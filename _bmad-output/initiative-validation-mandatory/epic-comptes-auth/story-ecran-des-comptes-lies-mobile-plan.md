---
title: 'Écran des comptes liés (mobile)'
type: 'feature'
ticket: '6'
created: '2026-10-09'
status: 'built'
baseline_revision: 'f5768fc42f87e17abf0817c58a2d261b2688b4e3'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #74 (story 3.6, CAP-6). The backend can list (`GET /api/auth/providers`), link (`POST /api/auth/providers/{provider}/link`, story 3.5) and unlink (`DELETE /api/auth/providers/{provider}`) sign-in methods, but the app has no screen for it: a signed-in user cannot add or remove Google or Facebook.

**Approach:** A new "Linked accounts" screen in the profile stack, opened from a button on `ProfileScreen` next to "Privacy". It lists the three methods (email/password, Google, Facebook) with their state from `GET /providers`. An unlinked Google or Facebook row has a "Link" action: the store runs the existing native sign-in (`signInWithGoogle` → `idToken`, `signInWithFacebook` → `accessToken`), sends that token to the link endpoint and stores the returned providers. A linked Google or Facebook row has an "Unlink" action through the existing `authStore.unlinkProvider`. The password row has no action.

## Boundaries & Constraints

**Always:** HTTP through `mobile/src/services/api.ts` (`authApi`), never a raw `fetch`. Backend error messages (`INVALID_PROVIDER_TOKEN`, `PROVIDER_ALREADY_LINKED`, `PROVIDER_ALREADY_SET`, `LAST_PROVIDER`) are shown as is in an error toast; a cancelled native sign-in (`Error('SIGN_IN_CANCELLED')`) shows nothing. The linked-provider type lives in `mobile/src/types/auth.types.ts` and mirrors the backend `LinkedProvidersResponse`. UI strings in English, like the neighbouring profile screens. Buttons are disabled while a link/unlink is running.

**Never:** No backend change. No unlink confirmation dialog (relinking undoes it). No change to sign-in screens. No barrel `index.ts`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| List | `GET /providers` → password + google | password and Google shown as linked, Facebook with "Link" | load failure → error toast, rows not shown |
| Link Google | tap "Link" on Google, native sign-in returns `idToken` | `POST /providers/google/link {idToken}`; list updated from the response; success toast | — |
| Link Facebook | native sign-in returns `accessToken` | `POST /providers/facebook/link {accessToken}` | — |
| Link cancelled | native sign-in throws `SIGN_IN_CANCELLED` | no request, no toast, list unchanged | — |
| Link refused | 409 `PROVIDER_ALREADY_LINKED` / 400 `INVALID_PROVIDER_TOKEN` | list unchanged | toast with the backend message |
| Unlink | tap "Unlink" on linked Google | `DELETE /providers/google`, list refetched, success toast | — |
| Unlink last method | 400 `LAST_PROVIDER` | list unchanged | toast with the backend message |

</frozen-after-approval>

## Code Map

