---
title: 'Playlist CRUD and permission tests (backend)'
type: 'chore'
ticket: '7'
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
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The permission matrix (`canViewPlaylist` / `canEditPlaylist`, 4 visibility × edit_mode cases) already has unit tests, but nothing covers playlist create/read/update/delete, the public and per-user lists, or collaborator and viewer management. Nothing checks end to end that a viewer added through `ViewerService` is refused edits in restricted mode (GitHub #92, epic #85, CAP-3).

**Approach:** Extend the unit file `playlist.permissions.test.ts` with explicit viewer-in-restricted cases and `checkOwnership`. Add one integration file, `playlist.service.int.test.ts`, that drives `PlaylistService`, `CollaboratorService`, `ViewerService` and `PlaylistTrackService.addTrack` against the local Supabase stack. The list filters (`or(...cs...)`), array updates and delete cascade live in PostgREST and Postgres, so integration is the right level for them.

## Boundaries & Constraints

**Always:** Tests only. Reuse the patterns of `services/playlist-track.int.test.ts`: `createUser` through `auth.admin`, a `user_profiles` insert, a mocked `@/realtime/index.js` (`notifyPlaylistUpdate`, `revalidatePlaylistRoom`), dynamic imports after `vi.mock`, and `afterAll` cleanup that deletes the users (cascade) plus any `tracks` rows under a random URI prefix. Each test creates its own playlist and depends on no other test. Use the `.js` import extension and `@/` aliases. No `any`.

**Never:** No production code change. If a bug blocks a test, record it under Open Questions and open a ticket; do not fix it here. No route/Supertest layer, no mobile change, no Music Track Vote.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Create defaults | `createPlaylist(owner, {name})` | `visibility: 'public'`, `editMode: 'open'`, trackCount 0 | none |
| Read private | private playlist, stranger | `getPlaylistById` rejects | 403 `PLAYLIST_ACCESS_DENIED` |
| Read missing | random uuid | rejects | 404 `PLAYLIST_NOT_FOUND` |
| Lists | owner / collaborator / viewer / stranger | `getUserPlaylists` includes it for the first three only; `getPublicPlaylists` shows public ones but not the caller's own; `getPlaylistsByUser` hides private ones from a stranger and from an anonymous caller | none |
| Update / delete by non-owner | a collaborator calls them | rejects; row unchanged / still present | 403 |
| Delete by owner | owner | row gone; `revalidatePlaylistRoom` called | none |
| Collaborators | add twice / unknown user / non-owner / remove | 409 `ALREADY_COLLABORATOR` / 404 `USER_NOT_FOUND` / 403 / id removed | as listed |
| Viewers | add owner / add collaborator / add twice / remove / list | 400 `OWNER_CANNOT_BE_VIEWER` / 409 `ALREADY_COLLABORATOR` / 409 `ALREADY_VIEWER` / removed / `getViewers` returns profiles | as listed |
| Viewer edits | viewer added via `ViewerService`, `addTrack` on private+restricted and public+restricted | rejects, no row added; the same viewer succeeds once `edit_mode` is `open` | 403 |

</frozen-after-approval>

## Code Map

- `backend/src/features/playlists/permissions/playlist.permissions.ts:39-53` -- `canEditPlaylist`; the guard: in non-open mode, after owner and collaborator checks, it returns `false` (line 52) instead of falling back to `canViewPlaylist` (line 48-49). `checkEditPermission` (78-97) and `checkOwnership` (58-72) wrap it with DB reads.
- `backend/src/features/playlists/permissions/playlist.permissions.test.ts` -- 1.7's unit file; matrix + `checkEditPermission` with a mocked `single`. Extend it here.
- `backend/src/features/playlists/playlist.service.ts` -- `getUserPlaylists`, `getPlaylistsByUser(target, current?)`, `getPublicPlaylists(current)` (limit 50, excludes caller), `getPlaylistById(id, userId?)`, `createPlaylist`, `updatePlaylist` / `deletePlaylist` (owner only, call `realtime.revalidatePlaylistRoom`).
- `backend/src/features/playlists/services/collaborator.service.ts`, `services/viewer.service.ts` -- owner-only add/remove/list with the error codes in the matrix.
- `backend/src/features/playlists/services/playlist-track.service.ts:27` -- `addTrack` calls `checkEditPermission`.
- `backend/src/features/playlists/services/playlist-track.int.test.ts` -- setup, cleanup and `rejection()` helper to copy.
- `backend/vitest.int.config.ts` -- picks up `src/**/*.int.test.ts` and runs files one after another.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/features/playlists/permissions/playlist.permissions.test.ts` -- add a named test: "a viewer cannot edit a restricted playlist" (public and private), for `canEditPlaylist` and `checkEditPermission` (403). Add `checkOwnership` cases: owner resolves, other user 403, missing 404 -- makes the acceptance check explicit at unit level.
- [x] `backend/src/features/playlists/playlist.service.int.test.ts` -- new integration file covering every row of the I/O matrix, with users owner, collaborator, viewer and stranger, and a public playlist owned by another user for `getPublicPlaylists` -- CRUD, lists, members and the end-to-end viewer edit refusal.

**Acceptance Criteria:**
- Given the local stack is up, when `npm run test:int` runs, then the new file passes; `npm test` passes with the extended unit file.
- Given `canEditPlaylist` is temporarily changed to return `canViewPlaylist(playlist, userId)` for every edit mode (guard removed), when `npm test` and `npm run test:int` run, then at least one unit test and the integration viewer-edit test fail. The implementer runs this, records the failing test names in Implementation Notes, and then reverts the change.
- Given the change is finished, then `git diff` touches only the two test files and this plan.

## Implementation Notes

- Unit file: added "a viewer cannot edit a restricted playlist (public|private)" for `canEditPlaylist` and `checkEditPermission` (403), plus `checkOwnership` (owner resolves; collaborator, viewer, stranger 403; missing 404). 21 tests.
- Integration file `playlist.service.int.test.ts`: 17 tests over five users (owner, collaborator, viewer, stranger, other owner); members are added through `CollaboratorService` / `ViewerService`. The owner-delete test also adds a track and checks that `playlist_tracks` is emptied by the cascade.
- Guard-removal check (`canEditPlaylist` returning `canViewPlaylist(...)` in every mode), then reverted:
  - unit, 7 failures: `canEditPlaylist > public/restricted`, `> private/restricted`, `> a viewer cannot edit a restricted playlist (public)`, `(private)`; `checkEditPermission > rejects when the user cannot edit`, `> a viewer cannot edit a restricted playlist (public): 403`, `(private): 403`.
  - integration, 2 failures: `viewer edit rights (CAP-3) > a viewer cannot add a track to a private restricted playlist, but can once it is open`, and the same for `public`.
  - all pass again once restored.
- No production bug found; no Open Questions.

## Plan Change Log

## Review Triage Log

Quick review, 4 findings: 1 low patched, 3 rejected.

- low, patched: the non-owner 403 tests for collaborators and viewers checked only `statusCode`; they now check `code: 'PLAYLIST_ACCESS_DENIED'`, and the viewer test checks `viewer_ids` is unchanged. File re-run: 17/17.
- low, rejected: `getPublicPlaylists` returns the 50 newest public playlists, so 50+ public playlists created concurrently by other runs could hide the test's one; CI runs files sequentially on a fresh database, so it does not happen in practice.
- rejected: unticked task boxes in the plan (plan bookkeeping, ticked at finalization).
- false: AC2 unverifiable from the diff; the recorded 7 unit + 2 integration failures match what removing the guard does.

## Design Notes

Integration rather than mocked unit tests for the services: mocking 4–5 chained `supabaseAdmin` calls per method would test the mock. The `cs` array filters, the `or` visibility filter and the cascade on delete only exist in PostgREST and Postgres. These tests run in `make test-int` and the CI `test-int` job, not in `make test`.

## Verification

**Commands:**
- `cd backend && npm test` -- expected: all unit tests pass.
- `make test-db-up && cd backend && npm run test:int` -- expected: all integration tests pass, including the new file.
- `cd backend && npm run type-check && npm run lint` -- expected: clean.
