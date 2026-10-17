---
title: 'Renommer, modifier et supprimer une playlist (#342)'
type: 'feature'
ticket: 'https://github.com/Elnop/music-room/issues/342'
created: '2026-10-17'
status: 'built'
baseline_revision: '7d3170420254ea55bb86129c03ba928ff74b7f23'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #342.
- A playlist cannot be renamed, re-described or deleted from the app: `playlistStore.updatePlaylist`/`deletePlaylist` exist, but no screen offers them.
- The owner's `⋯` goes straight to « Partage » (visibility and rights), which gets confused with the « Partager » link button.
- The mobile form caps the name at 20 characters (the backend allows 100), so « Les tubes du Crabe Croustillant » (31) does not fit.
- After creating a playlist the app returns to the list instead of opening it.

**Approach:**
- **Actions sheet:** the owner's `⋯` opens it with « Modifier » (name, description), « Visibilité et droits » (today's `PlaylistSharing` screen) and « Supprimer » (confirmation, then back to the list). A non-owner never sees these actions.
- **Editing:** `CreatePlaylistScreen` gets an edit mode (prefilled name and description, no visibility switches).
- **Name limit:** the mobile limit becomes 50 characters.
- **After creation:** the new playlist opens.
- **Real time:** two new server → client socket events, documented:
  - `playlist:details` `{ playlistId, name, description, visibility, editMode }`, emitted to `playlist:<id>` after a successful PATCH;
  - `playlist:deleted` `{ playlistId }`, emitted to the room before its sockets are evicted.

  The other participants update the open playlist live; on deletion they are told and taken back.

## Boundaries & Constraints

**Always:**
- Only the owner may edit or delete, as the backend already enforces (`checkOwnership`).
- `playlist:details` also fires for visibility/edit-mode changes made on « Visibilité et droits ».
- The deletion broadcast happens before `revalidatePlaylistRoom` evicts the sockets.
- Event names live in `backend/src/realtime/index.ts` and in `mobile/src/hooks`/`socketStore`; types are mirrored in `mobile/src/types/playlist.types.ts`.
- French UI text, formal register.

**Never:**
- Changing `playlist:updated` (track deltas, `tracksVersion`) or its convergence rules.
- Changing backend limits (name ≤ 100, description ≤ 500).
- Soft delete.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Owner `⋯` | Owner on their playlist | Sheet: Modifier, Visibilité et droits, Supprimer | No error expected |
| Rename | New valid name (≤ 50) | Saved; header and list show it; others in the room see it live | API error → French toast, form kept |
| Name too long | 51 characters | Validation message, no request | No error expected |
| Delete | Confirmed | Playlist gone from my list, back to the list | API error → toast, stays |
| Delete cancelled | Cancel in the dialog | Nothing happens | No error expected |
| Deleted while viewing | Another user on the playlist, owner deletes | Toast « Cette playlist a été supprimée », back to the list | No error expected |
| Create | New playlist saved | Its detail screen opens | Error as today |

</frozen-after-approval>

## Code Map

- `backend/src/features/playlists/playlist.service.ts`:
  - `updatePlaylist` (l.420): after the update, call a new `realtime.notifyPlaylistDetails(...)` from the updated row;
  - `deletePlaylist` (l.464): call `realtime.notifyPlaylistDeleted(playlistId)` before `revalidatePlaylistRoom`.
- `backend/src/realtime/index.ts`:
  - `notifyPlaylistUpdate` (l.555) is the pattern: `io.to(\`playlist:${id}\`)`, `socketLogger`, no-op when `io` is not initialised;
  - add the two methods; event list in the file header if any.
- `backend/src/features/playlists/playlist.types.ts` (l.134): add the two payload types.
- Backend unit tests: mock `realtime` as the existing `playlist.service` tests do; check emit on update and delete (order before revalidate).
- `backend/README.md` l.454–457: add both events to the server → client list with their payloads and when they fire.
- `mobile/src/types/playlist.types.ts` (l.64): mirror the payloads.
- `mobile/src/hooks/usePlaylistSocket.ts` (l.47): listen to both:
  - `playlist:details` → the store patches `currentPlaylist` and the matching entry of `playlists`;
  - `playlist:deleted` → the store drops it, and the hook exposes it so `PlaylistDetailScreen` toasts and goes back.
