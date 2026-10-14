---
title: 'Queue de lecture : bouton Play/Pause flottant pour jouer une playlist (mobile de #277)'
type: 'feature'
ticket: 'gh-277'
created: '2026-10-13'
status: 'built'
baseline_revision: '5a18875ecc1f4d3934b992faa37261f53200305d'
route: 'full'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/initiative-validation-mandatory/plan-gh-274-queue-store-mobile.md', '{project-root}/_bmad-output/initiative-validation-mandatory/plan-gh-277-play-playlist-backend.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The backend can play a playlist through the queue (`POST /api/queue/playlists/:playlistId/play`, merged in #286), but the app has no way to trigger it.

**Approach:** A floating round Play button fixed at the bottom right of the playlist detail screen, above the mini player. It plays the playlist through the queue; while this device plays an item that came from this playlist, it becomes Pause, and Play again resumes. This PR closes #277.

## Boundaries & Constraints

**Always:** the call goes through `queueStore` → `queueApi` → `apiRequest`; the returned state is applied and its current item plays on this device through the same in-flight guard as next/previous (#274); the button sits above the mini player (`usePlayerHeight`) and the tab bar, and the list's bottom padding leaves room for it; error toasts in French.

**Never:** backend changes; playlist → queue sync (#278); any change to the mini player or queue screen.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Play, empty queue | tap Play | playlist plays from its first track | — |
| Play, non-empty queue | tap Play, another track playing | the playlist's first track replaces it; the old upcoming items come after the block | — |
| Playing this playlist | `playerStore.queueItemId` is an item whose `sourcePlaylistId` is this playlist, playing | button shows Pause; tap pauses | — |
| Paused on this playlist | same item, paused | button shows Play; tap resumes, no request | — |
| Another playlist / list tap playing | current audio not from this playlist | button shows Play; tap plays this playlist | — |
| Empty playlist | no track | button hidden | 409 `PLAYLIST_EMPTY` (race) → error toast |
| No access / deleted | 403 / 404 | nothing plays | error toast |
| Double tap | second tap while the request runs | ignored | — |
| Mini player hidden / shown | nothing playing / something playing | button stays above the mini player and tab bar | — |

</frozen-after-approval>

## Code Map

- `mobile/src/screens/playlists/PlaylistDetailScreen.tsx` -- `usePlayerHeight()` (line ~52), list `contentContainerStyle` padding (line ~238); render the button here, over the list.
- `mobile/src/contexts/PlayerContext.tsx` -- `usePlayerHeight` (MINI_PLAYER_HEIGHT when a track is loaded).
- `mobile/src/store/queueStore.ts` -- `runStep` + `asStep` (in-flight guard, plays the new current item), `playItem` as the model for a `playPlaylist` action.
- `mobile/src/services/queueApi.ts` -- add `playPlaylist(playlistId)`.
- `mobile/src/store/playerStore.ts` -- `queueItemId`, `playbackState`, `pause()`, `resume()`.
- Backend contract: `backend/src/features/queue/queue.openapi.ts` (`/api/queue/playlists/{playlistId}/play`).

## Tasks & Acceptance

**Execution:**
- [x] `mobile/src/services/queueApi.ts` -- `playPlaylist(playlistId)`.
- [x] `mobile/src/store/queueStore.ts` -- `playPlaylist(playlistId)` through `runStep`; a selector telling whether this device plays an item of a given playlist.
- [x] `mobile/src/components/playlist/PlayPlaylistButton.tsx` -- the floating button per the matrix.
- [x] `mobile/src/screens/playlists/PlaylistDetailScreen.tsx` -- render it (hidden for an empty playlist), extra bottom padding.
- [x] Tests: `queueStore.test.ts` (playPlaylist success plays the first block item, error toast, ignored while pending, selector), a render test of the button (Play / Pause states, hidden when empty).

**Acceptance Criteria:**
- Given the native debug build, when tapping Play on a playlist with something else playing, then the playlist's first track plays, and after the block the previous upcoming items play.

## Verification

**Commands:**
- `cd mobile && npm run type-check && npm run lint` -- expected: clean, no new warning
- `cd mobile && npm test` -- expected: green

**Manual checks (if no CLI):**
- Native debug build: play a playlist with an empty and a non-empty queue; pause and resume from the button; check the button never covers the mini player.

## Review Triage Log

Pass 1 (quick lens): no unmet AC, rule or bug; 4 minor points, all low, all rejected.

| Finding | Verdict | Route | Evidence / action |
|---|---|---|---|
| After `setError`, the button shows Play and a tap queues the playlist again | low | reject | Stream failures go through `setTrackUnavailableError`, which clears `queueItemId`; `setError` with a kept item is rare. |
| Button disabled with a spinner while this playlist's item loads | low | reject | Pausing does nothing while loading; deliberate. |
| "Une action est déjà en cours" toast not covered by a button test | low | reject | Store tests cover the `'ignored'` outcome. |
| Long JSDoc line in `queueStore.ts` | low | reject | Cosmetic; Prettier and lint pass. |
