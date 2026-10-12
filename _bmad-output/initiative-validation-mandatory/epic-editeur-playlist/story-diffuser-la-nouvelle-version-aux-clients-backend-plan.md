---
title: 'Diffuser la nouvelle version aux clients'
type: 'feature'
ticket: '5'
created: '2026-10-09'
status: 'built'
baseline_revision: '48ba64f9492f7c0c393c4f4426ecf9babe82395f'
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

**Problem:** Story 5.5 (#90). Track operations now produce a `tracksVersion` (5.3/5.4), but `playlist:updated` still sends the old unversioned shape (`track_added` with a fake `position: 0`, `track_removed`, a bare `reordered`), so clients cannot tell which version they display nor detect a missed event (doc/PLAYLIST_CONCURRENCY.md, "Broadcast and convergence").

**Approach:** `realtime.notifyPlaylistUpdate(payload: PlaylistUpdatedPayload)` emits exactly the 5.2 delta (`{ playlistId, tracksVersion, rebalanced, event: 'track_added' | 'track_removed' | 'track_moved', track | trackId | trackId+rank }`) to `playlist:<id>`, called by add, remove and move with their RPC result. The old payload types go away. The mobile socket hook gets the minimal compatibility change so the app keeps converging until 5.6: `track_moved` triggers the full refresh `reordered` used to.

## Boundaries & Constraints

**Always:** Emit after the operation committed, with the version returned by the RPC. Same room and event name (`playlist:<id>`, `playlist:updated`). Logging as today (`socketLogger.broadcast`), including `tracksVersion`. Mobile event types mirror the backend (`PlaylistUpdatedEvent`, 5.2).

**Never:** No change to the RPCs, the HTTP contract or migration 016. No version-ordering logic on mobile (ignore older, apply next, reload on gap: 5.6); no store or screen change beyond the hook's event mapping. No new socket event.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Add | track added at version v | room gets `{ event: 'track_added', track (rank, addedBy, addedAt), tracksVersion: v, rebalanced }` | none |
| Remove | track removed at v | `{ event: 'track_removed', trackId, tracksVersion: v, rebalanced: false }` | none |
| Move | track moved at v | `{ event: 'track_moved', trackId, rank, tracksVersion: v, rebalanced }` | none |
| Two clients | two sockets in the room, one operation | both receive the identical payload | none |
| Outside the room | socket not joined | receives nothing | none |
| Refused operation | 409/404 from the RPC | no event | error returned to caller only |
| Mobile, move event | hook receives `track_moved` | full refresh (as `reordered` before) | none |

</frozen-after-approval>

## Code Map

- `_bmad-output/initiative-validation-mandatory/epic-editeur-playlist/plan-implementation.md` -- **Tâche 6** (lines ~1525–1695): new `notifyPlaylistUpdate(payload)`, service calls, removal of `TrackWithPositionResponse`, `playlist-updated.int.test.ts`. Its step 1 (`npm install -D socket.io-client`) is already done: the other realtime int tests import it.
- `backend/src/realtime/index.ts` -- overloads at ~535–560 and `TrackAddedPayload` / `TrackRemovedPayload` / `PlaylistEventPayload` (~30–40), `TrackWithPositionResponse` import (line 16): replace with the single-payload method.
- `backend/src/features/playlists/services/playlist-track.service.ts` -- three calls at lines ~67, ~89, ~112: build the payload from the RPC result (`AddTrackResult`, `RemoveTrackResult` + `rebalanced: false`, `MoveTrackResult`).
- `backend/src/features/playlists/services/playlist-track.int.test.ts` -- spies on the old notify signature; update its expectations.
- `backend/src/features/playlists/playlist.types.ts` -- `TrackWithPositionResponse` (line ~104): delete once unused.
- `backend/src/realtime/playlist-room.int.test.ts` -- pattern for real server + clients joining a playlist room (users, `playlist:join`, access).
- `mobile/src/hooks/usePlaylistSocket.ts` -- `PlaylistUpdateData` and the `switch`: type the data as `PlaylistUpdatedEvent`, map `track_moved` to `onReorder`; `track_added` passes `data.track` to `addTrackLocally` (adjust its parameter type if needed, types only). `mobile/src/types/track.types.ts` `TrackWithPosition` can go if nothing uses it.

## Tasks & Acceptance

**Execution:**
- [x] `realtime/index.ts` -- `notifyPlaylistUpdate(payload)`, old payload types removed.
- [x] `playlist-track.service.ts` + its int test -- versioned payloads.
- [x] `playlist.types.ts` -- drop `TrackWithPositionResponse`.
- [x] `realtime/playlist-updated.int.test.ts` -- two clients in the room receive the identical payload for add, remove and move (story Verify); a client outside the room receives nothing; a refused move emits nothing.
- [x] `mobile/src/hooks/usePlaylistSocket.ts` (+ types) -- event typing and `track_moved` → refresh; a jest test of the mapping if the hook has a test file, else a small one.

**Acceptance Criteria:**
- Given two clients in a playlist room, when a track is moved through the service, then both receive the same `tracksVersion` and the same `rank` for that track, equal to what `GET /api/playlists/{id}` returns.

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test && npm run test:int` (stack running; leave it running) -- expected: pass.
- `cd mobile && npm run type-check && npm run lint && npm test` -- expected: pass, no new warning.

## Implementation Notes

## Plan Change Log

## Review Triage Log

Quick review, pass 1: 0 high, 0 medium, 2 low (both rejected), 0 false.

- low, rejected: the `not_initialized` warning in `notifyPlaylistUpdate` logs `playlistId` and `event` but not `tracksVersion`. Only reached before `realtime.initialize`; the plan's requirement covers the broadcast log, which has it.
- low, rejected: `playlist-room.int.test.ts` keeps its own local `PlaylistUpdated` type for `nextEvent<>` besides importing `PlaylistUpdatedPayload`. Test-only duplication; assertions unaffected.

Also: removed the "emitted from #90 on; until then the old shape" note from `doc/PLAYLIST_CONCURRENCY.md`, now outdated.
