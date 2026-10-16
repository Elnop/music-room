---
title: 'React to audio interruptions: headset unplugged, calls (#310)'
type: 'feature'
ticket: ''
created: '2026-10-16'
status: 'built'
baseline_revision: '326716bc88538b204c77560be4d0960a3a86c3a5'
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

**Problem:** expo-audio 1.1.1 reacts to some audio events natively, but behind the app's back. On Android a call pauses the player and resumes it, while the store, the buttons and the media notification keep saying "playing". On iOS a call or an unplugged headset stops the player and the app never notices. Unplugging a headset on Android does nothing: the music jumps to the speaker. GitHub #310.

**Approach:**
- Let the native layer pause or resume, and mirror every change the app did not ask for into `playerStore`, so the buttons, the mini-player and the notification (#309) follow.
- On Android, enable ExoPlayer's `setHandleAudioBecomingNoisy(true)` with a one-line `patch-package` patch to expo-audio, so an unplugged headset pauses the player.
- A pause caused by the system and resumed by the system resumes the store. A pause caused by the system, followed by a pause by the user, stays paused.

## Boundaries & Constraints

**Decision (2026-10-16):** iOS switches to `interruptionMode: 'doNotMix'`, so iOS resumes playback after a call (`shouldResume`). Starting Zumik then stops other apps' music on iOS, as music apps usually do. Android keeps `interruptionModeAndroid: 'duckOthers'`.

**Always:**
- The store is the single source of truth for the UI.
- The mirror ignores loading, the end of a track (`didJustFinish`), a failed player (#313's `StreamWatchdog` owns that) and remote mode.
- The patch goes in `mobile/patches/` (`patch-package` already runs on `postinstall`).

**Never:**
- No custom native module.
- No change to the queue or to auto-advance.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Headset unplugged | store playing, the player stops (Android noisy / iOS route change) | store `paused`, play button shown | — |
| Call (Android) | transient focus loss → native pause, then gain → native resume | store `paused` during the call, back to `playing` after, same position | — |
| Call (iOS) | interruption → the player stops | store `paused`, then back to `playing` when iOS resumes the player (`doNotMix` + `shouldResume`) | — |
| User pauses during the interruption | store paused by the system, then the user pauses | stays paused when the system would resume | — |
| Short notification sound | Android `CAN_DUCK` → volume halved | keeps playing, store unchanged | — |
| Loading, track end, failure, remote mode | — | no mirror | — |

</frozen-after-approval>

## Code Map

- `mobile/node_modules/expo-audio/android/src/main/java/expo/modules/audio/AudioPlayer.kt` l.44-49: `ExoPlayer.Builder(context)...setAudioAttributes(AudioAttributes.DEFAULT, false)`.
  - Add `.setHandleAudioBecomingNoisy(true)` and save it with `npx patch-package expo-audio` → `mobile/patches/expo-audio+1.1.1.patch`. The existing pattern is `patches/react-native-image-colors+2.5.1.patch`.
- `AudioModule.kt` l.62-110 (Android focus):
  - `LOSS_TRANSIENT` pauses and sets `player.isPaused = true`, then `GAIN` calls `play()`.
  - `CAN_DUCK` with `DUCK_OTHERS` halves the volume.
  - `LOSS` pauses for good.
- iOS (`AudioModule.swift` l.383-445):
  - With `interruptionMode: 'duckOthers'` (today, `PlayerContext.tsx` l.~9), an interruption only halves the volume and the end only restores it. The system still stops the player during a call, and nothing calls `play()` after.
  - With `'doNotMix'`, the end of the interruption calls `play()` when iOS says `shouldResume`.
  - Route change `oldDeviceUnavailable` → `pauseAllPlayers()`.
- `mobile/src/contexts/PlayerContext.tsx`:
  - Add a component `AudioInterruptionSync`, pattern `QueueAutoAdvance` / `StreamWatchdog`, on `useAudioPlayerStatus(player)`. Compare statuses by `status.id === player.id`, like `StreamWatchdog`.
  - When the player goes from playing to not playing while the store is `playing`, loaded, not `didJustFinish`, not `idle`/`failed`, and local: mark `pausedBySystem` and call `pause()`.
  - When the player plays again while the store is `paused` with `pausedBySystem`: `resume()`.
  - A user `pause()`/`resume()`/`playTrack` clears `pausedBySystem`. A user pause during the interruption calls `player.pause()` again if the native side resumed.
- The `Sync pause/resume` effect, l.~395: it reacts only to store changes. The mirror must not trigger a `player.play()` from that effect: the store goes to `paused` while the player is already paused, so it is a no-op.
- `mobile/src/store/playerStore.ts`: add `pausedBySystem: boolean` and `pauseBySystem()`. `pause`, `resume` and `playTrack` reset it.

## Tasks & Acceptance

**Execution:**
- [x] `mobile/patches/expo-audio+1.1.1.patch` -- `setHandleAudioBecomingNoisy(true)` in `AudioPlayer.kt`, created with `npx patch-package expo-audio` -- Android pauses on an unplugged headset
- [x] `mobile/src/contexts/PlayerContext.tsx` -- `setAudioModeAsync` gets `interruptionMode: 'doNotMix'` (iOS), keeping `interruptionModeAndroid: 'duckOthers'`; add `AudioInterruptionSync` -- the mirror
- [x] `mobile/src/store/playerStore.ts` (+ test) -- `pausedBySystem`, `pauseBySystem()`, reset by `pause`/`resume`/`playTrack`
- [x] `mobile/src/contexts/PlayerContext.test.tsx` -- matrix rows with mocked status updates (pattern of the #313 tests)

**Acceptance Criteria:**
- Given a track playing with a headset, when the headset is unplugged, then playback pauses and the play button shows.
- Given a call during playback, when it ends, then playback resumes at the same position, and the buttons and notification show the right state throughout.
- Given a short notification sound, then playback does not stop.

## Verification

**Commands:**
- `cd mobile && npm test && npm run type-check && npm run lint` -- expected: pass, 0 errors
- `cd mobile && rm -rf node_modules/expo-audio && npm install` -- expected: `patch-package` applies `expo-audio+1.1.1.patch` (the line is present in `AudioPlayer.kt`)

## Implementation Notes

- Implemented by a subagent.
  - `patches/expo-audio+1.1.1.patch` adds `setHandleAudioBecomingNoisy(true)`, and `npm install` applies it.
  - `pause()` while already paused clears `pausedBySystem`: that is how a user pause during an interruption is recorded.
  - Buffering is ignored to avoid false pauses on seek and rebuffer.

## Review Triage Log

- Pass 1 (quick): 5 findings. 1 high and 2 low patched, 2 deferred.
  - high, patch: native status events reach JS late (Android coroutine `sendPlayerUpdate`). A fast user pause→play lets a stale `playing:false` be mirrored as a system pause, and the in-flight events keep the player toggling. Fix: mirror only when the live `player.playing` matches the event.
  - low, patch: the "failed" test row was stopped by `!isLoaded` before the `idle`/`failed` guard. It is now loaded with a failed state.
  - low, patch: `renewStream` and `setTrackUnavailableError` kept `pausedBySystem`. Both now reset it.
  - deferred (low, rare): a system pause during buffering gives no `playing` edge, so it is not mirrored. A level-based check risks false pauses (deferred-work.md).
  - deferred (maybe-false, medium if true): iOS may not resume after a call if the AVPlayer is already paused when `.began` is handled. To be checked on an iPhone (deferred-work.md).
