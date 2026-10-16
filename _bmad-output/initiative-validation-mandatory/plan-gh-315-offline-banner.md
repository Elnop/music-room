---
title: 'Offline banner and socket reconnection (#315)'
type: 'feature'
ticket: ''
created: '2026-10-15'
status: 'built'
baseline_revision: '2f047b79562a7774f2e8c3d2f2eff483aa545efc'
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

**Problem:** Losing the network or the socket makes actions fail silently. Nothing tells the user that the app is offline or reconnecting, and once Socket.io gives up after 10 attempts, nothing ever connects it again. GitHub #315.

**Approach:**
- A discreet banner sits at the top of the signed-in app:
  - « Hors ligne » when the device has no network;
  - « Reconnexion… » while the socket retries;
  - « Connexion perdue » with a « Réessayer » button once the 10 attempts are exhausted. The button reconnects.
- The banner disappears on reconnection. The network coming back also retries a socket that gave up.
- Realtime state is reloaded on reconnection. This already exists: `useQueueSync` reloads the queue, and `usePlaylistSocket` reloads the open playlist. Keep it and test it.

## Boundaries & Constraints

**Always:**
- The socket status lives in `socketStore`.
- Network state comes from `expo-network` (the SDK 54 version, `~8.0.8`, installed with `npx expo install`, lockfile committed).
- The banner never covers the status bar or the screen headers.
- French copy, like the rest of the UI.

**Never:**
- No banner on the auth screens.
- No new reconnection policy: keep `reconnectionAttempts: 10` and the existing handshake refusal handling (a refused handshake stops the socket on purpose, so it shows no banner).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Online, connected | network up, socket connected | no banner | — |
| Airplane mode | network down | « Hors ligne » within seconds, whatever the socket says | — |
| Backend down | network up, manager `reconnect_attempt` | « Reconnexion… » | — |
| Attempts exhausted | manager `reconnect_failed` | « Connexion perdue » + « Réessayer » | the tap calls `retry()`, back to « Reconnexion… » |
| Network back after failure | socket status failed, network becomes reachable | `retry()` called automatically | — |
| Reconnected | `connect` after a disconnect | banner gone; queue and open playlist reloaded | — |
| Handshake refused / logout | `stop()` / `disconnect()` | status idle, no banner | — |

</frozen-after-approval>

## Code Map

- `mobile/src/store/socketStore.ts`:
  - It only has `isConnected` today.
  - socket.io-client 4.8: `reconnect`, `reconnect_attempt`, `reconnect_error` and `reconnect_failed` are **Manager** events (`socket.io.on(...)`). The current `socket.on('reconnect_attempt' | 'reconnect_failed' | ...)` handlers never fire: move them to `socket.io`.
  - Add `status: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed'`, set from `connect` / `disconnect` / `reconnect_attempt` / `reconnect_failed` and the store's `disconnect()`.
  - Add `retry()`: calls `connect()`, which already replaces a socket that is not connected.
  - Keep `isConnected` as is: `useQueueSync`, `usePlaylistSocket`, `useMusicControl`, `useRemoteTarget` and `useNowPlaying` read it.
- New `mobile/src/hooks/useConnectionStatus.ts`:
  - Combines `expo-network`'s `useNetworkState()` (offline when `isConnected === false || isInternetReachable === false`; `undefined` counts as online) with the socket `status`.
  - Returns `'offline' | 'reconnecting' | 'failed' | null`.
  - Calls `retry()` when the network becomes reachable while the status is `failed`.
- New `mobile/src/components/common/ConnectionBanner.tsx`:
  - Renders the banner from the hook, with the theme from `useTheme()`, and an `accessibilityLiveRegion` / `accessibilityRole="alert"`.
- `mobile/src/navigation/AppNavigator.tsx` (container `View`, l.~66):
  - Render `<ConnectionBanner />` in the flow above `<Tab.Navigator>`, with its own `paddingTop: insets.top`.
  - While it shows, wrap the navigator in `SafeAreaInsetsContext.Provider` with `top: 0`, so stack headers (react-navigation reads that context) don't add the status-bar inset a second time. `PlaylistDetailScreen` reads `useSafeAreaInsets().top` too and follows the same context.
- Already done, do not rewrite: the reload on reconnect in `useQueueSync.ts` (`connectedOnceRef`) and `usePlaylistSocket.ts` (`joinedRef`). Add tests if missing.

## Tasks & Acceptance

**Execution:**
- [x] `mobile/package.json` + lockfile -- `npx expo install expo-network` -- network state
- [x] `mobile/src/store/socketStore.ts` (+ `socketStore.test.ts`) -- `status`, Manager events, `retry()` -- the source of the banner state
- [x] `mobile/src/hooks/useConnectionStatus.ts` (+ test) -- network + socket → banner state, auto-retry when the network returns
- [x] `mobile/src/components/common/ConnectionBanner.tsx` (+ test) -- the three banners, the « Réessayer » button
- [x] `mobile/src/navigation/AppNavigator.tsx` -- mount the banner, inset override while it shows
- [x] `useQueueSync` / `usePlaylistSocket` tests -- a reconnect reloads, if not already covered

**Acceptance Criteria:**
- Given airplane mode, when it turns on, then « Hors ligne » shows within seconds; when it turns off, the banner goes and the queue is reloaded.
- Given the backend stopped, then « Reconnexion… » shows, and « Réessayer » once the attempts run out; tapping it reconnects when the backend is back.
- Given the banner showing, then the status bar and the screen headers stay fully visible.

## Verification

**Commands:**
- `cd mobile && npm test && npm run type-check && npm run lint` -- expected: pass, 0 errors

## Implementation Notes

- Implemented by a subagent.
  - `expo-network` was added with `npm install expo-network@~8.0.8`: `npx expo install` reformatted the whole `package.json` and lockfile.
- Deviations from the plan:
  - `AppNavigator` calls `useConnectionStatus()` once and passes `status` to `ConnectionBanner`. Two calls would fire the auto-retry twice, and a second `connect()` tears down the first socket.
  - A non-client `disconnect` sets `reconnecting` right away.
  - `io server disconnect` sets `failed`, since Socket.io never retries a server kick.

## Review Triage Log

- Pass 1 (quick): 4 findings. 2 medium and 1 low patched, 1 rejected.
  - medium, patch: after « Réessayer », `connect()` sets `connecting`, which shows no banner, so the banner vanished for 1–20 s while the backend was still down. Fix: `retry()` leaves the status at `reconnecting`.
  - medium, patch: the auto-retry fired only on the exact offline→online edge while already `failed`. If the network came back during reconnection and the last attempt then failed, nothing retried. Fix: remember the offline period until the next connect, and retry when `failed` and online.
  - low, patch: white text on the default theme's error colour (`#EF4444`) is ~3.8:1, under WCAG AA. Fix: the text colour now follows the background's luminance.
  - rejected: `io server disconnect` → `failed` is outside the plan, but it is the correct state. Without it, a server kick would show « Reconnexion… » forever with no button, since Socket.io does not retry it. The backend never kicks clients today.
