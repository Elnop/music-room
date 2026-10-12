---
title: 'Écran de mes appareils et des accès par ami (mobile)'
type: 'feature'
ticket: '6'
created: '2026-10-09'
status: 'built'
baseline_revision: '7147421f3b3de36798b73a017da7e684a87f93cb'
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

**Problem:** GitHub #83 (story 4.6, CAP-4). The backend grants music control per device (`GET /api/music-control/devices`, `POST`/`DELETE /api/music-control/devices/{deviceId}/licenses/{userId}`, stories 4.2/4.4), but the app only has the per-friend switch on `FriendsScreen`, which means "all my devices". A user cannot see their devices nor give a friend control of one device only.

**Approach:** A new "Mes appareils" screen in the profile stack, opened from a button on `ProfileScreen` under "Linked accounts". It lists my devices (name, model, last seen; the current device is marked "Cet appareil"). Each device lists my mutual friends with a switch: on = the friend holds a license on that device; toggling grants or revokes it. A friend who has the "all my devices" switch on is shown on and disabled, with a hint that they control every device. The existing `FriendsScreen` switch label becomes "Tous mes appareils" (behavior unchanged).

**Decision (human, 2026-10-09):** the new screen, its entry button and the renamed switch use French strings ("Mes appareils", "Cet appareil", "Tous mes appareils", hints and toasts in French).

## Boundaries & Constraints

**Always:** New HTTP calls go through the exported `apiRequest` of `mobile/src/services/api.ts` (headers, refresh), never a raw `fetch`. Reuse the mobile types of `mobile/src/types/device.types.ts` (already mirroring the backend). Backend error messages (`NOT_FRIENDS`, `CANNOT_LICENSE_SELF`, `DEVICE_NOT_FOUND`) shown in an error toast; the switch goes back to its previous value on failure. One toggle at a time per device+friend; others stay usable. UI strings in French (decision above).

**Never:** No backend change. No change to the "all my devices" semantics, nor to the controlling side (`useMusicControl`, `DeviceListeningCard`, story 4.7). No migration of the existing raw-`fetch` methods of `musicControlApi`/`friendsApi` (#174). No barrel `index.ts`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| List | 2 devices, 2 friends, a license for friend A on device 1 | both devices with friends; A on for device 1 only; current device marked "Cet appareil" | load failure → error toast, error text instead of the list |
| No devices / no friends | empty list(s) | an empty-state text instead of rows | — |
| Grant | switch B on device 2 | `POST /devices/{d2}/licenses/{B}`; switch stays on | 400 `NOT_FRIENDS` → toast, switch back off |
| Revoke | switch A off on device 1 | `DELETE /devices/{d1}/licenses/{A}`; switch stays off | 404 `DEVICE_NOT_FOUND` → toast, switch back on |
| All devices | friend C in `GET /permissions` | C's switch on and disabled on every device, with a hint | — |
| FriendsScreen | friends tab | switch label "Tous mes appareils"; grant/revoke unchanged | — |

</frozen-after-approval>

## Code Map

- `backend/src/features/music-control/music-control.openapi.ts` / `music-control.types.ts:70-125` -- contract: `GET /devices` → `{ devices: DeviceWithLicenses[] }` (each `licenses[]` with `user.id`); grant → `{ deviceId, license }`; revoke → `{ message }`.
- `mobile/src/types/device.types.ts` -- `UserDeviceWithLicenses`, `MyDevicesResponse`, `GrantDeviceLicenseResponse`, `RevokeDeviceLicenseResponse` already exist; reuse.
- `mobile/src/services/musicControlApi.ts` -- `getMyPermissions()` returns the friend ids with "all my devices" (raw fetch, leave as is). Add `getMyDevices()`, `grantDeviceLicense(deviceId, userId)`, `revokeDeviceLicense(deviceId, userId)` built on `apiRequest` from `@services/api` (token from `useAuthStore.getState().accessToken`, `Authorization: Bearer`). URL-encode `deviceId`.
- `mobile/src/services/friendsApi.ts` -- `friendsApi.getFriends(accessToken)` → mutual friends `FriendProfile[]` (`id`, `username`, `displayName?`, `avatarUrl?`).
- `mobile/src/services/deviceService.ts:45` -- `deviceService.getDeviceInfo()` → `{ deviceId, ... }` for "Cet appareil".
- `mobile/src/screens/friends/FriendsScreen.tsx:180-200` -- switch label `'Can control my music' / 'Music control'` → "Tous mes appareils".
- `mobile/src/navigation/stacks/ProfileStack.tsx` + `ProfileScreen.tsx` (duplicated param list at top, "Linked accounts" button block) -- add the `MyDevices` route ("Mes appareils") and its entry button (Ionicons `phone-portrait-outline`).
- Templates: `mobile/src/screens/profile/LinkedAccountsScreen.tsx` (layout, toasts, disabled state) and its test `LinkedAccountsScreen.test.tsx` (fetch mock, `ThemeContext`/`LoadingSpinner`/`@utils/toast` mocks, cold-cache `FIRST_RENDER` timeout).

## Tasks & Acceptance

**Execution:**
- [x] `mobile/src/services/musicControlApi.ts` -- add the three device-license calls on `apiRequest`.
- [x] `mobile/src/screens/profile/MyDevicesScreen.tsx` -- the screen per Intent and matrix: load devices, friends, "all devices" ids and the current device id in parallel; optimistic switch with rollback; per-row pending state.
- [x] `mobile/src/navigation/stacks/ProfileStack.tsx`, `mobile/src/screens/profile/ProfileScreen.tsx` -- route and entry button.
- [x] `mobile/src/screens/friends/FriendsScreen.tsx` -- rename the switch label.
- [x] `mobile/src/screens/profile/MyDevicesScreen.test.tsx` -- component test with mocked API (fetch for `apiRequest` calls, mocked `musicControlApi.getMyPermissions`/`friendsApi.getFriends`/`deviceService`) covering each matrix row except FriendsScreen.

**Acceptance Criteria:**
- Given a friend licensed on device A only, when they open my profile on their app, then only device A is controllable (backend check, story 4.5; manual demo with two devices).

## Verification

**Commands:**
- `cd mobile && npm test && npm run lint && npm run type-check` -- expected: all green, no new lint warning

## Review Triage Log

Pass 1 (quick): medium 1 · low 2 · false 1.

| # | Finding | Verdict | Route | Evidence / action |
|---|---------|---------|-------|-------------------|
| 1 | Load effect depends on `accessToken`: a token refresh during a toggle or the first load re-runs the whole load (spinner, `licensed` rebuilt from a possibly stale GET, overlapping loads, stale token passed to `friendsApi.getFriends`) | medium | patch | `authStore.refreshAccessToken` writes a new `accessToken`; `apiRequest` refreshes on an expiring token or a 401. Fix: load on mount, read the token from `useAuthStore.getState()` + test. Patched. |
| 2 | Switch `accessibilityLabel` not unique for two devices or friends with the same name | low | rejected | Needs two devices with the same name (fallback `"<os> Device"`) or homonym friends; the switch position stays readable; not met in everyday use. |
| 3 | `FriendsScreen` label no longer states on/off | low | rejected | The label is the human-chosen rename; the `Switch` announces its own value to screen readers and the active colour remains. |
| 4 | Acceptance criterion (friend controls only device A) not demonstrated | false | — | It is a manual two-device demo backed by story 4.5's backend check; not a code defect. Reported to the user as still to do. |
