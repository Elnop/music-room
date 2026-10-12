---
title: 'Profile and privacy route tests (backend)'
type: 'chore'
ticket: '5'
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

**Problem:** The `/api/profile` routes (own profile, update, search, privacy, music preferences, a third party's profile) have no tests. Nothing would catch a `friends_only` field leaking to a non-friend (GitHub #98, epic API & mobile).

**Approach:** Add one Vitest unit file that mounts `profile.routes.ts` on a bare Express app listening on port 0, driven with `fetch` (like the existing integration tests), with the real `errorHandler`. It mocks `authMiddleware`, `@/shared/config/supabase.js` and the logger. The real controller and services run, so the public / friends / private filtering of `GET /api/profile/:userId` goes through `PrivacyService` exactly as in production.

## Boundaries & Constraints

**Always:** Tests only, unit kind (`*.test.ts`, run by `npm test`, no network, no secret). Mock the Supabase client, never the profile services: the guard under test lives in `PrivacyService`. Use a per-table fake query builder: chainable `select/eq/neq/in/or/limit/update/insert` plus a `single()` / thenable that resolves the result the test set for that table, and `auth.admin.getUserById`. Reset all mocks in `beforeEach`. Decision (2026-10-10, human): no Supertest; drive the app with `fetch` on an `http.Server` listening on port 0, closed in `afterAll`. No new dependency.

**Never:** No production code change. Do not test `PrivacyService.getFilteredProfile` directly or against the local Supabase stack: #206 covers that with integration tests. Do not edit `profile.openapi.ts`, even though its privacy schema is wrong (see Design Notes).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Third party, all public | viewer B, target A, no follows | 200 with `bio`, `avatarUrl`, `musicPreferences`, `isFriend: false` | No error expected |
| `friends_only`, non-friend | bio/avatar/music `friends_only`, only B follows A (one way) or no follows | `bio`, `avatarUrl`, `musicPreferences` keys absent | No error expected |
| `friends_only`, mutual friends | both follow rows present | fields present, `isFriend: true` | No error expected |
| `private`, mutual friend | all `private` | fields and `email` absent; `getUserById` not called | No error expected |
| Own profile by id | viewer = target, all `private` | every field present, `isOwnProfile: true` | No error expected |
| Unknown target | `user_profiles` single returns an error | 404 `PROFILE_NOT_FOUND` | errorHandler |
| No privacy row | `profile_privacy` returns `PGRST116` | defaults: email hidden, others public; no insert for a third party | No error expected |
| Invalid bodies | PATCH `displayName: '   '` or over 15 chars; PUT privacy `bioVisibility: 'friends'`; PUT music 6 genres or a duplicate; search without `q` | 400 `VALIDATION_ERROR`, service not reached | errorHandler (ZodError) |
| No auth | request without the test user header | 401 from the mocked middleware | mocked middleware |

</frozen-after-approval>

## Code Map

- `backend/src/features/profile/profile.routes.ts` -- router under test; `router.use(authMiddleware)`; `/search`, `/privacy`, `/music-preferences(/genres)` are declared before `/:userId`.
- `backend/src/features/profile/profile.controller.ts` -- Zod parse then service call; `{ success, data, meta }` responses.
- `backend/src/features/profile/services/privacy.service.ts:157-170` -- `isFieldVisible` (guard: `case 'friends_only': return isFriend;` at :163-164); `:183-254` `getFilteredProfile` (field gates :218, :235-249); `:259-285` `checkFriendship` (mutual follows, `follows.length < 2` early return, :281).
- `backend/src/features/profile/services/profile.service.ts` -- `getProfile` (`fetchSingle` + `auth.admin.getUserById`), `updateProfile`, `searchUsers` (`.or(...).limit()`, `.neq('id', requester)`).
- `backend/src/features/profile/services/music-preferences.service.ts` -- get/update music preferences, `getAvailableGenres`.
- `backend/src/features/profile/profile.validators.ts` -- displayName ≤ 15 and not blank, bio ≤ 300, `friends_only` enum, ≤ `MAX_GENRES` unique genres, `q` 1-100, `limit` 1-50.
- `backend/src/shared/utils/database.helpers.ts:23` -- `fetchSingle` uses `client.from(t).select().eq().single()`, 404 on error.
- `backend/src/shared/middleware/error-handler.ts` -- maps `ZodError` and `AppError`.
- `backend/src/features/auth/auth.controller.test.ts`, `music-control/services/device.service.test.ts` -- `vi.hoisted` + `vi.mock` patterns for services, Supabase and logger.
- `backend/vitest.config.ts`, `src/test/setup-env.ts` -- unit config and placeholder env.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/features/profile/profile.routes.test.ts` -- build the app (`express.json()`, `/api/profile` router, `errorHandler`). Mock `authMiddleware` so it sets `req.user = { id }` from a test header and answers 401 without it. Add the fake Supabase builder and one `describe` per route group covering the I/O matrix, plus the happy paths: GET/PATCH own profile (the PATCH reaches `user_profiles.update` with snake_case fields), search (excludes the requester and passes `limit`), GET/PUT privacy (no row: own GET inserts defaults), GET/PUT music preferences, GET genres.
- [ ] Same file -- one parameterized case per `friends_only` field (bio, avatar, music preferences, email) for a non-friend, checked with `not.toHaveProperty`, so each gate fails on its own.

**Acceptance Criteria:**
- Given the new file, when `npm test` runs in `backend/`, then every test passes and nothing reaches the network.
- Given `privacy.service.ts:164` temporarily changed to `return true;`, when `npm test` runs, then at least one `friends_only` non-friend test fails. The implementer records the failing test names in Implementation Notes, then reverts the change.
- Given `checkFriendship` temporarily changed to return true on a one-way follow (e.g. `user1FollowsUser2 || user2FollowsUser1` at :281), when `npm test` runs, then the one-way follow case fails. The change is reverted.
- Given the change, then `git diff --stat` lists only the test file, `package.json` and `package-lock.json`.

## Implementation Notes

- `profile.routes.test.ts`: 41 tests, all pass; full `npm test` 252/252, `type-check` and `lint` clean. No production code or dependency change (`git diff --stat` empty apart from the new test file).
- Guard 1 (`privacy.service.ts:164` → `return true;`): 9 failures — `friends_only field, viewer with no follow > hides {bio, avatarUrl, musicPreferences, email}`, `friends_only field, viewer with a one-way follow (viewer follows target) > hides {bio, avatarUrl, musicPreferences, email}`, `hides all friends_only fields from a one-way follower`. Reverted, 41/41 pass.
- Guard 2: changing only `&&` to `||` at :281 fails nothing, because the `follows.length < 2` early return (:270) already rejects a one-way follow, and migration `007_follows.sql` forbids self-follows (`no_self_follow`), so a one-way follow always yields one row. That mutant is equivalent. With the mutation that really returns true on a one-way follow (`length < 1` at :270 plus `||` at :281): 5 failures — the 4 `viewer with a one-way follow > hides …` cases and `hides all friends_only fields from a one-way follower`. Reverted, 41/41 pass.

## Plan Change Log

## Review Triage Log

Quick review, 6 findings: 4 patched, 2 rejected.

- low, patched: the plan's "own GET inserts defaults" case was not tested (`GET /privacy` cannot insert; `GET /:userId` as the owner can); added a test asserting one `profile_privacy` insert for ALICE.
- low, patched: the test server listened on every interface; now `127.0.0.1`.
- low, patched: one-way follow covered only viewer → target; added target → viewer to the `friends_only` matrix. File: 46/46.
- low, patched: doc/TESTING.md route-test line named a token and omitted the loopback host; reworded.
- rejected: the acceptance bullet listing allowed files does not include doc/TESTING.md; the doc change follows the human no-Supertest decision recorded in the frozen block.
- low, rejected: Code Map line range for `getFilteredProfile` off by a few lines.

Guard 2 note (from implementation): mutating only `&&`→`||` at privacy.service.ts:281 is unobservable (the `length < 2` early return already rejects one-way follows); the guard check used `length < 1` plus `||`, failing 5 tests.

## Design Notes

These tests stay at the route level because the controller and validators sit in front of the filtering. #206 checks `getFilteredProfile` against real tables, and this file checks what the HTTP response exposes. The fake builder should record calls (`from` table and `eq`/`in` arguments) so the friendship case can assert that both follow directions were queried.

Out of scope, found while planning: in `profile.openapi.ts:386-415` the `PrivacySettings` schemas describe `profileVisibility: public|friends|private`, `showEmail` and `showListeningActivity`. The real API uses `emailVisibility`, `bioVisibility`, `avatarVisibility` and `musicPreferencesVisibility` with `public|friends_only|private`. Separately, `profile.service.ts:132` puts the raw `q` into a PostgREST `.or()` filter. Both should go to a ticket, not into this change.

## Verification

**Commands:**
- `cd backend && npm test` -- expected: all pass, including `profile.routes.test.ts`.
- `cd backend && npm run type-check` -- expected: no errors.
- `cd backend && npm run lint` -- expected: no errors.
