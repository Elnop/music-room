---
title: 'Queue de lecture : écran Queue (réordonner, jouer, retirer)'
type: 'feature'
ticket: 'gh-276'
created: '2026-10-13'
status: 'built'
baseline_revision: '22055976cec1d664f5d42b328d36d2b59cf7d802'
route: 'full'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/initiative-validation-mandatory/plan-gh-274-queue-store-mobile.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The queue (#273, #274) cannot be seen or edited from the app.

**Approach:** A « Queue » button in `PlayerModal` opens a full-screen modal over the player. It lists the current item, then the upcoming items. Upcoming items can be reordered by drag and drop (the `ReorderableList` of #271), any item can be tapped to play it, and swiped left to remove it. Every action goes to the server, whose returned state replaces the store (and reaches the other devices through `queue:updated`).

**Decisions:** the screen is a second modal over `PlayerModal`, not a navigation screen. Playlist blocks are not labeled: their items look like any other item (the ticket's "blocs identifiables" line is dropped). History items are not listed.

## Boundaries & Constraints

**Always:** API calls through `queueApi` / `apiRequest`; the store takes each returned `QueueState`; an action of this device that changes the current item (tap to play, removing the current item) starts the new current item on this device, like next/previous in #274; reorder maps a drop to `afterItemId` (the upcoming item it lands after, or null for right after the current item); a failed action shows an error toast and the list returns to the store's order.

**Never:** backend changes; block names or block styling; swipe-to-add (#275); play-playlist button (#277); history list.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Open | queue with current + upcoming | current item at top (marked as playing), upcoming below in order | — |
| Empty queue | no item, or nothing upcoming and no current | empty state message | — |
| Reorder | drag upcoming item to a new index | `POST /items/:id/move` with the matching `afterItemId`; list shows the server order | 409/404 → error toast, list back to store order |
| Drop on same index | no move | no request | — |
| Tap item | any listed item | `POST /items/:id/play`, the item plays on this device | error toast |
| Swipe left upcoming | upcoming item | `DELETE /items/:id`, row gone | error toast |
| Swipe left current | current item | `DELETE`; server makes the next item current and this device plays it; empty → playback stops | error toast |
| Event from another device | `queue:updated` while the screen is open | list re-renders from the store | — |

</frozen-after-approval>

## Code Map

- `mobile/src/components/player/PlayerModal.tsx` -- full-screen RN `Modal` (`visible={isModalOpen}`); add the Queue button (header, next to the close chevron) and render the queue modal.
- `mobile/src/components/common/ReorderableList.tsx` -- `ReorderableList` (data, keyExtractor, renderItem with `drag` / `isActive`, `onReorder(from, to)`, `dragEnabled`, `ListHeaderComponent`, `ListEmptyComponent`).
- `mobile/src/store/moveTarget.ts` -- `afterRankForDrop`: same index arithmetic, but the queue move takes an item id; write the queue equivalent next to it.
- `mobile/src/components/common/SwipeableTrackItem.tsx` / `SwipeableUserItem.tsx` -- RNGH `Swipeable` left-swipe delete pattern and row styling to reuse or mirror.
- `mobile/src/store/queueStore.ts` -- `runStep`, `applyState`, `selectHasNext`; `mobile/src/services/queueApi.ts` -- `playItem` exists; add `moveItem`, `removeItem`.
- `mobile/src/store/playerStore.ts` -- `playTrack(track, queueItemId)` keeps the modal open for queue plays; `stop()`.
- `mobile/src/utils/trackToSoundCloud.ts` -- converts a `QueueItem` for the player.
- `mobile/src/utils/toast.ts` -- `showError`.

## Tasks & Acceptance

**Execution:**
- [x] `mobile/src/services/queueApi.ts` -- `moveItem(itemId, afterItemId)`, `removeItem(itemId)`.
- [x] `mobile/src/store/queueStore.ts` -- `moveItem`, `removeItem`, `playItem` actions: apply the returned state; play the new current item on this device when the action changed it; error toast on failure. Reuse the in-flight guard of #274 for actions that change the current item.
- [x] `mobile/src/store/moveTarget.ts` -- `afterItemIdForDrop(upcoming, from, to)`.
- [x] `mobile/src/components/player/QueueModal.tsx` -- the screen per the matrix; rows show artwork, title, artist, duration; the current row is highlighted and not draggable.
- [x] `mobile/src/components/player/PlayerModal.tsx` -- Queue button opening it.
- [x] Tests: `queueStore.test.ts` (move / remove / play success and failure, removing current plays the next or stops), `moveTarget.test.ts` (`afterItemIdForDrop`), a render test of `QueueModal` (current first, upcoming order, empty state).

**Acceptance Criteria:**
- Given the native debug build and two devices, when reordering, playing and removing from the Queue screen on one, then each change is persisted and visible on the other.

## Verification

**Commands:**
- `cd mobile && npm run type-check && npm run lint` -- expected: clean, no new warning
- `cd mobile && npm test` -- expected: green

**Manual checks (if no CLI):**
- Native debug build: open the player, tap Queue, reorder, tap an item, swipe one away; check on a second device.

## Review Triage Log

Pass 1 (quick lens): high 0, medium 2, low 4, false 0, maybe-false 0.

| Finding | Verdict | Route | Evidence / action |
|---|---|---|---|
| Error toasts invisible behind the native modals | medium | patch | Only `<Toast />` is at `App.tsx` root; QueueModal is a RN `Modal` inside PlayerModal's. Patch: `<Toast />` inside QueueModal. |
| Removing the queue's current item stops or replaces a list-tapped track | medium | patch | `runStep` starts/stops playback whenever loadCounter is unchanged, regardless of what this device plays. Patch: act on audio only when `queueItemId === itemId`. |
| Removing the current item while a step is pending does nothing silently | low | patch | `'ignored'` → `false`, swipe closes, no message. Patch: toast. |
| English a11y labels in a French screen | low | patch | `"Queue"`, `"Reorder track"`. Patch: French labels. |
| Emptying the queue closes the player instead of showing the empty state | low | reject | `stop()` clears `currentTrack` and PlayerModal unmounts; the matrix row asks for playback to stop, and no track → no player is the app's existing behavior. |
| Reorder uses indexes of the list at drag start | low | reject | Needs a `queue:updated` from another device during a drag; fix adds snapshot logic. |
