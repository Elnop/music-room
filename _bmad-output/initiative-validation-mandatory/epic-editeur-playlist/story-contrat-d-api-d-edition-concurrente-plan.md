---
title: "Contrat d'API d'édition concurrente"
type: 'feature'
ticket: '2'
created: '2026-10-09'
status: 'built'
baseline_revision: '40b681de6de43c0081aa64c9ef60bffd181805ee'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/doc/PLAYLIST_CONCURRENCY.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 5.2 (#87). The concurrency strategy is decided (spike 5.1, `doc/PLAYLIST_CONCURRENCY.md`: fractional ranks, `tracks_version`, move by `{ afterRank, expectedVersion }`), but no contract says what the API and the socket event look like, so 5.3 (migration), 5.4 (service), 5.5 (broadcast) and 5.6 (mobile) cannot be built against one shape.

**Approach:** Contract only: Zod schemas for the move body and the rank, backend response types, OpenAPI entries for add, remove and the new move endpoint (with `tracksVersion`, each track's `rank`, and the 409/404 codes), and the mirror types on mobile. No route, service or migration.

**Decisions (2026-10-09):**
- Rebalancing: a move whose `expectedVersion` is older than the last rebalance is refused with `409 PLAYLIST_REBALANCED`; add and move results and `playlist:updated` carry `rebalanced: boolean` (5.3 adds `playlists.ranks_rebalanced_at_version`).
- `playlist:updated` is a per-operation delta: `{ playlistId, tracksVersion, rebalanced, event: 'track_added', track } | { …, event: 'track_removed', trackId } | { …, event: 'track_moved', trackId, rank }`; a client reloads when it skips a version or when `rebalanced` is true.

## Boundaries & Constraints

**Always:** Follow `doc/PLAYLIST_CONCURRENCY.md`. Same OpenAPI style as `playlist.openapi.ts` (`SuccessResponse` + `data`, shared `#/components/responses/*`, `bearerAuth`). camelCase in the API. Code compiles and current behaviour is unchanged: old types (`TrackWithPositionResponse`, `reorderTracksSchema`, mobile `TrackWithPosition`) stay until 5.4 / 5.6; where the fetch response gains `tracksVersion`, the current code fills `0` until 5.4.

**Never:** No route, controller, service, migration or socket emission change. No mobile store or screen change. Metadata edits stay last-write-wins and out of the contract.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Move body | `{ afterRank: 'h' \| null, expectedVersion: 10 }` | valid; `null` = top of the list | 400 `VALIDATION_ERROR` if `expectedVersion` missing, negative or fractional, or `afterRank` not a base-62 rank (empty, trailing `0`, other chars, > 128) |
| Move result | 200 | `{ trackId, rank, tracksVersion, rebalanced }` | 409 `TRACK_MOVED_CONCURRENTLY`, 409 `TRACK_NOT_IN_PLAYLIST`, 409 `PLAYLIST_REBALANCED` |
| Add result | 201 | `{ track (with rank, addedBy, addedAt), tracksVersion, rebalanced }` | 409 `TRACK_DUPLICATE` |
| Remove result | 200 | `{ tracksVersion }` | 404 `TRACK_NOT_IN_PLAYLIST` |
| Fetch | `GET /api/playlists/{id}` | `tracksVersion`, tracks ordered by `rank`, each with `rank` | unchanged |
| Reorder | old `PUT /tracks/reorder` | documented as deprecated, replaced by move (removed in 5.4) | unchanged |

</frozen-after-approval>

## Code Map

- `_bmad-output/initiative-validation-mandatory/epic-editeur-playlist/plan-implementation.md` -- **Tâche 1** (backend contract, lines ~90–378) and **Tâche 2** (mobile contract, lines ~380–450) give the exact schemas, types and OpenAPI snippets; checked against the code on 2026-10-09 and still accurate. Follow them, adjusted by the decisions in the frozen block.
- `backend/src/features/playlists/playlist.validators.ts` -- add `rankSchema`, `moveTrackSchema`, `MoveTrackInput` after `reorderTracksSchema` (line ~61); keep the old schema.
- `backend/src/features/playlists/playlist.validators.test.ts` (new) -- rank and move body cases of the matrix.
- `backend/src/features/playlists/playlist.types.ts` -- `TrackInPlaylistResponse`, `AddTrackResult`, `RemoveTrackResult`, `MoveTrackResult`, `PlaylistUpdatedPayload`; `tracksVersion` on `PlaylistWithTracksResponse` (line ~99), filled with `0` where `getPlaylistById` builds it.
- `backend/src/features/playlists/playlist.openapi.ts` -- paths: `/tracks` (~266, add 201 + 409), `/tracks/{trackId}` (~327, remove 200), `/tracks/reorder` (~382, mark `deprecated: true`), new `/tracks/{trackId}/move`; schemas `PlaylistDetail` (~875), `PlaylistTrack` (~902, add `rank`, `addedAt`).
- `backend/src/realtime/index.ts:553` -- current emit `{ playlistId, event, ...data }`; not changed here (5.5), only typed by `PlaylistUpdatedPayload`.
- `mobile/src/types/track.types.ts`, `mobile/src/types/playlist.types.ts` -- mirror types; `tracksVersion` on `PlaylistWithTracks` (line ~32); fix hand-built test objects with `tracksVersion: 0` if type-check requires it.

## Tasks & Acceptance

**Execution:**
- [x] `playlist.validators.ts` + `playlist.validators.test.ts` -- schemas and tests.
- [x] `playlist.types.ts` -- response and event types, `tracksVersion: 0` placeholder.
- [x] `playlist.openapi.ts` -- move endpoint, add/remove responses, fetch `tracksVersion`, `rank` on tracks, error codes, reorder deprecated.
- [x] `mobile/src/types/track.types.ts`, `playlist.types.ts` -- mirror.
- [x] `doc/PLAYLIST_CONCURRENCY.md` -- replace "The exact payload is defined in the contract (#87)" with the delta payload, add `PLAYLIST_REBALANCED` to the move refusals and a short "client holding old ranks" note under Rebalancing.

**Acceptance Criteria:**
- Given the backend running, when opening http://localhost:3000/api-docs, then `moveTrack`, the add/remove results, `tracksVersion` and the track `rank` appear with their error codes, and no `$ref` dangles.
- Given both type files, when compared, then every response and the `playlist:updated` payload have the same fields on backend and mobile (story Verify).

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test` -- expected: pass.
- `cd backend && npx tsx -e "<import the swagger spec, resolve every $ref, find moveTrack>"` -- expected: 0 dangling refs.
- `cd mobile && npm run type-check && npm run lint && npm test` -- expected: pass, no new warning.

## Implementation Notes

- OpenAPI `PlaylistTrack.addedBy` was a `$ref` to `PlaylistMember`, but the API returns the adder's id (`string | null`); it is now `string` uuid nullable to match the types. `position` stays, marked deprecated; `updatedAt` added to match `TrackResponse`.
- Remove's 404 is inline (not the shared `NotFoundError`) so it can name `TRACK_NOT_IN_PLAYLIST`.
- `MoveTrackRequest.afterRank` also carries `minLength: 1`, mirroring the Zod regex.
- `playlist.service.ts` `getPlaylistById` returns `tracksVersion: 0` as a placeholder until #88.
- `realtime/index.ts` emission untouched (5.5).

## Plan Change Log

## Review Triage Log

Quick review, pass 1: 0 high, 1 medium, 2 low, 0 false; all patched.

- medium, patch: mobile `TrackInPlaylist` extended `Track` (no `createdAt`/`updatedAt`, required `albumArt`) while backend `TrackInPlaylistResponse` extends `TrackResponse`; AC 2 (same fields on both sides) unmet, also through `AddTrackResult.track` and `track_added`. Mirror now has `createdAt`, `updatedAt`, optional `albumArt`; `Track` untouched.
- low, patch: fetch contract documents tracks with `rank` while `PlaylistWithTracks(Response).tracks` stay `TrackWithPosition(Response)[]` by design until 5.4/5.6. Comment on both fields names the target type and story; no type change (plan keeps old types to compile).
- low, patch: `doc/PLAYLIST_CONCURRENCY.md` described the delta payload as current while `realtime/index.ts` emits the old shape until 5.5 (emission out of scope, under Never). Doc notes the payload is emitted from #90.
