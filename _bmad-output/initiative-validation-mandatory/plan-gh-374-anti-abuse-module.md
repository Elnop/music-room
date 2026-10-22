---
title: 'Backend : un seul module anti-abus (#374)'
type: 'refactor'
ticket: 'https://github.com/Elnop/music-room/issues/374'
created: '2026-10-22'
status: 'built'
baseline_revision: '8c1674192763299a2bee24a28999ee4de59c7178'
route: 'full'
route_source: 'auto'
risk: 'high'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md', '{project-root}/docs/superpowers/specs/2026-10-21-clean-codebase-refactor-design.md', '{project-root}/.agents/rules/structure.md', '{project-root}/.agents/rules/architecture.md', '{project-root}/.agents/rules/logging.md', '{project-root}/.agents/rules/guardrails.md', '{project-root}/doc/SECURITY.md', '{project-root}/doc/REDIS.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #374, epic #362. Abuse protection is spread across seven places, each talking to Redis its own way:
- `shared/services/brute-force.service.ts` (367 lines, a class);
- `shared/services/rate-limiter.service.ts` (a class);
- `features/auth/middleware/rate-limit.middleware.ts` (233 lines), with `utils/redis-rate-limit-store.ts` and `rate-limit-redis`;
- `features/auth/middleware/account-lockout.middleware.ts`;
- `features/auth/services/password-reset-cooldown.service.ts` (a class);
- `features/auth/utils/token-verify-limiter.ts` (its own Lua script);
- `realtime/event-rate-limit.ts`.

**Approach:** One module, `backend/src/shared/security/`, with a single Redis counter API that every limiter uses. Each limiter becomes a module of functions that keeps its exact limits, windows, keys, statuses, error codes and messages. Redis-down behaviour (fail closed, no in-memory fallback) is unchanged.

## Boundaries & Constraints

**Always:**
- Each limit triggers at the same threshold, over the same window, with the same response as on `develop`:
  - HTTP status, error `code` and message;
  - `details` (`retryAfter`, `lockedUntil`, `remainingTime`);
  - `RateLimit-*` / `Retry-After` headers where sent today;
  - Socket.io error payloads.
- The behaviour when Redis is unavailable is the same as today, for every limiter (503 `RATE_LIMIT_UNAVAILABLE` / `REVOCATION_UNAVAILABLE`, or whatever each one does now). Never add an in-memory fallback (AGENTS.md).
- Redis key names and TTLs do not change, so counters running at deploy time stay valid.
- Every limit value stays configurable through `shared/config/rate-limit.config.ts` / env as today.
- The integration tests for rate limiting, account lockout, token verify and socket events pass unchanged in their assertions. They may only change imports and how they reach internals.
- The style follows `.agents/rules/structure.md#backend-feature`: functions, namespace imports, files ≤ 150 lines. `npm run check` is green, with exception entries removed (the `shared → features` and cross-feature ones this fixes) and none added.
- `doc/SECURITY.md` and `doc/REDIS.md` describe the new module.

**Never:**
- Change a threshold, window or key, or add a new limit.
- Keep a second Redis counting path next to the shared API. The express-rate-limit store must sit on the shared API, unless that would change header or counting behaviour; if so, record why in Implementation Notes and keep the store as a thin adapter inside `shared/security/`.

</frozen-after-approval>

## Code Map

