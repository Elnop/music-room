---
title: 'Play queue end-of-epic refactor sweep (#299)'
type: 'refactor'
ticket: ''
created: '2026-10-15'
status: 'built'
baseline_revision: 'dd718bc4f41c19c1d45f5e9e7323f8d76b7738d0'
route: 'full'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context:
  - '{project-root}/doc/TESTING.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The play-queue epic (#272) left cleanup remarks behind: duplicated or misplaced code, dead code, a missing test and a missing note. GitHub #299 is cleanup only. Its scope is fixed here, from the review remarks and from what the plans of #285 and #294–#298 raised.

**Approach:** Apply the retained items listed below with no change in behavior. Record each rejected candidate in the PR together with the reason it was rejected.

## Boundaries & Constraints

**Always:** No behavior change. Tests change only to follow a move or a rename, plus one new integration test, which the issue lists. Imports point at source files, and backend imports use `.js` extensions.

**Never:**
- No feature work.
- No new barrel `index.ts`.
- No re-export shims for moved symbols: update their importers.
- No change to migration SQL, only to comments.
- No shared utility for code that is not identical (spec decision).

## Retained / rejected scope

Retained:
1. Move `estimatePositionMs` from `hooks/useNowPlaying.ts` to a pure utility module, so that `transferPlayback` (a store) no longer imports a hook module. Remove the `PlayerContext` mock that `transferPlayback.test.ts` needed only for this.
2. Split the pure parts of `queueStore.ts` (412 lines) into a sibling `store/queueSelectors.ts`:
   - `RESTART_THRESHOLD_S`, `previousAction`
   - `OwnerQueue`, `QueueItemsView`, `EMPTY_QUEUE`
   - `currentIndex`, `currentItem`
   - `selectQueue`, `selectHasNext`, `selectHasPrevious`, `selectPlaysPlaylist`
   - `playPlaylistError`

   The hook `useActiveQueue` stays in the store.
3. Rewrap the `queues` field doc in `QueueStoreState` (108 characters).
4. One shared `deferred` test helper, used by `queueStore.test.ts` and `playlistStore.test.ts`.
5. Backend integration test: a refused `moveItem` does not change the queue version.
6. Comment in `migrations/024_queue_version.sql`: cascades from deleting `playlists` / `tracks` change items without bumping `version`.
7. `realtime/index.ts` `subscribeToListening`: the `listening:error NOT_AUTHORIZED` emit block is copied twice word for word; replace both copies with one local helper.
8. Dead code in `PlaylistDetailScreen.tsx`: remove `handlePlayTrack` (never called), `playerLoading`, and the `playListTrack` selector they leave unused.
9. Drop `export` from symbols used only in their own file: `QueueStepOutcome`, `ConnectTarget`, `FriendDeviceStatus`.

Rejected, with the reason to write in the PR:
- Shared "is this state newer?" utility: `queueStore.applyState` replaces the whole state, while `playlistSync.applyPlaylistEvent` applies deltas with gap detection. The two are not identical.
- Shared "join a room after a rights check" socket helper: `subscribeToListening` checks twice and emits a status, while `joinPlaylistRoom` checks once. Ordering is already shared through `createSocketQueue`. Not identical.
- The listening subscribe/unsubscribe race: already fixed, because both events go through `createSocketQueue`.
- Alias for `Omit<QueueState, 'ownerId' | 'version'>`: no such type remains since #297.
- Shared QueueTrack → AddQueueItemBody conversion: `toTrackInput` and `fromQueueTrack` handle empty strings differently and take different input types.

</frozen-after-approval>

## Code Map

- `mobile/src/hooks/useNowPlaying.ts:54-64`: `estimatePositionMs` is pure.
  - Importers: `store/transferPlayback.ts:8,60` and `hooks/useNowPlaying.test.ts:2,114-123`.
  - `transferPlayback.test.ts:34-36` mocks `PlayerContext` only because of this import.
