---
title: 'Supprimer le code mort, backend et mobile (#363)'
type: 'refactor'
ticket: 'https://github.com/Elnop/music-room/issues/363'
created: '2026-10-21'
status: 'built'
baseline_revision: '43b98e0f1ae595ae907c3505dc57a4aaf8618fbf'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md', '{project-root}/docs/superpowers/specs/2026-10-21-clean-codebase-refactor-design.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #363, first story of epic #362. knip reports dead files, exports, types and dependencies in `backend/` and `mobile/`, and debug `console.log`s and a stale `TODO` remain. Dead code hides the real architecture before the refactor starts.

**Approach:** Delete what is really dead, verify each knip finding before acting on it, declare its false positives in a minimal `knip.json` per project so `npx knip` comes back clean, and commit the epic spec with this story.

## Boundaries & Constraints

**Always:**
- No behaviour change. The app builds and runs as before.
- Verify each finding with grep, the Makefile, `make/`, `scripts/`, the Dockerfiles and the app config before deleting it. If something is used outside TypeScript, keep it and declare it in `knip.json`.
- Change dependencies with `npm uninstall` / `npm install` and commit the lockfiles.
- When an export is unused but its symbol is used in its own file, drop only the `export`. When the symbol is used nowhere, delete it, along with its tests.

**Never:**
- Install knip as a dependency or wire it into the CI or a `check` script; that is #364.
- Replace `console.warn` / `console.error` or add a logger; that is #365. Only plain debug `console.log`s go.
- Refactor structure or rename anything beyond what deleting requires.
- Remove `uuid`: generating a UUID v4 stays with a library.

</frozen-after-approval>

## Code Map

Findings from `npx -y knip@5` (2026-10-21), already checked:

