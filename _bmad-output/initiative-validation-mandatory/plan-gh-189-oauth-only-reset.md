---
title: 'Reset de mot de passe pour un compte OAuth-only'
type: 'bugfix'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: 'f4a11c2031142f17b62131cb3ec2e080c2a4b71e'
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

**Problem:** GitHub #189. `PasswordResetService.requestPasswordReset` meant to refuse Google/Facebook-only accounts with `OAUTH_ONLY_ACCOUNT`, but the check (`!user.email?.includes('@')`) is always false after `z.email`, so such accounts already get a code. After a reset, `user_profiles.has_password` stays false, so the linked-accounts list (`provider.service.ts`) does not show the new password and `LAST_PROVIDER` counts it wrong.

**Approach:** **Decision (human, 2026-10-10): allow it.** A Google/Facebook-only account gets a reset code like any other; a successful reset sets `has_password: true`, so resetting adds email/password sign-in. Remove the dead `OAUTH_ONLY_ACCOUNT` check and its profile query; document the behavior on forgot-password and reset-password. Integration test: OAuth-only account → code → reset → `has_password` true and password sign-in works.

</frozen-after-approval>

## Implementation Notes

Oneshot. Mutation check: with the old service the test fails on `has_password` (still false). Overlaps #187 (PR #195) in `requestPasswordReset`; whichever merges second resolves the small conflict.

## Verification

**Commands:**
- `cd backend && npm run lint && npm run type-check && npm test && npm run test:int` -- expected: green

## Review Triage Log

Pass 1 (quick): high 1 · medium 1 · low 2 · false 1 · pre-existing 1.

| # | Finding | Verdict | Route | Evidence / action |
|---|---------|---------|-------|-------------------|
| 1 | A failed `has_password` write is logged and ignored after the password is set | medium | patch | Now 500 `PASSWORD_UPDATE_ERROR`; the code stays stored so the client can retry. |
| 2 | forgot-password docs still list `PROFILE_FETCH_ERROR` | low | patch | Removed with the profile query. |
| 3 | `createOAuthUser` leaves `has_password` at its `DEFAULT TRUE` (migration 007) | high | patch + ticket | New sign-ups now insert `has_password: false` + test (fails without it). Existing rows: data migration #196. |
| 4 | Test fixture is not what the app creates | low | patch | Fixture now created with `UserService.createOAuthUser`. |
| 5 | Unrelated Prettier reflow in `auth.controller.ts` | low | patch | Reverted. |
| 6 | Plan `ticket` field empty | false | — | The field is for ticket-tree ids; the PR carries `Closes #189`. |
