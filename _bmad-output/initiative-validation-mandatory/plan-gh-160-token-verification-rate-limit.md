---
title: 'Limiter les échecs de vérification de token par IP'
type: 'bugfix'
ticket: ''
created: '2026-10-09'
status: 'built'
baseline_revision: '30a849f783f6d91b9ffac17e50bff4866bfacee7'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #160. `SessionService.verifyToken` calls `supabase.auth.getUser(token)` for every request through `authMiddleware` / `optionalAuthMiddleware` and every Socket.io handshake (`realtime/socket-auth.ts`). Nothing limits it: a client can loop invalid tokens and turn each one into a Supabase Auth call (quota, latency, cost). The Redis denylist (#69) runs first but an unknown token still reaches Supabase.

**Approach:** Count failed token verifications per client IP in Redis (fixed window). Before verifying, if the IP has reached the limit, refuse without calling `getUser`: HTTP 429 `RATE_LIMIT_EXCEEDED` from `authMiddleware`, a dedicated `connect_error` code `TOO_MANY_ATTEMPTS` for the socket, and anonymous continuation in `optionalAuthMiddleware`. Successful verifications are never counted. Same toggle and whitelist as the other limiters (`RATE_LIMIT_ENABLED`, `RATE_LIMIT_WHITELIST_IPS`); limits configurable (`RATE_LIMIT_TOKEN_WINDOW_MS`, default 15 min; `RATE_LIMIT_TOKEN_MAX`, default 20).

**Decision (human, 2026-10-09, after review):** a parallel burst must not bypass the limit. A verification reserves a slot before calling Supabase (`INCR`, expiry set on creation); above `max` it is released and refused; a success or a non-counted failure releases it; a counted failure keeps it. Side effect accepted: more than `max` simultaneous in-flight verifications from one IP get a transient 429.

## Boundaries & Constraints

**Always:** Redis only, no in-memory counting (AGENTS.md). No Redis command while the client is not ready: then the limiter neither blocks nor counts, and `verifyToken` itself already fails closed (denylist check → 503). Only failures with code `INVALID_TOKEN` or `TOKEN_REVOKED` count; a 503 `REVOCATION_UNAVAILABLE` does not. Keys prefixed `rl:auth:token:`. A blocked IP is blocked for every token until the window ends, valid or not: telling them apart would need the `getUser` call the limit exists to avoid. The mobile client handles the new socket code like the other refusals (stays disconnected, no refresh loop).

**Never:** No change to `verifyToken`'s own logic or to the existing four limiters. No new dependency. No change to which routes use `authMiddleware`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid token | under the limit | passes; counter unchanged | none |
| Invalid token | under the limit | 401 as today; counter + 1 (expires with the window) | none |
| Over the limit, HTTP | `max` failures from this IP, any token | 429 `RATE_LIMIT_EXCEEDED`; `getUser` not called | none |
| Over the limit, socket | same, handshake | refused with `TOO_MANY_ATTEMPTS`; `getUser` not called | none |
| Over the limit, optional auth | same, optional route | continues anonymously; `getUser` not called | none |
| Window ends | after `windowMs` | verification resumes | none |
| Redis not ready | client not connected | limiter skipped; `verifyToken` fails closed (503) | logged |
| Disabled / whitelisted | `RATE_LIMIT_ENABLED=false` or IP in whitelist | never blocked, never counted | none |

</frozen-after-approval>

## Code Map

