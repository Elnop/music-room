---
title: 'Playlist drag and drop (#271)'
type: 'feature'
ticket: ''
created: '2026-10-13'
status: 'built'
baseline_revision: '276eb44779fb52c10e882c230945675c7b633478'
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

**Problem:** Reordering a playlist means tapping chevron buttons one row at a time, which is slow for long moves. GitHub issue #271 asks for drag and drop from a handle.

**Approach:** Replace the chevrons in `SwipeableTrackItem` with a drag handle and render the playlist detail list through a new reusable reorderable list component. Each drop is sent as a single `playlistStore.moveTrack(afterRank)`. The component is generic so the Queue screen (#276) can reuse it. No backend change.

## Boundaries & Constraints

**Always:** A drag starts only from the handle, so the horizontal swipe-to-delete keeps working. Only users with `canEdit` see the handle. The dropped order shows immediately and stays on screen until the store's tracks change: the server answer arrives, a conflict triggers a reload, or the move fails. Dragging stays disabled while a move is pending (`pendingMoves > 0`), as the chevrons were. Mobile only; follow AGENTS.md (no barrel files, lockfile committed with the dependency).

**Never:** Change the backend or the `moveTrack` store contract. Persist anything new. Let a drop that does not change position send a request.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Drag down | ranks [a,h,p,t], drag index 1 → 3 | `moveTrack(id, track1, 't')` | No error expected |
| Drag up | drag index 2 → 0 | `moveTrack(id, track2, null)` | No error expected |
| Drag up mid | drag index 3 → 1 | afterRank `'a'` | No error expected |
| Same spot | from === to | no request | — |
| Conflict | server answers a CONFLICT code | store reloads; the local order is dropped in favour of the reloaded tracks; toast via `conflictMessage` | handled by the existing effect |
| Other failure | network or 5xx | local order reverts to the store's tracks | toast "Impossible de déplacer le track" |

**Decision:** the drag library is `react-native-reorderable-list`, not `react-native-draggable-flatlist`. draggable-flatlist has had no release since mid-2025 and is reported to break with Reanimated 4 and the New Architecture.

</frozen-after-approval>

## Code Map

- `mobile/src/components/common/SwipeableTrackItem.tsx` -- uses RNGH `Swipeable` for delete; `showMoveButtons/onMoveUp/onMoveDown` render the chevrons. Replace them with an optional `onDragStart?: () => void` (handle shown when it is set and `!disabled`), plus `isDragActive?` for a raised style. The handle is a `reorder-three-outline` Ionicon in a `Pressable` with `onPressIn={onDragStart}`, `hitSlop`, `accessibilityLabel="Reorder track"`.
- `mobile/src/screens/playlists/PlaylistDetailScreen.tsx` -- `FlatList` with `ListHeaderComponent=<PlaylistHeader>`, `handleMove(index, direction)` uses `afterRankFor`, and `isMoving = pendingMoves > 0`. Switch to the new list component and a `handleReorder(from, to)`. Keep the header, empty state, padding and conflict effects as they are.
- `mobile/src/store/moveTarget.ts` (+ `.test.ts`) -- `afterRankFor(tracks, index, 'up'|'down')`. It is only used by the detail screen. Replace it with `afterRankForDrop(tracks, from, to)`: `undefined` when `from === to` or an index is out of range, `null` when `to === 0`, `tracks[to - 1].rank` when moving up, `tracks[to].rank` when moving down. Rewrite the tests against the matrix.
- `mobile/src/store/playlistStore.ts` -- `moveTrack` (l.336) is not optimistic: it applies the server's `track_moved` event and reloads on conflict. Leave it unchanged.
- `mobile/src/components/common/ReorderableList.tsx` (new) -- a generic wrapper around the drag library: `data`, `keyExtractor`, `renderItem({item, index, drag, isActive})`, `onReorder(from, to)`, `dragEnabled`, and pass-through FlatList props (`ListHeaderComponent`, `ListEmptyComponent`, `contentContainerStyle`, `showsVerticalScrollIndicator`). It holds the dropped order locally until the `data` prop changes identity, so there is no snap back while the request is in flight.
- `mobile/App.tsx` -- already wraps the app in `GestureHandlerRootView`. `babel.config.js` already has the reanimated plugin. Reanimated ~4.1.1 and RNGH ~2.28 are installed.
- `react-native-swipeable-item` is in `package.json` but unused; leave it alone.

## Tasks & Acceptance

**Execution:**
- [x] `mobile/package.json` + lockfile -- `npm install react-native-reorderable-list` -- the list needs native-thread drag.
- [x] `mobile/src/store/moveTarget.ts` + `moveTarget.test.ts` -- replace `afterRankFor` with `afterRankForDrop` and test every matrix row.
- [x] `mobile/src/components/common/ReorderableList.tsx` -- new generic component as described in the Code Map.
- [x] `mobile/src/components/common/SwipeableTrackItem.tsx` -- swap the chevrons for the handle props and drop the `moveButtons` style.
- [x] `mobile/src/screens/playlists/PlaylistDetailScreen.tsx` -- use `ReorderableList` with `dragEnabled={canEdit && !isMoving}` and pass `onDragStart={canEdit ? drag : undefined}`. `handleReorder` computes `afterRankForDrop` on `currentPlaylist.tracks` and keeps the existing error handling.
- [x] `mobile/src/components/common/SwipeableTrackItem.test.tsx` (new) -- the handle renders only with `onDragStart` and not when `disabled`; pressing it calls `onDragStart`.

**Acceptance Criteria:**
- Given an editor on a playlist, when they drag a track by its handle and drop it elsewhere, then the track stays at the drop position and, after a reload or on another member's device, it is in that position (`playlist:updated`).
- Given a viewer without edit rights, when they open the playlist, then no handle is shown and nothing can be dragged.
- Given an editor, when they swipe a track left and tap Supprimer, then the track is deleted as before.
- Given an editor, when they scroll the list by dragging anywhere except the handle, then the list scrolls and no reorder starts.

## Implementation Notes

- `react-native-reorderable-list@^0.18.1` installed (peers: RNGH >=2.12, Reanimated >=3.12).
- Revert on failure: `onReorder` may return a promise; the screen's `handleReorder` rethrows after its toast, and the list drops its local order on rejection (simpler than a `resetKey`).
- The local order is stored with the `data` array it was built from and ignored once `data` changes identity, so no reset effect is needed.
- The library's pan gesture covers the whole list; it is given `activeOffsetY([-5, 5])` so a horizontal swipe reaches the row's `Swipeable` first. The drag itself only starts when the handle calls `drag()`.
- Rows render through an inner `Cell` component because `useReorderableDrag`/`useIsActive` only work inside a cell; `shouldUpdateActiveItem` is on for `isActive`.

## Plan Change Log

## Review Triage Log

### Pass 1 (quick) — high 0, medium 1, low 2, false 1, maybe-false 1

| # | Finding | Verdict | Route | Evidence |
|---|---------|---------|-------|----------|
| 1 | `ReorderableList` keeps the dropped order when `moveTrack` resolves without the tracks changing; the next drag moves the wrong track | medium | patch | `reloadQuietly` (playlistStore.ts:24-29) swallows fetch errors, so after a `'reload'` outcome `data` keeps its identity and the promise resolves. Fix: clear the override when the promise settles either way. |
| 2 | On a conflict whose reload fails, the list snaps back to the pre-drop order | false | reject | The store's order is the truth after a refused move; showing it with the conflict toast is the intended outcome. |
| 3 | The handle is still shown and pressable while a move is pending | low | reject | `dragEnabled` blocks the drag (the library's `startDrag` returns early). A pending move lasts one request; signalling it would need a new prop. |
| 4 | No `failOffsetX` on the vertical pan, so a diagonal swipe may never reach the row | maybe-false | defer | Unverified, medium if true. Settled by the manual device check of swipe-to-delete. |
| 5 | No screen-level test for the conflict and other-failure rows; the list test never covers a `void` `onReorder` | low | reject | The revert is tested at component level; a screen-level test would need the store, the socket and the library mocked. |

## Design Notes

The drop index maps to the same `afterRank` contract as the chevrons. When moving down, the track lands after the row currently at `to`. When moving up, it lands after the row at `to - 1`, or at the top when `to` is 0. Example with ranks [a,h,p,t]: dragging 1 → 3 gives `'t'`, and 3 → 1 gives `'a'`.

Local order in `ReorderableList`: `const [override, setOverride] = useState<T[] | null>(null)`, reset in an effect when `data` changes. `onReorder` builds the reordered array from the displayed list, stores it, then calls the prop. On a non-conflict failure the store does not touch `currentPlaylist`, so the screen must ask for a revert explicitly: give the component a `resetKey` prop, or reset on `onReorder`'s returned promise rejecting. Pick the simpler one when implementing.

## Verification

**Commands:**
- `cd mobile && npm test -- moveTarget SwipeableTrackItem` -- expected: pass
- `cd mobile && npm run type-check && npm run lint` -- expected: no errors
- `make test` -- expected: exit 0

**Manual checks (if no CLI):**
- Native debug build (`npx expo run:android`), playlist with 4 or more tracks, two accounts: drag, swipe-delete and scroll behave as the ACs describe, and the second device sees the new order.
