---
title: 'Protéger les routes SoundCloud (auth, rate limit, Zod)'
type: 'bugfix'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: '5e56fc70e7b5e76aa50d44ff70273846b8b680eb'
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

**Problem:** GitHub #208, security (gap L10 of `doc/THREAT_MODEL.md`). `backend/src/features/soundcloud/soundcloud.routes.ts` mounts `GET /search`, `/track/:urlOrId`, `/stream` and `/stream/:trackUrl` with no authentication and no rate limit, and only `search` validates its input with Zod: anyone can use the backend as an unthrottled SoundCloud proxy with its client id. AGENTS.md also requires Zod on every input.

**Approach:** Require `authMiddleware` on every SoundCloud route (the app only calls them signed in, through `apiRequest`, which sends the token). Add a Redis-backed rate limiter keyed by the authenticated user id (same `RedisRateLimitStore` pattern and whitelist/enable switches as the auth limiters; window and max configurable in `rate-limit.config.ts`, defaults generous enough for normal browsing and playback, e.g. 120 requests per minute). Validate `track/:urlOrId`, `stream?url=` and `stream/:trackUrl` with Zod schemas in `soundcloud.validators.ts` (a SoundCloud URL — `https://soundcloud.com/...` or `https://on.soundcloud.com/...` — or a numeric id where an id is accepted), answering 400 `VALIDATION_ERROR`. Update `soundcloud.openapi.ts` (bearer auth, 401, 429, 400) and gap L10 in `doc/THREAT_MODEL.md`.

## Boundaries & Constraints

**Always:** Redis only, fail closed (503) like the other limiters (AGENTS.md: no in-memory fallback). Keep response shapes and the `MISSING_TRACK_URL` behavior for an absent url. Keep the legacy `/stream/:trackUrl` route (validated and protected like the query one). The OpenAPI coverage test must stay green.

**Never:** No mobile change (calls already authenticated). No change to SoundCloud client-id handling or caching. No in-memory limiter.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| No token | any SoundCloud route without bearer | 401 (authMiddleware codes) | SoundCloud never called |
| Signed in, valid | search / track / stream with valid input | same 200 as today | — |
| Invalid stream url | `stream?url=https://evil.example/x` or not a URL | 400 `VALIDATION_ERROR` | SoundCloud never called |
| Missing stream url | `stream` without `url` | 400 `MISSING_TRACK_URL` (unchanged) | — |
| Invalid track id | `track/abc` that is neither a SoundCloud URL nor a numeric id | 400 `VALIDATION_ERROR` | — |
| Over the limit | max+1 requests in the window from one user | 429 `RATE_LIMIT_EXCEEDED` with `retryAfter` | another user unaffected |
| Redis down | limiter cannot count | 503 `RATE_LIMIT_UNAVAILABLE` | fail closed |

</frozen-after-approval>

## Code Map

- `backend/src/features/soundcloud/soundcloud.routes.ts` -- the four routes; add `authMiddleware` (from `@/features/auth/auth.middleware.js`) and the new limiter.
- `backend/src/features/soundcloud/soundcloud.controller.ts` -- `search` (Zod already), `getTrack` (`req.params.urlOrId`), `getStreamUrl` (`req.query.url` or `optionalRouteParam(req, 'trackUrl')`, 400 `MISSING_TRACK_URL` when absent); parse with the new schemas.
- `backend/src/features/soundcloud/soundcloud.validators.ts` -- add the schemas.
- `backend/src/features/auth/middleware/rate-limit.middleware.ts` -- limiter factory pattern (`rateLimit` + `RedisRateLimitStore`, `skip` for whitelist/disabled, handler shape with `retryAfter`, fail closed); add `soundcloudRateLimiter` keyed `soundcloud:<userId>` (needs `authMiddleware` before it to have `req.user`). `backend/src/shared/config/rate-limit.config.ts` -- add its window/max with env overrides; `backend/.env.example` placeholders if the others are listed there.
- `backend/src/features/soundcloud/soundcloud.openapi.ts` -- add `security: bearerAuth`, 401, 429, 503, 400 on each operation.
- Tests: `backend/src/features/auth/middleware/rate-limit.int.test.ts` (limiter + Redis pattern), `backend/src/features/auth/utils/token-verify-limiter.int.test.ts` (throwaway express app with real middleware). SoundCloud must not be called in tests: mock the service (`soundcloud.service.ts`) or assert 401/400/429 before it.
- `doc/THREAT_MODEL.md` -- gap L10 and hazard M7/M9 text mention the SoundCloud routes; mark L10 fixed (#208).

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/shared/config/rate-limit.config.ts`, `backend/src/features/auth/middleware/rate-limit.middleware.ts` -- `soundcloudRateLimiter`.
- [x] `backend/src/features/soundcloud/soundcloud.validators.ts`, `soundcloud.controller.ts` -- Zod on track and stream inputs.
- [x] `backend/src/features/soundcloud/soundcloud.routes.ts` -- auth + limiter on every route.
- [x] `backend/src/features/soundcloud/soundcloud.openapi.ts` -- security and error responses.
- [x] `backend/src/features/soundcloud/soundcloud.int.test.ts` (new) -- one test per matrix row (SoundCloud service mocked).
- [x] `doc/THREAT_MODEL.md` -- L10 fixed.

**Acceptance Criteria:**
- Given the app signed in, when searching and playing a track, then it works as before (manual check on a device).

## Verification

**Commands:**
- `cd backend && npm run lint && npm run type-check && npm test && npm run test:int` -- expected: green

## Review Triage Log

After implementation: `www.soundcloud.com` and `m.soundcloud.com` added to the accepted hosts (legitimate SoundCloud URLs a stored track may carry) + test.

Pass 1 (quick): low 3 · manual check 1.

| # | Finding | Verdict | Route | Evidence / action |
|---|---------|---------|-------|-------------------|
| 1 | Docs say 503 `RATE_LIMIT_UNAVAILABLE` when Redis is down; `authMiddleware` answers 503 `REVOCATION_UNAVAILABLE` first | low | patch | OpenAPI 503 now documents both codes; README and THREAT_MODEL fixed. |
| 2 | 429 described only as the SoundCloud window; the token-verification limiter can also answer 429 | low | patch | OpenAPI 429 description mentions both. |
| 3 | README / THREAT_MODEL list only soundcloud.com and on. | low | patch | Now the four hosts. |
| 4 | Device check (search + play) not shown done | — | user | Reported to the user; the code path is compatible (mobile calls through `apiRequest` with the token). |
