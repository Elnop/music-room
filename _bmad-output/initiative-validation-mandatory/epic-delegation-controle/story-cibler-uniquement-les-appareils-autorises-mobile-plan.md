---
title: 'Cibler uniquement les appareils autorisés (mobile)'
type: 'feature'
ticket: '7'
created: '2026-10-09'
status: 'built'
baseline_revision: '155e65dd2a2726c0e434e2cb77769a94ed94bd8a'
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

**Problem:** GitHub #84 (story 4.7, CAP-4). On a friend's profile, `useFriendListening` (`mobile/src/hooks/useMusicControl.ts`) decides everything from `musicControlApi.canControl` (the "all my devices" switch only): a friend licensed on one device never subscribes nor sees controls, and a friend with the switch sees play/pause on every device. The server refusals of story 4.5 (`control:error` `NOT_AUTHORIZED`, `DEVICE_OFFLINE`) are never handled, so a refused command fails silently.

**Approach:** `useFriendListening(targetUserId)` loads the devices I may control from `GET /api/music-control/users/{userId}/devices` (story 4.2) and keeps their ids. It subscribes to the friend's listening status when that list is not empty, exposes for each received device whether it is controllable, refuses `remotePlay`/`remotePause` locally for other devices, reloads the list on `permission:changed` for that friend and on a `control:error` `NOT_AUTHORIZED`, and exposes the last `control:error` so the screen shows it in a toast. `UserProfileScreen` drops its own `canControl` call, shows every device's now-playing line as today, but play/pause only on controllable ones. `NowPlayingInline` and `DeviceListeningCard` get an optional `controllable` prop (default true) that hides the play/pause button.

## Boundaries & Constraints

**Always:** The new call goes through `apiRequest` (`mobile/src/services/api.ts`) like story 4.6's device calls. Socket event names exactly as the server emits them (`listening:subscribe`, `listening:status`, `listening:error`, `control:action`, `control:error`, `permission:changed`). Toast texts in French: `NOT_AUTHORIZED` → "Vous ne pouvez pas contrôler cet appareil", `DEVICE_OFFLINE` → "Cet appareil n'est plus en ligne", anything else → the server message.

**Never:** No backend change, no new socket event. No change to `useMusicControlEmitter` (the controlled side). No polling: a license granted while the profile is open shows on the next visit (the server emits nothing for a grant). No raw `fetch`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| License on A only | controllable `[A]`; status with A and B playing | subscribes; A controllable, B not; `remotePlay(B)` emits nothing | — |
| All devices | `allDevices: true`, `[A, B]` | both controllable | — |
| No access | controllable `[]` | no `listening:subscribe`, no devices, `canControl` false | — |
| Load fails | GET rejects | treated as no access | logged |
| Refused | `control:error` `NOT_AUTHORIZED` after `remotePlay(A)` | `controlError` set; controllable list reloaded | toast "Vous ne pouvez pas contrôler cet appareil" |
| Offline | `control:error` `DEVICE_OFFLINE` | `controlError` set, list not reloaded | toast "Cet appareil n'est plus en ligne" |
| Access changed | `permission:changed` for this friend | controllable list reloaded; subscription follows (`[]` → unsubscribe) | — |

</frozen-after-approval>

## Code Map

- `mobile/src/hooks/useMusicControl.ts:132-237` -- `useFriendListening(targetUserId, initialCanControl)`: `canControl` state, `permission:changed` handler (clears devices), subscribe effect gated on `canControl` (200 ms timer, `listening:status`/`listening:error`, unsubscribe on cleanup), `remotePlay`/`remotePause` emit `control:action { targetUserId, targetDeviceId, action }`. Rework around a controllable-ids set; drop the `initialCanControl` parameter. Keep `useMusicControlEmitter` untouched.
- `backend/src/realtime/index.ts:385-428` -- `control:error` payloads `{ message, code }` with `NOT_AUTHORIZED` / `DEVICE_OFFLINE`; `control:success` on delivery. `:590-610` `permission:changed { ownerId, targetUserId, canControl }` (switch only; a license revoke re-checks the subscription server-side without an event).
- `mobile/src/services/musicControlApi.ts` -- add `getControllableDevices(userId)` → `ControllableDevicesResponse` on `apiRequest`, same pattern as `getMyDevices` (`authHeaders`, `encodeURIComponent`).
- `mobile/src/types/device.types.ts` -- `ControllableDevicesResponse { allDevices, devices: ControllableDevice[] }` already exists.
- `mobile/src/screens/friends/UserProfileScreen.tsx:40-70` -- `initialCanControl` loaded with `musicControlApi.canControl(userId)` in a `Promise.all`; remove it and use the hook's `canControl`. `:162` online badge and `:244-258` `NowPlayingInline` list: pass `controllable`; show the hook's `controlError` with `showError` from `@utils/toast`.
- `mobile/src/components/profile/NowPlayingInline.tsx:7-60`, `mobile/src/components/music-control/DeviceListeningCard.tsx:8-70` -- add `controllable?: boolean` (default true) hiding the play/pause button. `DeviceListeningCard` is currently unused; change it only for consistency.
- `mobile/src/hooks/useMusicControl.test.ts` -- existing `renderHook` setup with mocked `socketStore`/`authStore`/`playerStore`/`deviceService` and fake timers; extend with `useFriendListening` tests (mock `@/services/musicControlApi`, capture `socket.on` handlers to trigger events).

## Tasks & Acceptance

**Execution:**
- [x] `mobile/src/services/musicControlApi.ts` -- add `getControllableDevices`.
- [x] `mobile/src/hooks/useMusicControl.ts` -- rework `useFriendListening` per Intent and matrix; return `devices` (each with `controllable`), `canControl`, `isLoading`, `error`, `controlError`, `remotePlay`, `remotePause`.
- [x] `mobile/src/components/profile/NowPlayingInline.tsx`, `mobile/src/components/music-control/DeviceListeningCard.tsx` -- `controllable` prop.
- [x] `mobile/src/screens/friends/UserProfileScreen.tsx` -- use the new hook API, drop `canControl` fetch, toast on `controlError`.
- [x] `mobile/src/hooks/useMusicControl.test.ts` -- one test per matrix row.

**Acceptance Criteria:**
- Given a friend licensed on device A only, when they open my profile while A and B play, then only A shows play/pause, and a command to A reaches A (manual demo with two devices).

## Verification

**Commands:**
- `cd mobile && npm test && npm run lint && npm run type-check` -- expected: all green, no new lint warning

## Review Triage Log

Pass 1 (quick): medium 2 · low 1.

| # | Finding | Verdict | Route | Evidence / action |
|---|---------|---------|-------|-------------------|
| 1 | `useFriendListening` ignores `allDevices`: with the switch on, a device connected after the GET (or an owner with no device row yet) is not controllable locally though the server accepts it | medium | patch | `control-access.service.ts:80` returns `allDevices \|\| licensed.includes(id)`; `GET /users/{id}/devices` lists only existing rows. Fix: keep `allDevices`, then every received device is controllable + test. Patched. |
| 2 | `control:error` handler not scoped to this hook: two stacked friend profiles both toast and the other reloads | low | rejected | Needs two `UserProfileScreen`s mounted at once; the payload has no target, so scoping needs pending-command tracking (new state). |
| 3 | After a license revoke, statuses stay "En ligne"/controllable and frozen until a refused command | medium | defer | No server event on license grant/revoke (`device-license.service.ts`); the plan forbids backend changes and polling. Ticket #183. |
