---
title: 'Tirer pour rafraîchir et squelettes de chargement (#317)'
type: 'feature'
ticket: ''
created: '2026-10-16'
status: 'built'
baseline_revision: '55c96a1c8d2a4716ade346186db7b42c8008a70a'
route: 'full'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Only PlaylistsScreen (and Profile) can be pulled to refresh; playlist detail, friends, my devices and search cannot. First loads show a full-screen `LoadingSpinner`, so the layout jumps when the content arrives.

**Approach:** Add a `RefreshControl` to each listed list, wired to the screen's existing load function, and replace the first-load spinner of those screens with skeletons shaped like their content (track rows, playlist cards, user/avatar rows), built from one skeleton component in `components/common/`.

## Boundaries & Constraints

**Always:** pull-to-refresh reuses the screen's existing load/fetch function and shows the theme's primary colour; a refresh never replaces the list by skeletons or a spinner (content stays while refreshing); skeletons only on the first load (no data yet); skeleton colours from the theme; the skeleton pulses, and stays static when the OS asks to reduce motion (`AccessibilityInfo.isReduceMotionEnabled`); a skeleton block is hidden from screen readers and the skeleton list announces « Chargement » once (`accessibilityRole="progressbar"` or label + `busy`).

**Never:** no new dependency (RN `Animated` or the already-installed reanimated); spinners on buttons and short actions stay (`Button`, `PlayPlaylistButton`, `MiniPlayer`, `PlayerModal`, `TrackItem`, sheets); screens not listed (auth, settings, sharing, linked accounts, privacy, music preferences, user profile, `RootNavigator`) keep their spinner.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First load | screen opens, no data yet | skeletons, no spinner | load failure keeps today's failure state |
| Pull to refresh | data shown, user pulls | refresh indicator, data reloaded in place | failure: today's error toast, data kept, indicator stops |
| Search tab pull | SoundCloud / friends search with a query | reruns the current query | empty query: refresh ends at once, nothing fetched |
| Reduce motion on | OS setting | static skeletons | — |

</frozen-after-approval>

## Code Map

All under `mobile/src/`.
- `components/common/LoadingSpinner.tsx` -- current full-screen loader; keep it.
- `components/common/EmptyState.tsx` / `AppToast.tsx` -- style references for theme usage (`useTheme`, `createStyles(theme)`).
- `screens/playlists/PlaylistsScreen.tsx` -- `RefreshControl` already at l.308 (`isRefreshing`, `handleRefresh`); full-screen spinner at l.158 (`isLoading && playlists.length === 0`) and section spinners at l.184 (friends) and l.278 (public) → playlist-card skeletons.
- `screens/playlists/PlaylistDetailScreen.tsx` -- `loadPlaylist` (l.100, `fetchPlaylistById`), spinners at l.185 and l.207 (`isLoading && !currentPlaylist`) → header + track-row skeletons; list is `components/common/ReorderableList.tsx`, whose `PassThroughProps` (l.19) must also pass `refreshControl` to `react-native-reorderable-list` (check that library forwards it to its FlatList; if not, use its `onRefresh`/`refreshing` props).
- `screens/friends/FriendsScreen.tsx` -- `loadFriends(silent)` (l.49) and `loadPermissions` (l.73); `performSearch` (l.117); spinners at l.266 (friends) and l.292 (search) → user-row skeletons; FlatLists at l.270/l.299.
- `screens/profile/MyDevicesScreen.tsx` -- one-shot `load` inside `useEffect` (l.68): extract it into a `useCallback` so refresh can call it without the full-screen state; spinner at l.128 → device/friend-row skeletons; `ScrollView` at l.212.
- `screens/search/SoundCloudSearchScreen.tsx` -- store `search(query)`, `isSearching`; spinner at l.76 → track-row skeletons; FlatList at l.78.
- `screens/playlists/SearchTracksScreen.tsx` -- spinner at l.201 → track-row skeletons (same search pattern; no refresh needed).

## Tasks & Acceptance

**Execution:**
- [x] `components/common/Skeleton.tsx` -- `SkeletonBlock` (width/height/radius, pulse, reduce-motion aware) plus presets `TrackRowSkeleton`, `PlaylistCardSkeleton`, `UserRowSkeleton` and a `SkeletonList` (`count`, `row`, single « Chargement » announcement).
- [x] `components/common/Skeleton.test.tsx` -- jest-expo: renders the requested number of rows, announces « Chargement » once, blocks hidden from accessibility, static when reduce motion is on.
- [x] `components/common/ReorderableList.tsx` -- pass `refreshControl` through.
- [x] The five screens in the Code Map (+ SearchTracksScreen skeleton only) -- `RefreshControl` wired to their load function with a local `isRefreshing`; first-load spinners replaced by skeletons.
- [x] Update screen tests that assert the old spinner / loading text; add one refresh test on a screen that has a test file (e.g. `MyDevicesScreen.test.tsx`: pulling calls the loaders again and keeps the list).

**Acceptance Criteria:**
- Given playlists, playlist detail, friends, my devices or search showing a list, when the user pulls down, then the list reloads in place.
- Given one of these screens opening without data, then skeletons shaped like its content show, not a spinner.

## Implementation Notes

- `react-native-reorderable-list` spreads its remaining props onto its FlatList, so `refreshControl` passes straight through.
- `SkeletonList` takes an optional `header` (playlist detail cover/title placeholder) inside the single « Chargement » announcement.
- Reduce motion starts as unknown (`null`): nothing pulses until the OS answers, so a reduced-motion user never sees a first pulse.
- Search screens: skeletons are skipped while a pull-refresh runs (`!isRefreshing`), so a refresh never swaps the list for skeletons.
- PlaylistsScreen `handleRefresh` now stops the indicator in `finally` (it stayed on forever when `fetchPlaylists` rejected).
- PlaylistDetail: a failed pull-refresh shows the toast « Impossible de charger la playlist » and keeps the tracks; MyDevices: a failed refresh keeps the list and shows the existing load toast; its failure screen is now pullable too.

## Plan Change Log

## Review Triage Log

Pass 1 (quick) — high 0, medium 3, low 3, false 1, maybe-false 0.

| Finding | Verdict | Route | Evidence / action |
|---|---|---|---|
| SoundCloud refresh failure empties results (store catch resets `searchResults`) | medium | patch | Breaks matrix "data kept". Patched: `keepResultsOnError` option on `search`, store test added. |
| Friends search refresh failure clears results | medium | patch | Same matrix row. Patched: `performSearch(query, isRefresh)` keeps results on refresh failure. |
| PlaylistsScreen first-load skeleton is a plain grid, unlike the sectioned layout | medium | patch | Layout still jumped. Patched: section titles + 140px carousel + grid. |
| One `isRefreshing` drives both Friends lists | low | patch | Both render when `!hasFriends`. Patched: one flag per list. |
| PlaylistsScreen RefreshControl lacks Android `colors` | low | patch | Patched. |
| PlaylistsScreen refresh failure only logged | low | patch | Patched: error toast through `apiErrorMessage`. |
| One reduce-motion query, listener and loop per skeleton block | false | reject | No user-visible failure; ~27 cheap listeners on a loading screen; fix is a refactor, not a correction. |

## Verification

**Commands:**
- `cd mobile && npm test` -- expected: all suites pass
- `cd mobile && npm run type-check && npm run lint` -- expected: no errors
