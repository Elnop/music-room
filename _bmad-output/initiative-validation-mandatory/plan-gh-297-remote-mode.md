---
title: 'Player as remote control of another device (#297)'
type: 'feature'
ticket: ''
created: '2026-10-15'
status: 'built'
baseline_revision: 'f16580f777c936a5e01aa3a861f20f6f6394d424'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context:
  - '{project-root}/docs/superpowers/specs/2026-10-14-queue-delegation-connect-design.md'
  - '{project-root}/doc/TESTING.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The phone player can only drive its own audio. GitHub #297 asks that it become the remote of another device (one of mine or a friend's), with the mini-player, the modal and the queue showing and controlling that device. The backend side is done (#294, #295).

**Approach:** Add a `connectStore` that holds the active device, and a `useNowPlaying` hook that both player components read: it uses the local `playerStore` in local mode, and the targeted device's `listening:status` in remote mode. Key the `queueStore` by owner. Teach `useMusicControl` the `play-item`, `play-track` and `control:revoked` commands. Switching to remote is exposed by `connectStore` only; its UI is #298.

## Boundaries & Constraints

**Always:**
- `target` is `{ kind: 'local' }` at startup and after logout.
- `applyState` ignores a state whose version is not strictly greater than the stored version for the same owner, and never touches another owner's queue.
- My own queue stays loaded. A friend's queue is loaded when the phone enters remote on one of their devices, and forgotten when it leaves.
- In remote mode the phone plays no audio. Next, previous and play-item go through the queue routes with `deviceId`, and play/pause through `control:action`.
- Auto-advance at the end of a track stays with the device that plays.
- All user-facing strings are in French, like the rest of the app.

**Never:**
- No device picker UI (#298).
- No backend change.
- No remote seek, because the backend has no such command: the seek bar is read-only in remote mode.
- No new barrel `index.ts`.
- No `fetch` around `api.ts`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Remote on a friend's device | `setRemote({ownerId:F, deviceId:D, ownerUsername:'Léa'})` | Subscribes to `listening:F`; the modal shows D's track and estimated progress; the queue shown is F's; the mini-player reads « Sur *Tablette de Léa* » | — |
| Remote on my own device | `setRemote({ownerId:me, deviceId:D})` | « Sur *Tablette* »; my queue is shown | — |
| Remote play/pause | toggle in remote mode | emits `control:action {targetUserId, targetDeviceId, action}`; no local audio | `control:error` → toast |
| Remote next/prev/play item | queue step in remote mode | `POST /api/users/F/queue/next {deviceId:D}` (my own queue: `/api/queue/next {deviceId}`); the result state is applied; nothing plays locally | 409 `DEVICE_OFFLINE` / 403 → toast, back to local |
| Out-of-order queue states | A v5 is stored, A v4 arrives | v4 ignored; B's queue untouched | — |
| Account switch race | logout of A, late A v57 arrives, then B loads v3 | B's v3 is applied (stored under B) | — |
| `play-item` received | `{item, positionMs:42000, version}` while the phone is in remote | plays the item locally from 42 s, sets `queueItemId`, `target` → local | — |
| `play-track` received | `{track, positionMs}` | plays the track from `positionMs`, with no queue item | — |
| Revoked | `control:revoked {ownerId:F}` while remote on F | `target` → local, info toast « Accès retiré » | — |
| Target offline | `listening:status` for F without D | `target` → local, toast « Appareil hors ligne » | — |

</frozen-after-approval>

## Code Map

- `mobile/src/store/queueStore.ts`
  - State today: `{currentItemId, items, version, loaded}` (l.68-76).
  - `applyState` is at l.180; `runStep` (l.128-161) always calls `usePlayerStore.playTrack`.
  - `selectHasNext` / `selectHasPrevious` are at l.86-90.
  - Toasts come from `@utils/toast`.
- `mobile/src/services/queueApi.ts`: every path is hard-coded to `/api/queue`, and step calls take no body.
  - On the backend, `/api/users/:userId/queue/*` mirrors these routes.
  - Play-item, play-playlist, next and previous accept `{deviceId}`.
  - Errors: 403 `QUEUE_ACCESS_DENIED`, 400 `DEVICE_ID_REQUIRED`, 409 `DEVICE_OFFLINE`.
- `mobile/src/store/playerStore.ts`: `playTrack(track, queueItemId?)` at l.151 has no start position. Exports `readPositionMs`.
- `mobile/src/contexts/PlayerContext.tsx`
  - `useAudioPlayer(streamUrl)` at l.69 is where the start-position seek goes.
  - `QueueAutoAdvance` (l.39) must only advance in local mode.
- `mobile/src/hooks/useMusicControl.ts`
  - Types: `ListeningStatus` (l.11), `UserListeningStatus` (l.29), local `ControlCommand` (l.34).
  - `useMusicControlEmitter` handles only play/pause (l.110-125).
  - `useFriendListening` (l.172; subscribe at l.244-288, `control:action` at l.307) is the pattern to copy for the room subscription.
  - `controlErrorMessage` is at l.146.
- `mobile/src/hooks/useQueueSync.ts`
  - Mounted in `AppNavigator.tsx:60`; it loads on mount and resets on unmount.
  - It drops states for `ownerId !== me` at l.45 (comment "waiting for #297").
- `mobile/src/store/socketStore.ts:211`: the `useAuthStore.subscribe` logout pattern, to reuse for resetting `connectStore`.
- `mobile/src/types/queue.types.ts`: `DeviceCommand`, `QueuePlayCommand`, `QueueTrackCommand` and `DevicePauseCommand` (l.105) already exist.
- `mobile/src/types/device.types.ts`: `ControlRevokedPayload {ownerId}` (l.78).
- `mobile/src/components/player/MiniPlayer.tsx`, `PlayerModal.tsx` (l.41-50, seek at l.146-155) and `QueueModal.tsx` (l.32-36) read the stores directly today.
- Tests to extend: `queueStore.test.ts`, `useMusicControl.test.ts` (mockSocket pattern), `useQueueSync.test.ts`, `MiniPlayer.test.tsx`, `PlayerModal.test.tsx`, `QueueModal.test.tsx`.

## Tasks & Acceptance

**Execution:**
- [ ] `mobile/src/store/connectStore.ts`
  - Add `target`, `setRemote({ownerId, deviceId, ownerUsername?})`, `setLocal(message?)` (shows an info toast when a message is given) and `remoteStatus: ListeningStatus | null`.
  - Reset on logout through the `useAuthStore.subscribe` pattern.
  - Move the `ListeningStatus` / `UserListeningStatus` types to `mobile/src/types/listening.types.ts` and import them from there.
- [ ] `mobile/src/hooks/useRemoteTarget.ts` (mounted in `AppNavigator`)
  - While in remote mode: `listening:subscribe` to the owner, keep the targeted device's status in `remoteStatus`, and switch to local when the device is missing or on `control:revoked`.
  - Load a friend's queue on enter and forget it on leave.
  - Unsubscribe on exit.
- [ ] `mobile/src/services/queueApi.ts`
  - Add an optional `{ownerId?, deviceId?}` to every call.
  - When `ownerId` is another user, use `/api/users/:ownerId/queue`.
  - Send `deviceId` in the body of play-item, next, previous and play-playlist.
- [ ] `mobile/src/store/queueStore.ts`
  - Change the state to `queues: Record<ownerId, {currentItemId, items, version}>` plus `loaded`.
  - `applyState` compares versions per owner.
  - Actions target the active owner (`connectStore`: the remote owner, else me) and pass `deviceId` in remote mode.
  - `runStep` plays locally only in local mode.
  - Add `forget(ownerId)` and owner-aware selectors (`selectActiveQueue`, and `selectHasNext` / `selectHasPrevious` on it).
  - On a remote error (`DEVICE_OFFLINE` or 403): toast, then `setLocal`.
- [ ] `mobile/src/hooks/useQueueSync.ts`: accept states for me and for the current remote owner, and drop others.
- [ ] `mobile/src/store/playerStore.ts` and `mobile/src/contexts/PlayerContext.tsx`
  - `playTrack(track, queueItemId?, startPositionMs?)`: the player seeks there once loaded.
  - `QueueAutoAdvance` only runs in local mode.
- [ ] `mobile/src/hooks/useMusicControl.ts`: in `useMusicControlEmitter`, handle `play-item` (play `item.track` at `positionMs` with `item.id`, set the queue's current item, then `setLocal()`) and `play-track` (play at `positionMs`, then `setLocal()`). Type commands with `DeviceCommand`.
- [ ] `mobile/src/hooks/useNowPlaying.ts`
  - Returns `{isRemote, track, isPlaying, positionMs, durationMs, deviceLabel, toggle, next, previous, hasNext, hasPrevious}`.
  - In remote mode, progress is `positionMs + (now - updatedAt)` while playing, ticking every second.
  - Duration comes from the owner's current queue item when its URI matches, else null.
- [ ] `MiniPlayer.tsx`, `PlayerModal.tsx` and `QueueModal.tsx`
  - Read `useNowPlaying` and the active queue.
  - The mini-player shows « Sur … » in remote mode.
  - The modal's seek bar is disabled in remote mode, and the progress bar is hidden when there is no duration.
- [ ] Tests (jest-expo): `connectStore.test.ts`, `useRemoteTarget.test.ts`, `useNowPlaying.test.ts`, `queueStore.test.ts` (per-owner versions, account-switch race, remote step does not play locally), `useMusicControl.test.ts` (play-item / play-track / position / back to local), `MiniPlayer.test.tsx` (« Sur … »), and an update to `QueueModal.test.tsx`.

**Acceptance Criteria:**
- Given the phone is in remote mode on a friend's device, when the user opens the modal, then it shows that device's track and progress, play/pause and next act on that device, and the queue shown is the friend's.
- Given the phone leaves remote mode on a friend's device, then that friend's queue is dropped from the store and my queue still shows.

## Design Notes

`ownerUsername` is an optional addition to the issue's `target` shape. `listening:status` carries no username, so the « Sur X de Léa » label needs it from the caller (the #298 picker has it in `DevicePickerOwner`).

## Verification

**Commands:**
- `cd mobile && npm test`: expected green.
- `cd mobile && npm run type-check && npm run lint`: expected clean.

## Review Triage Log

Pass 1 (quick): high 0 · medium 4 · low 2 · false 0 · maybe-false 0. The human chose to patch in place instead of reverting (2026-10-15).

| # | Finding | Verdict | Route | Evidence / action |
|---|---|---|---|---|
| 1 | A list tap (`SoundCloudSearchScreen.tsx:50`, `PlaylistDetailScreen.tsx:147-150`) plays on the phone while it is a remote | medium | intent_gap → resolved | Confirmed: `playTrack` is called directly with no target check. Human decision: in remote mode a list tap plays on the targeted device through `POST /api/queue/transfer` with `playing: {track}`. Patched. |
| 2 | `useRemoteTarget` and `useFriendListening` unsubscribe each other from `listening:<owner>` | medium | patch (human: fix in place) | Confirmed: the backend `listening:unsubscribe` does a plain `socket.leave`. Fix: client-side ref-count for listening subscriptions. |
| 3 | A refused subscribe (`listening:error`) leaves the phone remote | medium | patch | Confirmed: `subscribeToListening` emits only `listening:error` on refusal. Fix: handle it, then `setLocal` with a message. |
| 4 | A late load or action answer brings a forgotten friend's queue (or a previous account's) back | medium | patch | Confirmed: `applyState` stores any owner. Fix: keep only states for me or the current remote owner. |
| 5 | `setRemote` on the current target blanks `remoteStatus` with no new subscribe | low | patch | Confirmed: the effect's deps are unchanged, so it does not re-run. Fix: same target → no-op. |
| 6 | `control:error` toasted for actions not sent by remote mode | low | patch | Confirmed: there is no filter. Fix: only toast when the error's `targetDeviceId` is the targeted device. |
