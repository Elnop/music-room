---
title: 'Find the auth user by email past the first listUsers() page'
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

**Problem:** `PasswordResetService.requestPasswordReset` and `resetPassword` find the account with `auth.admin.listUsers()` then `users.find(u => u.email === email)`. `listUsers()` returns one page (50 users), so past it no code is sent and the reset fails; the comparison is case-sensitive (GitHub #194). `AuthService.register` uses the same lookup for its duplicate-email check.

**Approach:** Migration 018 adds `public.find_auth_user_id_by_email(text)`, a SECURITY DEFINER SQL function on `auth.users` comparing `lower(email)`, executable by `service_role` only. A helper `findAuthUserIdByEmail` calls it; the reset (both methods) and `register` use it.

**Decisions (user, 2026-10-10):** RPC rather than paginating `listUsers()`. Fix `register` in the same PR. The user applies 018 on the hosted project; then `make generate-types` regenerates the types (never hand-edited).

</frozen-after-approval>

## Implementation Notes

Baseline moved after rebasing onto develop once #214 merged.

Oneshot: a migration, a 20-line helper, three call sites, one integration test.

- `backend/migrations/018_find_auth_user_by_email.sql`: grants follow `016_playlist_track_ranks.sql` (revoke from PUBLIC, anon, authenticated; grant to service_role). `SET search_path = ''`, fully qualified `auth.users`. `ORDER BY created_at LIMIT 1` in case two rows differ only by case.
- `make migrate-create` writes `<timestamp>_<name>.sql`; renamed to `018_` like every other migration. Already tracked in #128.
- `backend/src/features/auth/utils/find-auth-user.ts`: throws 500 `USER_FETCH_ERROR`, the code the reset used on a `listUsers()` error.
- `password-reset.service.ts` and `auth.service.ts`: `listUsers()` + `find` replaced; `SupabaseAdminUsersResponse` import dropped from the reset service (still exported by `auth.types.ts`).
- `user.service.ts` (OAuth sign-in) already paginates `listUsers()`; left as is.
- Surprise: `listUsers()` lists the newest accounts first, so the test creates the target account before 51 fillers and asserts it is absent from the first page.
- Types generated from the local stack are not usable: the hosted schema has columns (`email_verification_*`) no migration creates. The user applied 018 on the hosted project (checked: the RPC answers the service key, refuses the anon key with 401); `make generate-types` then prettier gave a one-line diff (the new function).

Test `backend/src/features/auth/utils/find-auth-user.int.test.ts`: fails on the old code (reset and duplicate sign-up), passes with the fix.

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test` -- expected: green
- `cd backend && npm run test:int` (stack from `scripts/test-db.sh up`) -- expected: green, including the new file

## Review Triage Log

Quick review, 4 findings: 1 high, 1 medium, 1 low, 1 false.

- high, patched: the lookup now ignores case but `password_reset_attempts` was keyed on the raw email, so each case variant got 5 fresh tries on the same code. Key normalized with `trim().toLowerCase()` like `PasswordResetCooldownService`; new test fails without it.
- medium, patched: case-insensitivity was only tested on the helper. Forgot-password, reset and duplicate sign-up now use other cases.
- low, patched: `afterAll` deleted every `password_reset_*` key; scoped to the test email like the other reset tests.
- false: generated types not hand-edited. They come from `make generate-types` on the hosted project after 018 was applied; the plan text was stale and is updated.
