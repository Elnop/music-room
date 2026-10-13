---
title: 'Queue de lecture : store mobile, enchaînement auto, suivant/précédent'
type: 'feature'
ticket: 'gh-274'
created: '2026-10-13'
status: 'built'
baseline_revision: '229b84eb174470ed03c2e6be008bcf7a50dee028'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/initiative-validation-mandatory/plan-gh-273-play-queue-backend.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The backend queue (#273) has no client: when a track ends nothing plays next, and there are no next/previous buttons.

**Approach:** A zustand `queueStore` mirrors the server queue (`GET /api/queue`, `queue:updated`). At the end of a track the app asks the server for the next item and plays it; next/previous buttons in `PlayerModal` and a next button in `MiniPlayer` do the same on demand. Tapping a track in a list keeps today's behavior: it plays at once and the queue is untouched.

## Boundaries & Constraints

**Always:** HTTP through `mobile/src/services/api.ts` (`apiRequest`); types mirror backend `QueueState` / `QueueItem` exactly (`album` / `albumArt` are `null`, not omitted); event name `queue:updated` read from `backend/src/realtime/index.ts`; the queue is refetched after a socket reconnect (events sent while disconnected are lost); stream URLs are fetched on demand as today, never stored in the queue store.

**Decisions:** a `queue:updated` only refreshes the store; it never changes this device's audio. Previous restarts the track when more than 3 s have played, otherwise it goes to the previous item. When any track ends (queue item or list tap), the next queue item plays. `PlayerModal` controls become `[prev] [play/pause] [next]`: the ±15 s buttons are removed.

**Never:** queue screen, swipe-to-add, play-playlist button (#275–#277); delegate next/previous (#279); backend changes; Expo Go.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| App start / reconnect | authenticated, socket connects | store holds the server queue | fetch failure: store keeps its last state, logged |
| `queue:updated` | event from any device of the user | store replaced by the payload | — |
| Track ends, next exists | queue has an item after current | `POST /next`, the new current item starts playing | — |
| Track ends, queue end | `POST /next` → 409 `QUEUE_END` | playback stops cleanly (player idle, no error toast) | — |
| Next button | idem | idem as a track end | 409 `QUEUE_END`: button disabled beforehand when no upcoming item |
| Previous button, > 3 s played | any track playing | seek to 0, no request | — |
| Previous button, ≤ 3 s played | queue item playing, a history item exists | `POST /previous`, that item plays | 409 `QUEUE_START`: button disabled beforehand |
| List-tapped track ends | queue has an upcoming item | `POST /next`, it plays | `QUEUE_END`: stop |
| `queue:updated` with new current | this device playing something | store updated, audio unchanged | — |
| List tap | track tapped in search / playlist | plays at once; queue store and server queue unchanged | — |
| Network error on next/previous | request fails | current playback unchanged, error logged | no crash |

</frozen-after-approval>

## Code Map

- `mobile/src/store/playerStore.ts` -- `playTrack(track: SoundCloudTrack)`, `stop()`, `playbackState`. Add the queue item being played (`queueItemId: string | null`, null for list taps) set through `playTrack`'s callers.
- `mobile/src/contexts/PlayerContext.tsx` -- owns the `expo-audio` player; end of track = `useAudioPlayerStatus(player).didJustFinish` (expo-audio 1.x). Fire once per `loadCounter`.
- `mobile/src/screens/playlists/PlaylistDetailScreen.tsx:46-77` -- `hashStringToNumber` + `trackToSoundCloud(Track)`: move them to a util and reuse them to turn a `QueueItem.track` into a `SoundCloudTrack`.
- `mobile/src/screens/search/SoundCloudSearchScreen.tsx:47`, `PlaylistDetailScreen.tsx:175` -- list taps; must keep `queueItemId` null.
- `mobile/src/components/player/PlayerModal.tsx:236-272` -- controls row; `MiniPlayer.tsx:56` -- play/pause button, room for a next button.
- `mobile/src/hooks/usePlaylistSocket.ts` -- pattern for a socket hook (refetch after reconnect, `socket.on/off`).
- `mobile/src/services/musicControlApi.ts` -- pattern for a feature API client on `apiRequest`.
- `mobile/src/navigation/AppNavigator.tsx:61-119` -- mounted only when authenticated, inside `PlayerProvider`: mount the queue hook here.
- `mobile/src/store/playlistStore.test.ts` -- jest mocking pattern for stores.
- Backend contract: `backend/src/features/queue/queue.types.ts`, `queue.openapi.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `mobile/src/types/queue.types.ts` -- `QueueTrack`, `QueueItem`, `QueueState` mirroring the backend.
- [x] `mobile/src/services/queueApi.ts` -- `getQueue`, `next`, `previous` (and `playItem` for later stories) on `apiRequest`; 409 `QUEUE_END` / `QUEUE_START` surfaced as a typed result, not a thrown error.
- [x] `mobile/src/utils/trackToSoundCloud.ts` -- moved converter + a `QueueItem` overload; `PlaylistDetailScreen` imports it.
- [x] `mobile/src/store/queueStore.ts` -- state, `load`, `applyState`, `reset`, `next`, `previous`, selectors `hasNext` / `hasPrevious`; `next` / `previous` call the API, apply the returned state and start the new current item through `playerStore`.
- [x] `mobile/src/store/playerStore.ts` -- `queueItemId` on `playTrack`, cleared by list taps and `stop`.
- [x] `mobile/src/hooks/useQueueSync.ts` -- loads on connect, refetches on reconnect, applies `queue:updated`; resets on unmount. Mounted in `AppNavigator`.
- [x] `mobile/src/contexts/PlayerContext.tsx` -- on `didJustFinish`, call `queueStore.next()`; at queue end, `stop()`.
- [x] `mobile/src/components/player/PlayerModal.tsx`, `MiniPlayer.tsx` -- `[prev] [play/pause] [next]` in the modal (±15 s removed), a next button in the mini player; disabled per `hasNext` / `hasPrevious`.
- [x] `mobile/src/store/queueStore.test.ts` -- every matrix row the store owns: load, apply event, next / previous success, `QUEUE_END` stops, `QUEUE_START`, network error, list tap leaves the queue alone.

**Acceptance Criteria:**
- Given a queue of two items with the first playing, when it ends, then the second starts without user action, and when that one ends playback stops cleanly.
- Given two devices logged into the same account, when next is pressed on one, then the other's queue store shows the new current item.

## Verification

**Commands:**
- `cd mobile && npm run type-check && npm run lint` -- expected: clean
- `cd mobile && npm test` -- expected: green, including `queueStore.test.ts`

**Manual checks (if no CLI):**
- Native debug build (`npx expo run:android`): queue two tracks via Swagger, tap a track in search, let it end (or press next): the first queue item plays, then the second, then playback stops; previous before and after 3 s.

## Review Triage Log

Pass 1 (quick lens): high 0, medium 2, low 3, false 0, maybe-false 0.

| Finding | Verdict | Route | Evidence / action |
|---|---|---|---|
| next/previous and auto-advance close PlayerModal | medium | patch | `playTrack` sets `isModalOpen: false`; modal renders `visible={isModalOpen}`. Patch: keep it for queue plays. |
| Concurrent steps skip items and desync device from server | medium | patch | `runStep` has no in-flight guard; second step's loadCounter check fails after the first `playTrack`. Patch: ignore a step while one is pending, test it. |
| Previous after a list tap steps the server back | low | patch | `previousAction` uses server `hasPrevious`, never `queueItemId`; matrix steps back only when a queue item plays. Patch: restart when `queueItemId` is null. |
| Queue loaded twice at start | low | patch | Mount effect and first connect both call `load()`. Patch: reload only on reconnect, ref as in `usePlaylistSocket`. |
| In-flight load after sign-out repopulates the store | low | reject | Real but needs sign-out during the request; the next login's load replaces it. Fix adds a generation guard. |
