---
title: 'Fermer la prise de contrôle de compte par verify-email et resend-verification'
type: 'bugfix'
ticket: ''
created: '2026-10-09'
status: 'in-review'
baseline_revision: '748aa816f0c364e552a6ec0ed8bad13308012a1e'
route: 'full'
route_source: 'auto'
risk: 'high'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #188, security. (1) `POST /api/auth/verify-email` returns a full session for any already-verified user without checking the code: `EmailVerificationService.verifyCode` returns `true` when `email_verified` is set, and `authController.verifyEmail` then mints a session for that `userId`. Knowing a verified user's UUID (public: profiles, friends, playlists) is enough to take over the account. (2) `POST /api/auth/resend-verification` sends a fresh code to whatever `email` the body carries, without checking it belongs to `userId`: a third party can receive an unverified user's code, verify it and get that account's session.

**Approach:** `verifyCode` refuses an already-verified account with 400 `ALREADY_VERIFIED`, so no session is ever minted without a valid code. `resend-verification` sends a code only when the `userId` exists, is not yet verified, and the body `email` equals that account's auth email (case-insensitive); the code goes to the account's auth email. In every other case it answers the same 200 message without generating or sending anything (no account enumeration). Integration tests prove both holes are closed and the normal sign-up verification still yields a session.

## Boundaries & Constraints

**Always:** Fail closed: any lookup error in `resend-verification` sends nothing (log, then the neutral 200 or the existing 500, never a code to an unchecked address). Keep the existing rate limits, cooldown and response shapes. Identity comes from the stored account, never from the request body.

**Never:** No change to registration (`auth.service.ts` already sends to the sign-up email), to login, or to password reset. No new endpoint. No mobile change beyond what an `ALREADY_VERIFIED` error needs (the verification screen already shows server messages).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Takeover attempt | verified user, any 6-digit code | 400 `ALREADY_VERIFIED`, no session in the body | — |
| Normal verification | unverified user, the stored code | 200 with `user` + `session` (unchanged) | — |
| Wrong code | unverified user, wrong code | 400 `INVALID_CODE` (unchanged) | — |
| Resend, own email | unverified user, body email = auth email (any case) | 200; new code stored and mailed to the auth email | cooldown / limits unchanged |
| Resend, other email | unverified user, body email ≠ auth email | 200 same message; no code stored, no mail | logged as warning |
| Resend, verified user | verified user | 200 same message; nothing sent | — |
| Resend, unknown user | random UUID | 200 same message; nothing sent | — |

</frozen-after-approval>

## Code Map

- `backend/src/features/auth/services/email-verification.service.ts:70-140` -- `verifyCode`: the `if (profile.email_verified) return true;` branch (~line 91) becomes `throw new AppError(400, 'Email already verified', 'ALREADY_VERIFIED')`. `generateAndStore`, `sendVerificationEmail`, `canResendCode`, `recordResendAttempt` unchanged.
- `backend/src/features/auth/auth.controller.ts` -- `verifyEmail` (~380-470, unchanged: it now only runs after a real code check); `resendVerification` (~475-530): before `canResendCode`, load the account with `supabase.auth.admin.getUserById(userId)` (same `supabase` admin client the file already uses) and `user_profiles.email_verified`; if missing, verified, or email mismatch → respond the existing 200 message and return; else send to `authUser.user.email`.
- `backend/src/features/mail/mail.service.ts:53` -- `sendVerificationEmail(email, code, minutes)`; mock it in the integration test (`vi.mock('@/features/mail/mail.service.js')`) to capture the recipient and the code.
- `backend/src/features/auth/auth.routes.ts` (default export `router`) + `backend/src/shared/middleware/error-handler.ts` (`errorHandler`) -- mount on a throwaway express app (`express.json()`, `/api/auth`, `errorHandler`), as `features/auth/utils/token-verify-limiter.int.test.ts` does with fetch on a random port.
- `backend/src/features/auth/services/logout.int.test.ts` / `admin-session.int.test.ts` -- user creation and cleanup against the local stack (`supabaseAdmin.auth.admin.createUser`, `user_profiles` insert, `deleteUser` in `afterAll`); set `email_verified` / `verification_code` directly in `user_profiles` to stage each row.
- `mobile/src/screens/auth/EmailVerificationScreen.tsx` -- shows the server message on failure; check an `ALREADY_VERIFIED` answer reads sensibly (no code change expected).
- OpenAPI: the `verify-email` / `resend-verification` entries come with #94 (PR #190). If it is merged before this PR, add `ALREADY_VERIFIED` to verify-email's 400 and state resend-verification's email rule there; otherwise note it on #190.

## Tasks & Acceptance

**Execution:**
- [ ] `backend/src/features/auth/services/email-verification.service.ts` -- `ALREADY_VERIFIED` instead of `return true`.
- [ ] `backend/src/features/auth/auth.controller.ts` -- `resendVerification` account checks and recipient.
- [ ] `backend/src/features/auth/services/email-verification.int.test.ts` (new) -- one test per matrix row through HTTP on the real router, mail mocked.

**Acceptance Criteria:**
- Given a verified account's UUID, when anyone calls verify-email with any code, then no access or refresh token is returned.

## Verification

**Commands:**
- `cd backend && npm run lint && npm run type-check && npm test` -- expected: clean, green
- `cd backend && npm run test:int` -- expected: green, new file included

## Review Triage Log

Pass 1 (quick): medium 1 · low 3 · false 0 · already handled 1.

| # | Finding | Verdict | Route | Evidence / action |
|---|---------|---------|-------|-------------------|
| 1 | Cooldown only on the matching path: a 429 on the 2nd call reveals a matching email on an unverified account | medium | patch | `canResendCode` ran after `resolveVerificationRecipient`. Fix: cooldown first, attempt recorded on every path past it + test. Residual SMTP timing gap accepted. |
| 2 | `getUserById` error logged at info as "no such account", error dropped | low | patch | Outage indistinguishable from a missing user in logs. Fix: warn with the error. |
| 3 | Unknown-user test does not prove its own branch refused | low | patch | Random UUID is also refused by later checks. Fix: assert the branch log. |
| 4 | Mismatch warning not asserted | low | patch | Matrix says "logged as warning". Fix: assert `logger.warn`. |
| 5 | No OpenAPI entry for the touched routes | — | handled | Entries arrive with #190; the changes are commented there (plan fallback). |
