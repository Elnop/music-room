---
title: 'Tests des routes amis (backend)'
type: 'chore'
ticket: '6'
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

**Problem:** The friends feature (`/api/friends`: follow, unfollow, mutual friends list, follow status, own stats) has no test at all, so nothing proves mutual friendship works or that a self-follow is refused (GitHub #99, epic #93 "Done when" 4).

**Approach:** One integration test file drives the real friends router over HTTP against the local Supabase stack (real users, tokens and `follows` rows), covering every route including mutual friendship; one small unit test pins the service-level self-follow guard so `make test` catches its removal too.

## Boundaries & Constraints

**Always:** Integration test builds a minimal Express app (`express.json()`, `/api/friends` -> `friends.routes.ts`, `errorHandler`) on port 0 and calls it with `fetch`, like `src/realtime/music-control-access.int.test.ts` (no `server.ts` import, it listens on load). Users are created per file with `supabaseAdmin.auth.admin.createUser` + `user_profiles` insert, signed in with `supabaseAnon` (never the admin client), deleted in `afterAll`. `connectRedis()`/`disconnectRedis()` around the file (token verification limiter is Redis-backed). Each test starts from a known follow state (clean `follows` rows for its users in `beforeEach`). Unit test mocks `@/shared/config/supabase.js` and the logger, as in `device.service.test.ts`.

**Never:** No production code change (if a bug blocks a test, record it under Open Questions / a ticket instead). No new dependency (Supertest is not installed; use `fetch`). No mobile tests, no OpenAPI changes, no test of `listening-access.ts` eviction (covered by music-control tests).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| No token | any route without `Authorization` | 401 `NO_AUTH_HEADER` | — |
| Follow | A follows B | 200, `data.status` `{isFollowing:true,isFollowedBy:false,isFriend:false,followersCount:1}`; row exists | — |
| Follow twice | A follows B again | 200, still one row (23505 swallowed) | — |
| Mutual friendship | A->B and B->A | status `isFriend:true` both ways; `GET /api/friends` for A lists B (`id`, `username`) and vice versa | — |
| One-way only | A->B, no B->A | `GET /api/friends` for A and for B is `[]` | — |
| Self-follow | A follows A | 400 `SELF_FOLLOW_ERROR`; no `follows` row | — |
| Unknown target | A follows random UUID | 404 `USER_NOT_FOUND` | — |
| Unfollow | A unfollows B after mutual | 200, `isFollowing:false,isFriend:false`; B no longer in A's list | — |
| Unfollow when not following | A unfollows C | 200, no-op | — |
| Status | `GET /status/:B` | counts are B's followers/following | — |
| Stats | `GET /stats/me` | A's own `followersCount` / `followingCount` | — |

</frozen-after-approval>

## Code Map

- `backend/src/features/friends/friends.routes.ts` -- 5 routes behind `authMiddleware`: `GET /`, `GET /stats/me`, `GET /status/:userId`, `POST|DELETE /follow/:userId`.
- `backend/src/features/friends/friends.controller.ts` -- wraps results as `{ success, data, meta }`, errors via `next`.
- `backend/src/features/friends/services/friends.service.ts:100-103` -- **the guard**: `if (currentUserId === targetUserId) throw new AppError(400, ..., 'SELF_FOLLOW_ERROR')`. Line 110 target lookup -> 404; line 122 swallows 23505.
- `backend/migrations/007_follows.sql` -- PK `(follower_id, following_id)`, CHECK `no_self_follow`: without the service guard the insert fails (23514) and the route answers 500 `FOLLOW_ERROR`, so the 400 assertion still fails.
- `backend/src/features/friends/utils/listening-access.ts` -- called by unfollow; lazy-imports realtime and never throws.
- `backend/src/shared/middleware/error-handler.ts` -- `errorHandler`, `AppError`.
- `backend/src/realtime/music-control-access.int.test.ts:44-66` -- `createUser()` + anon sign-in pattern to copy.
- `backend/src/features/music-control/services/device.service.test.ts` -- unit mock pattern (`vi.hoisted`, `vi.mock` supabase + logger).

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/features/friends/friends.routes.int.test.ts` -- create users A, B, C; HTTP tests for every row of the I/O matrix; assert DB state through `supabaseAdmin.from('follows')` where the matrix says "row" -- route-level proof against the real schema.
- [x] `backend/src/features/friends/services/friends.service.test.ts` -- `followUser(id, id)` rejects with `AppError` status 400 code `SELF_FOLLOW_ERROR` and `supabase.from` is never called -- the guard is caught by `make test` and CI `test`, not only `test-int`.

**Acceptance Criteria:**
- Given the local stack is up, when `npm run test:int` runs, then the friends integration tests pass and leave no users or follows behind.
- Given the guard at `friends.service.ts:100-103` is temporarily commented out, when `npm test` and `npm run test:int -- src/features/friends` run, then the self-follow test fails in both; restoring it makes them pass (implementer records both runs in Implementation Notes, then reverts).
- Given mutual follows A<->B, when A and B each call `GET /api/friends`, then each sees the other, and after one unfollow neither does.

## Implementation Notes

- Guard check (`friends.service.ts` self-follow `if` commented out, then restored):
  - `npx vitest run src/features/friends`: 1 failed, `refuses a self-follow with 400 SELF_FOLLOW_ERROR before any query` (got AppError 500 `FOLLOW_ERROR`). Passes once restored.
  - `npx vitest run --config vitest.int.config.ts src/features/friends`: 1 failed / 10 passed, `refuses a self-follow ... and stores nothing` (`expected 500 to be 400`: the `no_self_follow` CHECK rejects the insert). 11/11 pass once restored.
- The unit mock exposes `supabase` (the alias the service imports) as well as `supabaseAdmin`.
- Cleanup checked after the run: no `intf_%` profiles left in the local stack.

## Plan Change Log

## Review Triage Log

Quick review, 2 findings: both low, rejected.

- low, rejected: if one `createUser()` in `beforeAll` rejects, users already created are not deleted in `afterAll`; only on a failed setup, against a test database that `make test-int` and CI rebuild every run, and the pattern matches the existing realtime integration tests.
- low, rejected: `afterAll` ignores the `deleteUser` error; same reasoning, cleanup failure cannot affect another run.

## Verification

**Commands:**
- `cd backend && npm test` -- expected: all unit tests pass, including `friends.service.test.ts`.
- `make test-db-up && cd backend && npm run test:int` -- expected: all integration tests pass, including `friends.routes.int.test.ts`.
- `cd backend && npm run type-check` -- expected: no errors.
- `cd backend && npm run lint` -- expected: no errors.

## Open Questions

- The worktree branch `99-friends-routes-tests` is 2 commits behind `origin/develop`: fast-forward it before setting `baseline_revision` (no choice needed unless the user objects).
