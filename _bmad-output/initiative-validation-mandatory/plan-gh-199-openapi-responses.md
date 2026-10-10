---
title: 'Align OpenAPI with the real playlist list and lockout responses'
type: 'bugfix'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: '3eeaacc3228c120ce7b8fe8df9fe8bab54cbd2ef'
route: 'oneshot'
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

**Problem:** `GET /api/playlists/user/{userId}` documents `data` as an array while the controller returns `data: { playlists }`, and `PlaylistSummary` misses `ownerId`, `collaboratorIds`, `viewerIds`, `firstTrackCover`; the account lockout is documented as a 423 with `details.lockoutEndsAt` and no `meta`, while the real answer is a 429 `ACCOUNT_LOCKED` with `error.lockedUntil` and `error.remainingTime` (GitHub #199).

**Approach:** Align these entries on the code: `data` shape, full item schema, and the lockout response (status, fields, example).

</frozen-after-approval>

## Implementation Notes

Oneshot:
- `playlist.openapi.ts`: `data: { playlists: PlaylistSummary[] }` for `/api/playlists/user/{userId}` and also `GET /api/playlists`, which had the same wrong array (controller returns `{ playlists }` for both; `/public` was already right). All three list routes now reference the existing `PlaylistResponse` schema (they all return `formatPlaylistResponse`); the stale duplicate `PlaylistSummary` is removed. `PlaylistMember`: `displayName` / `avatarUrl` no longer nullable (always mapped with `?? undefined`), `id` / `username` required.
- `auth.openapi.ts` login: the 423 is replaced by a 429 with two examples, `RATE_LIMIT_EXCEEDED` (login limiter, `retryAfter`) and `ACCOUNT_LOCKED` (`lockedUntil`, `remainingTime`), both with `meta`.
- `swagger.schemas.ts` `ErrorResponse.error`: `lockedUntil`, `remainingTime`.
- Checked against real calls on the local stack (throwaway script, deleted): both list routes answer `data.playlists` with the documented keys; with the rate limiters whitelisted (loopback), the 6th wrong login answers 429 `ACCOUNT_LOCKED` with `lockedUntil`, `remainingTime`, `meta`. Under default settings the login limiter (5 failures per email+IP, checked first) answers `RATE_LIMIT_EXCEEDED` before the lockout middleware runs; `ACCOUNT_LOCKED` shows once the limiter window ends while the lock lasts. The 429 description says so.

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test` -- expected: green (includes `openapi-coverage.test.ts`)

## Review Triage Log

Quick review, 4 findings: 1 medium, 3 low, all patched.

- medium, patched: the rewritten `PlaylistSummary` duplicated the existing `PlaylistResponse` schema. Both list routes now reference `PlaylistResponse`; `PlaylistSummary` removed (no other reference).
- low, patched: the 429 description said "too many login requests from this IP"; the limiter counts failed attempts per email+IP (`skipSuccessfulRequests`).
- low, patched: the plan presented `ACCOUNT_LOCKED` as the 6th-failure answer; that probe whitelisted loopback. Under defaults `RATE_LIMIT_EXCEEDED` comes first; description and notes say when each appears.
- low, patched: `PlaylistMember` still documented nullable fields the services always omit.