- `shared/services/rate-limiter.service.ts` (171 lines) -- `class RateLimiterService`: `checkLimit`, `incrementAndCheck`, `increment`, `reset` and `getAttempts` on Redis counters. Becomes the core: `shared/security/counter.ts` (or `limiter.ts`) exporting these as functions.
- `shared/services/brute-force.service.ts` (367 lines) -- `bruteForceService`: `recordFailedAttempt`, `lockAccount`, `resetFailedAttempts`, `checkLockout`, `recordIPActivity`, `blacklistIP` and `isIPBlacklisted`. Split it into `shared/security/account-lockout.ts` and `shared/security/ip-reputation.ts`, both built on the core.
- `features/auth/middleware/rate-limit.middleware.ts` (233 lines) and `features/auth/utils/redis-rate-limit-store.ts` (114 lines, wraps `rate-limit-redis` and fails closed while Redis is down) -- the express-rate-limit middlewares are `loginRateLimiter`, `registerRateLimiter`, `oauthRateLimiter`, `globalAuthRateLimiter` and the ones `profile.routes.ts` and `soundcloud.routes.ts` use. Move them to `shared/security/http-rate-limit.ts` plus a store adapter. Prefer a store written on the core API (express-rate-limit `Store`: `increment`, `decrement`, `resetKey`), and drop `rate-limit-redis` if that keeps the same keys, window semantics and headers.
- `features/auth/middleware/account-lockout.middleware.ts` -- `checkAccountLockout` and `checkIPBlacklist`. They use the request body email and IP; move them to `shared/security/` next to lockout.
- `features/auth/services/password-reset-cooldown.service.ts` (a class on `RateLimiterService`) -- turn it into functions on the core; callers are `auth-password.controller.ts` and `password-reset.service.ts`.
- `features/auth/utils/token-verify-limiter.ts` (144 lines) -- its own reserve/release Lua script on `redisClient`, plus `TokenVerifyLimitError`. It imports `SupabaseUser` from auth types (a shared/auth coupling). Express the reserve/release through the core, or keep its atomic script as a core primitive if counting must stay atomic, without changing semantics. Callers: `auth.middleware.ts` and `realtime/socket-auth.ts`.
- `realtime/event-rate-limit.ts` (87 lines) -- per-socket event limits (`RATE_LIMITED` payload). Base it on the core if it counts in Redis; if it counts in memory per socket by design, keep that (it is not a fallback) and say so in the doc.
- `shared/config/rate-limit.config.ts` -- the values; keep the export.
- `features/auth/utils/request-ip.ts` -- the client IP helper, used by lockout. Moving it to `shared/` is fine if `shared/security` needs it (shared must not import features).
- Importers to update: the auth controllers, routes and middleware, `profile.routes.ts`, `soundcloud.routes.ts`, and `realtime/index.ts`, `music-control-access.ts`, `playlist-room.ts` and `socket-auth.ts`.
- Tests: `rate-limit.int.test.ts`, `account-lockout.middleware.int.test.ts`, the token-verify-limiter tests, the event-rate-limit tests and the brute-force/rate-limiter unit tests. Move them next to the new files.

## Tasks & Acceptance

**Execution:**
- [x] Before changing anything, list every limiter's key pattern, TTL, threshold, status, code, message and Redis-down behaviour in Implementation Notes, then check the result against that list.
- [x] `shared/security/` -- core counter API and limiters as function modules -- single module.
- [x] Move or delete the old files; update importers and tests -- no second path.
- [x] `doc/SECURITY.md`, `doc/REDIS.md`, `AGENTS.md` (the rate-limit line points to `shared/security/`) -- docs.
- [x] Exception lists -- prune -- shrink-only.

**Acceptance Criteria:**
- Given each limit, when it is hit in the integration tests, then it triggers at the same count with the same status, code, details and headers as on `develop`.
- Given Redis is down, when each limiter is exercised, then it behaves as on `develop`, and nothing counts in memory.
- Given the backend, when grepping for `redisClient` outside `shared/config/redis.ts`, `shared/security/` and non-limiter users (token revocation, caches), then no limiter talks to Redis directly.
- Given `npm run check`, then it is green with fewer exception entries, and no file in `shared/security/` is over 150 lines.

## Implementation Notes

### Inventory on `develop` (8c16741), checked against after the refactor

Limits come from `shared/config/rate-limit.config.ts` (env) unless a constant is named.

**express-rate-limit limiters** (`RateLimit-*` draft-6 headers, `Retry-After` when limited, no `X-RateLimit-*`; skipped entirely when `RATE_LIMIT_ENABLED=false` or the IP is whitelisted). Redis key = store prefix + `keyGenerator`:

| Limiter | Redis key | Window / max | 429 message |
|---|---|---|---|
| login (`skipSuccessfulRequests`) | `rl:auth:login:login:{email}:{ip}` | login 15 min / 5 | Too many login attempts. Please try again later. |
| register | `rl:auth:register:register:{ip}` | register 1 h / 3 | Too many registration attempts. Please try again later. |
| oauth | `rl:auth:oauth:oauth:{google\|facebook}:{ip}` | oauth 15 min / 10 | Too many {Google\|Facebook} login attempts. Please try again later. |
| global auth | `rl:auth:global:auth:global:{ip}` | global 15 min / 20 | Too many authentication requests. Please try again later. |
| soundcloud | `rl:soundcloud:soundcloud:{userId}` | soundcloud 1 min / 120 | Too many SoundCloud requests. Please try again later. |
| avatar | `rl:profile:avatar:avatar:{userId}` | avatar 1 h / 10 | Too many profile photo changes. Please try again later. |

