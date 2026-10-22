---
title: 'Backend : feature friends en fonctions et layout uniforme (#372)'
type: 'refactor'
ticket: 'https://github.com/Elnop/music-room/issues/372'
created: '2026-10-22'
status: 'built'
baseline_revision: 'a9717893df22e23b1e53760e47a06654fa209151'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md', '{project-root}/docs/superpowers/specs/2026-10-21-clean-codebase-refactor-design.md', '{project-root}/.agents/rules/structure.md', '{project-root}/.agents/rules/architecture.md', '{project-root}/.agents/rules/logging.md', '{project-root}/.agents/rules/guardrails.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #372, epic #362. The `friends` backend feature still uses classes instantiated once, `try/catch` controllers and files over ~150 lines, unlike the pattern #367 set for auth.

**Approach:** Apply the "Backend feature" pattern of `.agents/rules/structure.md` (set by #367) to `friends`:
- services are modules of exported functions under `services/`, imported by namespace;
- handlers are exported functions with no `try/catch`, and routes pass them directly;
- input types come from `z.infer`, and DTOs that duplicate the validators go;
- every file is under 150 lines;
- tests follow the code.

## Boundaries & Constraints

**Always:**
- Same endpoints, middleware order, status codes, error `code`s, messages, response bodies and Socket.io emissions as on `develop`.
- `npm run check` green; prune the exception entries this fixes (ESLint suppressions, depcruise baseline, jscpd `ignore`), and never add any.
- Coverage of `src/features/friends` (by `vitest run --coverage`) is at least the baseline taken before the change. Unit and integration tests pass (`npm run test:int` on the local stack, `sh scripts/test-db.sh up`).
- Imports of this feature from other features or `realtime/` are updated, not wrapped.

**Never:**
- Touch the anti-abuse code (#374) or split `realtime/index.ts` (#375) beyond import updates.
- Change behaviour to simplify code.

</frozen-after-approval>

## Code Map

- `services/friends.service.ts` (240, class) -- split it, e.g. into follow/unfollow, lists and stats.
- `friends.controller.ts` (112, class, 5 `try/catch`).
- `friends.validators.ts` was created by #366 for params and responses. The routes do not validate their params today: make them parse `friends.validators.ts`, keeping the current status and code for a bad id (check what the RPC/DB returns today, and keep it).
- `utils/listening-access.ts` (42) -- the `realtime` feature uses it; keep its exports.
- External importers: `grep -rn "features/friends" backend/src --include='*.ts' | grep -v "src/features/friends/"`.
- Reference implementation: `backend/src/features/auth/` after #367.

## Tasks & Acceptance

**Execution:**
- [x] Record `npx vitest run --coverage src/features/friends` -- baseline.
- [x] Services, then controllers and routes, then types -- to the pattern -- uniform layout.
- [x] External importers and tests -- follow the code -- consistency.
- [x] Exception lists -- prune -- shrink-only.

**Acceptance Criteria:**
- Given `src/features/friends`, when listing it, then no `class` is left (error classes excepted), no file is over 150 lines, and the logic lives in `services/`.
- Given the feature's endpoints, when the unit and integration tests run, then they pass with the same statuses, codes and bodies as `develop`.
- Given `npm run check` in `backend/`, then it is green with fewer exception entries than on `develop`.
- Given coverage of `src/features/friends`, then it is at least the baseline.

## Implementation Notes

- Coverage baseline of `src/features/friends/**` (vitest unit): stmts 3.47 %, branches 3.84 %, funcs 4.54 %, lines 3.03 %. After: 75.49 / 93.47 / 86.66 / 73.11 (new `friends.controller.test.ts`, `services/follow-status.service.test.ts`, `services/follow.service.test.ts`, `services/mutual-friends.service.test.ts`; the old `friends.service.test.ts` case moved into `follow.service.test.ts`).
- `services/friends.service.ts` split into `follow-status.service.ts` (`getFollowStatus`, `getMyStats`), `follow.service.ts` (`followUser`, `unfollowUser`) and `mutual-friends.service.ts` (`getMutualFriends`). Each keeps its "unexpected error -> 500 `<CODE>`" wrapper through `failUnexpected`, moved from `music-control/services/control-switch.service.ts` to `shared/utils/fail-unexpected.ts` (made generic) so both features share it instead of a jscpd clone.
- Bad `:userId`: on `develop` the DB lookup answered it, so status -> 500 `FOLLOW_STATUS_ERROR`, follow -> 404 `USER_NOT_FOUND`, unfollow -> 500 `UNFOLLOW_ERROR` (checked with a new int test run against the baseline revision). The controller now `safeParse`s `friendUserParamsSchema` and throws those same errors without a lookup. The schema accepts exactly the input forms of the Postgres `uuid` type (hyphens optional after any group of 4 hex digits, optional braces), so every id the lookup accepted on `develop` still answers 200 (int test with a hyphenless and a braced id); the OpenAPI meta keeps `format: uuid`.
- `friends.types.ts`: `Friend`, `FriendStats`, `FollowStatus`, `FollowActionResponse` are `z.infer` of the response schemas (`success` becomes the literal `true`, the value always sent).
- External importers: `music-control` `control-switch`, `controllable-devices`, `device-license` services and `realtime/music-control-access.int.test.ts` import the function modules by namespace; `control-switch.service.test.ts` mocks `follow-status.service.js`.
- Exceptions: jscpd `ignore` loses `friends.controller.ts`; the depcruise baseline is regenerated (still 59: the music-control -> friends imports point to the new modules). No friends ESLint suppression existed.

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd backend && npm run check` -- expected: all OK.
- `cd backend && sh scripts/test-db.sh up && npm run test:int; sh scripts/test-db.sh down` -- expected: all pass.
- `grep -rn "^export class\|^class " backend/src/features/friends | grep -v test` -- expected: only error classes.

## Design Notes

`music-control` (after #371) still instantiates `new FriendsService()` in `services/control-switch.service.ts`, `controllable-devices.service.ts` and `device-license.service.ts`. Convert those call sites to the friends function module here, as import updates.

### Pass 1 (quick) — high 0 / medium 1 / low 1 / false 1 / maybe-false 0

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| `z.guid()` rejects uuid spellings Postgres accepts (no hyphens, braces), which answered 200 on develop | medium | patch | Breaks the frozen "same statuses" rule; accept exactly the Postgres uuid input forms and test them. |
| Formatting edit of the `CANNOT_LICENSE_SELF` throw in music-control | low | patch | Outside the ticket; revert it. |
| Integration tests not run by the reviewer | false | reject | The implementer ran 351/351 on this repo's test stack (`scripts/test-db.sh`), and the new int test passed on the base revision too. |
