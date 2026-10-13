---
title: 'Queue de lecture : swipe droit pour ajouter un son depuis les listes'
type: 'feature'
ticket: 'gh-275'
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

**Problem:** A track can only enter the queue through the API; the app offers no way to add one.

**Approach:** Swiping a track row to the right adds it to the end of the queue (`POST /api/queue/items`) from the three track lists: search results, playlist detail, and the add-tracks screen. The row shows a queue icon while it is swiped, then springs back, and a toast confirms the add.

## Boundaries & Constraints

**Always:** the add goes through `queueStore` → `queueApi` → `apiRequest`, and the store takes the returned `QueueState`; the request body is the backend `addTrackSchema` shape without `previewUrl`; a right swipe works for any viewer of a playlist, even one who cannot edit it; the left swipe that deletes from a playlist keeps working, still only for editors; the drag handle of #271 keeps working; toasts in French like the rest of the app (`utils/toast.ts`).

**Never:** play the added track or change what is playing; touch the backend; queue screen (#276); a confirmation dialog.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Swipe right in search | search result row | track appended to the queue, row springs back, toast « Ajouté à la file de lecture » | — |
| Swipe right in playlist detail | any viewer, editor or not | same | — |
| Swipe right in add-tracks screen | result row, added to the playlist or not | same; tapping the row still adds to the playlist | — |
| Swipe left in playlist detail | editor | delete action as today | — |
| Swipe left in playlist detail | viewer who cannot edit | nothing (as today) | — |
| Network / server error | add fails | row springs back, nothing added locally | error toast with the API message |
| Partial swipe | released before the threshold | row springs back, nothing sent | — |

</frozen-after-approval>

## Code Map

- `mobile/src/components/common/SwipeableTrackItem.tsx` -- RNGH `Swipeable` (v2.28) with `renderRightActions` = delete; today `enabled={!disabled}` turns off every swipe for non-editors. Add `renderLeftActions` + an `onAddToQueue` prop; keep the delete action editor-only.
- `mobile/src/components/common/SwipeableTrackItem.test.tsx` -- existing tests (theme mock, `act` for Ionicons font) to extend.
- `mobile/src/screens/search/components/SoundCloudTrackItem.tsx` -- search row (`TouchableOpacity`, tap = play, `+` = add to playlist); wrap it in the swipe.
- `mobile/src/screens/playlists/SearchTracksScreen.tsx:150-187` -- `renderTrackItem` row (tap = add to playlist); wrap it. Lines 117-133 build the add body from a `SoundCloudTrack`.
- `mobile/src/screens/search/components/PlaylistSelectorModal.tsx:92-104` -- same conversion; share one helper for both and the queue.
- `mobile/src/screens/playlists/PlaylistDetailScreen.tsx:219` -- renders `SwipeableTrackItem`.
- `mobile/src/store/queueStore.ts`, `mobile/src/services/queueApi.ts`, `mobile/src/types/queue.types.ts` -- from #274; add `addItem`.
- `mobile/src/utils/toast.ts` -- `showSuccess`, `showError`.

## Tasks & Acceptance

**Execution:**
- [x] `mobile/src/services/queueApi.ts` -- `addItem(body)` → `POST /api/queue/items`, returns `QueueState`.
- [x] `mobile/src/store/queueStore.ts` -- `addItem(track)`: calls the API, applies the returned state, toasts success or the error; never touches `playerStore`.
- [x] `mobile/src/utils/` -- one helper turning a `SoundCloudTrack` or a `Track` into the add body (no `previewUrl`); `SearchTracksScreen` and `PlaylistSelectorModal` reuse it for the playlist add.
- [x] `mobile/src/components/common/QueueSwipe.tsx` (or an extension of `SwipeableTrackItem`) -- the left action panel with a queue icon; opening it fully calls the add once and closes the row.
- [x] `SwipeableTrackItem.tsx`, `SoundCloudTrackItem.tsx`, `SearchTracksScreen.tsx`, `PlaylistDetailScreen.tsx` -- wire the right swipe on the three lists.
- [x] Tests: `queueStore.test.ts` (add success applies state and leaves the player alone, add failure keeps state), `SwipeableTrackItem.test.tsx` (add action present for a non-editor, delete action absent for a non-editor), the conversion helper.

**Acceptance Criteria:**
- Given the native debug build, when swiping a row right in each of the three lists, then the track is appended to the queue (visible after a `GET /api/queue`) and a toast confirms it.

## Verification

**Commands:**
- `cd mobile && npm run type-check && npm run lint` -- expected: clean, no new warning
- `cd mobile && npm test` -- expected: green

**Manual checks (if no CLI):**
- Native debug build: swipe right on each list; swipe left still deletes in a playlist you edit; drag handle still reorders.

## Review Triage Log

Pass 1 (quick lens): high 0, medium 1, low 1, false 0, maybe-false 0; one note on device checks.

| Finding | Verdict | Route | Evidence / action |
|---|---|---|---|
| A late add response overwrites a newer queue state | medium | defer | Real: `applyState` replaces the whole store with no ordering; two quick swipes can apply A after B. Root cause is the unversioned `QueueState` of #273 (also seen in #273/#274 reviews); the fix needs a backend version. Opened #285. |
| Queue panel shows through the row gap in `SearchTracksScreen` | low | patch | `trackItem` margin inside the Swipeable; panel is 100% height. Patch: margin outside the swipe. |
| Acceptance criterion needs a native-build run | — | note | Tests call `onSwipeableOpen` directly; device check listed in the PR test plan. |
