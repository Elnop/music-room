---
title: 'System media controls: notification and lock screen (#309)'
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

**Problem:** Background playback works, but there is no media notification on Android and no lock-screen controls on iOS. With the app in the background or the screen locked, the user cannot pause, skip or seek. GitHub #309.

**Approach:** Use `expo-media-control` 2.1.0 (user decision 2026-10-15, after comparing it with expo-audio 1.1.1, an SDK 57+ upgrade, react-native-track-player, react-native-audio-api and a homemade module). It is a thin native media-session library that only shows the controls and forwards their events. A `MediaSessionBridge` component, mounted inside `PlayerProvider`, reads `useNowPlaying()` (track, play state, position, duration) to update the metadata and playback state. It routes each event (play/pause, next, previous, seek) to the same actions as the in-app buttons. The queue, auto-advance and remote mode stay in project code: there is no second source of truth.

## Boundaries & Constraints

**Decisions:** the library is `expo-media-control`, with its Media3 version aligned on expo-audio's (1.8.0). In remote mode (#297) the system controls drive the remote device through `useNowPlaying`, with no seek, since there is no remote seek command. On iOS they show only while the phone plays audio, which is accepted.

**Always:** events go through `useNowPlaying`'s `toggle`/`next`/`previous` and the context `seekTo` (#313), never straight to the expo-audio player; metadata (title, artist, artwork) updates on each track change; controls are removed when playback stops (`playbackState: 'idle'`) and on logout; the choice of library and its reasons go in a comment on #309.

**Never:** do not call expo-audio's `setActiveForLockScreen` (two media sessions would compete for the system controls); do not let the library own the queue or playback; no Expo SDK upgrade in this ticket.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Track starts | local track playing | controls enabled, metadata = title, artist, artwork, duration | missing artwork → metadata without it |
| Play/pause from the system | PLAY / PAUSE event | same as the in-app toggle; state shown follows | — |
| Next / previous | NEXT_TRACK / PREVIOUS_TRACK | same as in-app next/previous (server queue, restart rule) | button hidden when there is no next track |
| Seek bar | SEEK event, position p | context `seekTo(p)` (renews the URL if stale) | — |
| Remote mode | `connectStore` target remote, remote status | metadata = remote track, play/pause/next/previous go to the device; no seek capability | remote track without duration → no progress |
| Playback stops / logout | `idle`, or logout | controls removed, notification gone | — |

</frozen-after-approval>

## Code Map

