---
title: 'Lock in that a password reset ends every open session'
type: 'bugfix'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: '76077aeb31a6c0f214958727f0443f61d79257bd'
route: 'oneshot'
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

**Problem:** `PasswordResetService.resetPassword` changes the password with `auth.admin.updateUserById` but leaves every Supabase session alive, so a stolen refresh token keeps minting access tokens after the victim resets (threat model gap L5, GitHub #203).

**Approach:** After the password update succeeds and before the reset code is cleared, revoke all of the account's Supabase sessions (global sign-out), so every existing refresh token is refused with 401 `INVALID_REFRESH_TOKEN`. Access tokens already issued expire at their term, as with logout (M5). If revocation fails, answer 500 and keep the code stored so the client can retry.

**Decision (user, 2026-10-10):** implementation showed Supabase Auth already deletes every session of the account when `auth.admin.updateUserById` sets a password. No explicit revocation in the service: keep an integration test that locks the behavior in, a comment in the service, and update L5 in `doc/THREAT_MODEL.md`.

</frozen-after-approval>

## Implementation Notes

Superseded by the decision in Intent: the explicit revocation below was written, then reverted.

Oneshot: about 30 lines in `backend/src/features/auth/services/password-reset.service.ts` plus one integration test.

GoTrue's admin API has no "sign out user by id": `auth.admin.signOut(jwt, 'global')` needs a JWT of that user and then deletes all of the user's sessions. The service knows the new password, so it signs in on `createSignInClient()` (never on the shared `supabaseAdmin`, see `backend/src/shared/config/supabase.ts` and #136), then calls `supabaseAdmin.auth.admin.signOut(accessToken, 'global')`, which also ends that temporary session. No JWT secret or migration needed. Login already uses `signInWithPassword` on accounts created with `email_confirm: false`, so GoTrue confirmation is off and the sign-in works for every account.

Test: `backend/src/features/auth/services/password-reset-sessions.int.test.ts`, modeled on `password-reset-oauth.int.test.ts` (HTTP through the auth router, mail mocked to capture the code) and `logout.int.test.ts` (`AuthService.refreshToken` rejects with `INVALID_REFRESH_TOKEN`).

Surprise: the new test passed with the service change stashed. A probe (sign in, refresh, `updateUserById` with a new password, refresh again) got `Invalid Refresh Token: Refresh Token Not Found` on the second refresh with no revocation code: GoTrue (local v2.197) logs the user out everywhere when the admin API sets a password. The service change was reverted; the test, a comment on the `updateUserById` call and the threat-model update remain.

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test` -- expected: green
- `cd backend && npx vitest run src/features/auth/services/password-reset-sessions.int.test.ts` with the local stack from `scripts/test-db.sh` -- expected: the refresh tokens issued before the reset are refused with 401 `INVALID_REFRESH_TOKEN`, a new sign-in with the new password works

## Review Triage Log

Quick review, 4 findings: 2 medium, 1 low, 1 false.

- medium, patched: the threat-model bullet said old access tokens live until expiry "like after a logout (M5)"; logout denylists the access token, so the comparison was wrong. Checked: `verifyToken` refuses the old access tokens right after the reset (session deleted). Test now asserts it; doc and comment say both tokens are refused.
- medium, patched: evidence covered only the local stack. `/auth/v1/health` on the hosted project answers GoTrue v2.197.0, the same as local; the doc names the version and says a GoTrue upgrade needs a recheck.
- low, patched with the above: wording of the L5 row and the service comment.
- false: `ticket: ''` is the template's value outside the ticket tree; #203 is a GitHub issue, not a tree entry.
