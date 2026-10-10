---
title: "Tests du parcours d'auth existant (backend)"
type: 'feature'
ticket: '7'
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
context: ['{project-root}/doc/TESTING.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `AuthService.register` and `AuthService.login` have no test at all, and nothing walks the email/password flow end to end; removing the login refusal for unverified emails would go unnoticed (GitHub #75, CAP-3).

**Approach:** A unit test of `AuthService.register`/`login` with mocked Supabase (runs in `make test` and the CI `test` job), plus one integration test that chains register -> login refused -> resend -> verify-email -> login -> forgot-password -> reset-password -> login on the real auth router and local Supabase stack. Existing int tests already cover verify/resend/reset edge cases; do not duplicate them.

## Boundaries & Constraints

**Always:** Tests only. Unit file mocks every client (`@/shared/config/supabase.js`, `find-auth-user.js`, `EmailVerificationService`, logger) like `session.service.test.ts`. Int file reuses the harness of `email-verification.int.test.ts` (rate limiting on, loopback whitelisted, mail mocked and codes read from the mock, Redis connected in `beforeAll`, created users and Redis keys deleted in `afterAll`). Assert on HTTP status and `error.code`, not messages.

**Never:** No production code change (if a bug blocks a test, record it under Implementation Notes and open/comment a ticket instead). No real mail, no Google/Facebook call, no cloud Supabase. No new dependency.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Register new | unknown email, free username | `requiresVerification: true`, no session; `createUser` with `email_confirm: false`; profile inserted; code generated and mailed | No error expected |
| Register taken email | email of a verified account | — | 409 `EMAIL_ALREADY_EXISTS` |
| Register over unverified | email of an unverified account | old profile + auth user deleted, new account created | No error expected |
| Register taken username | username exists | — | 409 `USERNAME_TAKEN` |
| Register profile insert fails | insert returns error | auth user deleted (rollback) | 500 `PROFILE_ERROR` |
| Login unverified | valid password, `email_verified: false`, no OAuth id | no session; `details` carry `userId`, `email` | 403 `EMAIL_NOT_VERIFIED` |
| Login OAuth-linked unverified | `google_id` set, `email_verified: false` | session returned | No error expected |
| Login verified | valid password, verified | `user` + `session.accessToken` | No error expected |
| Login wrong password | signIn returns error | — | 401 `INVALID_CREDENTIALS` |
| Login no profile | profile query errors | — | 404 `PROFILE_NOT_FOUND` |

**Decision (2026-10-10, human, renegotiated after implementation):** fix GitHub #243 in this ticket. `register` keeps the auth user unconfirmed; `login` answers 403 `EMAIL_NOT_VERIFIED` with `{ userId, email }` when Supabase returns `email_not_confirmed` (Supabase checks the password first, so a wrong password still gets 401 and the 403 reveals no account). The flow test expects 403 at the "login refused" step.

</frozen-after-approval>

## Code Map

- `backend/src/features/auth/auth.service.ts:31` -- `register`; `:136` -- `login`. **Guard under test: `:173-188`** (`if (!isOAuthAccount && !profile.email_verified) throw AppError(403, ..., 'EMAIL_NOT_VERIFIED')`).
- `backend/src/features/auth/auth.routes.ts` -- `POST /register`, `/login`, `/verify-email` (`{userId, code}`), `/resend-verification` (`{userId, email}`), `/forgot-password` (`{email}`), `/reset-password` (`{email, code, newPassword}`).
- `backend/src/features/auth/auth.validators.ts` -- register password needs >= 8 chars and an uppercase letter (check the rest of the regexes); reset `newPassword` same rules.
- `backend/src/features/auth/auth.controller.ts:384` -- verify-email returns `data.session`; `:480` -- resend sends the code via `EmailVerificationService.sendVerificationEmail` (mail mock).
- `backend/src/features/auth/services/password-reset.service.ts:63,87` -- forgot/reset; code mailed through `sendPasswordResetEmail(email, code, minutes)`.
- `backend/src/features/auth/services/session.service.test.ts` -- unit mock pattern (`vi.hoisted`, `vi.mock` of supabase with `createSignInClient: () => ({ auth: { signInWithPassword } })`, `caught()` helper).
- `backend/src/features/auth/services/email-verification.int.test.ts`, `password-reset-sessions.int.test.ts` -- int harness to copy.
- `backend/supabase/config.toml:227` -- `enable_confirmations = false`, so Supabase lets an unconfirmed user sign in and the app guard is what refuses it.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/features/auth/auth.service.test.ts` -- unit tests for every row of the I/O matrix; supabase `from()` builders mocked per table/call -- covers register/login in `make test`.
- [x] `backend/src/features/auth/auth-flow.int.test.ts` -- one ordered scenario on a fresh `int-<uuid>@example.com` user: register 201 -> login 403 `EMAIL_NOT_VERIFIED` -> resend-verification 200, take the mailed code -> verify-email 200 with a session -> login 200 -> forgot-password 200, take the mailed reset code -> reset-password 200 -> login old password 401, new password 200. Clean up the user (look it up by id from the register response) and its `email_*`/`password_reset_*` Redis keys.

**Acceptance Criteria:**
- Given both files, when `npm test` and `npm run test:int` run in `backend/`, then they pass.
- Given the guard at `auth.service.ts:173-188` is temporarily removed or its condition forced false, when both suites run, then at least one unit test and the int flow fail; the implementer runs this, records the failing test names under Implementation Notes, and restores the guard (no diff left in `auth.service.ts`).
- Given an OAuth-linked unverified profile, then login still succeeds (proves the test targets the guard's condition, not just any 403).

## Implementation Notes

- **Bug found, plan step adjusted (#243):** in the int flow, logging in right after registering answers **401 `INVALID_CREDENTIALS`**, not 403 `EMAIL_NOT_VERIFIED`. `register` creates the auth user with `email_confirm: false`, so GoTrue refuses the password sign-in ("Email not confirmed") even though `enable_confirmations = false` (Code Map line about config.toml is wrong on this point), and `login` maps every `authError` to 401 before the guard runs. The flow test asserts the current 401 at that step, with a comment pointing to #243. A separate int test covers the guard itself: a confirmed auth user whose profile is unverified gets 403 `EMAIL_NOT_VERIFIED` with `details: { userId, email }` and no tokens.
- **Guard check** (condition at `auth.service.ts:174` forced to `false && ...`): failing tests were
  - unit: `AuthService > login > answers 403 EMAIL_NOT_VERIFIED with the user id and email for an unverified account`
  - int: `email/password auth flow (#75) > refuses with 403 EMAIL_NOT_VERIFIED a confirmed auth user whose profile is unverified` (got 200)

  When the condition was changed to `!profile.email_verified` (OAuth exemption removed), `AuthService > login > signs in an unverified account linked to Google` failed. Guard restored; `git diff develop -- backend/src/features/auth/auth.service.ts` is empty.

## Plan Change Log

## Review Triage Log

Quick review, 2 findings: both low, patched. Then the human widened the ticket to fix #243.

- low, patched: `afterAll` missed the per-IP `ip_failed_logins:<ip>` counter incremented by the flow's failed logins; now deleted for 127.0.0.1 / ::1.
- low, patched: the registered user was pushed to the cleanup list only when Redis was connected; moved outside the Redis branch.
- #243 (human decision): `login` maps Supabase `email_not_confirmed` to 403 `EMAIL_NOT_VERIFIED` with `{ userId, email }`. Checked on the local stack that GoTrue answers `invalid_credentials` to a wrong password and `email_not_confirmed` only to the right one, so no account enumeration. New unit test; the flow expects 401 for a wrong password then 403. With the fix reverted, 1 unit and 1 integration test fail; restored, auth unit 65/65 and flow 2/2 pass.

## Verification

**Commands:**
- `cd backend && npm test` -- expected: all pass, including `auth.service.test.ts`.
- `make test-db-up && cd backend && npm run test:int` -- expected: all pass, including `auth-flow.int.test.ts`.
- `cd backend && npm run type-check && npm run lint` -- expected: clean (no `any`).
- `git diff --stat develop -- backend/src/features/auth/auth.service.ts` -- expected: empty.
