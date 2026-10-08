---
title: 'Révoquer la session au logout (backend)'
type: 'feature'
ticket: '1'
created: '2026-10-08'
status: 'built'
baseline_revision: '1541b2f78bd6a877ace2723f59c851474932aa18'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context:
  - '{project-root}/doc/TESTING.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `POST /api/auth/logout` only logs and answers 200: the access token stays valid until it expires and the refresh token can still mint new sessions, so a logout does not end anything server-side (subject IV.1, CAP-9).

**Approach:** On logout, put the access token in a Redis denylist until its `exp` and revoke the Supabase session (`supabase.auth.admin.signOut(token, 'local')`, which kills that session's refresh token). `SessionService.verifyToken` rejects denylisted tokens, so every HTTP route and, later, the socket (#71) refuse them.

## Boundaries & Constraints

**Always:** Store a SHA-256 hash of the token, never the raw token, under `auth:revoked:<hash>` with a TTL equal to the token's remaining lifetime (read from the JWT `exp`; at least 1 s). Check the denylist in `verifyToken` before calling Supabase. Revoke with scope `local`: only the session that logs out ends, other devices stay signed in. Real Redis in integration tests (doc/TESTING.md: never simulated there). Decision (2026-10-08): fail-closed. Without a ready Redis, `verifyToken` and logout answer 503 `REVOCATION_UNAVAILABLE`; Redis is always required (`isRedisRequired()` true whatever the rate-limit/lockout flags).

**Never:** No in-memory fallback for the denylist. No change to the mobile app (3.2 / #70). No socket-side test (#71). No new endpoint.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Logout | Valid bearer token | 200, token hash in denylist with TTL ≈ exp − now, Supabase session revoked | No error expected |
| Old access token after logout | Same bearer on any `authMiddleware` route | 401 `TOKEN_REVOKED` | Supabase not called |
| Old refresh token after logout | `POST /api/auth/refresh` with it | 401 `INVALID_REFRESH_TOKEN` | Existing refresh path |
| Supabase signOut fails | Network or GoTrue error | Denylist entry still written; logout answers 500 so the client knows the refresh token may survive | Error logged with userId |
| Token already expired at logout | `exp` ≤ now | Rejected by `authMiddleware` before logout runs | Existing 401 |
| Redis unavailable | Redis not ready, any authenticated request or logout | 503 `REVOCATION_UNAVAILABLE` | Error logged; `authMiddleware` keeps the 503 instead of turning it into 401 |

</frozen-after-approval>

## Code Map

- `backend/src/features/auth/services/session.service.ts` -- `verifyToken` (Supabase `getUser`) and `refreshToken`; add the denylist check at the top of `verifyToken`, keep the `AppError` rethrow pattern.
- `backend/src/features/auth/auth.service.ts:224` -- delegates `refreshToken` to `SessionService`; add `logout(token)` delegating the same way.
- `backend/src/features/auth/auth.controller.ts:161` -- `logout` is sync and log-only; make it async, read the token from the `Authorization` header (already validated by `authMiddleware`), call `authService.logout`.
- `backend/src/features/auth/auth.middleware.ts` -- forwards `err.code` and the message on 401; every error currently becomes 401; answer with `AppError.statusCode` when the error is an `AppError` so 503 survives.
- `backend/src/features/auth/auth.openapi.ts:198` -- logout doc; describe the denylist + refresh revocation and add the 500 response.
- `backend/src/shared/config/redis.ts` -- `redisClient` (ioredis, `enableOfflineQueue: false`, so commands throw when not connected), `isRedisConnected()`, `isRedisRequired()`.
- `backend/src/shared/services/brute-force.service.ts:25-45` -- existing Redis pattern (connection check, then `setex`/`exists`); mirror its style.
- `backend/src/shared/config/supabase.ts` -- `supabaseAdmin`; `admin.signOut(jwt, scope)` does not store a session on the client, safe to call there.
- `backend/scripts/test-db.sh` + `.github/workflows/ci.yml` (`test-int` job) -- no Redis yet; doc/TESTING.md says real Redis is added to `make test-int` with the first integration test that needs it: this one.
- `backend/src/test/setup-int-env.ts` -- sets `REDIS_HOST=localhost`; needs `REDIS_PORT` for the test container.
- `backend/src/features/auth/services/admin-session.int.test.ts` -- golden example for an int test (creates users with `supabaseAdmin`, logs in through `AuthService`, deletes users in `afterAll`).

## Tasks & Acceptance

**Execution:**
- [ ] `backend/src/features/auth/services/token-revocation.service.ts` -- new: `revoke(token)` (hash, TTL from `exp`, `setex`) and `isRevoked(token)` (`exists`) -- keeps `session.service.ts` small and gives #71 one place to reuse.
- [ ] `backend/src/features/auth/services/session.service.ts` -- `verifyToken` throws `AppError(401, 'Token has been revoked', 'TOKEN_REVOKED')` when revoked; add `logout(token)`: revoke in Redis, then `supabase.auth.admin.signOut(token, 'local')`, throw `AppError(500, ..., 'LOGOUT_FAILED')` on Supabase error.
- [ ] `backend/src/features/auth/auth.service.ts` -- `logout(token)` delegating to `SessionService`.
- [ ] `backend/src/features/auth/auth.controller.ts` -- async `logout` calling the service, errors to `next`.
- [ ] `backend/src/features/auth/auth.middleware.ts` -- use the `AppError` status code (401 otherwise) in `authMiddleware`; `optionalAuthMiddleware` unchanged.
- [ ] `backend/src/shared/config/redis.ts`, `backend/.env.example` -- Redis always required: `isRedisRequired()` returns true, comments and the dev-mode block of `.env.example` say Redis is needed for session revocation.
- [ ] `backend/src/features/auth/auth.openapi.ts` -- update logout description and responses (500, 503).
- [ ] `backend/src/features/auth/services/token-revocation.service.test.ts` -- unit tests with `vi.mock('@/shared/config/redis.js')`: key is a hash, TTL from `exp`, minimum TTL, `isRevoked` true/false, Redis not ready → `AppError(503, 'REVOCATION_UNAVAILABLE')` from both.
- [ ] `backend/scripts/test-db.sh`, `.github/workflows/ci.yml`, `backend/src/test/setup-int-env.ts`, `doc/TESTING.md` -- start a `redis:7-alpine` container on a free port in `up`, remove it in `down`, write `REDIS_HOST`/`REDIS_PORT` to `.env.test`; update the Redis row of the TESTING.md table.
- [ ] `backend/src/features/auth/services/logout.int.test.ts` -- login a user created in the local stack, connect Redis, logout, then `verifyToken(old access)` rejects with `TOKEN_REVOKED` and `refreshToken(old refresh)` rejects.

**Acceptance Criteria:**
- Given a user who logged in, when they call `POST /api/auth/logout`, then a request with the old access token gets 401 and `POST /api/auth/refresh` with the old refresh token fails.
- Given the same user signed in on two sessions, when one logs out, then the other session's tokens still work.
- Given the change, then `npm run type-check`, `npm run lint`, `npm test` and `npm run test:int` pass in `backend/`.

## Implementation Notes

## Plan Change Log

## Review Triage Log

Pass 1 (quick): high 1, medium 2, low 2, false 0, maybe-false 0.

| # | Finding | Verdict | Route | Evidence / action |
|---|---------|---------|-------|-------------------|
| 1 | `redis.ts` gives up for good after 10 errors (`disconnect()`, `retryStrategy` → null); with fail-closed every auth route answers 503 until restart | high | patch | Verified: only `'ready'` sets `isConnected`, `connectRedis()` runs once at boot; Redis down > ~3 s or slow at boot → permanent 503. Fix: retry forever with capped backoff, never disconnect. |
| 2 | `redis.ts` dead `isRedisRequired()` branches and "dev mode" comments | low | patch | Verified: `isRedisRequired()` is constant true; deletion only, folded into #1's fix. |
| 3 | `make dev-local` starts no Redis and local backend reads `REDIS_HOST=redis` → 503 everywhere | medium | patch | Verified: `make/local.mk` dev-local runs `npm run dev` only; `.env.example` has `REDIS_HOST=redis`. Fix: start Redis via `start_redis` and export `REDIS_HOST=localhost` for dev-local; `.env.example` points to `make redis-start`. |
| 4 | Socket handshake maps `TOKEN_REVOKED`/`REVOCATION_UNAVAILABLE` to `INVALID_TOKEN` (`socket-auth.ts:100`) | medium | defer | Real, but the intent puts socket refusal in #71; mobile `socketStore` reacts to `INVALID_TOKEN` with one refresh, so new codes are a socket contract change for #71. |
| 5 | AC1 checked at service level only; controller token extraction untested | low | patch | Verified: no supertest/app export in backend, `logout` controller has no test; middleware mapping already unit-tested. Fix: unit test of `AuthController.logout` in `auth.controller.test.ts`. |

## Design Notes

Hash the token: the denylist must not become a store of usable credentials. TTL from `exp` decoded locally (base64url of the payload); the token was already verified by `authMiddleware`, so no signature check is needed there.

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test` -- expected: all green
- `make test-int` -- expected: `logout.int.test.ts` and existing int tests pass
