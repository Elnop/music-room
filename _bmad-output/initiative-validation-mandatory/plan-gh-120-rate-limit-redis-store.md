---
title: 'Rate limiting toujours sur Redis, quel que soit l’ordre de démarrage'
type: 'bugfix'
ticket: ''
created: '2026-10-09'
status: 'built'
baseline_revision: 'dbbec01c818f25494f3ac56ecdb641d8062c70b4'
route: 'full'
route_source: 'auto'
risk: 'high'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #120. `features/auth/middleware/rate-limit.middleware.ts` builds its four limiters at import, before `connectRedis()` (not awaited in `server.ts`) finishes. `getStore()` sees Redis not ready and returns `undefined`, and `express-rate-limit` then silently uses its in-memory store, so login, register, OAuth and the global auth limiter never use Redis. That breaks the project rule (Redis-backed, no in-memory fallback) and is not shared between instances (IV.6). The disabled mode (`RATE_LIMIT_ENABLED=false`) has the same flaw: it claims to skip limiting but also falls back to memory.

**Approach:** Each limiter gets a store backed by Redis that does not depend on startup order: it creates the `rate-limit-redis` store on first use, only once Redis is ready, and fails closed (the request errors, no memory counting) while Redis is unavailable. The disabled mode skips limiting explicitly. `getStore()`'s comment and logs describe the real behaviour.

## Boundaries & Constraints

**Always:** Same limits, windows, keys, prefixes (`rl:auth:login:`, `rl:auth:register:`, `rl:auth:oauth:`, `rl:auth:global:`), handlers and whitelist as today. No Redis command is sent while the client is not ready (`enableOfflineQueue: false` would reject it, and `RedisStore` loads its scripts in its constructor: an unawaited rejected promise there could crash the process). Fail closed while Redis is down: `passOnStoreError` stays false, so the request gets an error, never unlimited access and never memory counting.

**Never:** No `MemoryStore`, explicit or implicit. No change to `redis.ts` connection options or to `server.ts` startup order. No new dependency. No change to which routes use which limiter.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Startup | module imported before Redis is ready | no "Rate limiting unavailable" log, no Redis command sent, no crash | none |
| Normal | Redis ready, requests | counters in Redis under the `rl:auth:*:` prefixes | none |
| Login failures | N failed logins | keys `rl:auth:login:*` exist; the (max+1)th attempt gets 429 `RATE_LIMIT_EXCEEDED` | none |
| Redis down at request time | client not ready | request fails (error handler), not counted in memory | logged |
| Redis back | client ready again | limiting resumes on Redis | none |
| Disabled | `RATE_LIMIT_ENABLED=false` | limiting skipped, no store used | none |

</frozen-after-approval>

## Code Map

- `backend/src/features/auth/middleware/rate-limit.middleware.ts` -- `getStore(prefix)` (returns `undefined` when disabled or Redis not ready) used by `loginRateLimiter`, `registerRateLimiter`, `oauthRateLimiter`, `globalAuthRateLimiter`; `baseRateLimitConfig.skip` (whitelist). Replace `getStore` with a store that is always present when enabled; when disabled, make `skip` return true.
- `backend/src/features/auth/middleware/redis-rate-limit-store.ts` (new, or `utils/` per feature layout) -- a class implementing `express-rate-limit`'s `Store` (`init`, `get?`, `increment`, `decrement`, `resetKey`, `prefix`/`localKeys: false`) that keeps the options from `init` and creates the `rate-limit-redis` `RedisStore` (same `sendCommand` as today: `redisClient.call(...)`, prefix `rl:<name>:`) on first use when `isRedisConnected()`; while not connected it throws an error, which `express-rate-limit` forwards to the error handler (fail closed).
- `backend/src/shared/config/redis.ts` -- `redisClient`, `isRedisConnected()`; `enableOfflineQueue: false`, `lazyConnect: true`. Read-only.
- `backend/node_modules/rate-limit-redis` 4.3.1 -- the constructor calls `loadIncrementScript()` and `loadGetScript()` immediately; `retryableIncrement` reloads the script once on failure. `express-rate-limit` 8.7.0 -- `passOnStoreError` default false.
- `backend/src/features/auth/auth.routes.ts` -- uses the limiters; unchanged.
- Tests: unit with mocked `@/shared/config/redis.js` (pattern: `token-revocation.service.test.ts`); integration against the test Redis from `scripts/test-db.sh` (pattern: `logout.int.test.ts` connects Redis), mounting a limiter on a throwaway express app and calling it with `fetch`.