- `mobile/src/store/authStore.ts:21-25` -- local `LinkedProvider` interface; move it to `types/auth.types.ts`. `fetchLinkedProviders` (~543) and `unlinkProvider` (~561, sets `isLoading`/`error`, refetches, rethrows) are the pattern for a new `linkProvider(provider)`; `loginWithGoogle` (~289) shows how `signInWithGoogle()` is called. `endSessionLocally` already resets `linkedProviders`.
- `mobile/src/services/api.ts:321-352` -- `authApi.getLinkedProviders` / `unlinkProvider`; add `linkProvider(accessToken, provider, token)` posting `{ idToken }` or `{ accessToken }`, returning `{ providers }`. `ApiError` carries `message`/`code`.
- `mobile/src/services/oauth.ts` -- `signInWithGoogle(): Promise<string>` (idToken), `signInWithFacebook(): Promise<string>` (accessToken); both throw `Error('SIGN_IN_CANCELLED')` on cancel. Native modules: mock `@services/oauth` in tests (as `authStore.test.ts` does).
- `backend/src/features/auth/auth.types.ts:123` -- `LinkedProvidersResponse` shape to mirror.
- `mobile/src/navigation/stacks/ProfileStack.tsx` -- `ProfileStackParamList` + screens; add `LinkedAccounts` ("Linked accounts" title). `ProfileScreen.tsx:26-32` duplicates the param list type: add the route there too.
- `mobile/src/screens/profile/ProfileScreen.tsx:222-235` -- "Privacy" button block; add a sibling button (Ionicons `link`) navigating to `LinkedAccounts`, reusing the same styles.
- `mobile/src/screens/profile/PrivacySettingsScreen.tsx` -- template for a settings screen: `useTheme` + `createStyles(theme)`, `LoadingSpinner`, `showError` from `@utils/toast` (also `showSuccess`).
- Tests: no component test exists yet; `@testing-library/react-native` 13 is installed. `src/store/authStore.test.ts` shows the fetch mock, AsyncStorage mock and `@/lib/supabase` / `@services/oauth` mocks to reuse. `useTheme` needs its provider (`@/contexts/ThemeContext`) or a mock.

## Tasks & Acceptance

**Execution:**
- [x] `mobile/src/types/auth.types.ts` -- add `LinkedProvider` and `LinkedProvidersResponse`; use them in `authStore.ts` and `api.ts`.
- [x] `mobile/src/services/api.ts` -- add `authApi.linkProvider`.
- [x] `mobile/src/store/authStore.ts` -- add `linkProvider(provider)`: native sign-in, link call, `set({ linkedProviders: response.providers })`; same `isLoading`/`error`/rethrow pattern as `unlinkProvider`.
- [x] `mobile/src/screens/profile/LinkedAccountsScreen.tsx` -- the screen per Intent and matrix (fetch on mount, rows, actions, toasts, cancel silent).
- [x] `mobile/src/navigation/stacks/ProfileStack.tsx`, `mobile/src/screens/profile/ProfileScreen.tsx` -- route and entry button.
- [x] `mobile/src/screens/profile/LinkedAccountsScreen.test.tsx` -- component test with mocked API (fetch) and mocked native sign-in covering every matrix row.

**Acceptance Criteria:**
- Given a signed-in user on Profile, when they tap "Linked accounts", then the screen shows each method's state.
- Given a dev build against the backend, when the user links then unlinks Google, then `GET /providers` reflects each change (manual demo).

## Verification

**Commands:**
- `cd mobile && npm test && npm run lint && npm run type-check` -- expected: all green, no new lint warning

**Manual checks (if no CLI):**
- Dev build: link Google on a password account, sign out, sign in with Google into the same account; unlink it again.

## Review Triage Log

Pass 1 (quick): medium 1 · low 1.

| # | Finding | Verdict | Route | Evidence / action |
|---|---------|---------|-------|-------------------|
| 1 | Cancelled Google sign-in shows an error toast: google-signin 16.1.5 resolves `{ type: 'cancelled' }` instead of throwing, so `signInWithGoogle` throws "No ID token…" and `isCancelled` is false | medium | patch | Confirmed in `node_modules/@react-native-google-signin/google-signin` (`translateNativeRejection.ts` returns `cancelledResult`; `isCancelledResponse` exported). Breaks the "Link cancelled" matrix row on a device; tests mocked `@services/oauth`. Fix in `oauth.ts` with `isCancelledResponse` + unit test; also fixes `loginWithGoogle`. Patched (`oauth.ts` + `oauth.test.ts`). |
| 2 | Unlink succeeds but the refetch fails → failure toast and stale list | low | rejected | Real but needs a GET to fail right after a successful DELETE; the fix adds a branch in `unlinkProvider`. Reopening the screen reloads the list. |
