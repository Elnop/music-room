---
title: 'Backend : feature soundcloud en fonctions et layout uniforme (#373)'
type: 'refactor'
ticket: 'https://github.com/Elnop/music-room/issues/373'
created: '2026-10-22'
status: 'built'
baseline_revision: 'e0803a898d48988888aa221e9e627f6062e40ae2'
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

**Problem:** GitHub #373, epic #362. The `soundcloud` backend feature still uses classes instantiated once, `try/catch` controllers and files over ~150 lines, unlike the pattern #367 set for auth.

**Approach:** Apply the "Backend feature" pattern of `.agents/rules/structure.md` (set by #367) to `soundcloud`:
- services are modules of exported functions under `services/`, imported by namespace;
- handlers are exported functions with no `try/catch`, and routes pass them directly;
- input types come from `z.infer`, and DTOs that duplicate the validators go;
- every file is under 150 lines;
- tests follow the code.

## Boundaries & Constraints

**Always:**
- Same endpoints, middleware order, status codes, error `code`s, messages, response bodies and Socket.io emissions as on `develop`.
- `npm run check` green; prune the exception entries this fixes (ESLint suppressions, depcruise baseline, jscpd `ignore`), and never add any.
- Coverage of `src/features/soundcloud` (by `vitest run --coverage`) is at least the baseline taken before the change. Unit and integration tests pass (`npm run test:int` on the local stack, `sh scripts/test-db.sh up`).
- Imports of this feature from other features or `realtime/` are updated, not wrapped.

**Never:**
- Touch the anti-abuse code (#374) or split `realtime/index.ts` (#375) beyond import updates.
- Change behaviour to simplify code.

</frozen-after-approval>

## Code Map

- `soundcloud.service.ts` (71, feature root, class) -- move it into `services/`.
- Classes: `SoundCloudController`, `soundcloud-stream.service.ts`, `soundcloud-search.service.ts` and `utils/soundcloud-cache.ts`.
- Stream URLs are fetched on demand and never persisted (AGENTS.md).
- **Mail** is part of this story: `features/mail/mail.service.ts` (177) goes to functions and is split under 150 lines (e.g. templates vs transport); `mail.config.ts` stays. Its coverage baseline is `src/features/mail`.
- External importers: `grep -rn "features/soundcloud" backend/src --include='*.ts' | grep -v "src/features/soundcloud/"`.
- Reference implementation: `backend/src/features/auth/` after #367.

## Tasks & Acceptance

**Execution:**
- [x] Record `npx vitest run --coverage src/features/soundcloud` -- baseline.
- [x] Services, then controllers and routes, then types -- to the pattern -- uniform layout.
- [x] External importers and tests -- follow the code -- consistency.
- [x] Exception lists -- prune -- shrink-only.

**Acceptance Criteria:**
- Given `src/features/soundcloud`, when listing it, then no `class` is left (error classes excepted), no file is over 150 lines, and the logic lives in `services/`.
- Given the feature's endpoints, when the unit and integration tests run, then they pass with the same statuses, codes and bodies as `develop`.
- Given `npm run check` in `backend/`, then it is green with fewer exception entries than on `develop`.
- Given coverage of `src/features/soundcloud`, then it is at least the baseline.

## Implementation Notes

- Baseline coverage (unit, before): `src/features/soundcloud` 50% stmts / 55% branches / 50% funcs / 49.35% lines; `src/features/mail` 100%. After: soundcloud 83.2 / 88.67 / 93.75 / 82.94; mail 100%.
- `soundcloud.service.ts` (a pass-through class) is gone: the controller calls `services/soundcloud-search.service.ts` (`searchTracks`, `getTrack`) and `services/soundcloud-stream.service.ts` (`getStreamUrl`) by namespace. The soundcloud.ts client is a module constant in `utils/soundcloud-client.ts` (replaces `utils/client-extractor.ts`, same class resolution, same startup log).
- `utils/soundcloud-cache.ts` is a module (`get`, `set`, `clear`, `size`) over one Map instead of one `SoundCloudCache` per service; keys were already prefixed (`search:`, `track:`, `stream:`), so lookups are unchanged.
- Types: `SoundCloudSearchInput` = `z.infer` of the search schema; `SoundCloudTrack`, `SoundCloudSearchResult`, `StreamUrlResult` inferred from the response schemas. `SoundCloudSearchQuery` (duplicate DTO) removed; `TrackDTO` and `convertToTrackDTO` removed as dead code (no caller).
- Controller: no `try/catch`, `sendSuccess`. Logs only: the redundant catch-and-log before `next(error)` is dropped (errorHandler logs it) and two consecutive info logs merged into one; statuses, codes and bodies unchanged.
- Mail: `mail.service.ts` moved to `services/mail.service.ts` (transport + send, 47 lines), templates to `utils/mail-templates.ts` (131 lines). Auth callers use a namespace import; test mocks follow the path. AGENTS.md and doc/TESTING.md paths updated.
- Exception lists: no ESLint suppression or jscpd entry concerned this feature. The depcruise baseline was regenerated only for the moved mail path (59 entries before and after). The remaining soundcloud entries are `soundcloud.routes.ts` -> auth middleware (anti-abuse, #374) and `shared/config` -> feature routes/openapi, out of scope here; so the "fewer entries" criterion cannot be met by this story alone.

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd backend && npm run check` -- expected: all OK.
- `cd backend && sh scripts/test-db.sh up && npm run test:int; sh scripts/test-db.sh down` -- expected: all pass.
- `grep -rn "^export class\|^class " backend/src/features/soundcloud | grep -v test` -- expected: only error classes.

### Pass 1 (quick) — high 0 / medium 0 / low 1 / false 0 / maybe-false 0

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| AC "fewer exception entries" not met (depcruise baseline stays at 59) | — | accepted deviation | No soundcloud or mail entry can go in this story: `soundcloud.routes.ts` → auth middleware belongs to #374, and `shared/config` → feature routes/openapi is the composition root, which can only leave `shared/` by moving it out (raised on #375). The AC was over-specified for this feature; the check stays green and the list did not grow. |
| Lazy `let transporter` in `mail.service.ts` | low | patch | The module-constant rule; keep the lazy form only if import-time creation changes behaviour. |
