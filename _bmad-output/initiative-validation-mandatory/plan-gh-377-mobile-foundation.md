---
title: 'Mobile : socle features/shared, primitives UI et TanStack Query (#377)'
type: 'refactor'
ticket: 'https://github.com/Elnop/music-room/issues/377'
created: '2026-10-22'
status: 'built'
baseline_revision: '1ddc03306a6b0673930b962f7fd1678d270f7c90'
route: 'full'
route_source: 'auto'
risk: 'high'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md', '{project-root}/docs/superpowers/specs/2026-10-21-clean-codebase-refactor-design.md', '{project-root}/.agents/rules/architecture.md', '{project-root}/.agents/rules/structure.md', '{project-root}/.agents/rules/logging.md', '{project-root}/.agents/rules/guardrails.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #377, epic #362. The mobile code is organised by technical kind (`components/`, `screens/`, `store/`, `hooks/`, `services/`, `api/`, `contexts/`, `utils/`, `themes/`, `constants/`). It imports through ten aliases and `../` paths: 305 ESLint suppressions. There is no shared design-system layer: `TouchableOpacity` and `Pressable` are used raw in 37 files, with opacities that vary. Server data is fetched and cached by hand in Zustand stores. The feature migrations (#378–#385) need a target to move into.

**Approach:**
- Create the target layout of the spec: `src/shared/`, `src/providers/` and `src/features/`, with `navigation/` kept.
- Move the code that is already shared into `shared/`: the API client, socket, storage, theme, constants, utils and the generic components. Feature code stays where it is for #378–#385.
- Rewrite every import to `@/`, and drop the other aliases.
- Add the UI primitives: a house `Pressable` and `Button`, plus `Input` and `Text`.
- Install TanStack Query: provider, query-key factory, named cache profiles, and the helper that applies Socket.io events to the cache.
- Add lint rules for the primitives, the theme tokens and the Zustand selectors.

## Boundaries & Constraints

**Always:**
- The app looks and behaves the same, apart from the harmonised press opacity of the new `Pressable` where it is adopted. Every moved file keeps its behaviour, and the jest suite passes.
- After this story, `@/` is the only alias (tsconfig, babel `module-resolver`, jest `moduleNameMapper` and ESLint). No `../` import leaves its folder. The `no-restricted-imports` suppressions this fixes go away.
- The new rules point to their `.agents/rules/*.md` section. The files that violate them today are recorded as exceptions that #378–#385 will remove; this is the only story allowed to add exception entries, and only for these new rules:
  - **Primitives:** `TouchableOpacity`, and `Pressable` from `react-native`, are only allowed in `shared/components/ui/`.
  - **Tokens:** no colour literals (hex, `rgb(`, named colours) outside `shared/theme/`.
  - **Selectors:** a Zustand store hook is always called with a selector.
- TanStack Query is wired in but no feature is migrated to it here. The provider, key factory, cache profiles and socket bridge come with tests.
- Dependencies are installed with `npx expo install` where Expo pins a version. Write the lockfile with npm 10 (AGENTS.md).
- Mobile `npm run check` is green; the backend is untouched.

**Never:**
- Migrate a feature (screens, feature stores, feature components): that is #378–#385.
- Restyle anything beyond the primitives.
- Use NativeWind or Expo Router (epic decision).

</frozen-after-approval>

## Code Map

- Aliases:
  - `mobile/tsconfig.json` `paths` (`@api`, `@components`, `@screens`, `@services`, `@store`, `@hooks`, `@utils`, `@constants`, `@contexts`, `@themes`);
  - `mobile/babel.config.js` `module-resolver` aliases;
  - the jest config in `mobile/package.json` (`moduleNameMapper`, if any).

  Keep `@/*` only. A codemod (ts-morph, or a careful script) rewrites the imports. Then prune with `npx eslint --prune-suppressions`.
