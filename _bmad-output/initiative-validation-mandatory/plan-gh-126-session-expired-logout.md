---
title: 'Déconnecter quand le refresh token est refusé, garder la session quand Supabase est injoignable'
type: 'bugfix'
ticket: ''
created: '2026-10-09'
status: 'built'
baseline_revision: '6f9dc6a4c096307bdc3cbfb9b1328ec83c5bbb10'
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

**Problem:** GitHub #126. With a dead session, the app stays on the signed-in screens and every request fails: `authStore.refreshAccessToken` never logs out, whatever the error. The mobile cannot tell a refused refresh token from an outage anyway: `SessionService.refreshToken` answers 401 `INVALID_REFRESH_TOKEN` for any Supabase error, including Supabase unreachable (`ENOTFOUND`, the case actually observed on the issue).

**Approach:** Backend: `POST /api/auth/refresh` answers 401 `INVALID_REFRESH_TOKEN` only when Supabase Auth explicitly refuses the token (`AuthApiError` with a 4xx status); Supabase unreachable or failing (`AuthRetryableFetchError`, 5xx, unexpected throw) answers 503 `AUTH_UNAVAILABLE`. Mobile: on a 401 from the refresh, `refreshAccessToken` ends the session locally and returns `false`, so `RootNavigator` shows the auth screens; on anything else (network error, 5xx, 503, 429) it keeps the session as today.

## Boundaries & Constraints

**Always:** The refused-refresh logout must not call the backend logout endpoint through `apiRequest` (its proactive refresh would call `refreshAccessToken` again: infinite loop); clear tokens, Supabase client session and AsyncStorage locally. The 401 decision on mobile reads `ApiError.status === 401` from the refresh call only. Mirror the new 503 code in `auth.openapi.ts`.

