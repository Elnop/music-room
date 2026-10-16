---
title: 'Restore the last track, paused, when the app opens (#312)'
type: 'feature'
ticket: ''
created: '2026-10-16'
status: 'built'
baseline_revision: 'b834c956ec20391fb2440140f3a6c017435cd4d0'
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

**Problem:** After the app is killed or the phone restarts, the player opens empty. The queue lives on the server, but the playing track and its position are lost. GitHub #312.

**Approach:**
- Save the current track's metadata (the `QueueTrack` shape), its `queueItemId` and its position in AsyncStorage, under a key per user.
- Save on track change, on pause, every ~10 s while playing, and when the app goes to the background.
- On start, once the user is known, the player is set to that track, paused, with no stream loaded. Play loads a fresh stream URL and starts at the saved position.
- The stream URL is never stored.
- Local storage rather than the server: no new endpoint, and the position changes too often to be worth a write per tick. This choice goes in a comment on #312.

## Boundaries & Constraints

**Always:**
- Restore only for the same user, and only in local mode.
- Restore only when the player is still empty: a track the user starts first wins.
- An unavailable track behaves as it does today: the existing toast shows on play, nothing blocks the start-up.
- Logout deletes the saved entry.
- A corrupt or unreadable entry is ignored and deleted.

**Never:**
- Do not store the stream URL or any token.
- No backend change.
- Do not autoplay on start.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Killed while playing | saved {track, queueItemId, positionMs} | at start: mini-player shows the track, paused, position shown; play → fresh stream at the position (± the save interval) | — |
| Nothing saved / other user | no entry, or a userId mismatch | empty player | — |
| Track gone on SoundCloud | play → stream 404 | existing `PlayerErrorToast`, player cleared | no retry loop |
| Corrupt entry | invalid JSON or shape | ignored, entry deleted | — |
| Logout | — | entry deleted | — |
| User starts a track before the restore resolves | `currentTrack` already set | restore skipped | — |

</frozen-after-approval>

## Code Map

- `mobile/src/store/playerStore.ts`:
  - `playTrack(track, queueItemId, startPositionMs)` loads and autoplays.
  - Add `restoreTrack(track, queueItemId, positionMs)`. It sets `currentTrack`, `queueItemId`, `startPositionMs` and `playbackState: 'paused'` with `streamUrl: null`, `isPlaying: false`, and a `needsStreamLoad: true` flag. It does not touch `loadCounter`, so `PlayerContext`'s load effect does not fetch (check that effect's deps: it runs on `currentTrack` change, so guard the fetch on `needsStreamLoad`).
  - `resume()`/`play()` with `needsStreamLoad` call `playTrack(currentTrack, queueItemId, startPositionMs)` and keep `isModalOpen` as is.
  - `playTrack`/`stop` clear the flag.
- `mobile/src/hooks/useNowPlaying.ts`:
  - `canToggle` and `positionMs` must allow a restored, paused track with no player loaded. `positionMs` comes from `usePlayerProgress` (player time), so for a restored track use `startPositionMs`. `durationMs` comes from the track's `duration`.
- New `mobile/src/services/lastTrackStorage.ts`: `save(userId, entry)`, `load(userId)` (validated with Zod), `clear(userId)`. Key `zumik:lastTrack:<userId>`. The `@react-native-async-storage/async-storage` pattern is in `authStore.ts` / `ThemeContext.tsx`.
- New `mobile/src/hooks/useLastTrackPersistence.ts`, mounted in `PlayerProvider`:
  - On mount with a user: `load` → `restoreTrack`, unless a track is already set or the mode is remote. Rebuild the track with `queueTrackToSoundCloud` (`utils/trackToSoundCloud.ts` l.42).
  - While local: save on `currentTrack`/`playbackState` changes, on a 10 s interval while playing, and on `AppState` → background. The position comes from `readPositionMs()` (`playerStore.ts` l.25).
  - A SoundCloudTrack → QueueTrack mapping is needed: `permalink_url`, `title`, `user.username`, `artwork_url`, `duration`. Reuse one if `utils/` already has it.
- `mobile/src/store/authStore.ts` `logout` (l.~263): call `lastTrackStorage.clear(userId)`, or clear from the hook on unmount when the user goes null.
- `useMusicControl` emits a `listening:update` on track change: a restored paused track is announced as paused, which is correct.

## Tasks & Acceptance

**Execution:**
- [x] `mobile/src/services/lastTrackStorage.ts` (+ test) -- save/load/clear, Zod-validated
- [x] `mobile/src/store/playerStore.ts` (+ test) -- `restoreTrack`, `needsStreamLoad`, play/resume load path
- [x] `mobile/src/contexts/PlayerContext.tsx` -- no fetch while `needsStreamLoad`; mount the persistence hook
- [x] `mobile/src/hooks/useNowPlaying.ts` (+ test) -- restored track is togglable, shows its saved position and duration
- [x] `mobile/src/hooks/useLastTrackPersistence.ts` (+ test) -- restore and save rules of the matrix
- [x] logout clears the entry (`authStore` or the hook)
- [x] comment on GitHub #312 -- local storage chosen, and why

**Acceptance Criteria:**
- Given the app killed during playback, when it reopens, then the mini-player shows the track paused, and play resumes within a few seconds of where it was.
- Given a stored entry, then it holds no stream URL.
- Given a track deleted on SoundCloud, then start-up is not blocked, and play shows the existing error.

## Verification

**Commands:**
- `cd mobile && npm test && npm run type-check && npm run lint` -- expected: pass, 0 errors

## Implementation Notes

- Implemented by a subagent.
  - `toTrackInput` (`utils/trackInput.ts`) builds the stored track.
  - `setRestoredPosition` lets a seek before play move the start position.
  - An emptied player (unavailable track, end of queue) deletes the entry.
  - Comment on #312: issuecomment-6211539469.

## Review Triage Log

- Pass 1 (quick): 5 findings, all real and patched.
  - high: logout never empties the player store. User B's restore was skipped and A's track got saved under B's key. Fix: `playerStore` stops the player on the auth → unauthenticated edge.
  - medium: `checkAndPlay` seeks asynchronously, then sets playing at once, so the save on → playing read the position before the seek landed (≈0). Fix: delay that save by ~2 s.
  - low: an unreadable entry was not deleted, which the plan requires. Fix: `clear` it in that path.
  - low: an invalid snapshot left the older entry in place. Fix: clear it instead.
  - low: a seek on a restored track (only `startPositionMs` changes) was not saved. Fix: it now triggers a save.