## Tasks & Acceptance

**Execution:**
- [x] `redis-rate-limit-store.ts` + unit test -- lazy creation only when ready, nothing sent before; throws while not ready; delegates `increment`/`decrement`/`resetKey`/`get` once created.
- [x] `rate-limit.middleware.ts` -- the four limiters use it; disabled mode skips; comments and logs match.
- [x] Integration test -- limiter mounted on a test app with the real test Redis: N failed login-like requests create `rl:auth:login:*` keys and the next one gets 429; keys cleaned up after.

**Acceptance Criteria:**
- Given the backend starting with Redis reachable, when the logs are read, then no "Rate limiting unavailable" line appears (story Verify).
- Given the module imported while Redis is not connected, when the process runs, then no unhandled rejection is raised.

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test && npm run test:int` (local stack running; leave it running) -- expected: pass.

**Manual checks:**
- `make dev-docker` (or the running backend): startup logs without "Rate limiting unavailable"; after failed logins, `redis-cli keys 'rl:auth:login:*'` lists keys.

## Implementation Notes

- Store placed in `backend/src/features/auth/utils/redis-rate-limit-store.ts` (feature layout: helpers in `utils/`), unit test next to it; integration test in `backend/src/features/auth/middleware/rate-limit.int.test.ts`.
- While Redis is not ready, or when a delegated Redis command fails, `get`/`increment`/`resetKey` throw `AppError(503, 'RATE_LIMIT_UNAVAILABLE')` so the error handler answers 503 (a raw ioredis error carries a `code` and would otherwise map to 400).
- `decrement` does not throw: express-rate-limit calls it from `void finishPromise.then(...)` after the response (`skipSuccessfulRequests` on login), so a throw there would be an unhandled rejection. It logs a warning and skips; worst case one successful login stays counted.
- `isRedisConnected()` is checked on every call, not only at creation, so no command is sent during an outage after the store exists.
- The `rate-limit-redis` constructor's unawaited script-load promises get a no-op `.catch` (get/increment reload a failed script themselves).
- Disabled mode: `baseRateLimitConfig.skip` returns true first; one info log at import instead of one per limiter.
- Verified: type-check, lint, `npm test` (145), `npm run test:int` (114); the new int test fails on the old middleware (no `rl:auth:login:*` key). Running dev backend restarted: no "Rate limiting unavailable" line, 5x 401 then 429, keys `rl:auth:login:*` and `rl:auth:global:*` present (deleted afterwards).

## Plan Change Log

## Review Triage Log

Quick review, pass 1: 0 high, 2 medium, 1 low; all patched.

- medium, patch: `doc/REDIS.md` ("No In-Memory Fallback") still described rate limiting as skipped when Redis is down and listed the removed log lines. Rewritten to the delivered behaviour (lazy Redis store, fail closed 503, disabled mode skips).
- medium, patch: every `/api/auth/*` route (behind `globalAuthRateLimiter`) can now answer 503 `RATE_LIMIT_UNAVAILABLE`, undocumented in `auth.openapi.ts` (AGENTS.md: the openapi file documents the endpoints). 503 added to the auth operations.
- low, patch: `rate-limit.int.test.ts` teardown called `server.close` on undefined and cleaned keys before `disconnectRedis()` when Redis was unreachable, hiding the real error and leaving the reconnect loop alive. Guarded; always disconnects.
