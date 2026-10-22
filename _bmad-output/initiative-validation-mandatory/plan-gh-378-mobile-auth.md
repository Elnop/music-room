---
title: 'Mobile : migrer la feature auth (#378)'
type: 'refactor'
ticket: 'https://github.com/Elnop/music-room/issues/378'
created: '2026-10-22'
status: 'built'
baseline_revision: '935a11f5ca2438b60a50a93d708f3fb63e4d87e0'
route: 'full'
route_source: 'auto'
risk: 'high'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md', '{project-root}/docs/superpowers/specs/2026-10-21-clean-codebase-refactor-design.md', '{project-root}/.agents/rules/architecture.md', '{project-root}/.agents/rules/structure.md', '{project-root}/.agents/rules/state.md', '{project-root}/.agents/rules/logging.md', '{project-root}/.agents/rules/guardrails.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #378, epic #362. The `auth` code of the mobile app is spread across the legacy technical folders (`screens/`, `components/`, `store/`, `hooks/`, `services/`, `api/`, `contexts/`, `utils/`). Its large files go far over 150 lines, it fetches server data by hand in Zustand stores, and it uses raw `TouchableOpacity` and hard-coded colours.

**Approach:**
- **Location:** move the feature into `src/features/auth/` per `.agents/rules/structure.md` and `state.md`.
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

