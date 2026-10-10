---
title: 'Backfill has_password false on Google/Facebook sign-ups'
type: 'bugfix'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: '0e09c93e6c953f4c5a54a0f9b2c38a03276e76fd'
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

**Problem:** `user_profiles.has_password` came with `DEFAULT TRUE` (migration 007) and `UserService.createOAuthUser` did not set it until #189, so existing Google/Facebook sign-ups show a password they do not have, and `LAST_PROVIDER` lets them unlink their only real sign-in method (GitHub #196).

**Approach:** A data migration sets `has_password = false` on accounts created by Google/Facebook sign-up, leaving email/password accounts (including those that linked Google later) unchanged.

</frozen-after-approval>

## Implementation Notes

Oneshot: one migration and one integration test.

- The issue suggested `auth.identities` (no `email` provider row). Probed on the local stack (GoTrue v2.197.0, same as hosted): `auth.admin.createUser` without a password still creates an `email` identity and stores a random bcrypt hash in `encrypted_password`. Neither column can tell these accounts apart, and the audit log only records `user_modified` for an admin password change.
- Marker used: `auth.users.raw_user_meta_data ? 'oauth_provider'`, set by `createOAuthUser` since the first Google sign-in (`git log -S "oauth_provider: provider"`), never by `register`. No condition on provider ids (a sign-up that unlinked its provider is fixed too).
- Bounded to `auth.users.created_at < 2026-10-09 22:39:21+00`, the merge of #189 into develop (40554b3), first code to insert false; develop runs against the hosted project. Later sign-ups showing true set a real password and are kept.
- Known limit, written in the migration: an older Google/Facebook sign-up that set a password through a reset also goes to false. Fail-safe: `has_password` is only read by `provider.service.ts` (providers list, unlink guard); login does not check it, and another reset sets it back.
- Numbered 019: 018 is in PR #215.
- Test `backend/src/features/auth/services/has-password-backfill.int.test.ts` runs the migration file again through `docker exec psql` (also used to backdate `auth.users.created_at`, not reachable through PostgREST) on the stack's DB container, the way `scripts/test-db.sh` applies migrations (also in CI).

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test` -- expected: green
- `cd backend && npm run test:int` -- expected: green, including the new file

## Review Triage Log

Quick review, 4 findings: 2 medium, 1 low (test gaps), 1 low (dead mock).

- medium, patched: the `google_id`/`facebook_id` condition skipped OAuth sign-ups that already unlinked their only provider, the users #196 already hurt. Condition dropped; test case added.
- medium, patched: without a date bound, OAuth sign-ups created after #189 that set a real password by reset would go to false. Bounded to accounts created before the #189 merge into develop; test case added.
- low, patched: tests now cover both edges of the filter.
- low, patched: the `OAuthService` mock was dead code (`createOAuthUser` does not use it); removed.
