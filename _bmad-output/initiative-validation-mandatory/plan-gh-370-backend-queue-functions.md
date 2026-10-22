---
title: 'Backend : feature queue en fonctions et layout uniforme (#370)'
type: 'refactor'
ticket: 'https://github.com/Elnop/music-room/issues/370'
created: '2026-10-22'
status: 'built'
baseline_revision: '348558c94209637077f87a61cbf820e151c2a930'
route: 'full'
route_source: 'auto'
risk: 'high'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md', '{project-root}/docs/superpowers/specs/2026-10-21-clean-codebase-refactor-design.md', '{project-root}/.agents/rules/structure.md', '{project-root}/.agents/rules/architecture.md', '{project-root}/.agents/rules/logging.md', '{project-root}/.agents/rules/guardrails.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #370, epic #362. The `queue` backend feature still uses classes instantiated once, `try/catch` controllers and files over ~150 lines, unlike the pattern #367 set for auth.

**Approach:** Apply the "Backend feature" pattern of `.agents/rules/structure.md` (set by #367) to `queue`:
- services are modules of exported functions under `services/`, imported by namespace;
- handlers are exported functions with no `try/catch`, and routes pass them directly;
- input types come from `z.infer`, and DTOs that duplicate the validators go;
- every file is under 150 lines;
- tests follow the code.

## Boundaries & Constraints

**Always:**
- Same endpoints, middleware order, status codes, error `code`s, messages, response bodies and Socket.io emissions as on `develop`.
- `npm run check` green; prune the exception entries this fixes (ESLint suppressions, depcruise baseline, jscpd `ignore`), and never add any.
- Coverage of `src/features/queue` (by `vitest run --coverage`) is at least the baseline taken before the change. Unit and integration tests pass (`npm run test:int` on the local stack, `sh scripts/test-db.sh up`).
- Imports of this feature from other features or `realtime/` are updated, not wrapped.

**Never:**
- Touch the anti-abuse code (#374) or split `realtime/index.ts` (#375) beyond import updates.
- Change behaviour to simplify code.

</frozen-after-approval>

## Code Map

- Classes: `QueueController` (`queue.controller.ts`, 131), `services/queue.service.ts` (149), `queue-transfer.service.ts` and `queue-sync.service.ts`.
- `queue-transfer.routes.ts` (14) sits next to `queue.routes.ts` (37). Keep both, or merge them if the mount allows it without changing paths. Check `shared/config/routes.ts` and `openapi-coverage.test.ts`.
- `utils/queue-rpc.ts` (146), `queue-add.ts` and `queue-play-command.ts` are already functional.
- Queue version (#285) and transfer semantics (spec `docs/superpowers/specs/2026-10-14-queue-delegation-connect-design.md`) must not change.
- External importers: `grep -rn "features/queue" backend/src --include='*.ts' | grep -v "src/features/queue/"`.
- Reference implementation: `backend/src/features/auth/` after #367.

## Tasks & Acceptance

**Execution:**
- [x] Record `npx vitest run --coverage src/features/queue` -- baseline.
- [x] Services, then controllers and routes, then types -- to the pattern -- uniform layout.
- [x] External importers and tests -- follow the code -- consistency.
- [x] Exception lists -- prune -- shrink-only.

**Acceptance Criteria:**
- Given `src/features/queue`, when listing it, then no `class` is left (error classes excepted), no file is over 150 lines, and the logic lives in `services/`.
- Given the feature's endpoints, when the unit and integration tests run, then they pass with the same statuses, codes and bodies as `develop`.
- Given `npm run check` in `backend/`, then it is green with fewer exception entries than on `develop`.
- Given coverage of `src/features/queue`, then it is at least the baseline.

## Implementation Notes

- Coverage baseline of `src/features/queue/**` (vitest unit): stmts 14.44 %, branches 20.93 %, funcs 7.81 %, lines 14.78 %. After: 47.65 / 32.55 / 55.35 / 48.79 (new `queue.controller.test.ts`, `services/queue.service.test.ts`, `services/queue-sync.service.test.ts`).
- Both route files are kept: merging would expose `/api/users/:userId/queue/transfer`. `step(direction)` became the `stepNext` / `stepPrevious` handlers.
- `queue.types.ts` types are `z.infer` of the response schemas in `queue.validators.ts`.
- `addTrackSchema` moved from `playlists/playlist.validators.ts` to `shared/utils/track-upsert.ts`, next to `TrackUpsertInput` (same object, same OpenAPI name), which drops the depcruise entry `queue.validators -> playlists/playlist.validators`. `TrackUpsertInput` stays an interface: `z.infer` of the schema makes `album` required (transform output).
- Design note not applied: `playlist-track.service -> queue-sync.service` stays in the depcruise baseline. `shared/` cannot reach `realtime/` or the queue RPCs, and no shared hook exists; a registration hook would make sync depend on startup wiring, which changes behaviour in tests that import the playlist service alone.

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd backend && npm run check` -- expected: all OK.
- `cd backend && sh scripts/test-db.sh up && npm run test:int; sh scripts/test-db.sh down` -- expected: all pass.
- `grep -rn "^export class\|^class " backend/src/features/queue | grep -v test` -- expected: only error classes.

## Design Notes

#368 left a dependency-cruiser known violation: `playlists/services/playlist-track.service.ts` imports `queue/services/queue-sync.service.ts` (playlist → queue sync, #278). Removing it is welcome here if it fits the cross-feature rule in `.agents/rules/architecture.md`, e.g. by moving the sync entry point into `shared/` or having the playlist side emit through an existing shared hook. Do it only if it changes no behaviour; otherwise leave the entry and note it.

### Pass 1 (quick) — high 0 / medium 0 / low 2 / false 1 / maybe-false 0

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| `TrackUpsertInput` restates `addTrackSchema` | low | patch | Breaks the no-duplicate-DTO rule; `z.input` keeps `album` optional. |
| `queue-transfer.service.ts` has no unit test | low | patch | It is the feature's most branched service; the other services gained tests. |
| Integration tests not shown to pass | false | reject | The implementer ran `npm run test:int` (40 files, 350 tests) on the local stack; CI runs it again. |