- `mobile/package.json` -- add `expo-media-control@2.1.0` with `npm install`, and commit the lockfile with it.
- `mobile/app.config.js` (plugins, l.57) and `mobile/app.json` (plugins, l.58) -- add `['expo-media-control', { enableBackgroundAudio: true, audioSessionCategory: 'playback' }]`. Check which file is the one in use: `app.config.js` exports the config.
- `mobile/plugins/` (`withJvmTarget.js` is the pattern) -- a new `withMedia3Version.js` that sets `ext.expoMediaControlMedia3Version = "1.8.0"` in the root `android/build.gradle`. expo-audio 1.1.1 pins Media3 1.8.0 (`node_modules/expo-audio/android/build.gradle` l.28), while expo-media-control defaults to 1.9.0.
- `mobile/src/hooks/useNowPlaying.ts` -- the single source for track, isPlaying, positionMs, durationMs, isRemote, hasNext, hasPrevious, toggle, next and previous. Reuse it as is.
- `mobile/src/contexts/PlayerContext.tsx` -- `seekTo(seconds)` (#313) for SEEK in local mode. Mount the bridge next to `<StreamWatchdog />`. `PlayerProvider` lives under `AppNavigator` (signed-in only), so unmounting it on logout is the place for `disableMediaControls()`.
- New `mobile/src/components/player/MediaSessionBridge.tsx` -- reads `useNowPlaying()`. It enables the controls when a track exists, then on track change sends `updateMetadata({ title, artist, artwork: { uri }, duration })`. On play/pause or a position jump it sends `updatePlaybackState(PLAYING|PAUSED|BUFFERING, positionSeconds)`. With no track it calls `disableMediaControls()`, and it does the same on unmount. Capabilities: PLAY, PAUSE, NEXT_TRACK when `hasNext`, PREVIOUS_TRACK, and SEEK in local mode only. Its listener maps PLAY/PAUSE → `toggle` (only when the state differs), NEXT_TRACK → `next`, PREVIOUS_TRACK → `previous`, and SEEK → `seekTo(event.data.position)`. It keeps the latest `useNowPlaying` values in a ref, so the listener is registered once.
- Do not touch expo-audio's `setActiveForLockScreen` (it is unused today; keep it that way).
- Jest: no native module in tests, so mock `expo-media-control` in the bridge test (`jest.mock`), as the other native mocks in `PlayerModal.test.tsx` do.

## Tasks & Acceptance

**Execution:**
- [x] `mobile/package.json`, `package-lock.json`, `app.config.js`/`app.json`, `plugins/withMedia3Version.js` -- install and configure the library, aligned Media3 -- build-time setup
- [x] `mobile/src/components/player/MediaSessionBridge.tsx` -- metadata, state and event routing as described -- the feature
- [x] `mobile/src/contexts/PlayerContext.tsx` -- mount `<MediaSessionBridge />` inside the provider -- one place, signed-in only
- [x] `mobile/src/components/player/MediaSessionBridge.test.tsx` -- matrix rows with a mocked `expo-media-control` -- coverage
- [x] comment on GitHub #309 -- the options compared and why `expo-media-control` won, plus the remote-mode decision -- AC of the ticket
- [x] `cd mobile && npx expo prebuild --platform android --no-install` in a scratch copy, or `./gradlew :app:dependencies` -- confirm a single Media3 version resolves and that the build compiles (`npx expo run:android` if an emulator is available)

**Acceptance Criteria:**
- Given a local track playing, when the app goes to the background, then the notification shows artwork, title and artist, and play/pause, next, previous and seek act through the app's own logic.
- Given next pressed in the notification, when the server queue has a next item, then that item plays, exactly as with the in-app button.
- Given the phone controls another device, when the notification's play/pause or next is pressed, then the remote device reacts.
- Given playback stops or the user logs out, then the notification disappears.

## Verification

**Commands:**
- `cd mobile && npm test && npm run type-check && npm run lint` -- expected: pass, 0 errors
- `cd mobile/android && ./gradlew :app:assembleDebug` (after prebuild) -- expected: BUILD SUCCESSFUL, one Media3 version

**Manual checks (on the final build from `main`, by the user):**
- notification and lock screen on Android, lock screen on iOS; next/previous/seek; remote mode; logout.

## Implementation Notes

- Implemented by a subagent as planned.
  - `expo-media-control` is pinned at `2.1.0`, and its plugin is listed in both `app.config.js` and `app.json`.
  - The `PlayerContext` and `usePlayerHeight` test suites mock the bridge, since they render the real `PlayerProvider` and there is no native module under Jest.
  - The position is sent again only on a jump of more than 2 s: the system extrapolates it while playing.
- Android build checked in a scratch prebuild: `:app:dependencies` resolves Media3 1.8.0 only, and `assembleDebug` succeeds. iOS was not built (Linux).
- Library comparison posted on #309 (issuecomment-6201816476).

## Review Triage Log

- Pass 1 (quick): 3 findings. 1 medium and 1 low patched, 1 rejected.
  - medium, patch: Android's media session sets play/pause optimistically before dispatching. When the app does not act (PAUSE while loading, `toggle` returning early, remote never answering), the `sentRef` dedupe never resends and the notification shows a wrong state. Fix: resend the current state about 1 s after each PLAY/PAUSE event.
  - low, patch: PREVIOUS_TRACK was always offered, while in remote mode the in-app previous button needs `hasPrevious`. Fix: offer it when `!isRemote || hasPrevious`.
  - rejected (false today): `setError` sets `idle` while keeping the track, which would leave the controls up. `playerStore.setError` has no callers, and `stop` / `setTrackUnavailableError` both clear the track.
