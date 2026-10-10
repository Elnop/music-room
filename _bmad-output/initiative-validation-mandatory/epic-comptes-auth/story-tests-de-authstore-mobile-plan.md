---
title: 'authStore tests (mobile): login, register, OAuth, session persistence'
type: 'chore'
ticket: '8'
created: '2026-10-10'
status: 'built'
baseline_revision: '35641158ca69994d63108ce36cd47c9d375a1e18'
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

**Problem:** `mobile/src/store/authStore.test.ts` only covers `refreshAccessToken` and `logout`. Login, register, Google/Facebook sign-in and the session that survives an app restart have no tests (GitHub #76, epic #68 "Done when" 3, CAP-3).

**Approach:** Extend the existing jest-expo test file. Drive the store's public actions through the real `authApi`/`apiRequest`, mocking `fetch`, the async-storage jest mock, `@/lib/supabase` and `@services/oauth`. Assert the in-memory state and the `@zumik/*` AsyncStorage keys. A restart is simulated by resetting the store's in-memory state, then calling `loadFromStorage()`.

## Boundaries & Constraints

**Always:** Extend `authStore.test.ts`; do not create a second file. Reuse its helpers (`jsonResponse`, `fetchMock`, `calledUrls`, `user`, the async-storage mock, the getter-based supabase mock). Read storage key names from `authStore.ts` `STORAGE_KEYS`. No network access. Reset mocks in `beforeEach`. Tests stay independent of each other's order. Follow `doc/TESTING.md`.

**Decision (2026-10-10, human):** the wrong-password login test asserts only that the call rejects, the user stays signed out and nothing is stored; the "Session expired" message bug is GitHub #235, not fixed here.

**Never:** Change production code, including `authStore.ts` and `api.ts`. A blocking bug goes under Open Questions or into a ticket, not into a fix. No new dependencies. No component or screen tests. No real Google/Facebook SDK calls.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Login OK | signed out; `POST /api/auth/login` 200 with user + session | state authenticated, `tokenExpiresAt = expiresAt*1000`, 5 keys stored, `signInWithPassword` called | No error expected |
| Login refused | signed out; login 401 `INVALID_CREDENTIALS` | rejects; `isAuthenticated` false, `error` set, tokens null, nothing stored | error thrown to caller |
| Register needs verification | register 201 with `requiresVerification: true` | returns `{requiresVerification: true, userId, email}`, not authenticated, nothing stored | No error expected |
| Register with session | register 201 with session | authenticated, tokens persisted, returns `{requiresVerification: false}` | No error expected |
| Google OK | `signInWithGoogle` resolves an ID token; `/api/auth/google` 200 | body carries `idToken`; authenticated; persisted; `supabase.auth.setSession` called | No error expected |
| Facebook OK | `signInWithFacebook` resolves a token; `/api/auth/facebook` 200 | body carries `accessToken`; authenticated; persisted | No error expected |
| OAuth cancelled | provider rejects `Error('SIGN_IN_CANCELLED')` | no fetch, `error` null, `isLoading` false, not authenticated | swallowed (no throw) |
| OAuth backend error | provider OK, backend 4xx ApiError | `error` = backend message, not authenticated, nothing stored | swallowed (no throw) |
| Restore session | keys present, `is_authenticated = 'true'`, store reset | `loadFromStorage` sets user, tokens, `tokenExpiresAt` (number), authenticated | No error expected |
| Restore with nothing / incomplete | empty storage, or `is_authenticated` missing | state stays signed out | No error expected |
| Corrupt stored user | `auth_user` not valid JSON | stays signed out, keys cleared (`clearStorage`) | caught and logged |
| Round trip | login, reset in-memory state, `loadFromStorage` | same user and tokens as after login | No error expected |

</frozen-after-approval>

## Code Map

- `mobile/src/store/authStore.ts` -- under test. `STORAGE_KEYS` :11; `login` :88 (`signInWithPassword` :95, persist :115); `register` :132 (persist :158); `loginWithGoogle` :288 (persist :302, `SIGN_IN_CANCELLED` :327); `loginWithFacebook` :364 (persist :378); `loadFromStorage` :467 (guard `userJson && accessToken && isAuthJson === 'true'` :477); `saveToStorage` :498 (persistence guard: writes the 5 keys); `registerAuthSession` at the bottom (`apiRequest` uses the store's token).
- `mobile/src/store/authStore.test.ts` -- existing file to extend. Its top-level `beforeEach` calls `signedIn()` (expired token): login/register/OAuth blocks need a nested `beforeEach` that signs out (store reset to nulls + `AsyncStorage.clear()`). Otherwise `apiRequest` refreshes first.
- `mobile/src/services/api.ts` -- `apiRequest` :108 (401 triggers `refreshAccessToken`), `handleResponse` :203 (unwraps `{success, data}`, throws `ApiError(message, code, details, status)`), `authApi.register/login/loginWithGoogle/loginWithFacebook` :254-340.
- `mobile/src/navigation/RootNavigator.tsx:27` -- production restore path (`loadBackendUrl` then `loadFromStorage`), mirrored by the restart test.

## Tasks & Acceptance

**Execution:**
- [x] `mobile/src/store/authStore.test.ts` -- add `signInWithPassword` to `mockSupabaseAuth` (reset in `beforeEach`). Add a `signedOut()` helper and an `authResponse(session?)` builder. Add `describe` blocks `login`, `register`, `loginWithGoogle`, `loginWithFacebook` and `session persistence` covering every row of the I/O matrix. Assert the URL, method, JSON body, state and AsyncStorage keys. Mock `@services/oauth` per test with `jest.mocked(signInWithGoogle).mockResolvedValue(...)`. This one file holds the ticket's whole scope.

**Acceptance Criteria:**
- Given the extended file, when `npm test` runs in `mobile/`, then every authStore test passes and the existing refresh/logout tests are unchanged and green.
- Given `saveToStorage` is temporarily emptied (body replaced by a no-op), or the `await get().saveToStorage()` in `login` (:115) is removed, when the tests run, then at least one login/OAuth persistence test and the round-trip test fail. The implementer runs this break, records the failing test names in Implementation Notes, then restores the code.
- Given the `loadFromStorage` restore (:477-487) is temporarily disabled, when the tests run, then the restore and round-trip tests fail. This is recorded the same way.
- Given `git diff develop -- mobile/src` after the work, then only `authStore.test.ts` changed.

## Implementation Notes

- `authStore.test.ts` extended with `login`, `register`, `loginWithGoogle`, `loginWithFacebook` and `session persistence` blocks (15 new tests, 23 total). Helpers added: `KEYS` (copied from `STORAGE_KEYS`), `resetMemory()`, `signedOut()`, `authResponse()`, `requestAt()`, `expectAuthenticated()`, `expectPersisted()`, `expectSignedOutAndNothingStored()`. `signInWithPassword` and the two `@services/oauth` mocks are reset in the top-level `beforeEach`.
- Wrong-password login: the 401 goes through the refresh path (no refresh token, so `endSessionLocally`), so `signInWithPassword` is never reached; the test asserts rejection, `error` set, signed out, nothing stored (message: #235).
- Guard break 1, `saveToStorage` body replaced by `return;`: 8 failed: login "authenticates and persists the session", register "authenticates and persists the session when the backend returns one", Google "exchanges the Google ID token for a persisted session", Facebook "exchanges the Facebook access token for a persisted session", "restores the same session after login and a restart", plus refresh tests "keeps the session when the auth service is unavailable (503)", "keeps the session when the backend is unreachable", "stores the new tokens on success" (they read storage). Restored: all green.
- Guard break 2, `await get().saveToStorage()` removed from `login`: 2 failed: login "authenticates and persists the session", "restores the same session after login and a restart". Restored: all green.
- Guard break 3, `loadFromStorage` restore condition forced false: 3 failed: "restores a stored session after a restart", "clears the stored session when the stored user is corrupt", "restores the same session after login and a restart". Restored: all green.

## Plan Change Log

## Review Triage Log

Quick review, 4 findings: 2 low patched, 1 deferred, 1 rejected.

- low, patched: the Facebook refusal test did not check that `setSession` was never called (the Google one did); added.
- low, patched: the corrupt-storage test accepted any `console.error`; it now expects `'Failed to load auth state from storage:'`. File re-run: 23/23.
- deferred: `doc/TESTING.md:45` says mobile tests mock `services/api.ts`, while authStore tests (old and new) mock `fetch` under the real `apiRequest`; pre-existing doc/practice gap.
- rejected: unticked task box (plan bookkeeping, ticked at finalization).

## Verification

**Commands:**
- `cd mobile && npx jest src/store/authStore.test.ts` -- expected: all pass
- `cd mobile && npm test` -- expected: whole mobile suite green
- `cd mobile && npm run type-check` -- expected: no errors
- `cd mobile && npm run lint` -- expected: no errors

