---
title: "Envoyer le token et l'appareil à la connexion socket (mobile)"
type: 'feature'
ticket: '2'
created: '2026-10-07'
status: 'built'
baseline_revision: '732ac4fbd6fd8aea4e45c078101fb7c57605adc8'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/doc/TESTING.md', '{project-root}/backend/src/realtime/socket-auth.ts']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Since #62 the server refuses any Socket.io connection whose handshake does not carry a valid token and the device fields. The app still connects without them and registers with `auth:register`, which the server no longer listens to, so realtime (playlist updates, listening, control) is cut in the app.

**Approach:** `socketStore.connect` sends the #62 handshake (`token`, `deviceId`, `deviceName`, `platform`, `model`, `appVersion`) through a Socket.io `auth` callback, so every (re)connection reads the current access token. On `connect_error`, `INVALID_TOKEN` triggers one `refreshAccessToken` and a reconnect; a failed refresh, `NO_TOKEN` or `INVALID_HANDSHAKE` disconnects. `useMusicControl` no longer emits `auth:register` and no longer sends `device` in `listening:update`.

## Boundaries & Constraints

**Always:** the token is read from `useAuthStore.getState()` at handshake time, never captured once; one refresh attempt per refusal, then stop (no loop); the device comes from `deviceService.getDeviceInfo()`; the app version is computed in one place shared with `api.ts`.

**Never:** no change to `authStore` (Barbara's #70 and #126 change it); no change to the backend; no change to the server URL logic (#96).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Connect | signed in | handshake `auth` = token from the store + 5 device/version fields | — |
| Reconnect after token refresh | store holds a new token | the next handshake carries the new token | — |
| Expired token | `connect_error` `INVALID_TOKEN`, refresh succeeds | one `refreshAccessToken`, then reconnect | — |
| Refresh fails | `connect_error` `INVALID_TOKEN`, refresh returns false | socket disconnected, `isConnected` false, no further retry | — |
| Still refused | `INVALID_TOKEN` again after a successful refresh | disconnect, no second refresh | logged |
| Other refusal | `NO_TOKEN` or `INVALID_HANDSHAKE` | disconnect, no refresh | logged |
| Legacy event | app running | no `auth:register` emitted; `listening:update` has no `device` | — |

</frozen-after-approval>

## Code Map

- `mobile/src/store/socketStore.ts` -- `connect()` creates `io(API_CONFIG.BASE_URL, {...})` with no `auth`; `connect_error` only logs. Add the `auth` callback and the refusal handling here. `disconnect()` already clears the state.
- `backend/src/realtime/socket-auth.ts` -- the handshake contract and refusal codes (`NO_TOKEN`, `INVALID_HANDSHAKE`, `INVALID_TOKEN`) as `connect_error` `message`.
- `mobile/src/store/authStore.ts` -- `accessToken`, `refreshAccessToken(): Promise<boolean>`; read through `useAuthStore.getState()` inside functions (authStore will import socketStore in #70: keep the access lazy to avoid an import-time cycle). Do not edit.
- `mobile/src/services/deviceService.ts` -- `getDeviceInfo()` → `{ deviceId, deviceName, platform, model }`; add `getAppVersion()` here.
- `mobile/src/services/api.ts` -- `getClientHeaders()` computes the app version (l.61-65): use `getAppVersion()`.
- `mobile/src/hooks/useMusicControl.ts` -- `useMusicControlEmitter`: the `auth:register` effect and `isRegistered` retry exist only for registration; remove them and the `device` field of `listening:update`.
- `mobile/src/navigation/RootNavigator.tsx` -- connects when authenticated, disconnects otherwise. Unchanged.

## Tasks & Acceptance

**Execution:**
- [x] `mobile/src/services/deviceService.ts` -- export `getAppVersion()` (logic moved from `api.ts`)
- [x] `mobile/src/services/api.ts` -- use `getAppVersion()` -- one source for the version sent to the backend
- [x] `mobile/src/store/socketStore.ts` -- `auth` callback building the handshake; `connect_error` handling per the matrix with a one-refresh guard reset on `connect`
- [x] `mobile/src/hooks/useMusicControl.ts` -- drop `auth:register`, `isRegistered` and `device` in `listening:update`
- [x] `mobile/src/store/socketStore.test.ts` -- jest-expo, `socket.io-client`, `authStore` and `deviceService` mocked; one test per matrix row (the legacy row: assert no `emit('auth:register', ...)` through the hook, or the hook source no longer emits it via a render of `useMusicControlEmitter`)

**Acceptance Criteria:**
- Given the #62 backend running, when a signed-in user opens the app, then the socket connects and a friend's play/pause reaches the device.

## Design Notes

Socket.io's `auth` option accepts a callback `(cb) => cb(data)`, called on every connection attempt, which is how a refreshed token reaches the next handshake. After a middleware refusal the client does not reconnect by itself (`socket.active` is false), so the store calls `socket.connect()` after a successful refresh.

## Verification

`mobile/node_modules` in this checkout is root-owned and empty. Run from a copy: `rsync -a --exclude node_modules mobile/ /tmp/claude-1000/-home-elthinkbuntu-Documents-music-room/ab33d70a-3a13-4ee6-8938-dc4d0a060d15/scratchpad/mobile/` then `npm ci` there.

**Commands:**
- `cd mobile && npm run type-check && npm run lint && npm test` -- expected: green

**Manual checks (if no CLI):**
- Dev build against the #62 backend: the socket connects and a friend's remote pause works.

## Review Triage Log

Quick review, pass 1: 2 low (patched), 1 open verification.
- low, patch — the hook test rendered with `react-test-renderer`, which is undeclared (pulled in transitively by jest-expo) and deprecated in React 19; now `@testing-library/react-native` (named in doc/TESTING.md), added as a devDependency with its lockfile.
- low, patch — the `useMusicControlEmitter` test lived in `socketStore.test.ts`, against TESTING.md's one-file-per-module rule; moved to `hooks/useMusicControl.test.ts`.
- open, not a code defect — the AC (a friend's play/pause reaches the device against the #62 backend) needs a dev build on a device; only mocked tests cover it. Left to the human before merging #62 + #63.