- `backend/src/features/auth/services/session.service.ts:16` -- `verifyToken(token)` (denylist, then `getUser`); throws `AppError` 401 `TOKEN_REVOKED` / `INVALID_TOKEN`, 503 from the denylist. Unchanged.
- `backend/src/features/auth/auth.middleware.ts` -- `authMiddleware` (line ~59) and `optionalAuthMiddleware` (~102) call `authService.verifyToken`; IP from `req.ip` (same as `rate-limit.middleware.ts` `getClientIp`).
- `backend/src/realtime/socket-auth.ts:~108` -- handshake verification; refusal codes listed in its contract comment and `SocketAuthErrorCode`; IP from `socket.handshake.address`.
- `backend/src/features/auth/utils/token-verify-limiter.ts` (new) -- `isBlocked(ip)` (`GET`), `recordFailure(ip)` (`INCR`, `PEXPIRE` on first hit, e.g. one `MULTI`), and a wrapper `verifyTokenLimited(token, ip)` that the three callers use: blocked → throw a dedicated error; failure with a counted code → record then rethrow. Uses `redisClient` / `isRedisConnected()` from `shared/config/redis.ts` and `rateLimitConfig`.
- `backend/src/shared/config/rate-limit.config.ts`, `env.ts`, `backend/.env.example` -- add `token: { windowMs, max }` and the two env vars, beside the others.
- `backend/src/features/auth/auth.openapi.ts` / `swagger.schemas.ts` -- protected routes can now answer 429: add it to the shared protected-route responses if there is one, else document it in `backend/README.md` auth section (do not edit every feature's openapi).
- `mobile/src/store/socketStore.ts` -- handshake refusal codes at the top; add `TOO_MANY_ATTEMPTS` to the codes that stop without refreshing; test in `socketStore.test.ts`.
- Tests: unit for the limiter with mocked Redis (pattern `redis-rate-limit-store.test.ts`); integration with the test Redis: HTTP through `authMiddleware` on a throwaway express app and the socket handshake (pattern `socket-auth.int.test.ts`), spying on `supabase.auth.getUser` to prove it is not called once blocked; a low `max` via env set in `vi.hoisted`.

## Tasks & Acceptance

**Execution:**
- [x] config + env -- `token` limits, `.env.example`.
- [x] `token-verify-limiter.ts` + unit test -- block check, failure count with expiry, skip when Redis not ready / disabled / whitelisted, only counted codes.
- [x] `auth.middleware.ts` -- both middlewares through the wrapper; 429 body like the other limiters.
- [x] `socket-auth.ts` -- wrapper, `TOO_MANY_ATTEMPTS` in `SocketAuthErrorCode` and the contract comment; `backend/README.md` handshake codes.
- [x] docs -- 429 on protected routes (see Code Map).
- [x] `mobile/src/store/socketStore.ts` + test -- new code stops without refresh.
- [x] Integration tests -- HTTP and socket rows of the matrix, `getUser` spy.

**Acceptance Criteria:**
- Given an IP past the limit with invalid tokens, when it sends more (HTTP or socket), then it gets 429 / `TOO_MANY_ATTEMPTS` and `getUser` is not called; given a valid token from an IP under the limit, then it passes (issue Verify).

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test && npm run test:int` (local stack running; leave it running) -- expected: pass.
- `cd mobile && npm run type-check && npm test` -- expected: pass.

## Implementation Notes

- Reservation (human decision): `reserve` = MULTI `SET NX PX` + `INCR` + `PTTL` (each exec pair checked; a pair error is logged and the verification proceeds); above `max` the slot is released and refused; `release` is a Lua `DECR` only if the key exists, so an expired key is never recreated without TTL. `isBlocked` / `recordFailure` replaced by `reserve` / `release`. `RATE_LIMIT_TOKEN_*` validated in Zod as positive integers.
- `verifyTokenLimited(token, ip, verify)` takes the verify function as a third argument, so `auth.middleware.ts` keeps going through `AuthService` (its unit test mocks it) and `socket-auth.ts` through `SessionService`.
- A Redis error in the limiter (thrown or per-command in `exec()`) is logged and lets the verification through, like the not-ready case.
- Swagger: no shared protected-route response list exists, so the 429 is documented in the `bearerAuth` scheme description and in `backend/README.md` (Endpoints section), not in each feature's openapi.
- `socket-auth.int.test.ts` now clears `rl:auth:token:*` in `beforeAll`: its invalid-token handshakes count against 127.0.0.1 and repeated runs would otherwise reach the default limit.

## Plan Change Log

## Review Triage Log

Quick review, pass 1: 0 high, 3 medium, 1 low; all patched (one after a human decision amending the frozen intent).

- medium, patch (intent amended): check-then-count let a parallel burst of invalid tokens all reach `getUser` (500 parallel → 500 calls with `max` 20). The human chose to reserve a slot before verifying (`INCR`, release on success / non-counted failure, refuse above `max`).
- medium, patch: `RATE_LIMIT_TOKEN_MAX` / `_WINDOW_MS` were unvalidated `parseInt`; `NaN` or `0` blocked every IP from the first request, valid tokens included, forever. Validated as positive integers in `env.ts`.
- medium, patch: on a shared IP (no `trust proxy`, tunnel, NAT) one client's failures now lock every user out of the whole API, not only `/api/auth/*`. Documented in `backend/README.md`; configuring `trust proxy` deferred.
- low, patch: `multi().exec()` per-command errors were ignored (uncounted, unlogged), contradicting the plan note. Now checked and logged.