**Never:** No change to `verifyToken` / `authMiddleware` classification (a Supabase outage still yields 401 `INVALID_TOKEN` on regular routes; separate issue if wanted). No new retry scheduler on mobile: "retried later" is the existing behavior (next request, next app start, socket reconnect). No change to socket disconnection on logout (#70; `RootNavigator` already disconnects when `isAuthenticated` turns false).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Refresh OK | valid refresh token | 200, new session stored | — |
| Refused | Supabase returns `AuthApiError` 400 (revoked/expired/unknown token) | backend 401 `INVALID_REFRESH_TOKEN`; mobile clears session, `isAuthenticated=false`, returns false | no toast at app start: screens never mount |
| Supabase unreachable | `AuthRetryableFetchError` (DNS, timeout, 502–504) | backend 503 `AUTH_UNAVAILABLE`; mobile keeps tokens and `isAuthenticated=true`, returns false | logged as warning |
| Backend unreachable | fetch throws | `ApiError` `NETWORK_ERROR` (no status); session kept | — |
| Unexpected throw in Supabase client | exception | backend 503 `AUTH_UNAVAILABLE` | logged |
| Profile lookup fails after refresh | `fetchUserProfile` AppError | unchanged (its own status, not 401) → session kept | — |

</frozen-after-approval>

## Code Map

- `backend/src/features/auth/services/session.service.ts:44-70` -- `refreshToken`: today maps every `error` and the catch-all to 401. Classify with `isAuthApiError` / `isAuthRetryableFetchError` from `@supabase/supabase-js` (re-exported from auth-js 2.117). `AppError` from `@/shared/middleware/error-handler.js` keeps its status through the error handler.
- `backend/src/features/auth/services/session.service.test.ts` -- unit tests, Supabase mocked via `vi.mock`; add a `describe('refreshToken')` (mock `createSignInClient`).
- `backend/src/features/auth/auth.openapi.ts:139-170` -- `/api/auth/refresh` responses: 503 currently `$ref` `RateLimitUnavailable`; replace with an inline 503 describing both `RATE_LIMIT_UNAVAILABLE` and `AUTH_UNAVAILABLE`, and describe the 401 as "refresh token refused".
- `mobile/src/store/authStore.ts:606-680` -- `refreshAccessToken` catch block (`Skipping auto-logout`). `logout` at 268 calls `authApi.logout` (do not reuse it here). `clearStorage` exists on the store.
- `mobile/src/services/api.ts:43-55` -- `ApiError` carries `status` from `handleResponse`; `/api/auth/refresh` bypasses the interceptor (line 128), so the 401 reaches the store as-is.
- `mobile/src/navigation/RootNavigator.tsx:27-43` -- refresh at startup before `setIsReady(true)`; renders `AuthNavigator` when `isAuthenticated` is false. No change.
- `mobile/src/store/socketStore.test.ts` / `mobile/src/services/api.test.ts` -- jest-expo mocking style (AsyncStorage mock, `fetch` mock) to copy for a new `authStore.test.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/features/auth/services/session.service.ts` -- in `refreshToken`: `AuthApiError` with status 400–499 or a null session → 401 `INVALID_REFRESH_TOKEN`; any other error and the catch-all → 503 `AUTH_UNAVAILABLE` ('Authentication service is unavailable'), logged with `logger.warn` -- outage must not look like a refusal.
- [x] `backend/src/features/auth/services/session.service.test.ts` -- tests: 4xx `AuthApiError` → 401; `AuthRetryableFetchError` → 503; 5xx `AuthApiError` → 503; thrown error → 503; success returns the session.
- [x] `backend/src/features/auth/auth.openapi.ts` -- update `/api/auth/refresh` 401/503 entries.
- [x] `mobile/src/store/authStore.ts` -- in the refresh catch: if `error instanceof ApiError && error.status === 401`, clear the session locally (state, `supabase.auth.signOut()` guarded, `clearStorage`) and return false; otherwise keep the current behavior. Keep the store under its current structure (a small local helper is fine).
- [x] `mobile/src/store/authStore.test.ts` (new) -- refused (401) → logged out, storage cleared, no call to `/api/auth/logout`; 503 and network error → tokens and `isAuthenticated` kept; success → tokens updated.

**Acceptance Criteria:**
- Given a revoked refresh token, when the app starts, then it lands on the login screen without error toasts.
- Given the backend stopped (or Supabase unreachable), when the app starts with an expiring token, then the session is kept and the next successful refresh restores it.

## Verification

**Commands:**
- `cd backend && npm test && npm run lint && npm run type-check` -- expected: all green
- `cd mobile && npm test && npm run lint && npm run type-check` -- expected: all green

**Manual checks (if no CLI):**
- Swagger UI: `POST /api/auth/refresh` with a garbage token → 401 `INVALID_REFRESH_TOKEN`.

## Review Triage Log

Pass 1 (quick): high 0 · medium 1 · low 1 · false 0 · maybe-false 0 · pre-existing 2.

| # | Finding | Verdict | Route | Evidence / action |
|---|---------|---------|-------|-------------------|
| 1 | `session.service.ts`: Supabase 429/408 `AuthApiError` mapped to 401 → mobile logs out during a rate-limit burst | medium | patch | GoTrue answers 429 `over_request_rate_limit` on the token endpoint; all refreshes come from the backend IP. Intent says 401 only on an explicit refusal. Fix: exclude 429/408 from the refusal branch + test. Patched (`isRefusal`, 429 test). |
| 2 | `authStore.ts`: `isRefreshing` reset before `endSessionLocally`, waiters resolve(true) and retry with the stale token | low | patch | Waiters poll every 100 ms and resolve true on `isRefreshing === false`; the gap spans `await signOut`. Fix: reset only with the cleared session on the 401 path. Patched. |
| 3 | `authStore.ts`: `!refreshToken` branch calls `logout()` → `apiRequest` proactive refresh → `refreshAccessToken` → `logout()` loop | medium | defer | Pre-existing, not in the diff. Ticket opened: #176. |
| 4 | `auth.openapi.ts`: `/api/auth/refresh` lacks the 429 from `loginRateLimiter` | low | defer | Pre-existing doc gap (`auth.routes.ts:47`). Commented on #94. |