- `mobile/eslint.config.mjs` -- the `no-restricted-imports` rule already bans `../` and the old aliases. Add:
  - `react-native` `TouchableOpacity`/`Pressable` (outside `src/shared/components/ui/`);
  - a colour-literal rule, through `no-restricted-syntax` or ast-grep (outside `src/shared/theme/`);
  - a Zustand selector rule (a call `useXStore()` with no argument), through `no-restricted-syntax` on `CallExpression[callee.name=/^use\w+Store$/][arguments.length=0]`.

  Each rule message ends with `See .agents/rules/<file>.md#<anchor>`. Record the current violations with `eslint --suppress-rule <rule>` (or the semgrep/ast-grep exception list) so the check stays green.
- Moves into `shared/` (update importers and move the tests along):
  - `src/services/api.ts`, `backendUrl.ts`, `lastTrackStorage.ts` → `src/shared/services/`. The feature APIs (`friendsApi`, `profileApi`, `privacyApi`, `queueApi`, `musicControlApi`, `deviceService`, `listeningRooms`, `oauth`, and `src/api/playlistApi.ts`) stay until their feature story. Delete `src/api/` only if it ends up empty.
  - `src/store/socketStore.ts` → `src/shared/stores/` (cross-cutting).
  - `src/themes/*` and `src/contexts/ThemeContext.tsx` → `src/shared/theme/`. `src/components/theme/ThemeSelector.tsx` → `src/shared/components/theme/`.
  - `src/constants/index.ts` → `src/shared/constants/app.ts`. This removes the `index.ts` exception.
  - `src/utils/*` → `src/shared/utils/`. Feature-specific utils such as `playlistPermissions` or `remotePosition` may stay for their feature; decide per file and note it.
  - `src/components/common/*`:
    - primitives (`Button`, `Input`, `Card`, `Skeleton`, `ThemedSwitch`, `LoadingSpinner`) → `src/shared/components/ui/`;
    - shared blocks (`AppToast`, `Artwork`, `Avatar`, `ConnectionBanner`, `EmptyState`, `ErrorBoundary`, `FormError`, `SearchBar`, `ReorderableList`, `Swipeable*`, `QueueSwipe`, `ShareLinkButton`, `ThemedSystemUI`, `BackendUrlField`) → `src/shared/components/<subject>/`.
  - `src/contexts/PlayerContext.tsx` stays: it belongs to the player feature (#380).
- New:
  - `src/shared/components/ui/Pressable.tsx`: opacity, haptics through `shared/utils/haptics`, a default accessibility role, and `accessibilityLabel` required by its type. Rebase `Button` on it. Add `Text.tsx` (themed typography) only if it is used; otherwise defer it (YAGNI) and note that.
  - `src/shared/query/`: `queryClient.ts` (named cache profiles, e.g. `STALE.short` and `STALE.long`), `keys.ts` (a typed factory per domain), and `socketCache.ts` (a helper that applies a socket payload to a query: `setQueryData` or invalidate).
  - `src/providers/AppProviders.tsx`: composes `QueryClientProvider`, the theme and the existing providers. `App.tsx` uses it.
- Install `@tanstack/react-query`. Add `expo-image` only if a primitive needs it; otherwise don't.
- `.dependency-cruiser.cjs` -- the target rules exist already. Add: `shared` must not import the legacy feature folders (`src/store/`, `src/screens/`, `src/hooks/`, `src/components/<feature>/`) except through the exceptions file, and `navigation` must not be imported by `shared`.
- Docs: `.agents/rules/structure.md` (mobile placement and the `ui/` primitives) and `architecture.md` (mobile layers); add `.agents/rules/state.md` (TanStack for server data, Zustand for client state, the key factory, selectors). Update `AGENTS.md` (mobile paths: `mobile/src/shared/services/api.ts`, `socketStore` location) and `mobile/README.md`.

## Tasks & Acceptance

**Execution:**
- [x] Rewrite the imports to `@/`; drop the other aliases; prune the suppressions.
- [x] Moves into `shared/` and `providers/`, with their tests.
- [x] Primitives `Pressable`/`Button` (+ `Input`); adopt them inside `shared/` itself.
- [x] TanStack Query: install it, add the provider, keys, profiles and socket helper, with tests.
- [x] New lint rules with their `.agents/rules` sections and the recorded exceptions.
- [x] Docs.

**Acceptance Criteria:**
- Given `mobile/`, when grepping imports, then no alias other than `@/` and no `../` remains, and `eslint-suppressions.json` has no `no-restricted-imports` entries left.
- Given `src/shared/`, then nothing in it imports `src/features/`, `src/navigation/` or the legacy feature folders (depcruise).
- Given a new file using `TouchableOpacity`, a hex colour, or `useAuthStore()` without a selector, when `check` runs, then it fails and points to `.agents/rules`.
- Given the jest suite and a native debug build, then everything passes and the app starts and behaves as before.

## Implementation Notes

- Imports: a one-shot codemod moved the files with `git mv` and rewrote every specifier (`from`, `import()`, `require`, `jest.mock`/`requireActual`) to `@/` (or `./` inside the same folder). Aliases left: `@/` only, in tsconfig and babel (jest has no `moduleNameMapper`; it uses babel). The 305 `no-restricted-imports` and the `constants/index.ts` `no-restricted-syntax` suppressions are gone.
- Utils kept in `src/utils/` for their feature: `playlistPermissions` (playlists), `remotePosition` (player), `codeDigits` (auth), `avatarImage` (profile). All others moved to `src/shared/utils/` (logger included). `useConnectionStatus` moved to `src/shared/hooks/` (it only reads the socket store; needed by the shared `ConnectionBanner`).
- Shared blocks grouped as `shared/components/{feedback,form,lists,media,sharing,theme}/`.
- `Text` primitive deferred (YAGNI): nothing needs themed typography yet.
- Lint rules are a local ESLint plugin `guardrails/*` reusing the core `no-restricted-syntax` implementation, so each rule has its own name and suppression count. Named colours are only checked in colour props/style keys (`'snow'` is also an icon name); template-literal colours and namespace use (`RN.Pressable`) are caught. Tests are covered.
- `check-exceptions.mjs` learnt two things: entries and inline escapes follow git renames within their own project (`tools/guardrails/renames.mjs`, tested), and a new rule lands with exceptions only through the allowlist `tools/guardrails/new-rule-baselines.json` (mobile: ui-primitives 37, theme-tokens 136, zustand-selector 24, shared-not-to-legacy 4).
- jscpd: the `SearchBar` and `SwipeableTrackItem` ignores were no longer needed and were removed; `Skeleton` follows its move.
- depcruise `shared-not-to-legacy` records 4 imports: `socketStore` -> `store/authStore`, `services/deviceService`; `api.ts` -> `services/deviceService`; `SwipeableTrackItem` -> `components/track/TrackActionsButton`.
- `@tanstack/react-query` installed with npm 10 (`npx npm@10 install`); Expo does not pin it.

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd mobile && npm run check` -- expected: all OK.
- `grep -rnE "from '(\.\./|@(api|components|screens|services|store|hooks|utils|constants|contexts|themes)\b)" mobile/src` -- expected: nothing.

**Manual checks:**
- `cd mobile && npx expo run:android` (if an emulator is available), or the next `main` build: the app starts, the theme switch works, and buttons respond.

### Pass 1 (quick) — high 1 / medium 2 / low 2 / false 0 / maybe-false 0

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| The new-rule exemption in `check-exceptions.mjs` is open-ended: substring matching on the config, rule renames reset the list, a new rule's baseline grows for the whole branch | high | patch | Weakens shrink-only governance beyond this story. Fix: an explicit allowlist with max counts per new rule. |
| `followRenames` rewrites entries across projects | medium | patch | Reviewer reproduced a mobile move rewriting a backend exclude path. |
| Theme-tokens and ui-primitives rules exempt test files | medium | patch | The frozen constraints have no test exemption. |
| Colour rule misses template literals; primitives rule misses namespace use | low | patch | Real gaps (`useImageColors.ts`); extend the selectors. |
| `mobile/README.md:40` stale path | low | patch | Doc fix. |
| AC2: 4 `shared-not-to-legacy` exceptions | — | accepted deviation | They depend on `authStore` / `deviceService` / `TrackActionsButton`, which move with #378, #384 and #379; noted on those tickets. |
