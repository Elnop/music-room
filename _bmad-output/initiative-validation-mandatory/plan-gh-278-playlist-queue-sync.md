---
title: 'Queue de lecture : synchro playlist → queue (blocs non détachés)'
type: 'feature'
ticket: 'gh-278'
created: '2026-10-13'
status: 'built'
baseline_revision: '5a18875ecc1f4d3934b992faa37261f53200305d'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/initiative-validation-mandatory/plan-gh-273-play-queue-backend.md', '{project-root}/_bmad-output/initiative-validation-mandatory/plan-gh-277-play-playlist-backend.md', '{project-root}/doc/PLAYLIST_CONCURRENCY.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A playlist played into the queue (#277) is a copy: when the playlist changes afterwards, the queues that hold it do not follow.

**Approach:** After each successful track add, remove or move in a playlist, the backend applies the same change to every non-detached block of that playlist, in every user's queue, then emits `queue:updated` to each affected user. Only the upcoming part of a block is synced; history and the current item are never touched.

**Decisions:** sync touches upcoming items only. Add: the track goes right after the block's last item, unless the block is finished (its last item is the current one or history), in which case nothing is added. Remove: the matching upcoming item of the block is deleted; the current item and history items stay. Move: the new place is right after the block item of the track's new playlist predecessor, or right before the block's first item when it moves to the top of the playlist; it is applied only when the moved item is upcoming and that new place lies after the current item; otherwise that block is left as is. A sync never detaches a block.

## Boundaries & Constraints

**Always:** each affected queue is changed under its own `queue_lock`, users locked in `user_id` order (no deadlock); ranks from migration 016's functions with the rebalance rule; a sync failure is logged and never fails the playlist operation the user made; the playlist services stay under ~150 lines (sync logic in a dedicated service); `queue:updated` with the full state to each affected user only.

**Never:** sync a detached block (`block_detached = true`); remove or move the current item; touch history; change the existing queue or playlist SQL functions' behavior; mobile changes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Add, block upcoming | playlist gets a track; user's block has upcoming items | new item after the block's last item, same `block_id` / `source_playlist_id`, not detached | — |
| Add, block finished | block's last item is current or history | queue unchanged | — |
| Remove, upcoming | removed track is an upcoming block item | item deleted | — |
| Remove, current | removed track is the current item | queue unchanged | — |
| Remove, history | removed track is a history block item | queue unchanged | — |
| Move, both upcoming | moved track and its new place upcoming | block item moved to match the playlist order | — |
| Move touching the played part | moved item, or its new place, is current/history | queue unchanged | — |
| Detached block | user removed or moved one of its items before | queue unchanged | — |
| Several users / blocks | two users each with a block, one user with two blocks of the playlist | every non-detached block synced; each affected user gets one `queue:updated`; unaffected users get none | — |
| Sync failure | sync RPC errors | playlist operation still succeeds; error logged | — |

</frozen-after-approval>

## Code Map

- `backend/src/features/playlists/services/playlist-track.service.ts` -- `addTrack` / `removeTrack` / `moveTrack` (119 lines): after the RPC succeeds, call the sync service (track id, playlist id; for a move, the new predecessor track from the playlist order).
- `backend/migrations/021_play_queue.sql` -- `queue_lock`, `queue_rebalance`, `queue_state`; `play_queue_items(block_id, block_detached, source_playlist_id, track_id, rank)`, `play_queues.current_item_id`.
- `backend/migrations/022_queue_play_playlist.sql` -- how a block is laid out (one `block_id`, playlist order, after the current item).
- `backend/migrations/016_playlist_track_ranks.sql` -- `rank_between`, `rank_max_length`; `playlist_tracks(playlist_id, track_id, rank)` gives the playlist order (track ids are unique within a playlist).
- `backend/src/features/queue/utils/queue-rpc.ts`, `services/queue.service.ts` -- RPC + `queueStateSchema` parsing; `realtime.notifyQueueUpdate(userId, state)`.
- `backend/src/features/queue/services/queue.service.int.test.ts` -- harness (users, playlists via `PlaylistService` / `PlaylistTrackService`, `playPlaylist`).

## Tasks & Acceptance

**Execution:**
- [x] `backend/migrations/023_queue_playlist_sync.sql` (via `make migrate-create`) -- `queue_sync_track_added(p_playlist_id, p_track_id)`, `queue_sync_track_removed(p_playlist_id, p_track_id)`, `queue_sync_track_moved(p_playlist_id, p_track_id)` (reads the new predecessor from `playlist_tracks`); each locks the affected queues in `user_id` order, applies the decisions above, and returns the affected user ids. REVOKE / GRANT like 021.
- [x] `make supabase-up` then `make generate-types`.
- [x] `backend/src/features/queue/services/queue-sync.service.ts` -- calls the right RPC, then for each affected user reads `queue_state` and emits `queue:updated`; catches and logs every error.
- [x] `backend/src/features/playlists/services/playlist-track.service.ts` -- call the sync after each successful add / remove / move.
- [x] `backend/src/features/queue/services/queue-sync.int.test.ts` -- every matrix row, including the failure row (sync error does not fail the playlist call).

**Acceptance Criteria:**
- Given a user who played a playlist and has not touched its block, when another user adds, removes or moves a track in that playlist, then the first user's queue reflects it and they receive `queue:updated`.

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint` -- expected: clean
- `cd backend && npm test && npm run test:int` -- expected: green, including the sync tests

## Review Triage Log

Pass 1 (quick lens): high 0, medium 2, low 4, false 0, maybe-false 0.

| Finding | Verdict | Route | Evidence / action |
|---|---|---|---|
| Sync reaches users who can no longer view the playlist | medium | patch | `queue_sync_users` has no visibility check; `canViewPlaylist` only ran at block creation. Patch: filter on public / owner / collaborator / viewer, test with a playlist turned private. |
| Stale `current_rank` after a rebalance inside the block loop | medium | patch | Read once per user; `queue_rebalance` respaces all ranks; next block compared in the old key space → history touched. Patch: re-read after rebalance, test. |
| "Already there" guard counts current/history items | low | patch | Removed-while-current then re-added track never appended. Patch: guard on upcoming items only. |
| Move skipped when the block holds none of the predecessors | low | patch | `anchor_rank` NULL → `CONTINUE`. Patch: same as top of playlist. |
| Test gaps (moved failure, multi-block remove/move, rebalance) | low | patch | Patch: add the tests. |
| Concurrent adds whose syncs run in reverse order leave the block out of order | low | reject | Needs two adds to the same playlist within the sync window; the next move sync realigns; the plan's decision appends at the block end. |
