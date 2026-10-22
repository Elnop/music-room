---
title: 'Backend : feature profile en fonctions et layout uniforme (#369)'
type: 'refactor'
ticket: 'https://github.com/Elnop/music-room/issues/369'
created: '2026-10-22'
status: 'built'
baseline_revision: '4d71de55250342853b251fc54aebc1b17da953bb'
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

**Problem:** GitHub #369, epic #362. The `profile` backend feature still uses classes instantiated once, `try/catch` controllers and files over ~150 lines, unlike the pattern #367 set for auth.

**Approach:** Apply the "Backend feature" pattern of `.agents/rules/structure.md` (set by #367) to `profile`:
- services are modules of exported functions under `services/`, imported by namespace;
- handlers are exported functions with no `try/catch`, and routes pass them directly;
- input types come from `z.infer`, and DTOs that duplicate the validators go;
- every file is under 150 lines;
- tests follow the code.

## Boundaries & Constraints

**Always:**
- Same endpoints, middleware order, status codes, error `code`s, messages, response bodies and Socket.io emissions as on `develop`.
- `npm run check` green; prune the exception entries this fixes (ESLint suppressions, depcruise baseline, jscpd `ignore`), and never add any.
- Coverage of `src/features/profile` (by `vitest run --coverage`) is at least the baseline taken before the change. Unit and integration tests pass (`npm run test:int` on the local stack, `sh scripts/test-db.sh up`).
- Imports of this feature from other features or `realtime/` are updated, not wrapped.

**Never:**
- Touch the anti-abuse code (#374) or split `realtime/index.ts` (#375) beyond import updates.
- Change behaviour to simplify code.

</frozen-after-approval>

## Code Map

- `services/privacy.service.ts` (331) -- split it, e.g. into settings read/write and the visibility filtering.
- `profile.controller.ts` (312, 11 `try/catch`) -- split by subject (profile, avatar, privacy, preferences, search).
- `services/music-preferences.service.ts` (200) -- split it.
- Classes: `ProfileController`, `AvatarService`, `ProfileService`, `MusicPreferencesService`, `PrivacyService` and `ProfileSearchService`.
- `profile.types.ts` (174) -- drop the DTOs that duplicate validators.
- `permissions/search-visibility.ts` and `utils/avatar-upload.ts` / `image-type.ts` stay as they are, beyond the style change.
- External importers: `grep -rn "features/profile" backend/src --include='*.ts' | grep -v "src/features/profile/"`.
- Reference implementation: `backend/src/features/auth/` after #367.

## Tasks & Acceptance

**Execution:**
- [x] Record `npx vitest run --coverage src/features/profile` -- baseline.
- [x] Services, then controllers and routes, then types -- to the pattern -- uniform layout.
- [x] External importers and tests -- follow the code -- consistency.
- [x] Exception lists -- prune -- shrink-only.

**Acceptance Criteria:**
- Given `src/features/profile`, when listing it, then no `class` is left (error classes excepted), no file is over 150 lines, and the logic lives in `services/`.
- Given the feature's endpoints, when the unit and integration tests run, then they pass with the same statuses, codes and bodies as `develop`.
- Given `npm run check` in `backend/`, then it is green with fewer exception entries than on `develop`.
- Given coverage of `src/features/profile`, then it is at least the baseline.

## Implementation Notes

- Coverage of `src/features/profile` (unit): baseline 75.36 % statements, 69.09 % branches, 94.36 % functions, 75.74 % lines; after 86.25 / 82.21 / 94.73 / 85.71. The thin controllers lost covered lines, so `profile.routes.test.ts` gained route-level cases for missing rows, failing queries and unexpected client errors (each keeps its endpoint's error `code`).
- `privacy.service.ts` became `services/privacy-settings.service.ts` (read/write) and `services/filtered-profile.service.ts` (`getFilteredProfile`, friendship); `isFieldVisible` moved to `permissions/field-visibility.ts`, shared with `search-visibility.ts`; the genre filter shared by both services is `utils/music-genres.ts`.
- Controllers: `profile.controller.ts` (own profile, update, search, by id), `profile-avatar.controller.ts`, `profile-settings.controller.ts` (privacy, music preferences, matching `profile-settings.openapi.ts`).
- `MUSIC_GENRES` / `MAX_GENRES` moved to `profile.validators.ts` (`musicGenreSchema = z.enum(MUSIC_GENRES)`), so `profile.types.ts` infers every response type from `profile-responses.validators.ts` without a cycle. `OwnProfile` replaces `ProfileUpdateResponse`; the DTOs are `UpdateProfileInput`, `UpdatePrivacyInput`, `UpdateMusicPreferencesInput`. `UpdateProfileDTO.favoriteArtist` is gone: the schema never accepted it (Zod strips it), so its write branch was dead.
- Service `try/catch` that turn an unexpected error into a 500 with the endpoint's `code` stay, as in auth and playlists.
- `avatar.int.test.ts` moved from `services/` to the feature root (it drives the router), which removes its `services-not-to-controller` baseline entry; `privacy.int.test.ts` follows the code as `services/filtered-profile.int.test.ts`.
- Exceptions pruned: 4 jscpd `ignore` globs, 1 depcruise known violation. No ESLint suppression concerned profile.

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd backend && npm run check` -- expected: all OK.
- `cd backend && sh scripts/test-db.sh up && npm run test:int; sh scripts/test-db.sh down` -- expected: all pass.
- `grep -rn "^export class\|^class " backend/src/features/profile | grep -v test` -- expected: only error classes.

### Pass 1 (quick) — high 0 / medium 0 / low 2 / false 0 / maybe-false 0

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| `it.each` titles in `profile.routes.test.ts` fill their placeholders in the wrong order | low | patch | Verified with `--reporter=verbose`; the names mislead anyone reading a failure. |
| `profile-avatar.controller.ts` has no matching OpenAPI file; the avatar routes stay in `profile.openapi.ts` | low | patch | Breaks the controller/openapi pairing rule. |
| Integration tests not run by the reviewer | — | — | Not a finding: the implementer ran 350/350, and CI runs them. |
