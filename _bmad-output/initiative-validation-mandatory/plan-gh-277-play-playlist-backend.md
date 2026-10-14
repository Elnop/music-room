---
title: 'Queue de lecture : jouer une playlist (backend de #277)'
type: 'feature'
ticket: 'gh-277'
created: '2026-10-13'
status: 'built'
baseline_revision: '229b84eb174470ed03c2e6be008bcf7a50dee028'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/initiative-validation-mandatory/plan-gh-273-play-queue-backend.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story #277 needs a way to play a whole playlist through the queue; the queue API of #273 only adds one track at a time and never creates the playlist blocks that #277 and #278 rely on.

**Approach:** One endpoint that copies the playlist's tracks, in playlist order, into the caller's queue as a new block placed right after the current item, and makes the block's first item current. The track that was playing becomes history; the items that were upcoming follow the block. This PR is the backend half of #277; the floating Play/Pause button comes in a second PR once #274 is merged.

## Boundaries & Constraints

**Always:** the caller must be able to view the playlist (`canViewPlaylist`); one SQL function under `queue_lock`, like the other queue operations; every item of the block gets the same new `block_id`, `source_playlist_id` = the playlist, `block_detached = false`; ranks from migration 016's functions, with the same rebalance rule; the full `QueueState` is returned and emitted as `queue:updated`; Zod on params, `authMiddleware`, OpenAPI entry.

**Never:** mobile changes; playlist → queue sync (#278); changes to the existing queue functions' behavior; a stream URL stored.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Empty queue | playlist of 3 tracks | 3 items in playlist order, one block, current = first | — |
| Queue with current and upcoming | current X, upcoming Y, Z | X (history), block items, then Y, Z; current = first block item | — |
| Queue with items but no current | items Y, Z, current null | block items first, then Y, Z; current = first block item | — |
| Same playlist played twice | block already in the queue | a second, separate block (new `block_id`) | — |
| Empty playlist | no tracks | queue unchanged, nothing emitted | 409 `PLAYLIST_EMPTY` |
| Playlist not viewable | private, caller not owner / collaborator / viewer | queue unchanged | 403 `PLAYLIST_ACCESS_DENIED` |
| Unknown playlist | random uuid | queue unchanged | 404 `PLAYLIST_NOT_FOUND`; non-uuid → 400 |
| Long playlist | enough tracks to push a rank past `rank_max_length()` | order kept, ranks rebalanced | — |

</frozen-after-approval>

## Code Map

- `backend/migrations/021_play_queue.sql` -- `queue_lock`, `queue_set_current` (also trims history to 50), `queue_rebalance`, `queue_state`, grants pattern. Reuse; do not modify.
- `backend/migrations/016_playlist_track_ranks.sql` -- `rank_between`, `rank_max_length`; `playlist_tracks(playlist_id, track_id, rank)` is the source order.
- `backend/src/features/playlists/permissions/playlist.permissions.ts` -- `getPlaylistForPermissionCheck` (404 `PLAYLIST_NOT_FOUND`) and `canViewPlaylist`; `playlist.service.ts:getPlaylistById` shows the 403 `PLAYLIST_ACCESS_DENIED` used for a non-viewable playlist.
- `backend/src/features/queue/` -- `utils/queue-rpc.ts` (error map + `call`), `services/queue.service.ts` (`publish` emits), `queue.controller.ts`, `queue.routes.ts`, `queue.validators.ts`, `queue.openapi.ts`.
- `backend/src/features/queue/services/queue.service.int.test.ts` -- harness to extend (users, `addItems`, `ids`, `expectRanked`).
- `backend/src/realtime/playlist-updated.int.test.ts` -- how tests create a playlist and add tracks through `PlaylistService` / `PlaylistTrackService`.

## Tasks & Acceptance

**Execution:**
- [x] `backend/migrations/022_queue_play_playlist.sql` (via `make migrate-create name=queue_play_playlist`) -- `queue_play_playlist(p_user, p_playlist_id) RETURNS jsonb`: lock; raise `PLAYLIST_EMPTY` when the playlist has no track; new block id; insert the tracks in playlist rank order between the current item's rank (or the start) and the next item's rank; rebalance when a key exceeds `rank_max_length()`; `queue_set_current` to the block's first item; return `queue_state`. REVOKE / GRANT like 021.
- [x] `make supabase-up` then `make generate-types`.
- [x] `backend/src/features/queue/utils/queue-rpc.ts` -- `playPlaylistRpc`; `PLAYLIST_EMPTY` → 409.
- [x] `backend/src/features/queue/services/queue.service.ts` -- `playPlaylist(userId, playlistId)`: permission check, RPC, publish.
- [x] `queue.validators.ts`, `queue.controller.ts`, `queue.routes.ts`, `queue.openapi.ts` -- `POST /api/queue/playlists/:playlistId/play`.
- [x] `backend/src/features/queue/services/queue.service.int.test.ts` -- every matrix row.

**Acceptance Criteria:**
- Given the backend running, when opening Swagger UI, then `POST /api/queue/playlists/{playlistId}/play` is listed and callable.
- Given two devices of one user, when one plays a playlist, then both receive `queue:updated` with the block.

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint` -- expected: clean
- `cd backend && npm test && npm run test:int` -- expected: green, including the new cases

## Review Triage Log

Pass 1 (quick lens): high 0, medium 0, low 2, false 0, maybe-false 0.

| Finding | Verdict | Route | Evidence / action |
|---|---|---|---|
| Permission check and RPC not atomic: a playlist deleted mid-call gives 409 `PLAYLIST_EMPTY` or 500 instead of 404 | low | patch | Service checks outside the lock; `playlist_tracks` cascade on delete; `source_playlist_id` FK. Patch: lock the playlist row `FOR SHARE` in the function, raise and map `PLAYLIST_NOT_FOUND`. |
| Long-playlist test comment claims several rebalances | low | patch | With V/W bounds the loop rebalances once (~380th insert). Patch: comment. |
