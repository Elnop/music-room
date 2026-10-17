---
title: 'Irritants UX des playlists (#307, groupe « Playlists »)'
type: 'bugfix'
ticket: 'https://github.com/Elnop/music-room/issues/307'
created: '2026-10-17'
status: 'built'
baseline_revision: '9642788df54448820416506a13ce5b589dbdfcd7'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Audit #307, section « Playlists »:
1. Empty mini player: its play button looks active but does nothing.
2. The mini player's « Piste suivante » icon touches the right edge.
3. The floating Play button of a playlist (#277) hides a track's duration and `⋯`, and doubles the mini player's play button just below.
4. The playing track is not highlighted in the playlist (it is in the queue).
5. My playlist shows my avatar as « ? » and two add buttons (« Ajouter un titre » and « Ajouter des titres »).
6. Switches that are off are almost invisible.
7. On « Ajouter des titres », the « + » shows nothing during the ~1 s call.
8. « Lire ensuite » / « Ajouter à la queue » showed no visible confirmation, and « queue » should read « file d'attente ».

**Approach:**
1. The empty mini player's play button gets a neutral background, not the primary color.
2. The mini player gets right padding.
3. The Play/Pause button moves into the playlist header, next to the track count, and scrolls with the list. Its behaviour (#277) is unchanged (user's decision, 2026-10-17).
4. The playlist row of the playing track is highlighted the way the queue highlights its current item.
5. The avatar falls back to the username. When the playlist is empty, the empty state drops its add action and keeps the header's.
6. A shared themed switch makes the off state visible, used by every switch in the app.
7. The add list re-renders while a track is being added, so its spinner shows.
8. The queue wording becomes « file d'attente » everywhere. The existing success toasts are checked on device.

## Boundaries & Constraints

**Always:** French UI text, formal register (#341). The Play button keeps everything #277 gives it: it plays the playlist as a queue block, pauses and resumes that block without a request, guards double taps, and hides when the playlist is empty. The current-track match uses the playing track's SoundCloud permalink against the row's `trackUri`, and only when what plays comes from this playlist. The match is by URI, so a track listed twice lights up twice.

**Never:** Changing queue or player logic, endpoints, or toasts other than their wording. Translating unrelated English labels (#341).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Highlight on | Track of this playlist playing from its queue block | That row's title in the primary color, with a speaker icon | No error expected |
| Highlight off | Same track playing from search or another playlist | No row highlighted | No error expected |
| Avatar | Owner without display name | Initials from the username | No error expected |
| Empty playlist, editor | No tracks, user can edit | One add button (header), empty state without action | No error expected |
| Empty playlist, viewer | No tracks, read-only | No add button | No error expected |
| Adding | « + » pressed | Spinner in that row until the call ends, then a check | Error toast as today |

</frozen-after-approval>

## Code Map

- `mobile/src/components/player/MiniPlayer.tsx` -- `playButton` style (l.~284) always `primary`; give it `surfaceAlt` when `!track`. `content` padding (l.~251) → add `paddingRight: theme.spacing.md`.
- `mobile/src/components/playlist/PlayPlaylistButton.tsx` -- floating (`position: 'absolute'`, `bottom: playerHeight + …`). Make it an inline round button (drop absolute positioning and `usePlayerHeight`); keep logic, labels, `trackCount === 0 → null`. `PLAY_PLAYLIST_BUTTON_SIZE` stays exported only if still used.
- `mobile/src/components/playlist/PlaylistHeader.tsx` -- renders the meta row (l.36–43); add the Play button there (right-aligned on that row or just below it). Avatar `name` (l.37) → `displayName || username`.
- `mobile/src/screens/playlists/PlaylistDetailScreen.tsx` -- renders `<PlayPlaylistButton>` (l.~304) and adds `PLAY_PLAYLIST_BUTTON_SIZE` to the list's bottom padding (l.~283): remove both. `ListEmptyComponent` action (l.~290) → none. Passes `isCurrent` to `SwipeableTrackItem`. Its test mocks `PlayPlaylistButton`: update the mock.
- `mobile/src/components/common/SwipeableTrackItem.tsx` -- new optional `isCurrent` prop; style like `QueueItemRow` (`rowCurrent`, `trackTitleCurrent`, `volume-high` icon, `accessibilityState.selected`).
- `mobile/src/store/playerStore.ts` -- `currentTrack.permalink_url`, `queueItemId`. `mobile/src/store/queueSelectors.ts` -- `selectPlaysPlaylist(queue, queueItemId, playlistId)`, `useActiveQueue()` from `queueStore`. Reuse; no change.
- `mobile/src/components/common/` -- new `ThemedSwitch.tsx`: RN `Switch` with off track `surfaceAlt`, off thumb `textSecondary`, on track `primary`, on thumb white, `ios_backgroundColor`. Replace the six `<Switch>` uses: `CreatePlaylistScreen.tsx` (×2, l.160/179), `PlaylistSharingScreen.tsx` (×2, l.~430/461), `FriendsScreen.tsx` (l.~235), `MyDevicesScreen.tsx` (l.~220).
- `mobile/src/screens/playlists/SearchTracksScreen.tsx` -- `FlatList` (l.203) lacks `extraData`; pass `addingTrackId` and `addedTrackUris`.
- `mobile/src/components/track/TrackActionsSheet.tsx` l.199 « Ajouter à la queue », `mobile/src/store/queueStore.ts` l.297 « Ajouté à la file de lecture », and the other « la queue » / « file de lecture » strings in `src/` → « file d'attente ». Update tests that assert them.

## Tasks & Acceptance

**Execution:**
- [x] `MiniPlayer.tsx` -- neutral play button when empty; right padding.
- [x] `PlayPlaylistButton.tsx`, `PlaylistHeader.tsx`, `PlaylistDetailScreen.tsx` (+ test) -- Play button in the header; floating one and its padding removed; avatar fallback; empty state without action.
- [x] `SwipeableTrackItem.tsx`, `PlaylistDetailScreen.tsx` -- `isCurrent` highlight; test the I/O rows « Highlight on/off ».
- [x] `ThemedSwitch.tsx` + the six screens -- shared switch.
- [x] `SearchTracksScreen.tsx` -- `extraData`.
- [x] Queue wording across `src/` (+ tests).

**Acceptance Criteria:**
- Given nothing is playing, when the mini player shows, then its play button looks disabled (not the primary color).
- Given a playlist with tracks, when it opens, then no floating button covers a row, and Play/Pause sits in the header and works as before.
- Given a track sheet, when « Ajouter à la file d'attente » is tapped, then the toast « Ajouté à la file d'attente » shows.

## Verification

**Commands:**
- `cd mobile && npm test && npm run type-check && npm run lint` -- expected: all pass, no new lint error.

**Manual checks (if no CLI):**
- At the `main` acceptance pass: mini player empty and right edge, header Play button, highlighted row, switches off, « + » spinner, queue toasts visible after the sheet closes.

## Implementation Notes

The audit's missing queue confirmation is not explained by the code: `queueStore.addItem`/`playNext` already toast « Ajouté à la file de lecture » / « Lira ensuite ». Only the wording changes here; the visibility is checked on device.

Matrix audit (orchestrator): the « Empty playlist, viewer » and « Adding » rows had no test; the implementer added `SearchTracksScreen.test.tsx` and a viewer case in `PlaylistHeader.test.tsx`.

## Plan Change Log

## Review Triage Log

Quick review, pass 1: 5 findings, medium 3, low 1, maybe-false 1. Four patched, one deferred.

- maybe-false, deferred: the « + » feedback. `extraData` is harmless but probably not the fix: RN FlatList outside `strictMode` rebuilds its renderer every render (`FlatList.js` l.683), so rows already re-rendered and the existing spinner should show. The real cause is unknown; the new test passes with or without `extraData`. Entry added to `deferred-work.md`, with an on-device check.
- medium, patched: the header meta row could push the Play button off screen with a long owner name. The owner text now truncates on one line.
- medium, patched: the empty mini player's white icon at 0.35 opacity on `surfaceAlt` vanished on the light themes. With no track it now uses `textSecondary`.
- medium, patched: the switch's off track `surfaceAlt` barely differed from its surfaces. It now uses `borderLight`, with a white thumb.
- low, patched: a screen test named for the header's add button only checked the empty state (header mocked). Renamed.
