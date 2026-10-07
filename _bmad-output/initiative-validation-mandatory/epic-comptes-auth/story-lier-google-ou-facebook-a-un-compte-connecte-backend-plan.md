---
title: 'Lier Google ou Facebook à un compte connecté (backend)'
type: 'feature'
ticket: '5'
created: '2026-10-07'
status: 'built'
baseline_revision: 'b0e570002c9489eb3cacf500eb1c392897a8db24'
route: 'full'
route_source: 'auto'
risk: 'high'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/doc/TESTING.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A signed-in user cannot link Google or Facebook to their account (CAP-6). Also, OAuth login finds the account by provider id but opens the session for the *network's* email, so once a Google account with a different email is linked, Google login would open the wrong session, or fail.

**Approach:** Implement `POST /api/auth/providers/{provider}/link` exactly as documented in `auth.openapi.ts` (contract #72). Verify the provider token, then store `google_id`/`facebook_id` on the signed-in user whatever the email. Refuse an id that is already linked. Fix `UserService.createOAuthUser` so that the account found by provider id gets a session for *its own* auth email.

## Boundaries & Constraints

**Always:** follow the #72 contract (400 `INVALID_PROVIDER_TOKEN`, 409 `PROVIDER_ALREADY_LINKED`, 409 `PROVIDER_ALREADY_SET`, 200 `{ providers }`); validate params and body with Zod; protect the route with `authMiddleware` and `oauthRateLimiter`; keep each service under ~150 lines; use `.js` imports through `@/features`/`@/shared`.

**Never:** no new migration (unique indexes `idx_user_google_id`/`idx_user_facebook_id` already exist, migration 007); no mobile change (#74); no change to unlink or GET /providers behavior.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Link, different email | user A (email a), Google token of G (email g), nobody has G | A.google_id = G; 200 with providers incl. google | — |
| Login after link | Google login with G's token | session for A (email a), user.email = a | — |
| Id taken | G already on user B | nothing written | 409 PROVIDER_ALREADY_LINKED |
| Provider already set | A already has a google_id (same or other) | nothing written | 409 PROVIDER_ALREADY_SET |
| Bad token | verification fails | nothing written | 400 INVALID_PROVIDER_TOKEN |
| Race | two users link G at once | unique index rejects one (23505) | 409 PROVIDER_ALREADY_LINKED |
| Body mismatch | `/google/link` with `{ accessToken }` | — | 400 VALIDATION_ERROR |
| Email login, other id set | A has google_id G2; Google G1 with A's email logs in | session for A (unchanged behavior) | — |

**Decisions (2026-10-07):**
- Tests are written in this ticket: one integration test on the local Supabase stack, with token verification mocked.
- Login by the network's email is never refused, even when the account already holds another id for that provider: a user must always reach their account by email, Google or Facebook.

</frozen-after-approval>

## Code Map

- `backend/src/features/auth/services/provider.service.ts` -- 154 lines; `getLinkedProviders` (reuse for the 200 body), `isProviderLinked`. Do not grow it.
- `backend/src/features/auth/services/oauth.service.ts` -- `verifyGoogleToken` → `sub`, `verifyFacebookToken` → `id`; both throw 401 `INVALID_TOKEN`/`INVALID_FACEBOOK_TOKEN`, which the link must map to 400 `INVALID_PROVIDER_TOKEN`. Google also throws 400 `EMAIL_NOT_VERIFIED`; keep it.
- `backend/src/features/auth/services/user.service.ts` -- `createOAuthUser`: the `existingOAuth` branch calls `createSessionForOAuthUser(effectiveEmail)` and returns `email: effectiveEmail`; it must use the account's auth email (`supabase.auth.admin.getUserById`).
- `backend/src/features/auth/utils/auth.helpers.ts` -- `providerIdField(provider, id)` for typed updates.
- `backend/src/features/auth/auth.validators.ts` -- `googleLoginSchema`, `facebookLoginSchema` to reuse for the body.
- `backend/src/features/auth/auth.controller.ts` / `auth.service.ts` / `auth.routes.ts` -- follow the `unlinkProvider` path (controller → `authService` delegate → `ProviderService`).
- `backend/src/features/auth/auth.openapi.ts` -- link entry from #72; add the 429 of `oauthRateLimiter`.
- `backend/src/features/profile/services/privacy.int.test.ts` -- integration test pattern (local Supabase stack, create and delete users).

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/features/auth/services/provider-link.service.ts` -- new `ProviderLinkService.linkProvider(userId, provider, token)`: verify (map 401 → 400 `INVALID_PROVIDER_TOKEN`), 409 `PROVIDER_ALREADY_SET` if the user's column is set, 409 `PROVIDER_ALREADY_LINKED` if `isProviderLinked` or on update error 23505, update with `providerIdField`, return `ProviderService.getLinkedProviders` -- a separate file keeps both services under 150 lines
- [x] `backend/src/features/auth/auth.validators.ts` -- `providerParamSchema` (`google`|`facebook`) -- Zod on params
- [x] `backend/src/features/auth/auth.service.ts` -- `linkProvider` delegate -- same pattern as unlink
- [x] `backend/src/features/auth/auth.controller.ts` -- `linkProvider`: parse params, parse body with the provider's login schema, respond 200 `{ success, data: { providers }, meta }`
- [x] `backend/src/features/auth/auth.routes.ts` -- `POST /providers/:provider/link` with `authMiddleware`, `oauthRateLimiter`
- [x] `backend/src/features/auth/auth.openapi.ts` -- add `'429': RateLimitError` to the link entry
- [x] `backend/src/features/auth/services/user.service.ts` -- `existingOAuth` branch opens the session for the account's auth email and returns it; the email-match branch is unchanged
- [x] `backend/src/features/auth/services/provider-link.int.test.ts` -- mock `OAuthService`; cover the matrix rows "Link, different email", "Login after link" (through `AuthService.loginWithGoogle`), "Id taken", "Provider already set"; create and delete users like `privacy.int.test.ts`

**Acceptance Criteria:**
- Given an email/password user and a Google account with another email, when they link it and then sign in with Google, then they get the same user id and their own email.
- Given the endpoint, when called without a bearer, then 401 `UnauthorizedError`.

## Verification

`backend/node_modules` in this checkout is root-owned and empty (npm cannot install there). Run the commands from a copy: `rsync -a --exclude node_modules backend/ /tmp/claude-1000/-home-elthinkbuntu-Documents-music-room/ab33d70a-3a13-4ee6-8938-dc4d0a060d15/scratchpad/backend/` then `npm ci` there; `make test-int` can be replaced by `scripts/test-db.sh up` then `npm run test:int` in that copy.

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test` -- expected: green
- `make test-int` -- expected: green

**Manual checks (if no CLI):**
- Swagger UI: call the link endpoint with an invalid token → 400 `INVALID_PROVIDER_TOKEN`.

## Review Triage Log

Quick review, pass 1: 1 high (defer + patch), 1 low (patch), 2 low (rejected).
- high, defer (root cause) + patch (symptom) — the shared `supabaseAdmin` client keeps the session from `verifyOtp`/`signInWithPassword`/`refreshSession` in memory and then sends that user's JWT to PostgREST (supabase-js 2.117.2 `_getAccessToken` prefers the session token over the service key). After any login the link update can match 0 rows under RLS and still return 200. Patch: the update checks the returned row (`.select('id')`) and fails loud. The root cause predates this change → deferred-work.md.
- low, patch — `PROVIDER_ALREADY_SET` check-then-write race (same user, two accounts at once): the update adds `.is('<provider>_id', null)`, and a missing row is re-read → 409.
- low, rejected — a Google/Facebook outage becomes 400 `INVALID_PROVIDER_TOKEN`: `OAuthService` already wraps every failure as 401 (oauth.service.ts:62-68, 164-170), so telling them apart means changing `OAuthService`; rare in normal use.
- low, rejected — AC "no bearer → 401" has no test: the route runs `authMiddleware` first (auth.routes.ts), which answers 401 like every other protected route; Supertest is not a backend dependency.
