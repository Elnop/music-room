---
title: 'Queue de lecture : modèle, API et socket (backend)'
type: 'feature'
ticket: 'gh-273'
created: '2026-10-13'
status: 'built'
baseline_revision: '7d6e8557eb979c0ff44fceeb24147e3e847e1c42'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/doc/PLAYLIST_CONCURRENCY.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** There is no play queue: the app plays one track and stops. Epic #272 needs a server-side queue, one per user, synced across that user's devices, that later stories (#274–#279) build on.

**Approach:** New `play_queues` (one row per user: current item pointer, lock) and `play_queue_items` (rank-ordered items) tables, mutated only through SQL functions serialized per user, exposed by a new `features/queue/` REST API. Every mutation emits `queue:updated` with the full queue state to `user:<id>`.

## Boundaries & Constraints

**Always:** Zod on every body and path param; `authMiddleware` on every route; an OpenAPI entry per endpoint; ranks reuse migration 016's `rank_after` / `rank_between` / `rank_spaced` with the same format check and rebalance threshold; a user mutation (remove, move) of an item that has a `block_id` sets `block_detached = true` on every item of that block; `track_uri` is the SoundCloud permalink; services under ~150 lines.

**Decisions:** queue items reference `tracks` (`track_id`), upserted on `track_uri` like playlist adds, instead of a metadata snapshot. Removing the current item is allowed and acts as a skip: current moves to the next item; with no next item, current becomes null and the history is deleted, leaving an empty queue.

