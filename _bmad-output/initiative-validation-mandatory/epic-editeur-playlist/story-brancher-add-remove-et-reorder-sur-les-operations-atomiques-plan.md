---
title: 'Brancher add, remove et move sur les opérations atomiques'
type: 'feature'
ticket: '4'
created: '2026-10-09'
status: 'built'
baseline_revision: '6a46c64ae6734abb83823375242870390c3d69ea'
route: 'full'
route_source: 'auto'
risk: 'high'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/doc/PLAYLIST_CONCURRENCY.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 5.4 (#89). Migration 016 (#88, same branch) dropped `playlist_tracks.position` and added atomic RPC operations, but the backend still renumbers positions, reorders by deleting and re-inserting rows (losing `added_by`), and exposes `PUT /tracks/reorder`. Once 016 is applied, the current service breaks.

**Approach:** Route add, remove and move through `playlist_add_track`, `playlist_remove_track` and `playlist_move_track`; map their error codes to the 5.2 HTTP errors; read playlists ordered by `rank` with `tracksVersion`; replace `PUT /tracks/reorder` with `POST /tracks/{trackId}/move`; drop the old contract (reorder schema, `position`).

**Decision (2026-10-09):** Same branch and PR as #88. The committed `supabase.generated.ts` comes from the hosted project, so it is regenerated only at the human step: 016 applied in the hosted dashboard right before the merge, then `make generate-types`. Until then, type-check is run against types generated from the local stack and not committed.

## Boundaries & Constraints

**Always:** Permission checks before any RPC (`checkEditPermission` as today). `added_by` rule unchanged on add (restricted mode → adder; open mode → null, as today) and never touched by a move. RPC results parsed with Zod; RPC `error.message` codes → `AppError`: `TRACK_DUPLICATE` 409, `TRACK_MOVED_CONCURRENTLY` / `PLAYLIST_REBALANCED` 409, `TRACK_NOT_IN_PLAYLIST` 404 on remove and 409 on move, `PLAYLIST_NOT_FOUND` 404, anything else logged + 500. Responses follow the 5.2 shapes (`AddTrackResult`, `RemoveTrackResult`, `MoveTrackResult`, fetch with `tracksVersion` and tracks with `rank`). Services stay under ~150 lines.

**Never:** No change to migration 016 or the 5.2 contract shapes. No change to the socket payload (5.5): until then the service keeps calling `realtime.notifyPlaylistUpdate` with today's signature (`'track_added'`, `'track_removed'`, `'reordered'` for a move). No hand edit of `supabase.generated.ts`; the locally generated version is never committed. No mobile change (5.6) except mirroring the changed response types in `mobile/src/types/` (decision of the human, 2026-10-09, AGENTS.md rule).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Add | editor adds a track | 201 `{ track (rank, addedBy, addedAt), tracksVersion, rebalanced }` | 409 `TRACK_DUPLICATE`; 403 without edit right |
| Remove | editor removes a track | 200 `{ tracksVersion }`, no renumbering | 404 `TRACK_NOT_IN_PLAYLIST` |
| Move | `{ afterRank, expectedVersion }` current | 200 `{ trackId, rank, tracksVersion, rebalanced }`; `added_by` unchanged | 400 `VALIDATION_ERROR` on a bad body |
| Stale move, same track | track moved since `expectedVersion` | not applied | 409 `TRACK_MOVED_CONCURRENTLY` |
| Move of a removed track | track gone | not applied | 409 `TRACK_NOT_IN_PLAYLIST` |
| Concurrent service calls | move, add and remove at once through the service | each track once, `added_by` intact | only the documented refusals |
| Fetch | `GET /api/playlists/{id}` | tracks ordered by `rank`, each with `rank`; `tracksVersion` from the row | unchanged |
| Old route | `PUT /tracks/reorder` | gone (404) | none |

</frozen-after-approval>

## Code Map

- `_bmad-output/initiative-validation-mandatory/epic-editeur-playlist/plan-implementation.md` -- **Tâche 5** (lines ~1180–1524): `utils/track-rpc.ts` (+ unit test), the rewritten `playlist-track.service.ts`, rank-ordered reads, controller/routes, removal of the old contract, with code. Follow it; the frozen block wins where they differ (e.g. its "Étape 8" Swagger check needs the hosted step, so do it on the local stack instead).
- `backend/src/features/playlists/services/playlist-track.service.ts` (184 lines) -- uses `get_next_playlist_position`, inserts `position`, reorders by delete + insert with `added_by: userId` (line ~168): replace with RPC calls.
- `backend/src/features/playlists/utils/playlist.helpers.ts` -- `reindexPositions` (lines ~56–74): delete.
- `backend/src/features/playlists/playlist.service.ts` -- `position` selects/orders at lines ~61, ~169, ~253, ~338–361; `tracksVersion: 0` placeholder from 5.2 → `playlist.tracks_version`.
- `backend/src/features/playlists/playlist.types.ts` -- `PlaylistWithTracksResponse.tracks` → `TrackInPlaylistResponse[]`; drop `ReorderTracksDTO`; keep `TrackWithPositionResponse` (realtime imports it until 5.5).
- `backend/src/features/playlists/playlist.validators.ts`, `playlist.controller.ts`, `playlist.routes.ts`, `playlist.openapi.ts` -- drop `reorderTracksSchema`, the reorder route and its OpenAPI path/schema, `PlaylistTrack.position`; add `moveTrack`.
- `backend/src/features/playlists/services/track-operations.int.test.ts` (#88) -- RPC-level concurrency; this story adds service-level concurrency tests beside it (new `playlist-track.int.test.ts`), using the same fixtures.
- Local types for verification: generate from the running local stack (`npx supabase gen types typescript --local` from the working directory `backend/scripts/test-db.sh` uses), Prettier, run type-check, then `git restore backend/src/shared/types/supabase.generated.ts`. Only errors in playlist files matter; report any other difference.

## Tasks & Acceptance

**Execution:**
- [x] `utils/track-rpc.ts` + `track-rpc.test.ts` -- RPC wrappers, Zod parsing, error mapping (unit: each code → status, unknown → 500).
- [x] `services/playlist-track.service.ts`, `utils/playlist.helpers.ts` -- add/remove/move through the wrappers; `reindexPositions` gone.
- [x] `playlist.service.ts`, `playlist.types.ts` -- reads by `rank`, `tracksVersion`.
- [x] `playlist.controller.ts`, `playlist.routes.ts`, `playlist.validators.ts`, `playlist.openapi.ts` -- move endpoint, old contract removed.
- [x] `services/playlist-track.int.test.ts` -- service-level matrix rows on the local stack, including the story Verify (concurrent move/add/remove; stale move → 409).

**Acceptance Criteria:**
- Given local types generated from the stack, when `npm run type-check` runs, then the playlist feature compiles; `grep -rn "position\|reorder" backend/src/features/playlists` only finds `TrackWithPositionResponse` kept for realtime.
- Given the local stack, when add, fetch, move (200), the same move again (409 `TRACK_MOVED_CONCURRENTLY`) are called over HTTP, then statuses and shapes match the 5.2 contract.

## Verification

**Commands:**
- `cd backend && npm run lint && npm test && npm run test:int` (stack running; leave it running) -- expected: pass.
- type-check against locally generated types, then restore the committed file -- expected: no error in playlist files.

**Manual checks:**
- HTTP sequence of AC 2 against the local stack (throwaway script, not committed).

## Implementation Notes

- `track-rpc.ts` calls each RPC by name with the generated argument types instead of the `fn as never` cast of plan-implementation; the shared `call()` takes the request promise, parses with Zod and maps `error.message` through a table (`Object.hasOwn`, so a message like `toString` still falls through to 500).
- `added_by` rule and permission checks unchanged; `addTrack` no longer wraps every failure into 500, so RPC errors keep their mapped status. The track upsert failure still returns 500 `TRACK_ADD_ERROR`.
- Realtime stays on the old signature until 5.5: `track_added` with `{ track: { ...added, position: 0 } }`, `track_removed`, `reordered` for a move. These two service lines and `TrackWithPositionResponse` are the only `position`/`reorder` grep hits left.
- Outside the code map: the `PlaylistRow` fixtures in `permissions/playlist.permissions.test.ts` and `src/realtime/playlist-room.test.ts` gained `tracks_version` and `ranks_rebalanced_at_version` (required by the regenerated types).
- `playlist-track.int.test.ts` mocks `@/realtime/index.js` with a spy to assert the old notify calls.
- Local vs committed generated types, beyond 016: local output has `graphql_public` instead of `__InternalSupabase`, and lacks `user_profiles.email_verification_token` / `email_verification_expires_at` (present on the hosted project, absent from the local migrations). Neither affects the playlist feature.
- Against the committed (hosted) types, type-check fails in the playlist files and the two fixtures until 016 is applied and `make generate-types` runs, as the Decision expects; CI type-check stays red until then.

## Plan Change Log

## Review Triage Log

Quick review, pass 1: 0 high, 2 medium, 4 low, 3 false; 4 patched (one after the human amended the frozen Never), 5 rejected.

- medium, patch: `trackId` reached the RPCs unvalidated; a non-uuid gave a Postgres cast error → 500 `TRACK_OPERATION_ERROR` instead of 400 (OpenAPI declares uuid + 400; AGENTS.md: Zod on every input). Controller validates `trackId` as uuid.
- medium, patch (intent amended): the fetch and add/remove response shapes changed but `mobile/src/types/` still declared `TrackWithPosition[]`, against the AGENTS.md mirror rule; the frozen Never deferred all mobile change to 5.6. The human allowed mirroring types only; `PlaylistWithTracks.tracks` → `TrackInPlaylist[]`.
- low, patch: `backend/README.md` still listed "reorder" among the track operations.
- low, patch: the remove 404 example message in OpenAPI differed from `track-rpc.ts`.
- low, rejected: a forged 128-char `afterRank` with nothing after it yields a 129-char rank → CHECK error → 500. Real ranks stay ≤ 65 chars (rebalance at 64); the fix changes the 5.2 contract limit.
- low, rejected: AC 1 grep also matches the realtime-compat lines (`position: 0`, `'reordered'`) and the tests spying on them; all are required by the Never rule until 5.5.
- low, rejected: the "missing playlist → 404" int test stops at `checkEditPermission`, not the RPC mapping; that mapping is covered by `track-rpc.test.ts`.
- false: "mobile breaks on develop (reorder route removed)": no screen calls `playlistStore.reorderTracks` (only the store and the API client define it), and `addTrack` ignores the response body.
- false: "CI type-check fails": known and accepted by the frozen Decision; cleared by the hosted 016 + `make generate-types` step before the PR.
