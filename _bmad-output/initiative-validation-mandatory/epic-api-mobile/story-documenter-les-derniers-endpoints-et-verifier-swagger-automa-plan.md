---
title: 'Documenter les derniers endpoints et vérifier Swagger automatiquement'
type: 'chore'
ticket: '2'
created: '2026-10-10'
status: 'built'
baseline_revision: '12d90bc034131f5ec07dfda7a90cf27264220975'
route: 'full'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #95 (story 6.2, CAP-7). Two mounted routes are missing from the OpenAPI spec: `GET /api/playlists/public` and `GET /api/soundcloud/stream` (query variant; only `/stream/{trackUrl}` is documented). `GET /health` is already in `swagger.config.ts`. Nothing stops the next route from shipping undocumented (AGENTS.md: "a new endpoint without its OpenAPI entry is unfinished"). Also (comment on #95): the shared `ErrorResponse` schema types `details` as an object and the `ValidationError` example shows `details: { field, issue }` without `meta`, while `error-handler.ts` answers `details` as an array of `{ path, message }` and the rate limiters add `retryAfter`.

**Approach:** Document the two endpoints in their feature's `*.openapi.ts` from the real code. Add a backend unit test that walks every route of the registry in `shared/config/routes.ts` (Express 5 router stacks, `:param` → `{param}`) and fails, listing them, when a method+path is missing from `swaggerSpec`, and in the other direction when a documented `/api/...` operation matches no mounted route (stale docs). Fix `ErrorResponse` / `ValidationError` in `swagger.schemas.ts` to the real error body.

## Boundaries & Constraints

**Always:** The test needs no external service (unit config, `vitest.config.ts`); add the OAuth placeholders (`GOOGLE_CLIENT_ID`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`) to `src/test/setup-env.ts` since importing the routes loads `oauth.service`. Routes mounted outside the registry (`/health`, `/api-docs` in `server.ts`) are out of the walk; `/health` stays documented by hand. Docs taken from controllers/validators, same style as neighbouring entries.

**Never:** No change to routes, controllers or response shapes. No new dependency.

</frozen-after-approval>

## Code Map

- `backend/src/shared/config/routes.ts` -- `routes: RouteConfig[]` (`{ path, router }`), the registry `server.ts` mounts; walk `router.stack` layers with `route.path` + `route.methods`.
- `backend/src/shared/config/swagger.config.ts:130` -- `export const swaggerSpec`; `paths` merged from each feature's `*.openapi.ts`; `/health` at :45.
- `backend/src/features/playlists/playlist.routes.ts:30` -- `GET /public` → `playlistController.getPublicPlaylists`; document in `playlist.openapi.ts` (see `/api/playlists` entry at :7 for style and auth).
- `backend/src/features/soundcloud/soundcloud.routes.ts:30-31` -- `GET /stream` (query) and `/stream/:trackUrl` share `controller.getStreamUrl`; read it for the query parameter name and validation; document `/api/soundcloud/stream` in `soundcloud.openapi.ts` next to `/api/soundcloud/stream/{trackUrl}` (:111).
- `backend/src/shared/middleware/error-handler.ts:25-80` -- real error body: `{ success: false, error: { message, code, details? }, meta: { timestamp } }`; Zod `details` = `[{ path, message }]`; `AppError.details` free-form.
- `backend/src/features/auth/middleware/rate-limit.middleware.ts` -- limiter handlers add `retryAfter` to `error`.
- `backend/src/shared/config/swagger.schemas.ts:60-80` -- `ValidationError` response; `ErrorResponse` schema (find it in the schemas export).
- `backend/src/test/setup-env.ts` -- unit placeholders; `backend/src/test/setup-int-env.ts` has the OAuth placeholder values to mirror.
- Throwaway spec scripts showed exactly two missing operations today.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/features/playlists/playlist.openapi.ts` -- `GET /api/playlists/public`.
- [x] `backend/src/features/soundcloud/soundcloud.openapi.ts` -- `GET /api/soundcloud/stream`.
- [x] `backend/src/shared/config/swagger.schemas.ts` -- `ErrorResponse.details` (array of `{ path, message }` or free value), `meta`, optional `retryAfter`; `ValidationError` example fixed.
- [x] `backend/src/test/setup-env.ts` -- OAuth placeholders.
- [x] `backend/src/shared/config/openapi-coverage.test.ts` (new) -- routes ↔ spec in both directions, readable failure listing the offenders.

**Acceptance Criteria:**
- Given the current routes, when `npm test` runs, then the coverage test passes; given a route added without its OpenAPI entry, then it fails naming `METHOD /path`.
- Given Swagger UI, then `/api/playlists/public` and `/api/soundcloud/stream` appear.

## Verification

**Commands:**
- `cd backend && npm run lint && npm run type-check && npm test` -- expected: green, coverage test included
- Temporarily remove one documented entry → the coverage test fails naming it (then restore).

## Review Triage Log

Pass 1 (quick): medium 2 · low 1 (pre-existing).

| # | Finding | Verdict | Route | Evidence / action |
|---|---------|---------|-------|-------------------|
| 1 | Coverage test silently skips nested routers (`router.use('/sub', subRouter)`) | medium | patch | `if (!layer.route) continue`; none today but the next one would escape. Recurse or fail on an unwalkable router layer. Patched: fails naming the feature (Express 5 does not expose the mount path); checked with a temporary sub-router. |
| 2 | `GET /api/playlists/public` items use `PlaylistSummary` (missing `ownerId`, `collaboratorIds`, `viewerIds`, `firstTrackCover`); 500 `PLAYLIST_FETCH_ERROR` undocumented | medium | patch | Service returns `PlaylistResponse[]` (`playlist.types.ts:78`). Schema matching it + 500. Patched (`PlaylistResponse` schema). |
| 3 | `ErrorResponse` lacks `lockedUntil`/`remainingTime`; lockout example says 423 with `details.lockoutEndsAt` | low | defer | Pre-existing (`account-lockout.middleware.ts:41-49`, `auth.openapi.ts:117-130`). Ticket #199, with the pre-existing `/api/playlists/user/{userId}` mismatch found while implementing. |
