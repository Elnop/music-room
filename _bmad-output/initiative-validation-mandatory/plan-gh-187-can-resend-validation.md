---
title: 'Valider can-resend et enregistrer le cooldown de reset'
type: 'bugfix'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: 'f4a11c2031142f17b62131cb3ec2e080c2a4b71e'
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

**Problem:** GitHub #187. `GET /api/auth/reset-password/can-resend` reads `req.query.email` without a Zod schema (AGENTS.md: validate every input with Zod). Its cooldown is never recorded (`PasswordResetService.recordResendAttempt` has no caller), so it always answers `{ canResend: true, remainingSeconds: 0 }`, and `remainingSeconds` was computed as `60 - attempts`, not a duration. `ResetPasswordScreen` relies on it.

**Approach:** Add `canResendResetCodeQuerySchema` (`email: z.email()`) and parse the query with it (400 `VALIDATION_ERROR`, replacing `EMAIL_REQUIRED`). `requestPasswordReset` records the resend attempt on every request, before the account lookup, so an unknown email starts the same cooldown (no enumeration). `canResendCode` reads the cooldown with `checkLimit` and returns the key's real TTL. OpenAPI entry updated. Integration test through the real router.

</frozen-after-approval>

## Implementation Notes

Oneshot: ~40 lines of code plus one integration test file. Mutation check: with the old service, the two cooldown tests fail.

## Verification

**Commands:**
- `cd backend && npm run lint && npm run type-check && npm test && npm run test:int` -- expected: green

## Review Triage Log

Pass 1 (quick): medium 2 · low 4 · false 1.

| # | Finding | Verdict | Route | Evidence / action |
|---|---------|---------|-------|-------------------|
| 1 | can-resend ignores the 3-per-hour limit: says go while forgot-password answers 429 | medium | patch | Hourly key checked first, its TTL returned + test. |
| 2 | Cooldown recorded but not enforced; docs implied it is | low | patch | Intent did not require enforcement; docs now say it is advisory. |
| 3 | Existing-account test does not exercise the account path | low | patch | Asserts `sendPasswordResetEmail` called with the account email. |
| 4 | Untyped `res.json()` in the test | false | — | Stale diff; the working tree already used the typed `cooldown()` helper. |
| 5 | `PasswordResetService` over the ~150-line rule and growing | medium | patch | Limits moved to `PasswordResetCooldownService`; the service went from 245 to 210 lines. |
| 6 | Email not normalized in the cooldown keys | low | patch | Keys use the trimmed lowercase email + test. |
| 7 | forgot-password doc does not mention the cooldown | low | patch | Sentence added. |

Out of scope, found while fixing: `listUsers()` without pagination in the same service (#194).