- Screens: `screens/auth/`: `LoginScreen` (343 lines), `RegisterScreen` (334), `ResetPasswordScreen` (368), `EmailVerificationScreen` (281), `WelcomeScreen` (268), `ForgotPasswordScreen`. Navigation: `navigation/AuthNavigator.tsx`.
- `store/authStore.ts` (713) -- this is the session: tokens, the refresh shared by concurrent callers, the purge of the old SDK session, and linked providers. Keep the session state as a client store under `features/auth/stores/`. Reads such as linked providers move to TanStack. Split the rest into hooks or services under 150 lines.
- `services/oauth.ts` (195, Google and Facebook native sign-in) and `utils/codeDigits.ts`.
- **Removing the `shared-not-to-legacy` exception `shared/stores/socketStore.ts → store/authStore.ts`:** `shared/` must not import a feature. Invert the dependency the way `shared/services/api.ts` already does with `registerAuthSession`: auth registers a token getter or refresher that `socketStore` calls.
- `screens/profile/LinkedAccountsScreen.tsx` belongs to profile (#383), but it calls the auth linked-providers API. Leave it in place, and expose what it needs without making it import the feature: legacy code may import the feature until #383.
- Pattern and rules: `.agents/rules/structure.md` (mobile placement, `ui/` primitives), `state.md` (TanStack vs Zustand, keys, selectors), `architecture.md` (layers, no cross-feature imports). Shared building blocks: `src/shared/query/` (`queryClient`, `keys`, `socketCache`), `src/shared/components/ui/` (`Pressable`, `Button`, `Input`, `Card`…), `src/shared/theme/`.
- Exception entries to remove: `grep -n "<moved path>" mobile/eslint-suppressions.json mobile/.dependency-cruiser-known-violations.json mobile/.jscpd.json tools/semgrep/rules.yml`. Prune them with `npx eslint --prune-suppressions` and by regenerating the depcruise baseline.

## Tasks & Acceptance

**Execution:**
- [x] Record coverage of the files being moved -- baseline.
- [x] Create `src/features/auth/`: server data through TanStack hooks, client stores, orchestrators, presenters and hooks; screens point to the orchestrators -- feature layout.
- [x] Delete the emptied legacy files; update importers -- no duplicate path.
- [x] Tests follow the code; prune the exceptions; update the docs that name the moved paths (`AGENTS.md`, `mobile/README.md`, `doc/`).

**Acceptance Criteria:**
- Given `src/features/auth/`, then every file is 150 lines or fewer, presenters hold no state, effects, stores or requests, and no file imports another feature.
- Given the feature's flows in the jest suite, then they pass with the same visible behaviour (texts, states, navigation) as on `develop`.
- Given `npm run check` in `mobile/`, then it passes with fewer exception entries than on `develop`, and none for this feature's files.
- Given coverage of the moved code, then it is at least the baseline.

## Implementation Notes

- Coverage of the moved code: 37.99 % of lines (212/558) on `develop` (`screens/auth/**`, `store/authStore.ts`, `services/oauth.ts`, `utils/codeDigits.ts`, `navigation/AuthNavigator.tsx`), 90 % (450/500) on `src/features/auth/**` after.
- Shared contract: `shared/services/authSession.ts`. The auth store registers itself (`registerAuthSession({ store, isTokenExpiringSoon, refreshAccessToken })`) and announces the end of a session (`notifySessionEnd`); `socketStore` and `playerStore` subscribe with `onSessionEnd`. **Session read API for the features (#379+), which must not import `features/auth`:** `getSession()` outside React and `useSession(selector)` in components, both over the registered auth store seen as `SessionView { user: UserProfile | null; accessToken; isAuthenticated }` (e.g. `useSession(s => s.user?.id ?? null)`, `getSession().accessToken`). Before registration they read signed out. Legacy files still import `useAuthStore` directly; each migrating feature switches to `useSession`/`getSession`. The API client and the socket already read the token through `getSession()`. Removes `socketStore → store/authStore` from the depcruise baseline (17 → 12 violations, the 4 AuthNavigator cycles included).
- `useAuthStore` keeps the session (tokens, user, `logout`, `refreshAccessToken`, `loadFromStorage`, `setAvatarUrl`) so legacy importers only change their import path. Sign-in flows are mutations (`hooks/useSignInMutations.ts`, `usePasswordResetMutations.ts`); the store's `error`/`isLoading` for them is gone, each screen holds its own error. Linked providers are a TanStack query keyed per user (`queryKeys.auth.providers(userId)`), used by the legacy `LinkedAccountsScreen` until #383.
- Provider brand colours and the sign-in divider are `FIXED_COLORS` in `shared/theme/tokens.ts`, spread into the four themes.
- Login and Register no longer render the `FormError` that flashed for one frame before the toast cleared it (same toast).
- Storage modules (coordinator decision): `no-asyncstorage-outside-storage` now defines a storage module by name, `<thing>Storage.ts`, in `metadata.allowed-paths` (`*Storage.ts`, repeated in `paths.exclude` because semgrep reads only `paths`). `check-exceptions.mjs` does not count an exclude entry the same rule declares in `allowed-paths` (file-name globs without `/` only), documented in `.agents/rules/guardrails.md#exception-lists`. The per-file excludes of `lastTrackStorage.ts` and `store/authStore.ts` are gone; `backendUrl.ts` (named before the convention), `ThemeContext.tsx` and `deviceService.ts` keep theirs.

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd mobile && npm run check` -- expected: all OK.
- `find mobile/src/features/auth -name '*.ts*' ! -name '*.test.*' | xargs wc -l | awk '$1>150'` -- expected: only the total line.

**Manual checks:**
- On the next `main` build, the feature's flows (listed in the PR) behave as before.

### Pass 1 (quick) — high 1 / medium 3 / low 0 / false 0 / maybe-false 0

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| `allowed-paths` bypasses shrink-only: never compared with develop; a plain file name or `*.ts` passes; read at any nesting | high | patch | Reviewer emptied a rule with `*.ts` and the check exited 0. Fix: only under `metadata`, suffix globs only, a set compared with develop, and new entries only through `new-rule-baselines.json` (`allowedPaths`). Defining storage modules by name is the coordinator's decision for this epic, recorded here and in the PR as the dedicated rule change. |
| `LinkedAccountsScreen` loading/error states differ from develop (cache, retries, replayed toast, error over data) | medium | patch | Breaks the frozen "same loading/error states" rule; match develop's fetch-on-mount with no retry. |
| A failed refetch after unlink no longer shows the error | medium | patch | `invalidateQueries` swallows the error; refetch with `throwOnError`. |
| The login error toast shows after leaving the screen | medium | patch | develop gated it on `useIsFocused`; restore the gate. |