**Backend**
- Dead files: `src/features/mail/mail.types.ts` and `src/shared/types/database.types.ts`.
- **Keep** `src/test/perf-fixtures.ts` and `src/test/perf-socket.ts`: `make/perf.mk` runs them with `npx tsx`. Declare them as knip entries.
- Unused exports and types: knip's list. Includes the classes exported next to their instance (`MusicControlController`, `QueueController`, `BruteForceProtectionService`…), `socket-logger.middleware` helpers, `database.helpers` (`fetchMany`, `insertOne`, `recordExists`) and DTOs in `auth.types.ts`, `playlist.types.ts`, `friends.types.ts`, `music-control.types.ts`. Zod-inferred `*Input` types that nothing imports: drop them.
- `src/shared/config/supabase.ts:54`: `supabase` is an alias of `supabaseAdmin`. Keep one name and update its importers.
- Unused devDependencies: `@types/ioredis`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-plugin-prettier`. **Keep** `supabase`: `make/supabase.mk` runs `npx supabase`. Declare it in `ignoreDependencies`.

**Mobile**
- Dead files: `src/hooks/usePlayerSync.ts`, `src/components/playlist/TrackItem.tsx`, `src/components/playlist/AddTrackButton.tsx`, `src/components/music-control/DeviceListeningCard.tsx`, `src/types/api.types.ts`, `plugins/withAndroidNetworkSecurity.js`.
- `app.json` is dead: `app.config.js` exports a static object, and `npx expo config` shows the resolved config ignores `app.json` (targetSdk 34, no `withJvmTarget`). Delete `app.json` and `plugins/withJvmTarget.js`, then check that `npx expo config --json` is unchanged apart from `_internal.staticConfigPath`.
- **Keep** `babel.config.js` (`module-resolver` and the reanimated plugin), `plugins/withDebugKeystore.js` and `plugins/withMedia3Version.js` (used in `app.config.js`). Declare them in knip.
- Dependencies to remove: `axios`, `expo-secure-store` (no code usage; also drop its entry from `app.config.js` `plugins`), `react-native-swipeable-item`, `expo-web-browser`, `react-dom` (check that `web` is not used by any make target; if it is, keep it and declare it), `@expo/config-plugins` (check the `plugins/*.js` requires; keep it if they use it), `lodash` and `@types/lodash`. Also devDependencies `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser`.
- **Keep** `@expo/ngrok` (tunnel mode: `scripts/start-expo-tunnel.sh` and the Dockerfiles), `babel-plugin-module-resolver` and `babel-preset-expo`. Declare them.
- Add `expo-constants`: it is imported by `services/api.ts`, `deviceService.ts` and `oauth.ts` without being declared. Use `npx expo install expo-constants` so the version is SDK-aligned.
- `lodash/debounce` is used in `SearchTracksScreen`, `PlaylistSharingScreen`, `FriendsScreen` and `SoundCloudSearchScreen`. Replace it with `src/utils/debounce.ts`, which must keep the `.cancel()` the screens rely on (check their usage).
- Unused exports and types: knip's list (`constants/index.ts` `SUPABASE_CONFIG`, `APP_CONFIG`, `COLORS`, `FONT_SIZES`; `oauth.ts` `signOutGoogle`, `isSignedIn`…; timing constants exported only for tests: keep them if a test imports them, since knip ignores tests by default; check).
- `src/store/authStore.ts:447`: `updateProfile` is a placeholder (`TODO` at l.456) that no screen calls (EditProfileScreen uses `profileApi.updateProfile`). Delete the action and its type entry. Scan the other stores' actions for callers in the same way.
- Debug `console.log`s: `authStore.ts` (l.629–688), `RootNavigator.tsx` (l.64, 94), `socketStore.ts`, `services/api.ts` (l.132–158). Find the rest with `grep -rn "console.log" src`.

## Tasks & Acceptance

**Execution:**
- [x] `docs/superpowers/specs/2026-10-21-clean-codebase-refactor-design.md` -- commit as is -- the epic spec ships with its first story.
- [x] `backend/` -- delete dead files, exports, types and the `supabase` alias; uninstall the dead devDependencies; add `knip.json` (entries `src/server.ts` and `src/test/perf-*.ts`, ignore `supabase`) -- clean backend.
- [x] `mobile/` -- delete dead files, `app.json` and `withJvmTarget.js`; adjust dependencies as mapped; add `src/utils/debounce.ts` and its test and switch the four screens to it; delete `authStore.updateProfile` and any other uncalled store action; add `knip.json` declaring the kept config files and dependencies -- clean mobile.
- [x] `backend/src`, `mobile/src` -- remove debug `console.log`s and the stale `TODO`s -- noise removal.
- [x] `mobile/README.md`, `backend/README.md`, `doc/` -- remove mentions of deleted files and dependencies -- keep the docs true.

**Acceptance Criteria:**
- Given a clean clone, when `make install` runs, then it succeeds with the updated lockfiles.
- Given `backend/` and `mobile/`, when `npx -y knip@5` runs, then it reports nothing.
- Given the change, when `make test`, `npm run lint` and `npm run type-check` run in both projects, then all pass.
- Given the mobile app, when `npx expo config --json` runs, then the resolved config matches the baseline except for `expo-secure-store` and `_internal`.
- Given a native debug build, when the user searches tracks, searches friends and shares a playlist, then the debounced search still works.

## Implementation Notes

- Backend `knip.json`: knip flagged `src/server.ts` as a redundant entry (found from `package.json`), so only `src/test/perf-*.ts` is declared. `supabase.generated.ts` is in `ignore` (never hand-edited).
- `supabase` alias: `supabaseAdmin` kept; 17 services and the test mocks moved to it; `doc/THREAT_MODEL.md` updated.
- Mobile: knip also flagged `expo-linking` (no usage) — removed; it flagged `expo-updates` as unlisted (expo plugin inference, not used) and the `expo-doctor` binary — declared in `knip.json`. `@expo/config-plugins` kept (required by the kept plugins). `react-dom` removed: no make target uses web; npm still installs it as a peer of `react-native-web`.
- `app.json` deletion: `scripts/setup-eas-auto.sh` read `projectId` from `app.json`; it now reads `app.config.js`. `npx expo config --json` differs only by `expo-secure-store` and `_internal`.
- Store scan: besides `authStore.updateProfile`, `playlistStore.clearCurrentPlaylist` had no caller outside tests; removed, its tests use `setState`.
- All mobile `console.log`s were debug traces and are gone, as are the `jest.spyOn(console, 'log')` silencers. Follow-ups of that removal: `fetchStreamUrl`'s `purpose` param (only labelled the log), the log-only `reconnect` Manager listener (and its test expectation), the unused iOS `AuthenticationToken` read in `oauth.ts`.
- Not touched (out of scope): stale TODO in `backend/eslint.config.js` pointing to a missing `SUPABASE_TYPES_MIGRATION.md`; 9 pre-existing mobile lint warnings (unused locals in auth/sharing screens).

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd backend && npx -y knip@5 && npm run lint && npm run type-check && npm test` -- expected: knip reports nothing, all green.
- `cd mobile && npx -y knip@5 && npm run lint && npm run type-check && npm test` -- expected: knip reports nothing, all green.
- `cd mobile && npx expo config --json` -- expected: same as before, minus `expo-secure-store`.
- `grep -rn "console.log" backend/src mobile/src --include='*.ts' --include='*.tsx' | grep -v test` -- expected: only intended output remains (server startup, CLI scripts such as `src/test/perf-*.ts`), no debug traces.

**Manual checks:**
- Native Android debug build (`cd mobile && npx expo run:android`) starts. Login, search with debounce and playback work. Listed in the PR for the user's `main` build pass.

### Pass 1 (quick) — high 0 / medium 0 / low 1 / false 0 / maybe-false 0

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| `playerStore.setLoading`, `setError` and `playlistStore.clearError` have no caller outside tests, against the "any other uncalled store action" task | low | patch | Grep found no `usePlayerStore`/`getState` read of `setLoading`/`setError` and no `usePlaylistStore` read of `clearError`; the other `clearError` calls read authStore, playerStore and soundcloudStore. Sent to the implementer: delete the three actions and their tests. |