- `mobile/src/store/playlistStore.ts`:
  - `updatePlaylist` (l.208) and `deletePlaylist` (l.252) exist;
  - add `applyDetails(payload)` and `removePlaylist(id)`, or reuse `deletePlaylist`'s local part.
- `mobile/src/screens/playlists/PlaylistDetailScreen.tsx`: `handleShare` (`⋯`) navigates to `PlaylistSharing`. Instead, open a new `components/playlist/PlaylistActionsSheet.tsx`, modelled on `components/track/TrackActionsSheet.tsx` (Modal, rows, safe-area). « Supprimer » uses `Alert.alert` with a destructive button, then `deletePlaylist` and `navigation.popToTop()` (stack `PlaylistsStack.tsx`). Keep its #343 header test passing.
- `mobile/src/screens/playlists/CreatePlaylistScreen.tsx`:
  - optional route param `playlistId` → edit mode: prefill from `currentPlaylist`, title « Modifier la playlist », hide the two switches, save with `updatePlaylist`, then `goBack`;
  - create mode: after `createPlaylist`, `navigation.replace('PlaylistDetail', { id })`.

  Register the param in `PlaylistsStack.tsx`.
- `mobile/src/utils/validators.ts` l.39: name max 50, message updated.

## Tasks & Acceptance

**Execution:**
- [x] Backend types, realtime methods, service calls, tests, README.
- [x] Mobile types, store, `usePlaylistSocket` (+ tests).
- [x] `PlaylistActionsSheet` (+ test) and `PlaylistDetailScreen` wiring, deleted-while-viewing handling (+ test).
- [x] `CreatePlaylistScreen` edit mode and open-after-create, `PlaylistsStack`, `validators.ts` (+ tests).

**Acceptance Criteria:**
- Given two users on the same playlist, when the owner renames it, then the other's screen shows the new name without reloading.
- Given a non-owner, when they open the playlist, then no `⋯` actions are offered.

## Verification

**Commands:**
- `cd backend && npm test && npm run type-check && npm run lint` -- expected: pass.
- `cd mobile && npm test && npm run type-check && npm run lint` -- expected: pass.

**Manual checks (if no CLI):**
- Swagger unchanged (no new endpoint). On device at the `main` acceptance pass: rename, delete, create then land on the playlist, a second account watching during rename and delete.

## Implementation Notes

- Backend service tests are integration tests (`playlist.service.int.test.ts`, real Supabase, `realtime` mocked): they check both emits and that `notifyPlaylistDeleted` runs before `revalidatePlaylistRoom`. `playlist-updated.int.test.ts` checks both events reach real sockets of the room.
- `playlistStore.createPlaylist` now resolves with the created playlist (needed for `navigation.replace`); `deletePlaylist` reuses the new `removePlaylist`; `updatePlaylist` also patches `editMode` on the open playlist.
- `usePlaylistSocket` returns `{ deleted }`. The owner's own deletion is ignored through a ref in `PlaylistDetailScreen` (it goes `popToTop` itself); a deletion from elsewhere toasts and `goBack()`s, which also works in `FriendsStack`.
- The `PlaylistSharing` header title became « Visibilité et droits » to match the sheet entry.
- `PlaylistHeader` renders the description with `!!`: an emptied description is `''` and would otherwise be a bare string in a View.

## Plan Change Log

## Review Triage Log

Quick review, pass 1: 5 findings. 4 patched by the implementer (then full verification green: backend 378 unit tests, type-check, lint; mobile 822 tests, type-check, lint), 1 rejected, 1 part deferred.

- medium, patched: the mobile description cap (70) was below the backend's (500), so a long stored description blocked every edit. Now 500 in the validator and the input.
- medium, patched: on iOS, « Supprimer » raised `Alert.alert` while the sheet's Modal was dismissing, which iOS may drop. The action now runs from the Modal's `onDismiss` on iOS; Android unchanged. Tested.
- low, patched: deleted while viewing, with the screen at the root of its stack, it stayed on the skeleton. It now navigates to the list.
- low, patched: `updatePlaylist` mapped the playlist twice (payload and response). Built once.
- low, deferred: `playlist.service.ts` (~490 lines, before this change) is far over the ~150-line service guideline; this change only added ~12 lines. Split left for later (`deferred-work.md`).
- low, rejected: edit mode with a playlist found in neither `currentPlaylist` nor `playlists` would open empty and could erase the description. No entry point reaches it today (edit is only opened from the loaded detail screen), and the fix would add guards.
