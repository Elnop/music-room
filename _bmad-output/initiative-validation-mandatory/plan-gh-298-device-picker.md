---
title: 'Spotify Connect-style playback device picker (#298)'
type: 'feature'
ticket: ''
created: '2026-10-15'
status: 'built'
baseline_revision: '78b8b3f8290aa9a622b64be540fe81b6f4d5f35c'
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

**Problem:** Remote mode (#297) and the transfer route (#295) exist, but nothing in the app lets the user pick the device that plays. GitHub #298 asks for a Spotify Connect-style picker opened from the player modal.

**Approach:** Add a `DevicePickerSheet` opened by a button in `PlayerModal` and fed by `GET /api/music-control/controllable-devices`. Choosing a device calls `POST /api/queue/transfer` with what is playing and its position. On success, `connectStore` points at the chosen device; on failure, a message is shown and nothing changes.

## Boundaries & Constraints

**Always:**
- Three sections: « Ce téléphone » (the owner entry with `isSelf`, the device whose `deviceId` is this phone's), « Mes appareils » (my other devices) and « Appareils de mes amis » (one group per friend, headed by their username).
- Offline devices are greyed out and cannot be selected. The active device is marked: this phone in local mode, `target.deviceId` in remote mode.
- What is playing:
  - local with a queue item → `{queueItemId}`;
  - local with a track outside the queue → `{track: toTrackInput(currentTrack)}`;
  - remote on my own device → the current item of my queue, as `{queueItemId}`;
  - remote on a friend's device → the current item of their queue, as `{track}` built from `item.track`.
- Position:
  - local: `readPositionMs() ?? 0`;
  - remote: `estimatePositionMs(remoteStatus, Date.now(), null)`, rounded to an integer.
- `source` is `{userId: target.ownerId, deviceId: target.deviceId}` in remote mode (the server pauses that device). It is left out in local mode, because `setRemote` stops the phone.
- Success towards another device: `setRemote({ownerId, deviceId, ownerUsername})` first, then `applyState(result.queue)` when it is not null, then close the sheet.
- Success towards « Ce téléphone »: `setLocal()`. The phone resumes when it receives `play-item` / `play-track` (#297, `useMusicControl`).
- Failure (403 / 409 / 404 / network): an error toast in French; neither the audio nor `target` changes. Never reuse `handleRemoteRefusal`, which switches to local.
- All new UI strings are in French. The HTTP call goes through `apiRequest`.

**Never:**
- No backend change.
- No change to the play/pause buttons of the device cards on a friend's profile (`DeviceListeningCard`).
- No new bottom-sheet dependency.
- No barrel `index.ts`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Listing | picker response with me (phone + offline tablet + online PC) and Léa (one online device) | three sections; tablet greyed and not selectable; phone marked active in local mode | load error → error message in the sheet |
| Phone → my PC | local, queue item `i1` at 42 s | `transfer({targetUserId: me, targetDeviceId: PC, positionMs: 42000, playing: {queueItemId: i1}})`; `target` = remote PC; local audio stopped | — |
| Phone → Léa's device | local, track outside the queue at 10 s | `playing: {track}`; `setRemote` with `ownerUsername: 'Léa'`; `result.queue` applied under Léa | — |
| Remote → « Ce téléphone » | remote on my PC, current item `i2`, status at 30 s | `transfer({targetUserId: me, targetDeviceId: phone, playing: {queueItemId: i2}, source: {me, PC}})`; then `setLocal()` | — |
| Remote on Léa → my PC | Léa's current item `L1` | `playing: {track: L1.track}`, `source: {Léa, her device}` | — |
| Refused | transfer rejects 409 `DEVICE_OFFLINE` / 403 | toast; `target` and the audio unchanged; sheet stays open | — |
| Nothing playing | no track, local or remote | no transfer call: `setRemote` / `setLocal` directly | — |
| Active device tapped | the marked device | nothing happens | — |

</frozen-after-approval>

## Code Map

- **Backend (read-only, for reference):**
  - `backend/src/features/music-control/services/controllable-devices.service.ts`: the route answers `{owners: DevicePickerOwner[]}`.
  - `owners[0]` is always me (`isSelf`); it is followed by mutual friends sorted by username.
  - Each device: `{deviceId, deviceName, platform, model, lastSeenAt, access, online}`. This phone is not flagged; match it against `deviceService.getDeviceInfo().deviceId` (async).
- **Mobile types:** `DevicePickerOwner` / `DevicePickerResponse` in `mobile/src/types/device.types.ts:65-75` already match the backend.
- `mobile/src/services/musicControlApi.ts:103`: `getControllableDevices` hits another route. Add `getDevicePicker()` on the same `apiRequest` + `authHeaders` pattern; the answer is wrapped in `{success, data}`, as for the other functions there.
- **Transfer:**
  - API: `queueApi.transfer(body)` (`mobile/src/services/queueApi.ts:114`); types `TransferRequest` / `TransferResult` in `types/queue.types.ts:66-79`.
  - Backend: transfer to self is allowed, and the target must be online.
- **Helpers to reuse:**
  - `toTrackInput` (`mobile/src/utils/trackInput.ts`) and `readPositionMs` (`store/playerStore.ts:25`);
  - `estimatePositionMs` (`hooks/useNowPlaying.ts:55`) and `selectQueue` (`store/queueStore.ts`);
  - `useConnectStore` (`setRemote` stops the audio and is a no-op on the same target; `setLocal`; `target`; `remoteStatus`).
- **`mobile/src/components/player/PlayerModal.tsx`:**
  - Header at l.183-221: queue button `styles.queueButton`, absolute right, l.198-207; styles at l.383-389.
  - `isQueueOpen` state at l.54, closed with the player at l.56-60, `<QueueModal>` at l.346: copy this pattern.
- **Sheet:** `QueueModal.tsx:78` (`Modal` slide, `overFullScreen`, transparent).
- **Rows:** platform icon logic in `screens/profile/MyDevicesScreen.tsx:170` and `components/music-control/DeviceListeningCard.tsx:30`.
- **Tests:** mocks in `PlayerModal.test.tsx` / `QueueModal.test.tsx`. Add `getDeviceInfo` to the `deviceService` mock and `transfer` to the `queueApi` mock.

## Tasks & Acceptance

**Execution:**
- [x] `mobile/src/services/musicControlApi.ts` -- add `getDevicePicker(): Promise<DevicePickerResponse>` -- feeds the sheet.
- [x] `mobile/src/store/transferPlayback.ts` (new) -- add `transferTo(owner: DevicePickerOwner, deviceId)`, which builds `playing` / `positionMs` / `source` from the matrix rules, calls `queueApi.transfer`, applies the success / failure rules, and returns `true` / `false` -- keeps the transfer logic testable and out of the component (`queueStore` is already large).
- [x] `mobile/src/components/player/DevicePickerSheet.tsx` (new) -- a `{visible, onClose}` sheet:
  - loads the list when opened (spinner, error with « Réessayer »);
  - shows the three sections, platform icons and the « En cours » mark;
  - offline rows are greyed and disabled;
  - a tap calls `transferTo` (a single call in flight at a time), then closes on success.
- [x] `mobile/src/components/player/PlayerModal.tsx` -- add a device button (icon `phone-portrait-outline`, accessibilityLabel « Choisir l'appareil ») next to the queue button; `isDevicesOpen` is closed together with the player.
- [x] Tests:
  - `transferPlayback.test.ts`: every matrix row on the transfer side;
  - `DevicePickerSheet.test.tsx`: sections, offline, active, a tap calls the transfer, failure leaves the target unchanged;
  - `PlayerModal.test.tsx`: the button opens the sheet.

**Acceptance Criteria:**
- Given the player modal is open, when the user taps the device button, then the sheet lists the three sections, greys the offline devices and marks the active one.
- Given a transfer to another device succeeds, then the mini-player and the modal show the remote device (« Sur … »), and the phone no longer plays audio.

## Design Notes

« Nothing playing » switches the target without a transfer call, like Spotify. Without this, a user with nothing playing could never pick a device, while the route requires `playing`.

## Verification

**Commands:**
- `cd mobile && npx jest` -- expected: green.
- `cd mobile && npm run type-check && npm run lint` -- expected: 0 errors.

## Review Triage Log

Pass 1 (quick): high 0 · medium 2 · low 1 · false 0 · maybe-false 0.

| # | Finding | Verdict | Route | Evidence / action |
|---|---|---|---|---|
| 1 | `remotePlayback` sends the queue's current item without checking it against `remoteStatus.track` | medium | patch | Confirmed: `play-track` (self-transfer `{track}`) leaves the queue's `currentItemId` unchanged, so the wrong song is played. Fix: the same `hashStringToNumber(trackUri) === track.id` check as `remoteDurationMs`. |
| 2 | A remote track with no matching queue item is treated as "nothing playing": the target changes and the remote device keeps playing | medium | patch | Confirmed: `remotePlayback` returns null and `switchTarget` runs without `source`. Fix: when `remoteStatus.track` exists but cannot be transferred, toast and change nothing (the matrix's failure rule). |
| 3 | Reopening the sheet shows the stale list, still tappable, while it reloads | low | patch | Confirmed: `loaded` is never reset. Fix: clear the list on open so the spinner shows. |
