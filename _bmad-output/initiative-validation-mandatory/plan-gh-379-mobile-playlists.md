---
title: 'Mobile : migrer la feature playlists (#379)'
type: 'refactor'
ticket: 'https://github.com/Elnop/music-room/issues/379'
created: '2026-10-22'
status: 'ready-to-ship'
baseline_revision: '33a477cfd087ef7d6995fb5d14d926bbb03b821e'
route: 'full'
route_source: 'auto'
risk: 'high'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 1
context: ['{project-root}/AGENTS.md', '{project-root}/docs/superpowers/specs/2026-10-21-clean-codebase-refactor-design.md', '{project-root}/.agents/rules/architecture.md', '{project-root}/.agents/rules/structure.md', '{project-root}/.agents/rules/state.md', '{project-root}/.agents/rules/logging.md', '{project-root}/.agents/rules/guardrails.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #379, epic #362. The `playlists` code of the mobile app is spread across the legacy technical folders (`screens/`, `components/`, `store/`, `hooks/`, `services/`, `api/`, `contexts/`, `utils/`). Its large files go far over 150 lines, it fetches server data by hand in Zustand stores, and it uses raw `TouchableOpacity` and hard-coded colours.

**Approach:**
- **Location:** move the feature into `src/features/playlists/` per `.agents/rules/structure.md` and `state.md`.
- **Components:** each non-trivial component splits into an orchestrator (wires hooks and stores, picks a presenter), presenters (props in, JSX out: no state, no effects, no stores, no requests) and hooks (logic and state, no JSX, an explicit return interface). Screens in `navigation/` render only an orchestrator.
- **Server data:** read it through TanStack Query hooks, using the key factory and cache profiles in `shared/query/`. Writes go through mutations, and socket events update the cache through `shared/query/socketCache`. Zustand stores keep only client state.
- **Shared primitives:** use `shared/components/ui` and the theme tokens.
- **Size and tests:** keep every file at 150 lines or fewer, and move the tests with the code.

## Boundaries & Constraints

**Always:**
- The user sees the same screens, texts, flows, loading, empty and error states, and realtime updates as on `develop`. The only allowed difference is the harmonised press feedback of the `Pressable` primitive.
- No import from another feature (`.agents/rules/architecture.md`).
  - When this feature needs something another feature owns, use an existing `shared/` contract, or compose at the `navigation/` level.
  - If neither exists, add the smallest neutral contract in `shared/`: a type, a store interface, or a callback prop.
  - Legacy, not-yet-migrated folders may still import this feature for now.
- Remove this feature's entries from every exception list, and add none: `guardrails/ui-primitives`, `theme-tokens`, `zustand-selector`, jscpd, depcruise and semgrep.
- `npm run check` passes in `mobile/`. Coverage of the moved code (`jest --coverage` on the old paths before, the new folder after) does not drop.
- API calls keep going through `shared/services/api.ts`, since the backend logs every app action (subject IV.6).
- A change to backend response types is mirrored in the feature's `types.ts`; the backend itself is untouched.

**Never:**
- Change a backend endpoint or a socket event.
- Restyle anything, or change copy.
- Migrate another feature's code beyond the contract it needs.

</frozen-after-approval>

## Code Map

- Screens: `screens/playlists/`: `PlaylistSharingScreen` (825 lines), `PlaylistDetailScreen` (415), `PlaylistsScreen` (423), `CreatePlaylistScreen` (310), `SearchTracksScreen` (198, adds tracks to a playlist). Navigation: `navigation/stacks/PlaylistsStack.tsx`.
- Components: `components/playlist/*` (`PlaylistHeader`, `PlaylistCard`, `PlaylistGridCard`, `PlaylistActionsSheet`, `PlayPlaylistButton`, `FriendPlaylistSection`).
- Data: `store/playlistStore.ts` (450) and `store/playlistSync.ts` (realtime merge) become TanStack queries and mutations, with `playlist:updated`/`details`/`deleted` applied to the cache. `api/playlistApi.ts` moves in. `hooks/usePlaylistSocket.ts` moves in, and `utils/playlistPermissions.ts` too. Keep the version-based concurrency rules of `doc/PLAYLIST_CONCURRENCY.md` (`tracksVersion`, rejecting stale states).
- **Track actions:** `components/track/TrackActionsButton` / `TrackActionsSheet` (285) are used by shared lists and touch both queue and playlists. This story removes the `shared-not-to-legacy` exception `shared/components/lists/SwipeableTrackItem.tsx → components/track/TrackActionsButton.tsx`: make `SwipeableTrackItem` take the actions through props or a render slot, and compose the sheet where the lists are used.
- Playing a playlist uses the player and queue features (#380/#381), which are not migrated yet. Call their current legacy modules through a `shared/` contract, or leave the call in a legacy orchestrator. Never import `features/player` or `features/queue` from here.
- Pattern and rules: `.agents/rules/structure.md` (mobile placement, `ui/` primitives), `state.md` (TanStack vs Zustand, keys, selectors), `architecture.md` (layers, no cross-feature imports). Shared building blocks: `src/shared/query/` (`queryClient`, `keys`, `socketCache`), `src/shared/components/ui/` (`Pressable`, `Button`, `Input`, `Card`…), `src/shared/theme/`.
- Exception entries to remove: `grep -n "<moved path>" mobile/eslint-suppressions.json mobile/.dependency-cruiser-known-violations.json mobile/.jscpd.json tools/semgrep/rules.yml`. Prune them with `npx eslint --prune-suppressions` and by regenerating the depcruise baseline.

## Tasks & Acceptance

**Execution:**
- [x] Record coverage of the files being moved -- baseline.
- [x] Create `src/features/playlists/`: server data through TanStack hooks, client stores, orchestrators, presenters and hooks; screens point to the orchestrators -- feature layout.
- [x] Delete the emptied legacy files; update importers -- no duplicate path.
- [x] Tests follow the code; prune the exceptions; update the docs that name the moved paths (`AGENTS.md`, `mobile/README.md`, `doc/`).

**Acceptance Criteria:**
- Given `src/features/playlists/`, then every file is 150 lines or fewer, presenters hold no state, effects, stores or requests, and no file imports another feature.
- Given the feature's flows in the jest suite, then they pass with the same visible behaviour (texts, states, navigation) as on `develop`.
- Given `npm run check` in `mobile/`, then it passes with fewer exception entries than on `develop`, and none for this feature's files.
- Given coverage of the moved code, then it is at least the baseline.

## Implementation Notes

- Coverage of the moved code: 55.5 % of lines (484/872) on `develop` (`screens/playlists/**`, `components/playlist/**`, `components/track/**`, `store/playlist*.ts`, `api/playlistApi.ts`, `hooks/usePlaylistSocket.ts`, `utils/playlistPermissions.ts`), 95.9 % on `src/features/playlists/**` plus the pieces moved to `shared/` after. Jest: 942 tests (927 on `develop`).
- Server data: `hooks/usePlaylistQueries.ts` (list, public, friends' playlists, detail) with `staleTime: STALE.none` and `retry: false`, refetched on each focus (`hooks/useRefetchOnFocus.ts`), as `develop` reloaded on focus and showed failures at once. Writes are mutations (`usePlaylistMutations.ts`, `useTrackEdits.ts`, the sharing members); the cache helpers live in `utils/playlistCache.ts`, the add/remove/move logic in `utils/trackEdits.ts` and `utils/trackMoves.ts` (move queue and version checks of `doc/PLAYLIST_CONCURRENCY.md` kept, « open playlist » = an active detail query). `playlist:updated`/`details`/`deleted` go through `socketCacheRule`s (`utils/playlistSocketRules.ts`); `hooks/usePlaylistRoom.ts` joins the room, reloads after a reconnect and reports a deletion. The only Zustand store left is `stores/pendingMovesStore.ts`.
- Player and queue (#380/#381): new shared contract `shared/services/playbackBridge.ts` (`usePlaylistPlayback`, `usePlayerHeight`, `addToQueue`, `playNext`, `playPlaylist`, `pause`, `resume`), registered by `navigation/playbackBridge.ts` on load of `AppNavigator` with `playerStore`/`queueStore`/`PlayerContext`. **#380/#381 re-register it from the migrated player and queue.**
- Friends and profile endpoints the feature reads (`/api/friends`, `/api/profile/:id`, `/api/profile/search`) are called from its own `services/usersApi.ts`; SoundCloud search for « Ajouter des titres » is `services/trackSearchApi.ts` on `queryKeys.search.tracks` (#385 can reuse the key).
- Moved to `shared/`: `TrackActionsButton` (`components/lists/`, removes the `shared-not-to-legacy` exception), `PreviewBadge` (`components/media/`), `useImageColors` (`hooks/`, used by the player too; its suppressions follow the rename), `moveTarget` (`utils/`), the share links (`utils/shareLinks.ts`, which breaks three navigation cycles). `TrackActionsSheet` is the feature's `trackActions/` orchestrator, still used by the legacy `QueueModal` and `SoundCloudSearchScreen`. The query cache is cleared at every end of session (`providers/AppProviders.tsx` subscribes `client.clear()` to `onSessionEnd`), since the playlist keys are not per user. New theme tokens `onColor`, `backdrop`, `shadow` in `FIXED_COLORS`. New `shared/theme/useThemedStyles.ts`.
- Exceptions: 14 ESLint suppression files (2 more renamed with `useImageColors`), 9 jscpd globs and 4 dependency-cruiser violations gone; none added.
- Visible differences: the harmonised press opacity; the avatar of a friend's playlist card no longer swallows the tap (it opens the playlist like the rest of the card); « Visibilité et droits » no longer shows its full-screen spinner again when it regains focus (it reloads in place); « Ajouter des titres » opens on its empty state instead of the results left in the search store shared with the Search tab (each search still asks the backend: `staleTime: STALE.none`). Dead code dropped: the unused per-member edit toggle of the sharing screen and `FriendPlaylistSection.onFriendPress`.
- Tests: `src/test/` gains `renderWithClient` (the app's real `createQueryClient()`), `fetchRoutes`, `session` (`signIn` through `registerAuthSession`, since tests outside auth may not import it) and `playlistFixtures`. `QueueModal` and `PlayerModal` tests mock the sheet, which now needs a QueryClient.

## Plan Change Log

## Review Triage Log

- Pass 1 (quick) — 6 findings (2 medium, 4 low), all accepted and patched:
  1. Query cache cleared on sign-out via `AppProviders.tsx` listening to `onSessionEnd`, tested in `AppProviders.test.tsx`.
  2. Search-tracks query configured with `staleTime: STALE.none` in `useSearchTracks.ts`.
  3. `playbackBridge` guards against unregistered calls and duplicate registrations in `playbackBridge.ts`, tested in `playbackBridge.test.ts`.
  4. Extracted shared contract types (`AddQueueItemBody`, `PlaybackState`) into `shared/types/playback.ts`.
  5. Corrected reorder description in `PLAYLIST_CONCURRENCY.md`.
  6. Split `PlaylistActionsSheet` into presenter (`PlaylistActionsView.tsx`) and orchestrator (`PlaylistActionsSheet.tsx`).
- Verification: `npm run check` passes in `mobile/`, `make test` passes (584 backend + 945 mobile tests), all files under 150 lines.

## Verification

**Commands:**
- `cd mobile && npm run check` -- expected: all OK.
- `find mobile/src/features/playlists -name '*.ts*' ! -name '*.test.*' | xargs wc -l | awk '$1>150'` -- expected: only the total line.

**Manual checks:**
- On the next `main` build, the feature's flows (listed in the PR) behave as before.

## Design Notes

- Session access: read the current user and token through `shared/services/authSession.ts` (`useSession(selector)`, `getSession()`), never `features/auth` (set by #378).
- #378 showed the shared query client's defaults (5-min `STALE.long`, 2 retries) can change visible loading/error behaviour. For each query, pick options that keep develop's behaviour (e.g. refetch on screen focus/mount where develop fetched on mount, `retry: false` where develop showed the error at once) and test with the app's real `createQueryClient()`, not a `retry:false` test client.
- An error toast that develop gated on focus/mount must stay gated (see `features/auth/form/hooks/useFocusedErrorToast.ts`).

### Pass 1 (quick) — high 0 / medium 2 / low 4 / false 0 / maybe-false 0

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| Query cache not cleared on sign-out: the next account sees the previous user's friends' playlists | medium | patch | Keys are not per user and the client is never cleared; fix globally with `queryClient.clear()` on `onSessionEnd`. |
| Search-tracks query served from a 30 s cache, unlike develop's search on every query | medium | patch | Use `staleTime: 0`. Opening on the empty state, instead of develop's leftover shared-store results, is accepted and recorded as a deliberate difference. |
| `playbackBridge` silently does nothing until registered (misleading toast); "register once" is not enforced | low | patch | Log or throw when unregistered; throw on a second registration. |
| The shared contract imports a legacy queue type and hand-copies `PlaybackState` | low | patch | Define both types in `shared/`. |
| `PLAYLIST_CONCURRENCY.md` describes up/down buttons | low | patch | The doc paragraph was edited in this diff but stayed wrong. |
| `PlaylistActionsSheet` is a presenter holding a hook, placed under `orchestrators/` | low | patch | Follow the `TrackActionsSheet` split. |
