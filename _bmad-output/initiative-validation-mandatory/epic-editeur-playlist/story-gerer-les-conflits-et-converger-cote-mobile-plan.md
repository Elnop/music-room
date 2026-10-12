---
title: 'Gérer les conflits et converger côté mobile'
type: 'feature'
ticket: '6'
created: '2026-10-09'
status: 'built'
baseline_revision: 'cc08bc0fbf9534bd99a6ace70352642ce4f8e4e1'
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

**Problem:** Story 5.6 (#91). The backend serializes track operations and broadcasts versioned deltas (5.3–5.5), but the app cannot move a track (its `reorderTracks` calls a removed route), ignores `tracksVersion`, applies `playlist:updated` without checking order, and says nothing when a concurrent edit wins. Users of the same playlist can drift apart and never learn their move was refused.

**Approach:** As `doc/PLAYLIST_CONCURRENCY.md` describes: pure sync functions (sort by rank, apply an event → applied / ignored / reload); the store keeps `tracksVersion`, sends moves one at a time with `afterRank` and the version from the previous answer, reloads and tells the user on a 409, and applies `playlist:updated` (next version → apply, seen → ignore, gap or `rebalanced` → reload). Up / down buttons on each track row in the playlist detail screen send a move for editors. Store tests cover loading, CRUD, collaborators and conflicts. The concurrency doc gets its final details.

## Boundaries & Constraints

**Always:** All calls through `playlistApi` (already on `apiRequest`). Local order always sorted by `rank` (byte order, `<` on strings). A move is sent only after the previous one answered, with the `tracksVersion` it returned. On `TRACK_MOVED_CONCURRENTLY`, `TRACK_NOT_IN_PLAYLIST` or `PLAYLIST_REBALANCED`: reload the playlist and show a message ("This track was changed by someone else"). Buttons only for users who can edit (`canEdit`), disabled at the list edges and while a move is pending.

**Never:** No backend change. No drag and drop. No optimistic reorder that is not rolled back by the reload. No change to collaborator/viewer endpoints beyond testing them.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Move up | track at index i > 0 | move with `afterRank` = rank of track i−2 (null if i = 1) and the displayed version | none |
| Move down | track at index i < last | `afterRank` = rank of track i+1 | none |
| Two quick moves | second tapped before the first answered | second sent after the first, with the version from the first answer; no 409 against oneself | none |
| Conflict | move answers 409 (any of the three codes) | playlist reloaded, message shown | rejects with the `ApiError` |
| Event next version | `tracksVersion` = displayed + 1 | applied (add / remove / move by rank) | none |
| Event already seen | `tracksVersion` ≤ displayed | ignored | none |
| Event gap | `tracksVersion` > displayed + 1 | reload | none |
| Event rebalanced | `rebalanced: true` | reload | none |
| Own operation echo | event for the move/add/remove this client just made | ignored (version already taken from the HTTP answer) | none |
| Manual, two devices | up on device A | device B shows the new order; simultaneous moves of the same track leave both screens in the same order, the loser sees the message | none |

</frozen-after-approval>

## Code Map

- `_bmad-output/initiative-validation-mandatory/epic-editeur-playlist/plan-implementation.md` -- **Tâche 7** (lines ~1696–2050: `store/playlistSync.ts` + test, store `moveTrack` queue, `applyPlaylistEvent`, `CONFLICT_CODES`, socket wiring), **Tâche 8** (lines ~2053–2190: `moveTarget.ts` + test, buttons in `SwipeableTrackItem`, screen wiring), **Tâche 9** (lines ~2192–2215: doc). Already done elsewhere, skip: `apiRequest` export and `playlistApi` on `apiRequest` (#96), `TrackWithPosition` removal and `track_moved` typing (#90), the delta payload and `PLAYLIST_REBALANCED` in the doc (#87).
- `mobile/src/api/playlistApi.ts` -- `addTrack`/`removeTrack` return `void` (lines ~85, ~114): return `AddTrackResult` / `RemoveTrackResult`; replace `reorderTracks` (~121) with `moveTrack(playlistId, trackId, afterRank, expectedVersion): Promise<MoveTrackResult>`.
- `mobile/src/store/playlistStore.ts` (368 lines) -- actions at lines ~59–360; `reorderTracks` (~294) goes; `addTrackLocally` / `removeTrackLocally` replaced by event application. If it grows past ~300 lines, keep the sync logic in `playlistSync.ts`.
- `mobile/src/hooks/usePlaylistSocket.ts` -- currently maps events to `addTrackLocally` / `removeTrackLocally` / `onReorder`; pass events to the store's `applyPlaylistEvent` and reload on `'reload'`.
- `mobile/src/screens/playlists/PlaylistDetailScreen.tsx` -- `canEdit` (~98), `handleReorderUpdate` (~109), `SwipeableTrackItem` rows (~213); add the buttons and the conflict message (existing alert/toast pattern of the screen).
- `mobile/src/components/common/SwipeableTrackItem.tsx` -- row component; add optional up/down props.
- Collaborators: `playlistApi.addCollaborator` / `removeCollaborator` / viewers (~131–173) are called from `PlaylistSharingScreen`; if the store has no collaborator action, cover them with `playlistApi` tests (mocked `apiRequest`).
- `doc/PLAYLIST_CONCURRENCY.md` -- remaining Tâche 9 items: threshold `rank_max_length() = 64` (~320 moves into one gap), the move path `POST /api/playlists/:id/tracks/:trackId/move` in the operations table, and the test files in "Tests".
- Test patterns: `src/store/socketStore.test.ts`, `src/hooks/usePlaylistSocket.test.ts`, `src/services/api.test.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `store/playlistSync.ts` + test -- `sortByRank`, `applyPlaylistEvent` (matrix event rows).
- [x] `store/moveTarget.ts` + test -- `afterRank` for up/down (matrix move rows, edges).
- [x] `api/playlistApi.ts` -- typed results, `moveTrack`, `reorderTracks` gone.
- [x] `store/playlistStore.ts` + `playlistStore.test.ts` -- version tracking, move queue, conflict reload + message state, event application; tests for loading, CRUD, add/remove, moves, conflicts, events.
- [x] `api/playlistApi.test.ts` (or store tests) -- collaborators and viewers.
- [x] `hooks/usePlaylistSocket.ts` + its test -- events through the store.
- [x] `SwipeableTrackItem.tsx`, `PlaylistDetailScreen.tsx` -- buttons and message.
- [x] `doc/PLAYLIST_CONCURRENCY.md` -- remaining details; remove the `reorderTracks` deferred-work entry if one exists.

**Acceptance Criteria:**
- Given the store tests, when they run, then two quick moves go one after the other with the returned version, a 409 reloads and sets the message, an event replaces the local order and a missing version reloads, and CRUD and collaborators are covered (story Verify).
- Given two devices on the same playlist, when one moves a track up, then the other shows it; when both move the same track at once, both end in the same order and the loser sees the message (manual, by the human).

## Verification

**Commands:**
- `cd mobile && npm run type-check && npm run lint && npm test` -- expected: pass, no new warning.

**Manual checks:**
- Two devices or emulators on the same playlist (human).

## Implementation Notes

- `moveTarget.ts` lives in `mobile/src/store/` (as the task list says), not `screens/playlists/` (Tâche 8).
- Store state added: `pendingMoves` (disables the buttons while a move is sent or queued) and `conflictMessage` + `clearConflictMessage` (set after the conflict reload; the screen shows it with `showError` and clears it). `CONFLICT_CODES` and `CONFLICT_MESSAGE` are exported from `playlistStore.ts`.
- `fetchPlaylistById` sorts by rank and keeps the displayed tracks when an event applied during the request is newer than the answer.
- Reloads after a successful add / remove / move (`'reload'` outcome) are quiet: a failed reload stays in `error` and does not turn the operation into a failure.
- A non-conflict move error sets `error` and does not reload; the socket event brings the order if the move did apply.
- `SwipeableTrackItem` gets `showMoveButtons` in addition to `onMoveUp` / `onMoveDown`, so the buttons stay visible (disabled) while a move is pending instead of disappearing.
- `playlistStore.ts` is ~405 lines (was 368); the pure sync rules are in `playlistSync.ts`.
- The `reorderTracks` entry was removed from `_bmad-output/initiative-validation-mandatory/deferred-work.md`.

## Plan Change Log

## Review Triage Log

Quick review, pass 1: 1 high, 2 medium, 1 low; all patched.

- high, patch: `moveTrack` incremented `pendingMoves` before queueing, and the queued run's early return (playlist no longer current) skipped the `finally`, so the counter never dropped and every move button stayed disabled until restart; the move also resolved as a success though never sent. Decrement now covers every exit; a stale move is dropped explicitly; test added.
- medium, patch: `removeTrack`'s failure restore wrote `playlistApi.fetchPlaylistById` straight into `currentPlaylist`, skipping `sortByRank`, the newer-version guard and the current-playlist check (could roll back a newer event or overwrite another playlist). Uses the shared reload path.
- medium, patch: after a socket reconnect the room was re-joined without reloading; an event missed while disconnected was never recovered if no later event arrived (two-device AC). The hook reloads the playlist on re-join after a reconnect.
- low, patch: `conflictMessage` set after the reload could outlive the screen and appear on the next playlist opened. Set only if the playlist is still current; cleared by `clearCurrentPlaylist` and on unmount.
