---
title: 'Renew an expired stream URL without stopping playback (#313)'
type: 'feature'
ticket: ''
created: '2026-10-15'
status: 'built'
baseline_revision: 'a7c40e19a270df736e10a9de2b1632ab543c3447'
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

**Problem:** SoundCloud stream URLs expire after 30 minutes. A track paused for a long time, or a seek after expiry, can fail, and today the only outcome is an error. The mobile app can't even tell how old a URL is: the backend caches URLs for 30 minutes, so the one it returns may expire right away.

**Approach:** The backend returns `expiresAt` with the stream URL and caches it for less time than its lifetime. The mobile player renews the URL itself before play or seek when it is about to expire, and renews it once when the player fails mid-track. In both cases it reloads the same track at the same position, keeping play or pause as it was. If the renewal fails too, the existing error toast shows.

## Boundaries & Constraints

**Always:** never persist a stream URL (AGENTS.md); a single renewal per load, then `setTrackUnavailableError`; local mode only (in remote mode the other device plays); mirror the response shape in `mobile/src/types/` and both OpenAPI stream entries.

**Never:** no cache-bypass query parameter on the stream route; no timer that renews in the background; no change to the queue or to `listening:status` emission beyond the existing `markSeek` after a seek.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Resume after a long pause | paused, `expiresAt - now < 2 min`, user presses play | new URL fetched, track reloads at the paused position and plays | none shown |
| Seek after expiry | stale URL, seek to 90 s, playing or paused | reload at 90 s, same play/pause state | none shown |
| Player fails mid-track | store `playing`, player went from loaded to `idle` (Android) / `failed` (iOS) | one renewal at the last known position | none shown |
| Renewal also fails | second failure in the same load, or stream fetch 404 | `setTrackUnavailableError` → `PlayerErrorToast` | no further attempt |
| Fresh URL | `expiresAt` far ahead | play and seek act on the player directly, as today | — |

</frozen-after-approval>

## Code Map

- `backend/src/features/soundcloud/services/soundcloud-stream.service.ts` -- `getStreamUrl` caches and returns a string; make it return `{ streamUrl, expiresAt }` (obtained time + lifetime), caching that object.
- `backend/src/features/soundcloud/utils/soundcloud-cache.ts` -- `CACHE_TTL.STREAM` 1800 s. Add `STREAM_URL_LIFETIME_S = 1800` and lower the cache TTL to 1200 s, so a cached URL has at least 10 min left and a renewal made 2 min before expiry always misses the cache.
- `backend/src/features/soundcloud/soundcloud.service.ts`, `soundcloud.controller.ts` (~l.99-110) -- pass the object through; respond `data: { streamUrl, expiresAt }`.
- `backend/src/features/soundcloud/soundcloud.openapi.ts` (~l.227, ~l.280) -- add `expiresAt` (date-time) to both stream responses.
- `mobile/src/types/soundcloud.types.ts` -- add a `StreamUrlResponse` type.
- `mobile/src/store/playerStore.ts` -- has `playTrack(track, queueItemId, startPositionMs)`, `loadCounter`, `startPositionMs`, `setTrackUnavailableError`. Add `streamExpiresAt`, `streamRenewed` (reset by `playTrack`), `resumeAfterLoad`, and `renewStream(positionMs, keepPlaying)`, which reloads the current track like `playTrack` but keeps `currentTrack`/`queueItemId`/`isModalOpen`.
- `mobile/src/contexts/PlayerContext.tsx` -- `useAudioPlayer(streamUrl)` creates a NEW player on each URL change, so position must go through `startPositionMs`, which the auto-play effect already seeks to. Store `expiresAt` on load. The auto-play effect ends in `setPlaybackReady` instead of play when `resumeAfterLoad` is false. The pause/resume sync effect renews instead of `player.play()` when stale. Expose `seekTo(seconds)` in the context value. Add a `StreamWatchdog` component (pattern: `QueueAutoAdvance`) on `useAudioPlayerStatus` for the mid-track failure.
- `mobile/src/components/player/PlayerModal.tsx` `handleSeek` (l.~150) and `mobile/src/hooks/useNowPlaying.ts` l.111 -- call the context `seekTo` instead of `player.seekTo`.
- expo-audio 1.1.1 sends no error event: an Android failure shows as `playbackState: 'idle'`, an iOS one as `'failed'`.

## Tasks & Acceptance

**Execution:**
- [ ] backend stream service, cache, service, controller, openapi -- return and document `expiresAt`, shorter cache TTL -- the app must know the real age
- [ ] backend stream service/controller tests -- assert `expiresAt` and the cached URL keeps its original `expiresAt`
- [ ] `mobile/src/types/soundcloud.types.ts`, `playerStore.ts` (+ `playerStore.test.ts`) -- `renewStream` state and single-retry flag
- [ ] `mobile/src/contexts/PlayerContext.tsx` -- staleness check, context `seekTo`, `StreamWatchdog`, paused reload
- [ ] `PlayerModal.tsx`, `useNowPlaying.ts` -- route seeks through context `seekTo`
- [ ] new `mobile/src/contexts/PlayerContext.test.tsx` -- the matrix rows (expired URL simulated via `expiresAt` in the past, failure via mocked status)

**Acceptance Criteria:**
- Given a track paused past its URL's expiry, when the user presses play, then playback resumes at the paused position with no error shown.
- Given a stale URL, when the user seeks, then the track reloads at the new position keeping its play/pause state.
- Given a track that fails again after one renewal, when it fails, then the error toast shows and no further request is made.

## Verification

**Commands:**
- `cd backend && npm test && npm run type-check && npm run lint` -- expected: pass, 0 errors
- `cd mobile && npm test && npm run type-check && npm run lint` -- expected: pass, 0 errors
- Swagger UI `GET /api/soundcloud/stream?url=…` -- expected: `data.expiresAt` present

## Implementation Notes

- Implemented by a subagent as planned. Deviation: a renewal made while paused ends in `paused`, not `ready` (`setPlaybackReady` maps it), since `canToggle`/`resume()` only accept `paused`. A seek to 0 on a stale URL calls `markSeek` at once, since the reload does not seek from 0. `StreamWatchdog` compares statuses by player id, because the hook can still hold the previous player's status.
- After the implementer's report: a renewal of an expiring URL no longer uses up the retry. `renewStream(position, keepPlaying, afterFailure)` sets `streamRenewed` only for a failure, so a long pause followed by a real failure still gets its one retry.
- Not done: the Swagger UI call and the on-device check.

## Review Triage Log

- Pass 1 (quick): 4 findings. 2 medium, 1 low (patched), 1 low (rejected).
  - medium, patch: a stale resume sends `listening:update` with `positionMs: 0`. `resume()` flips `isPlaying`, `useMusicControl` emits 200 ms later, and by then the position reader points at the empty player created by `streamUrl: null`. Fix: the reader returns `startPositionMs` while loading.
  - medium, patch: a mix longer than ~60 min ends in the error toast at the second URL expiry, because `streamRenewed` is only cleared by `playTrack`. Fix: the flag clears once the renewed player has played 30 s past its start.
  - low, patch: the test "ignores a player that never loaded" never exercises a player that was never loaded. A case was added.
  - low, rejected: `expiresAt` is compared with the phone clock, so a large clock skew triggers useless renewals or none at all. Phones sync their clock over the network, and the fix needs another API shape change (a relative expiry). The failure path stays as the safety net.