**Never:** persist a stream URL; a "play playlist" endpoint or playlist → queue sync (#277, #278); mobile changes (#274); delegate next/previous (#279); direct table writes outside the SQL functions; Music Track Vote.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First read | user never queued anything | `{ currentItemId: null, items: [] }` | — |
| Add | track body | item appended after the last rank; current unchanged | 400 on invalid body |
| Remove | upcoming or history item id | item gone; its block detached | 404 `QUEUE_ITEM_NOT_FOUND` if not the caller's |
| Remove current | current item, a next item exists / none | current = next item / current null and history deleted | — |
| Move | item, `afterItemId` (null = right after current) | item placed between `afterItemId` and the next item; block detached | 404 unknown item; 409 `QUEUE_ITEM_NOT_UPCOMING` when the item or `afterItemId` is current or history |
| Play item | any item id of the caller | `currentItemId` = item | 404 unknown item |
| Next | current has a following item / current null and items exist | current = next item / first item | 409 `QUEUE_END` when none |
| Previous | current has a preceding item | current = previous item | 409 `QUEUE_START` when none or current null |
| Other user's item | item id of another user | nothing changes | 404 (no existence leak) |

</frozen-after-approval>

## Code Map

- `backend/migrations/016_playlist_track_ranks.sql` -- rank functions to reuse; `playlist_lock` / `playlist_move_track` / `playlist_rebalance` are the model for the queue functions (lock first, `SET CONSTRAINTS ... DEFERRED` on rebalance, REVOKE from PUBLIC/anon/authenticated, GRANT to service_role).
- `backend/migrations/017_revoke_direct_table_access.sql` -- new tables must not grant anon/authenticated anything.
- `backend/src/features/playlists/utils/track-rpc.ts` -- pattern for calling RPCs, Zod-parsing results and mapping `RAISE EXCEPTION` codes to `AppError`.
- `backend/src/features/playlists/services/playlist-track.service.ts` -- `addTrack` upserts into `tracks` (lines ~29–45): extract it to a shared helper used by both features.
- `backend/src/features/playlists/playlist.validators.ts` -- `addTrackSchema` reused for the add body.
- `backend/src/features/music-control/` -- controller (`sendData`), routes, openapi layout to mirror.
- `backend/src/shared/config/routes.ts`, `backend/src/shared/config/swagger.config.ts` -- mount `/api/queue`, register paths/schemas.
- `backend/src/realtime/index.ts` -- sockets already join `user:${userId}` (line ~162); add `notifyQueueUpdate(userId, state)` next to `notifyPlaylistUpdate`.
- `backend/src/realtime/playlist-updated.int.test.ts` -- harness (real Socket.io server, users, tokens) to copy for the two-device test.
- `backend/src/features/playlists/services/track-operations.int.test.ts` -- style for SQL-backed service int tests (local test stack is running).

## Tasks & Acceptance

**Execution:**
- [x] `backend/migrations/021_play_queue.sql` (via `make migrate-create name=play_queue`) -- tables `play_queues(user_id PK → auth.users ON DELETE CASCADE, current_item_id → play_queue_items ON DELETE SET NULL, updated_at)` and `play_queue_items(id, user_id, track_id → tracks, rank text COLLATE "C" + format check + UNIQUE(user_id, rank) DEFERRABLE, source_playlist_id → playlists ON DELETE SET NULL, block_id uuid null, block_detached bool default false, added_at)`; functions `queue_lock`, `queue_rebalance`, `queue_add_item`, `queue_remove_item`, `queue_move_item`, `queue_play_item`, `queue_step(p_user, p_direction)`; history trim; grants -- one serialized writer per user.
- [x] `make supabase-up` then `make generate-types` -- types for the new tables/functions.
- [x] `backend/src/features/queue/queue.types.ts`, `queue.validators.ts`, `utils/queue-rpc.ts`, `services/queue.service.ts`, `queue.controller.ts`, `queue.routes.ts`, `queue.openapi.ts` -- endpoints `GET /api/queue`, `POST /api/queue/items`, `DELETE /api/queue/items/:itemId`, `POST /api/queue/items/:itemId/move`, `POST /api/queue/items/:itemId/play`, `POST /api/queue/next`, `POST /api/queue/previous`; each returns the full `QueueState` and emits it.
- [x] `backend/src/realtime/index.ts` -- `notifyQueueUpdate` emitting `queue:updated` to `user:<id>`.
- [x] `backend/src/shared/config/routes.ts`, `swagger.config.ts` -- mount and document.
- [x] `backend/src/features/queue/services/queue.service.int.test.ts` -- every I/O matrix row, block detachment on remove and move (blocks seeded with direct inserts), history trim, rank rebalance.
- [x] `backend/src/realtime/queue-updated.int.test.ts` -- two sockets of the same user; a mutation reaches both, another user's socket gets nothing.
- [x] `backend/src/features/queue/queue.validators.test.ts` -- uuid params, `afterItemId` nullable uuid.

**Acceptance Criteria:**
- Given the backend running, when opening Swagger UI, then the seven queue endpoints are listed and callable with a bearer token.
- Given two devices of one user connected, when one adds an item, then both receive `queue:updated` with the new state, and no other user does.
- Given any queue operation, when inspecting the database, then no stream URL is stored.

## Design Notes

`QueueState = { currentItemId: string | null, items: QueueItem[] }`, items in rank order, history included (items ranked before the current one) so the client can show "previous". `QueueItem = { id, rank, track: { trackUri, title, artist, album, albumArt, durationMs }, sourcePlaylistId, blockId, blockDetached }`.

Items ranked after the current one are "upcoming"; with `currentItemId` null every item is upcoming. Playing an item skips the ones in between into history. On each `queue_step` forward, history beyond the 50 most recent items is deleted so the queue stays bounded.

Move takes `afterItemId` (not a rank + version as playlists do): a queue has one owner, the lock serializes their devices, and the server computes the rank, so no concurrent-move conflict exists to report.

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint` -- expected: clean
- `cd backend && npm test` -- expected: green
- `cd backend && npm run test:int` -- expected: green, including the new queue tests

**Manual checks (if no CLI):**
- Swagger UI (http://localhost:3000/api-docs): add, move, play, next, previous, remove on a test account.

## Review Triage Log

Pass 1 (quick lens): high 0, medium 1, low 4, false 0, maybe-false 0.

| Finding | Verdict | Route | Evidence / action |
|---|---|---|---|
| Queue add accepts and persists `previewUrl` (stream URL) | medium | patch | `addQueueItemSchema = addTrackSchema` keeps `previewUrl`; `upsertTrack` writes `preview_url`; soundcloud.types.ts:77 calls it the stream URL. Mobile never sends it, but the API allows it. Patch: omit it from the queue schema, test it. The playlist add path has the same hole (pre-existing): deferred. |
| `queue:updated` can arrive out of order; no version in `QueueState` | low | reject | Real: emit happens after each RPC response, two concurrent mutations of one user can emit in reverse order. Needs two devices of the same user mutating within milliseconds; fix adds a public `version` field. Unlikely in everyday use; revisit if #274/#278 show stale states. |
| Removing current leaves 49 history items | low | patch | `queue_set_current(next_id)` trims before the removed item is deleted. Patch: delete first. |
| `queue_find_item` comment says "locked" | low | patch | No `FOR UPDATE`; callers hold `queue_lock`. Patch: comment. |
| History trimmed on play/previous, not only on next | low | patch | Trim lives in `queue_set_current`; bounding history on every current change is intended, but `/play` does not document it. Patch: OpenAPI description. |
