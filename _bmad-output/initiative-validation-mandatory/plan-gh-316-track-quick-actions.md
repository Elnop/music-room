---
title: 'Quick actions on a track: play next, queue, add to playlist, share (#316)'
type: 'feature'
ticket: ''
created: '2026-10-16'
status: 'built'
baseline_revision: '33aa345f8934e35308f8f58ff28bbaddf69e52a3'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context:
  - '{project-root}/doc/TESTING.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A track can only be swiped into the queue. There is no way to play it next, add it to a playlist from a list, or share it. GitHub #316.

**Approach:**
- A long press or a ⋯ button on a track row opens the same action sheet on every screen that lists tracks: search, playlist, queue and profile, wherever they exist.
- The sheet offers four actions:
  - « Lire ensuite » adds the track right after the current queue item;
  - « Ajouter à la queue » adds it at the end of the queue;
  - « Ajouter à une playlist » lists only the playlists I can edit;
  - « Partager » shares the SoundCloud permalink through React Native's `Share`; the app link comes with #321.
- Each action shows a toast.
- The actions go through `queueStore` and `playlistStore`. The swipe to queue stays.
- « Lire ensuite » is a single backend call: `POST /api/queue/items` accepts an optional `next: true`. The server adds the item, then moves it right after the current item (the existing move RPC with `afterItemId: null`), so one state and one realtime update come back.

## Boundaries & Constraints

**Always:**
- One sheet component reused by every list.
- The editable-playlist rule matches `PlaylistDetailScreen`'s `canEdit`: owner, collaborator, or `editMode: 'open'` on a public playlist or one I can view. Extract it into a shared helper, and make the screen use it too.
- The new body field is validated with Zod and documented in `queue.openapi.ts`, and `AddQueueItemBody` is mirrored in `mobile/src/types/`.
- Remote mode: the queue actions act on the active queue, the way the swipe does today.

**Never:**
- No new dependency (`Share` comes from react-native).
- No change to the swipe.
- Never implement Music Track Vote.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Play next | queue with a current item | item inserted right after it; toast « Lira ensuite » | API error → error toast |
| Play next, nothing current | `currentItemId` null | item at the head of the upcoming items | — |
| Add to queue | — | item appended; toast | API error → error toast |
| Add to playlist | my editable playlists | the list shows only editable playlists; a pick adds the track and shows a toast | duplicate or error → the store's existing error toast |
| No editable playlist | none | an empty message in the picker | — |
| Share | track permalink | system share sheet with the SoundCloud URL | cancel → nothing |

</frozen-after-approval>

## Code Map

- **Backend:**
  - `backend/src/features/queue/queue.validators.ts` l.8: `addQueueItemSchema = addTrackSchema.omit({ previewUrl: true })`. Add `next: z.boolean().optional()`; it is not a track field, so strip it before `upsertTrack`.
  - `backend/src/features/queue/services/queue.service.ts` l.37 `addItem`: after `addQueueItemRpc`, when `next`, call `moveQueueItemRpc(ownerId, <new item id>, null)` and publish once. Find the new item by `track_id` among the upcoming items of the returned state (the add appends). The controller is `queue.controller.ts` `addItem`. Owner routes `/api/users/:userId/queue/items` share the controller.
  - `backend/src/features/queue/queue.openapi.ts`: document `next`.
  - Integration test in `services/queue.service.int.test.ts` (pattern of the existing add/move tests): `next` lands right after the current item, and at the head when nothing is current.
- **Mobile:**
  - `mobile/src/types/queue.types.ts` l.45 `AddQueueItemBody`: add `next?: boolean`.
  - `mobile/src/services/queueApi.ts` `addItem`, and `mobile/src/store/queueStore.ts` l.281 `addItem(track)`: add `addItem(track, { next })` or `playNext(track)`, built on the same `mutate`.
  - The track-to-body conversion the swipe uses: `mobile/src/components/common/QueueSwipe.tsx` / `SwipeableTrackItem.tsx`. Reuse it.
  - Rows: `components/playlist/TrackItem.tsx` (playlist), `screens/search/components/SoundCloudTrackItem.tsx` (search), `components/player/QueueItemRow.tsx` (queue), and the profile screen's track list if one exists (search `screens/`). Add `onLongPress`, plus a ⋯ button with `accessibilityLabel="Actions"`.
  - New `mobile/src/components/track/TrackActionsSheet.tsx`. The sheet pattern is `components/player/DevicePickerSheet.tsx` (`Modal` with `GestureHandlerRootView`). A second step picks the playlist.
  - New `mobile/src/utils/playlistPermissions.ts`: `canEditPlaylist(user, playlist)`, used by `PlaylistDetailScreen.tsx` l.74-83 and by the picker. The picker source is `playlistStore.playlists` (`fetchPlaylists`).
  - `playlistStore.addTrack(playlistId, track: Track)` l.274: convert with the helpers in `utils/trackInput.ts`.
  - Toasts come from `showSuccess` / `showError` in `utils/toast.ts`.

## Tasks & Acceptance

**Execution:**
- [x] backend validator, service, openapi, plus an int test -- `next` placement
- [x] `mobile/src/types/queue.types.ts`, `queueApi.ts`, `queueStore.ts` (+ test) -- play next
- [x] `mobile/src/utils/playlistPermissions.ts` (+ test), with `PlaylistDetailScreen` using it
- [x] `mobile/src/components/track/TrackActionsSheet.tsx` (+ test) -- four actions, the playlist step, toasts
- [x] the track rows (playlist, search, queue, profile) -- long press and ⋯ open the sheet

**Acceptance Criteria:**
- Given any screen listing tracks, when I long-press a track or tap ⋯, then the same sheet opens.
- Given « Ajouter à une playlist », then only the playlists I can edit are listed.
- Given an action, then a toast confirms it, and the queue or the playlist updates live through the existing socket events.

## Verification

**Commands:**
- `cd backend && npm test && npm run type-check && npm run lint` -- expected: pass, 0 errors
- `cd mobile && npm test && npm run type-check && npm run lint` -- expected: pass, 0 errors
- `cd backend && make test-int` (or CI `test-int`) -- expected: the new queue test passes

## Implementation Notes

- Implemented by a subagent.
  - The new item is the last item of the add's state, not matched by `track_id`, since the same track can be queued twice.
  - `addQueueItemSchema` is unchanged (transfer uses it); the new `addQueueItemBodySchema` adds `next`.
  - The search's + button and the unused `PlaylistSelectorModal` (which listed all playlists, not only editable ones) are replaced by ⋯.
  - No profile track list exists. `components/playlist/TrackItem.tsx` is unused and left alone.

## Review Triage Log

- Pass 1 (quick): 3 findings, all patched; 1 check with no finding.
  - low, patch: Android's `Share.share` always resolves with `sharedAction`, so a cancel still toasted « Lien partagé ». Fix: no success toast for share.
  - medium, patch: add and move are separate RPCs. A move failure (`QUEUE_ITEM_NOT_UPCOMING` after another device steps) left the item added but returned an error and published nothing. Fix: catch the move error, then publish and return the add's state.
  - low, patch: `queue.service.ts` grew past the ~150-line rule (AGENTS.md). Fix: the add logic moves to its own file.
  - no finding: profile screens have no track list; every other list opens the sheet.
