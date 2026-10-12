---
title: 'Couper le socket au logout (mobile)'
type: 'bugfix'
ticket: '2'
created: '2026-10-09'
status: 'built'
baseline_revision: 'f81dac22756dbef4ce6dca3aec3f9925262b85e3'
route: 'oneshot'
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

**Problem:** GitHub #70 (story 3.2). `authStore.logout` (`mobile/src/store/authStore.ts`) never touches the socket: only `RootNavigator`'s `isAuthenticated` effect disconnects it, so the store cannot guarantee it (and nothing tests it). It also leaves the user signed in when `supabase.auth.signOut()` throws: the catch sets `error: 'Logout failed'` and keeps tokens and state.

**Approach:** Every end of session disconnects the socket: `socketStore` subscribes to `useAuthStore` and calls `disconnect()` when `isAuthenticated` goes from true to false (covers `logout` and the refused-refresh path of #126; `socketStore` already imports `authStore`, so no new import cycle). `logout` calls the backend logout as today (failure tolerated), then always ends the session locally through the existing `endSessionLocally()` (state, Supabase client session, AsyncStorage), whatever the Supabase sign-out does, and resets `isLoading`/`error`. A new test in `mobile/src/store/authStore.test.ts` checks: logout calls `/api/auth/logout`, disconnects the socket, clears tokens, state and storage, including when the API call fails.

**Decision (human, 2026-10-09):** the mobile sign-out uses Supabase scope `local` (only this device), matching the backend logout; the default global scope signed out every device of the user.

</frozen-after-approval>

## Implementation Notes

Oneshot: about 40 lines of code in two stores plus tests, no new surface.

- `mobile/src/store/socketStore.ts`: module-level `useAuthStore.subscribe` disconnects on `isAuthenticated` true → false. No import cycle: nothing `authStore` imports reaches `socketStore`.
- `mobile/src/store/authStore.ts`: `logout` = backend logout (failure tolerated) + `endSessionLocally()`; the outer try/catch and `error: 'Logout failed'` are gone since nothing left can throw (`endSessionLocally` guards `signOut`, `clearStorage` catches). `endSessionLocally` now also resets `isLoading` and `error`. RootNavigator's own disconnect effect is kept (harmless, idempotent).
- `mobile/src/store/socketStore.test.ts`: its `authStore` mock gains `subscribe`.
- `mobile/src/store/authStore.test.ts`: logout tests (API OK, API down, Supabase sign-out throws) and a socket check on the refused-refresh test.

## Verification

**Commands:**
- `cd mobile && npm test && npm run lint && npm run type-check` -- expected: all green

## Review Triage Log

Pass 1 (quick): 5 findings, none patched.

- medium · defer — `logout` with an `accessToken` but no `refreshToken` and an expiring token recurses (`apiRequest` proactive refresh → `refreshAccessToken` → `logout`), never reaching `endSessionLocally`. Reachable: `loadFromStorage` restores a session without a refresh token. Pre-existing, already tracked as #176 (commented there).
- low · rejected — no logout test with an expiring token. Checked: on a refused refresh `endSessionLocally` runs twice, then the backend logout goes out without a token and fails; both runs are idempotent, the end state is the same.
- low · rejected — `endSessionLocally` resets `isLoading`/`error` on the refused-refresh path too. The user is signed out right after; the interrupted action's own `finally`/`catch` sets `isLoading` again; no visible effect.
- false — the subscription exists only once `socketStore` is imported: `RootNavigator` always imports it, so no app path ends a session without it.
- low · rejected — `ProfileScreen.handleLogout` try/catch is now unreachable. Harmless defensive code around an async UI call.