- `mobile/src/store/queueStore.ts`:
  - l.13-19: `previousAction`, `RESTART_THRESHOLD_S`.
  - l.38-93: types (l.47 is too long).
  - l.95-139: view helpers.
  - l.141-149: `playPlaylistError`.
  - Importers of the moved symbols are `PlayerModal`, `useNowPlaying`, `QueueModal`, `PlayPlaylistButton`, `transferPlayback` and the tests: grep each symbol.
- `mobile/src/store/queueStore.test.ts:540-546` (`const deferred`) and `mobile/src/store/playlistStore.test.ts:56-60` (`function deferred`): the same helper. Check `doc/TESTING.md` / jest config for an existing test-utils location before creating one; the test-utils file must not be picked up as a test.
- `backend/src/features/queue/services/queue.service.int.test.ts:571-581`: "keeps the version when a mutation is refused" (previous, remove). Add the refused move there, e.g. moving an item after an item that does not exist, or after itself.
- `backend/migrations/024_queue_version.sql:2-7`: the header comment.
- `backend/src/realtime/index.ts:278-281` and `:292-295`: the duplicated emit block.
- `mobile/src/screens/playlists/PlaylistDetailScreen.tsx`: l.71 `playerLoading`, l.72 `playListTrack`, l.134-147 `handlePlayTrack`.
- `mobile/src/store/queueStore.ts` (`QueueStepOutcome`), `mobile/src/store/connectStore.ts` (`ConnectTarget`) and `mobile/src/hooks/useMusicControl.ts` (`FriendDeviceStatus`): exports used only in their own file.

## Tasks & Acceptance

**Execution:**
- [ ] `mobile/src/utils/remotePosition.ts` (new): move `estimatePositionMs` here, and update `useNowPlaying.ts`, `transferPlayback.ts` and the tests. Drop the now-useless `PlayerContext` mock in `transferPlayback.test.ts` if nothing else needs it.
- [ ] `mobile/src/store/queueSelectors.ts` (new): move retained item 2's symbols here and update every importer. Then rewrap l.47 of `queueStore.ts` (item 3).
- [ ] Shared `deferred` test helper (item 4), used by both store tests.
- [ ] `backend/src/features/queue/services/queue.service.int.test.ts`: add the refused-move version test (item 5).
- [ ] `backend/migrations/024_queue_version.sql`: add the cascade comment (item 6).
- [ ] `backend/src/realtime/index.ts`: add the local helper for the `listening:error NOT_AUTHORIZED` emit (item 7).
- [ ] `mobile/src/screens/playlists/PlaylistDetailScreen.tsx`: remove the dead code (item 8).
- [ ] Remove the `export` keyword from the file-only symbols (item 9).

**Acceptance Criteria:**
- Given the sweep is applied, when `make test`, the backend integration tests, and `npm run lint` and `npm run type-check` run in both `backend/` and `mobile/`, then all pass, and the 2 `PlaylistDetailScreen` unused-variable warnings are gone.
- Given the PR body, then it lists every retained item as done and every rejected candidate with its reason.

## Verification

**Commands:**
- `cd mobile && npx jest && npm run type-check && npm run lint`: expected green, 0 errors.
- `cd backend && npm test && npm run type-check && npm run lint`: expected green.
- `cd backend && npm run test:int` (or the command given in `doc/TESTING.md`): expected green, including the new test. If the local stack cannot run, say so; the CI runs it.

## Review Triage Log

Pass 1 (quick): low 1 · false 0 · other 2 not findings (verified by the PR body / CI).

| # | Finding | Verdict | Route | Evidence / action |
|---|---|---|---|---|
| 1 | `export type QueueItemsView` in `queueSelectors.ts` has no importer | low | patch | Confirmed by grep. `export` removed. |
| 2 | The PR body must list retained and rejected items | false | — | Process note, not a defect: the PR body will carry both lists. |
| 3 | Integration tests not run by the reviewer | false | — | The implementer ran `npm run test:int` locally (38 files / 328 tests green); CI runs it again. |
