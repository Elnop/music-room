---
title: 'Backend : feature playlists en fonctions et layout uniforme (#368)'
type: 'refactor'
ticket: 'https://github.com/Elnop/music-room/issues/368'
created: '2026-10-22'
status: 'built'
baseline_revision: 'a90063ff02db6aff9c209008db625724e79890b0'
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

**Problem:** GitHub #368, epic #362. The `playlists` backend feature still uses classes instantiated once, `try/catch` controllers and files over ~150 lines, unlike the pattern #367 set for auth.

**Approach:** Apply the "Backend feature" pattern of `.agents/rules/structure.md` (set by #367) to `playlists`:
- services are modules of exported functions under `services/`, imported by namespace;
- handlers are exported functions with no `try/catch`, and routes pass them directly;
- input types come from `z.infer`, and DTOs that duplicate the validators go;
- every file is under 150 lines;
- tests follow the code.

## Boundaries & Constraints

**Always:**
- Same endpoints, middleware order, status codes, error `code`s, messages, response bodies and Socket.io emissions as on `develop`.
- `npm run check` green; prune the exception entries this fixes (ESLint suppressions, depcruise baseline, jscpd `ignore`), and never add any.
- Coverage of `src/features/playlists` (by `vitest run --coverage`) is at least the baseline taken before the change. Unit and integration tests pass (`npm run test:int` on the local stack, `sh scripts/test-db.sh up`).
- Imports of this feature from other features or `realtime/` are updated, not wrapped.

**Never:**
- Touch the anti-abuse code (#374) or split `realtime/index.ts` (#375) beyond import updates.
- Change behaviour to simplify code.

</frozen-after-approval>

## Code Map

- `playlist.service.ts` (494, feature root) -- the core playlist CRUD. Move it into `services/` and split it by subject (create/read, update/delete, listing).
- `playlist.controller.ts` (392, 15 `try/catch`) -- split by subject (playlists, tracks, sharing).
- Classes: `PlaylistService`, `PlaylistController`, `services/viewer.service.ts` (171, split it), `collaborator.service.ts` and `playlist-track.service.ts`.
- `permissions/playlist.permissions.ts`, `utils/track-rpc.ts` and `utils/playlist.helpers.ts` are already under 150 lines; keep them, converting them to functions if they hold classes.
- `playlist.types.ts` (138) -- drop the DTOs that duplicate validators.
- Concurrency: `doc/PLAYLIST_CONCURRENCY.md` (locks, version counter, RPCs). Do not change any RPC call or lock order.
- External importers: `grep -rn "features/playlists" backend/src --include='*.ts' | grep -v "src/features/playlists/"`.
- Reference implementation: `backend/src/features/auth/` after #367.

## Tasks & Acceptance

**Execution:**
- [x] Record `npx vitest run --coverage src/features/playlists` -- baseline.
- [x] Services, then controllers and routes, then types -- to the pattern -- uniform layout.
- [x] External importers and tests -- follow the code -- consistency.
- [x] Exception lists -- prune -- shrink-only.

**Acceptance Criteria:**
- Given `src/features/playlists`, when listing it, then no `class` is left (error classes excepted), no file is over 150 lines, and the logic lives in `services/`.
- Given the feature's endpoints, when the unit and integration tests run, then they pass with the same statuses, codes and bodies as `develop`.
- Given `npm run check` in `backend/`, then it is green with fewer exception entries than on `develop`.
- Given coverage of `src/features/playlists`, then it is at least the baseline.

## Implementation Notes

- Coverage baseline (`vitest run --coverage`, include `src/features/playlists/**`): statements 9.23%, branches 14.96%, functions 10.71%, lines 9.87%. After: 36.29%, 34.57%, 58.73%, 37.74%.
- Services: `services/playlist.service.ts` (create, read by id), `playlist-update.service.ts` (update, delete), `playlist-listing.service.ts` (three lists), `viewer.service.ts` (add, remove) and `viewer-list.service.ts` (list); the three lists share `services/playlist-summaries.service.ts` (same queries, same order), with the pure mapping in `utils/playlist-summaries.ts` and the member-profile helpers (`OWNER_COLUMNS`, `toOwner`) in `utils/playlist.helpers.ts`.
- Controllers split into `playlist.controller.ts`, `playlist-tracks.controller.ts` and `playlist-sharing.controller.ts`, matching the openapi files; each has a unit test.
- `addTrack` handler: the try/catch and the debug/error logs of the request body are gone (logging.md forbids logging a request body; `errorHandler` logs the failure). Statuses and bodies are unchanged.
- The track service takes the shared `TrackUpsertInput` (as queue does): `z.infer<typeof addTrackSchema>` makes `album` a required key because of its transform.
- Response types are inferred from `playlist-responses.validators.ts`; `CreatePlaylistInput` is `z.input` so callers may omit the defaulted fields, as before.
- `queue.service.int.test.ts` deletes its playlist with a direct row delete instead of `deletePlaylist`, which would have added a cross-feature import (depcruise count stays at 61).
- Exception lists: 2 jscpd `ignore` globs removed; depcruise baseline regenerated (paths renamed, same count).

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd backend && npm run check` -- expected: all OK.
- `cd backend && sh scripts/test-db.sh up && npm run test:int; sh scripts/test-db.sh down` -- expected: all pass.
- `grep -rn "^export class\|^class " backend/src/features/playlists | grep -v test` -- expected: only error classes.

### Pass 1 (quick) — high 0 / medium 0 / low 3 / false 0 / maybe-false 0

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| Supabase queries in `utils/playlist-summaries.ts`, against "logic lives in services/" | low | patch | Breaks the placement rule the AC states; move the data access into a service. |
| Member-profile mapping imported from the list-summaries module | low | patch | Misleading module; move the mapping into `playlist.helpers.ts`. |
| Stale controller reference in `doc/TESTING_SECURITY.md:136` | low | patch | Doc fix. |
