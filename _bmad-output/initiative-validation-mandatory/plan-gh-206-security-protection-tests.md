---
title: 'Integration tests for account lockout, IP blacklist, code attempt limits and privacy filter'
type: 'chore'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: '35641158ca69994d63108ce36cd47c9d375a1e18'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/doc/TESTING.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Threat-model gap L9 (#67, GitHub #206): no test covers the account lockout (`brute-force.service.ts`, `checkAccountLockout`), the IP blacklist (`checkIPBlacklist`), the max attempts on email-verification and password-reset codes, or `PrivacyService.getFilteredProfile`. Any of them could be switched off and CI would stay green.

**Approach:** Add `*.int.test.ts` integration tests on the local Supabase stack and the test Redis. Each test sends HTTP requests through the real auth router (throwaway Express app + `fetch`, the way `email-verification.int.test.ts` does it) or calls `PrivacyService` directly. Every protection gets a test that fails when that protection is removed.

## Boundaries & Constraints

**Always:** Follow `doc/TESTING.md`. Set env values with `vi.hoisted` before any import: `RATE_LIMIT_ENABLED=true`, `ACCOUNT_LOCKOUT_ENABLED=true`, and loopback whitelisted (`RATE_LIMIT_WHITELIST_IPS='127.0.0.1,::1,::ffff:127.0.0.1'`) so the express-rate-limit limiters (`loginRateLimiter`, `globalAuthRateLimiter`) skip. The whitelist does not affect `RateLimiterService` or `bruteForceService`. Mock `@/features/mail/mail.service.js`. Each test creates its own users and deletes them in `afterAll`. Clean the Redis keys each test touches (`failed_login:*`, `account_locked:*`, `ip_failed_logins:*`, `ip_blacklist:*`, `email_verify_attempts:*`, `password_reset_attempts:*`) in `beforeEach`/`afterAll`. Call `connectRedis()` in `beforeAll` and `disconnectRedis()` in `finally`. Use `.js` imports through `@/`. No `any`.

**Never:** Change production code. Add Supertest: these tests use `node:http` + `fetch` like the existing int tests, so no dependency change here and nothing to align with #98. Duplicate #98's unit route tests. Test the Supabase Auth or SoundCloud rate limits.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Lockout | verified user; `ACCOUNT_LOCKOUT_THRESHOLD` (5) wrong-password `POST /api/auth/login` | each 401 `INVALID_CREDENTIALS`; next login **with the right password** → 429 `ACCOUNT_LOCKED` with `lockedUntil`, `remainingTime > 0` | — |
| Reset on success | 2 wrong passwords, then the right one | 200; Redis has no `failed_login:<email>:*` key | — |
| IP blacklist | `IP_BLACKLIST_THRESHOLD=7` (hoisted); 7 failed logins, each with a new random email (so the lockout never intercepts) | next `/api/auth/*` request, including a valid login, → 403 `IP_BLOCKED` | — |
| Email code limit | unverified user with stored code; `EMAIL_VERIFICATION_MAX_ATTEMPTS` (5) wrong `POST /verify-email` | each 400 `INVALID_CODE`; then the **right** code → 429 `RATE_LIMIT_EXCEEDED`; `email_verified` still false | — |
| Reset code limit | user with stored `password_reset_code`; 5 wrong `POST /reset-password` | each 400; then the **right** code → 429; code still stored, password unchanged | — |
| Privacy filter | target: bio `friends_only`, avatar `private`, email `private`, music `public`, all fields filled | stranger: no `bio`/`avatarUrl`/`email`, gets `musicPreferences`; friend (mutual follows): `bio`, no `avatarUrl`/`email`, `isFriend: true`; self: every field incl. `email` | — |
| One-way follow | viewer follows target, target does not follow back | treated as stranger (`isFriend: false`, no `bio`) | — |

</frozen-after-approval>

## Code Map

- `backend/src/features/auth/auth.routes.ts:19` -- `router.use(checkIPBlacklist)`; `:38` -- login chain `loginRateLimiter, checkAccountLockout, login`.
- `backend/src/features/auth/middleware/account-lockout.middleware.ts:33` -- `ACCOUNT_LOCKED` 429; `:104` -- `IP_BLOCKED` 403. Both fail open on error.
- `backend/src/shared/services/brute-force.service.ts:55` -- lock at threshold; `:150` reset; `:282` `recordIPActivity` blacklists at `ipReputation.blacklistThreshold`. Keys use `req.ip` and the raw email.
- `backend/src/features/auth/auth.controller.ts:90-112` -- `resetFailedAttempts` on success, `recordFailedAttempt` + `recordIPActivity` on failure.
- `backend/src/shared/config/rate-limit.config.ts:56-70` -- lockout and IP reputation thresholds, read from env at import.
- `backend/src/features/auth/services/email-verification.service.ts:74` -- `incrementAndCheck` before the code compare (key `email_verify_attempts:<userId>:<ip>`).
- `backend/src/features/auth/services/password-reset.service.ts:90` -- same guard, key `password_reset_attempts:<lowercased email>:<ip>`, max 5 (`:33`).
- `backend/src/shared/services/rate-limiter.service.ts:53` -- throws 429 `RATE_LIMIT_EXCEEDED`; skipped when `RATE_LIMIT_ENABLED=false`.
- `backend/src/features/profile/services/privacy.service.ts:157` `isFieldVisible`, `:175` `getFilteredProfile`, field gates `:235-249`, `checkFriendship` (mutual follows in `follows`).
- Patterns to reuse: `backend/src/features/auth/services/email-verification.int.test.ts` (router + fetch + user staging), `backend/src/features/auth/middleware/rate-limit.int.test.ts` (Redis key cleanup), `backend/src/features/auth/utils/find-auth-user.int.test.ts:152` (reset attempts, case variants: keep it, do not duplicate it).
- `backend/src/features/profile/services/privacy.int.test.ts` -- existing user staging (profile row insert triggers `profile_privacy` + `music_preferences`).

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/features/auth/middleware/account-lockout.middleware.int.test.ts` -- new file. Mounts the real `/api/auth` router and covers the Lockout, Reset on success and IP blacklist rows. Hoisted env also sets `IP_BLACKLIST_THRESHOLD=7`. Clean the brute-force keys between tests so the blacklist test does not leak into the others.
- [x] `backend/src/features/auth/services/email-verification.int.test.ts` -- add an "attempt limit" test for the Email code limit row. It reuses the existing hoisted env and helpers.
- [x] `backend/src/features/auth/services/password-reset-attempts.int.test.ts` -- new file for the Reset code limit row. Stage `password_reset_code` + expiry in `user_profiles`.
- [x] `backend/src/features/profile/services/privacy.int.test.ts` -- add a `getFilteredProfile` describe: target, stranger and friend users, privacy rows set through `supabaseAdmin`, mutual and one-way follows, and the Privacy filter and One-way follow rows checked through `new PrivacyService()`.

**Acceptance Criteria:**
- Given the test stack (`make test-db-up`), when `npm run test:int` runs, then every new test passes and the existing int tests stay green.
- Given each guard is disabled one at a time, then at least one new test fails. The implementer proves this by breaking each guard temporarily, running the suite, restoring the code, and recording the result in Implementation Notes:
  - `checkAccountLockout` removed from `auth.routes.ts:38`
  - `router.use(checkIPBlacklist)` removed (`auth.routes.ts:19`)
  - `incrementAndCheck` call removed in `email-verification.service.ts:74`
  - `incrementAndCheck` call removed in `password-reset.service.ts:90`
  - `isFieldVisible` returning `true` for `private` and `friends_only` (`privacy.service.ts:163-166`)
- Given the right credentials or code are sent after the limit, then the tests assert a refusal, not just a 429 on a wrong input. This shows the guard runs before the credential check.

## Implementation Notes

- Test users come from `supabaseAdmin.auth.admin.createUser({ email_confirm: true })` plus a `user_profiles` row with `email_verified: true` (not `register`, which leaves `email_confirm: false`, GitHub #243).
- `account-lockout.middleware.int.test.ts` cleans `failed_login:<email>:*`, `account_locked:<email>:*`, `password_reset_*:<email>:*` for every email it used, and `ip_failed_logins:<ip>` / `ip_blacklist:<ip>` for `127.0.0.1`, `::1`, `::ffff:127.0.0.1`, in `beforeEach` and `afterAll`. Thresholds are asserted (`5`, `7`) so a config drift fails loudly. The IP test also checks a second route (`forgot-password`) gets 403.
- Email code limit reads the max from `verificationConfig.maxAttempts`; reset limit hard-codes 5 (`MAX_RESET_ATTEMPTS` is private).
- One file uses about 16 Supabase password sign-ins; the local stack allows 30 per 5 min per IP (`supabase/config.toml`), so repeated back-to-back runs of the whole int suite could hit that limit.

Guard removal, one at a time (production file restored with `git checkout` after each):

| Guard removed | Failing test | Failure |
|---|---|---|
| `checkAccountLockout` on `/login` | locks the account after the threshold... | expected 200 to be 429 |
| `router.use(checkIPBlacklist)` | blacklists the IP after the threshold... | expected 200 to be 403 |
| `incrementAndCheck` in `email-verification.service.ts` | refuses even the right code once the attempt limit is reached (#206) | expected 200 to be 429 |
| `incrementAndCheck` in `password-reset.service.ts` | refuses even the right code once the attempt limit is reached | got 200 instead of 429 |
| `isFieldVisible` returning `true` for `friends_only` and `private` | stranger, mutual follower, one-way follower (3 tests) | profile has `bio` / `avatarUrl` |

Restored: the 4 files pass (19 tests); `npm test` 211 passed; `type-check`, `lint`, prettier clean.

## Plan Change Log

## Review Triage Log

Quick review, 4 findings: 1 medium patched, 1 fixed elsewhere, 2 rejected.

- medium, patched: the full integration suite was not run, and the new tests add ~16 password sign-ins to ~30 existing ones, past the local stack's `sign_in_sign_ups = 30` per 5 minutes per IP (GoTrue throttling would surface as 401). Raised to 1000 in `backend/supabase/config.toml` (test stack only) and updated tests/performance/README.md; full `make test-int` on a fresh stack: 26 files, 185 tests passed.
- fixed elsewhere: doc/TESTING.md still named Supertest; corrected by #98 (merged).
- low, rejected: two files clean their Redis keys only in `afterAll`; keys are scoped to a random email or user id, so tests in the file cannot see each other's.
- low, rejected: the `threshold toBe(5|7)` assertions cannot catch config drift since the file sets them; they still check that the hoisted env reached `rateLimitConfig`, which the blacklist test (7 instead of 50) depends on.

## Verification

**Commands:**
- `cd backend && make -C .. test-db-up && npm run test:int` -- expected: all integration tests pass.
- `cd backend && npm test` -- expected: unit tests unchanged and green.
- `cd backend && npm run type-check && npm run lint` -- expected: no errors.

