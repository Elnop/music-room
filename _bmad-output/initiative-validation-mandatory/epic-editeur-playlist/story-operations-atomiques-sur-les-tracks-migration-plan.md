---
title: 'Opérations atomiques sur les tracks (migration 016)'
type: 'feature'
ticket: '3'
created: '2026-10-09'
status: 'in-progress'
baseline_revision: '752ef263847b2614dc1194855f22fcfd366a9eb4'
route: 'full'
route_source: 'auto'
risk: 'high'
review: ''
review_source: ''
lenses_ran: []
review_loop_iteration: 0
context: ['{project-root}/doc/PLAYLIST_CONCURRENCY.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 5.3 (#88). Track order is an integer `position` renumbered on every change, with no lock and no version: concurrent moves, adds and removes can duplicate or lose tracks (subject IV.2.3). The contract (5.2) expects ranks, `tracks_version` and atomic operations that do not exist in the database.

**Approach:** Migration `backend/migrations/016_playlist_track_ranks.sql`, as `doc/PLAYLIST_CONCURRENCY.md` and the 5.2 contract describe: project-written rank functions (`rank_between`, `rank_after`, `rank_spaced`), `playlist_tracks.rank` (text `COLLATE "C"`, unique per playlist) replacing `position`, `moved_at_version`, `playlists.tracks_version` and `ranks_rebalanced_at_version`, and one Postgres function per operation (add, remove, move) that locks the playlist row, bumps the version, and rebalances past a length threshold. Proven by concurrency integration tests on the local stack.

**Decision (2026-10-09):** #88 and #89 ship in one branch (`88-atomic-track-operations`) and one PR: the migration drops `position`, which the current service reads. This story is the migration and its tests (one commit); #89 follows on the same branch. The human applies 016 on the hosted project right before the merge, then `make generate-types`.

## Boundaries & Constraints

**Always:** Every operation function takes the playlist row lock first (`FOR UPDATE`) and no other, so writers of one playlist serialize and cannot deadlock. Errors leave the function as `RAISE EXCEPTION '<CODE>'` with the 5.2 codes (`PLAYLIST_NOT_FOUND`, `TRACK_DUPLICATE`, `TRACK_NOT_IN_PLAYLIST`, `TRACK_MOVED_CONCURRENTLY`, `PLAYLIST_REBALANCED`). Functions executable by `service_role` only (revoked from `PUBLIC`, `anon`, `authenticated`). Existing tracks keep their order (ranks backfilled from `position`). A move changes only `rank` and `moved_at_version`; `added_by`, `added_at` untouched. Rank functions are SQL, written in the project (no extension or library).

**Never:** No change to backend TypeScript services, routes or types (that is #89); `supabase.generated.ts` is not hand-edited, and not regenerated in this commit (it comes from the hosted project). No socket change (#90). No change to migrations 001–015.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Backfill | playlist with positions 0..n | ranks increasing in the old order, unique | none |
| Add | new track | appended after the last rank, version + 1, `added_by` set | `TRACK_DUPLICATE` |
| Remove | track in playlist | row gone, version + 1 | `TRACK_NOT_IN_PLAYLIST` |
| Move to top / bottom | `afterRank` null / last rank | track at the edge, version + 1 | none |
| Concurrent moves, different tracks | N moves in parallel, same `expectedVersion` | all applied, each where its author dropped it | none |
| Concurrent moves, same track | N moves of one track in parallel | exactly one applied | others `TRACK_MOVED_CONCURRENTLY` |
| Move vs concurrent remove | move and remove of the same track in parallel | track not resurrected | move gets `TRACK_NOT_IN_PLAYLIST` if remove won |
| Moves vs adds/removes | mixed parallel operations | each track once, ranks unique | none |
| Long run into one gap | hundreds of moves into the same gap | a rebalance happens: ranks respaced, `ranks_rebalanced_at_version` set, order kept | none |
| Stale ranks after rebalance | move with `expectedVersion` < `ranks_rebalanced_at_version` | not applied | `PLAYLIST_REBALANCED` |
| Direct RPC with anon key | anon client calls an operation | refused | permission denied |

</frozen-after-approval>

## Code Map

- `_bmad-output/initiative-validation-mandatory/epic-editeur-playlist/plan-implementation.md` -- **Tâche 3** (lines ~453–700: rank functions and `track-ranks.int.test.ts`) and **Tâche 4** (lines ~701–1178: schema, `rank_max_length` = 64, `playlist_lock`, `playlist_rebalance`, the three operation functions with their signatures and jsonb results, grants, `track-operations.int.test.ts`). Full SQL and tests are written there; follow them. Its "Étape 5" steps (apply on hosted, generate types, type-check failing) are **not** part of this story: see the frozen Decision.
- `backend/migrations/016_playlist_track_ranks.sql` (new, hand-numbered like 001–015; `make migrate-create` would timestamp it).
- `backend/migrations/003_playlist_persistence.sql` -- origin of `position`, `unique_playlist_position`, `idx_playlist_tracks_playlist`, `get_next_playlist_position`; check names before dropping them.
- `backend/src/features/playlists/services/track-ranks.int.test.ts`, `track-operations.int.test.ts` (new) -- call functions by name (`rpc(fn as never, ...)`): local generated types do not know them yet.
- `backend/scripts/test-db.sh up` -- resets the local stack and applies every migration, 016 included. The stack is running; re-run `up` to apply 016, leave it running.
- Code still reading `position` (`playlist-track.service.ts`, `playlist.helpers.ts`, `playlist.service.ts`): untouched here; no integration test touches it, so the int suite stays green.

## Tasks & Acceptance

**Execution:**
- [x] `016_playlist_track_ranks.sql` -- rank functions, schema change with backfill, operation functions, grants.
- [x] `track-ranks.int.test.ts` -- rank function properties (strictly between, valid format, short keys over 200 inserts, `rank_after` growth, `rank_spaced` order, wrong-order bounds refused).
- [x] `track-operations.int.test.ts` -- every matrix row, each test asserting the invariants (each track once, ranks unique, `added_by` unchanged by moves).

**Acceptance Criteria:**
- Given the local stack reset with 016, when `npm run test:int` runs twice in a row, then every suite passes both times (concurrency tests not flaky).
- Given 016 applied, when reading the database, then no `position` column or `get_next_playlist_position` remains and `rank` is `NOT NULL` with both unique constraints.

## Verification

**Commands:**
- `cd backend && ./scripts/test-db.sh up && npm run test:int && npm run test:int` -- expected: pass twice.
- `cd backend && npm run type-check && npm run lint && npm test` -- expected: pass (no TypeScript change besides the tests).

## Implementation Notes

- SQL taken from `plan-implementation.md` Tâches 3–4, with one change: `playlist_move_track` checks in the order of `doc/PLAYLIST_CONCURRENCY.md` (track gone, then moved concurrently, then rebalanced) instead of rebalanced first.
- Threshold `rank_max_length()` = 64: measured 320 moves alternating two tracks into one gap before a rebalance. Record it on #88.
- Tests reach the functions and new columns through an untyped view of `supabaseAdmin` (`as unknown as SupabaseClient`), since local generated types predate 016; #89 can drop this once types are regenerated.
- `track-operations.int.test.ts` adds to the draft: remove happy path and `TRACK_NOT_IN_PLAYLIST`, `PLAYLIST_NOT_FOUND`, 5-way race on one track (exactly one wins), `added_at` unchanged by a move, order kept across the rebalance and `ranks_rebalanced_at_version` set, anon refused on every operation and on `rank_between`. Every test checks the invariants (each track once, ranks unique and sorted, `added_by` unchanged).
- Backfill checked by hand (not automated: `position` no longer exists after 016): 001–015 applied, two playlists seeded (70 shuffled inserts; sparse positions 2/7/40), 016 applied, 0 order mismatches, ranks unique, `rank` NOT NULL `COLLATE "C"`, both unique constraints present, `position` and `get_next_playlist_position` gone.
- Verified: `test-db.sh up`, `npm run test:int` twice (98/98 both), `npm run type-check`, `npm run lint` (0 problems), `npm test` (119/119).

## Plan Change Log

## Review Triage Log