All answer 429 `RATE_LIMIT_EXCEEDED`, `details.retryAfter` = reset time (ISO), `why`/`fix` as in `sendRateLimited`. Counting (rate-limit-redis 4.3.1 script): PTTL ≤ 0 → `SET key 1 PX window` (new window), else INCR; reset time = now + PTTL; `decrement` = DECR, `resetKey` = DEL. Redis not ready → 503 `RATE_LIMIT_UNAVAILABLE` "Rate limiting is unavailable" (no command sent); command error → ERROR log "Rate limiting failed: Redis command error" + same 503; decrement failure → WARN "Rate limit decrement skipped: Redis unavailable", never throws.

**Attempt counters** (`RateLimiterService`): INCR, EXPIRE window on the first hit, TTL (seconds). Over max → 429 `RATE_LIMIT_EXCEEDED` "Rate limit exceeded. Please try again in N minute(s)." Redis not ready → 503 `REDIS_UNAVAILABLE` "Service temporarily unavailable" on check/increment; `reset` skips (WARN), `getAttempts` returns 0 (WARN); disabled → no-op. Command errors propagate (500).

| Use | Key | Limit |
|---|---|---|
| email verification code | `email_verify_attempts:{userId}:{ip}` | `verificationConfig.maxAttempts` / `expiryMinutes*60` s, reset on success |
| verification resend cooldown | `email_resend:{userId}:{ip}` | 1 / `resendCooldownSeconds` → 429 `RESEND_COOLDOWN` "Please wait {s} seconds before requesting a new code" |
| verification resend count | `email_resend_count:{userId}:{ip}` | `maxResends` / 3600 s → 429 `RESEND_LIMIT_EXCEEDED` |
| reset code attempts | `password_reset_attempts:{email lower}:{ip}` | 5 / 900 s, reset on success |
| forgot-password requests | `password_reset_request:{email lower}:{ip}` | 3 / 3600 s |
| forgot-password cooldown | `password_reset_resend:{email lower}:{ip}` | 1 / 60 s (status only, `canResend`/`remainingSeconds` = Redis TTL) |

**Account lockout** (`ACCOUNT_LOCKOUT_ENABLED`): `failed_login:{email}:{ip}` INCR, 900 s TTL on first; at ≥ threshold (5) `account_locked:{email}:{ip}` SETEX attempts for 900 s (< 8), 3600 s (8–9), 86400 s (≥ 10). Login on a locked account → 429 `ACCOUNT_LOCKED` "Account temporarily locked due to too many failed login attempts. Please try again later.", `details { lockedUntil, remainingTime }` (locked = key exists and TTL > 0). Success deletes both keys. Redis down or error: fail open (logged).

**IP reputation**: `ip_failed_logins:{ip}` INCR, 900 s TTL on first (login and OAuth failures); ≥ 50 → `ip_blacklist:{ip}` SETEX 86400 `1`; 10/20 only log throttled/blocked. Blacklisted (key exists) → 403 `IP_BLOCKED` "Access temporarily restricted due to suspicious activity from this IP address." on every `/api/auth/*`. Redis down or error: fail open.

**Token verification** (#160): `rl:auth:token:{ip}`, window `token.windowMs` (15 min) set when the key is created, reserve = INCR before verifying, > `token.max` (20) → release + 429 `RATE_LIMIT_EXCEEDED` "Too many failed authentication attempts. Please try again later." with `details.retryAfter` = now + PTTL (HTTP), `TOO_MANY_ATTEMPTS` (socket). INVALID_TOKEN/TOKEN_REVOKED keep the slot, anything else releases it (DECR only if the key exists). Skipped (no block, no count) when disabled, whitelisted or Redis not ready; Redis errors logged, verification proceeds.

**Socket events** (#204): in memory per socket by design (counters die with the socket, not a fallback): fixed 10 s window, 20 `listening:update`/`control:action`, 30 other app events, one shared counter for unknown names; refusal `{ message: 'Too many events, slow down', code: 'RATE_LIMITED' }` on `listening:error`/`control:error`, `playlist:error` with `playlistId: null`.

### Decisions

- One Redis counting path, `shared/security/counter.ts`. `hit` is the rate-limit-redis increment script (PTTL ≤ 0 → SET 1 PX window, else INCR) and serves every counter: express-rate-limit store, attempt counters, lockout, IP reputation and token verification. For the attempt counters, lockout and IP reputation (INCR then EXPIRE on the first hit) and the token limiter (SET NX PX, INCR, PTTL) this is the same window and count, atomic; the only difference is a key left without a TTL (a crash between INCR and EXPIRE), which now starts a new window instead of never expiring. Seconds still come from Redis' TTL rounding (`(pttl + 500) / 1000`).
- The express-rate-limit store is written on the core; `rate-limit-redis` is dropped. Same keys, script, reset time and headers. `decrement` becomes "DECR only while the key exists" (the token limiter's release): a plain DECR on an expired key used to recreate it at -1 without TTL, giving one extra free hit in the next window.
- `get` returns `undefined` for a missing key (rate-limit-redis returned NaN hits); express-rate-limit only calls it from `getKey`, which nothing uses.
- `lockoutWarning`, attached to the request by `checkAccountLockout` and read by nothing, is dropped; the INFO log stays.
- `requestIp` moves to `shared/security/request-ip.ts`; `verifyTokenLimited` becomes generic over the user type, so `shared/` no longer imports auth types.
- The account-lockout and token-verify integration tests stay in `features/auth/` (they drive the auth router and middleware, which `shared/` may not import).
- The login limiter's key generator and `checkAccountLockout` read the email null-safely: on develop a request without a parsed body (Express 5 leaves `req.body` undefined) threw there and answered 500. Bodyless requests now answer 400 `VALIDATION_ERROR` on /login, /refresh and /verify-email (the routes behind `loginRateLimiter`), after counting a hit under `login:unknown:{ip}`. No other response changes. Test: « sends a bodyless login to validation (400), not a 500 » in `features/auth/account-lockout.int.test.ts`.
- `brute-force.service.ts` became `account-lockout.ts` and `ip-reputation.ts`, with their shared "disabled / Redis not ready / command error" handling in `fail-open.ts`; the internal `lockAccount` and `blacklistIP` are no longer exported. `SocketEventLimiter` became `createSocketEventLimiter()` (a closure per socket). `RateLimiterService` became `attempt-limit.ts`, `PasswordResetCooldownService` `password-reset-limit.ts`.

### Result, checked against the inventory

Same keys (prefix + key generator, `failed_login`, `account_locked`, `ip_failed_logins`, `ip_blacklist`, attempt keys, `rl:auth:token:`), windows, thresholds, statuses, codes, messages and `details`; integration tests unchanged in their assertions and green. Headers checked by hand on the register limiter against the test Redis: `RateLimit-Limit/Policy/Remaining/Reset` on every response, `Retry-After: 3600` on the 429, Redis value 4 after 4 hits, PTTL ≈ window. Redis-down paths unchanged: store 503 `RATE_LIMIT_UNAVAILABLE` (unit test, soundcloud int test), attempt counters 503 `REDIS_UNAVAILABLE`, lockout/IP fail open, token limiter skips.

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd backend && npm run check` -- expected: all OK.
- `cd backend && sh scripts/test-db.sh up && npm run test:int; sh scripts/test-db.sh down` -- expected: all pass.
- `grep -rn "redisClient" backend/src --include='*.ts' | grep -v test` -- expected: limiters only in `shared/security/`.

**Results (2026-10-22):** `npm run check` passed (all 10 checks). `npm run test:int`: 41 files, 358 tests passed (new `shared/security/counter.int.test.ts` included). `redisClient` outside `shared/config/redis.ts`: `shared/security/counter.ts` and `features/auth/services/token-revocation.service.ts` (revocation, not a limiter) only. Exception lists: 3 dependency-cruiser entries (`profile.routes`, `soundcloud.routes`, `soundcloud.int.test` → `rate-limit.middleware`) and 1 jscpd ignore (`rate-limit.middleware.ts`) removed, none added. Largest file in `shared/security/`: `http-rate-limit.ts`, 149 lines. `rate-limit-redis` removed from `package.json` and the lockfile.

### Pass 1 (quick) — high 0 / medium 1 / low 2 / false 0 / maybe-false 0

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| A bodyless `/login` still throws in `checkAccountLockout` (500) after counting under `unknown`; the note claims it reaches validation; `/refresh` and `/verify-email` silently moved from 500 to 400 | medium | patch | Reviewer reproduced `req.body === undefined` on Express 5. Fix: a null-safe read. A bodyless request is a client error, so 400 `VALIDATION_ERROR` replaces a crash on all three routes; recorded as the one response change of this story. |
| `THREAT_MODEL.md:253` cites a renamed test | low | patch | Doc fix. |
| `THREAT_MODEL.md` L9 says the lockout code is untested, contradicting line 45 | low | patch | Doc fix. |
