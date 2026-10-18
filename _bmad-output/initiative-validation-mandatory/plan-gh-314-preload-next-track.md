---
title: 'Précharger la piste suivante (#314)'
type: 'feature'
ticket: ''
created: '2026-10-16'
status: 'built'
baseline_revision: '0af4929706feb8445039a32cf86b417e95876815'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** When a track ends, the next queue item only starts after a fresh `GET /api/soundcloud/stream` round trip in `PlayerProvider`'s load effect, which leaves an audible gap.

**Approach:** In the last 20 seconds of a locally played track, fetch the stream URL of the queue's next item ahead of time and keep it keyed to that queue item; when that exact item is then loaded, use the prefetched URL instead of fetching. Anything that no longer matches (queue changed, other item played, URL about to expire) is ignored and the normal fetch runs.

## Boundaries & Constraints

**Always:** prefetch only in local mode (`useConnectStore` target `local`), only while playing, once per (queue item id, track) pair; the prefetched entry is used only when both the loaded `queueItemId` and the track permalink match it, and only if `isStreamStale(expiresAt)` (#313) is false; it is consumed (cleared) on use and dropped when it no longer matches the queue's next item; a prefetch failure is silent (no toast, no error state): the normal load path handles the error later; stream URLs stay in memory only (never persisted, AGENTS.md).

**Never:** no change to the backend or the stream endpoint; no second audio player / audio-data preloading (URL only); no prefetch in remote mode (the remote device plays); no change to how `QueueAutoAdvance` advances or to #313 renewal.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Normal end | local, playing, ≤ 20 s left, next item B | one prefetch for B; B loads with no stream fetch | — |
| Reorder before end | prefetched B, queue now has C next | prefetch for C (B dropped); C loads with prefetched URL | — |
| Removed / other item played | prefetched B, user plays D | D fetched normally; B entry not used | — |
| Stale prefetch | prefetched URL within 2 min of expiry when B loads | normal fetch | — |
| Remote mode | remote target | no prefetch | — |
| Prefetch fails | network error | nothing shown; B fetched normally on load | error swallowed |
| No next item | last item | no prefetch | — |

</frozen-after-approval>

## Code Map

All under `mobile/src/`.
- `contexts/PlayerContext.tsx` -- load effect (l.~252-335): builds `/api/soundcloud/stream?url=${encodeURIComponent(permalink_url)}`, calls `apiRequest<Partial<StreamUrlResponse>>`, parses `expiresAt` with `Date.parse`, `setStreamUrl(url, expiresAt)`; guarded by `loadCounter` and `needsStreamLoad` (#312). Extract the request + parsing into a small function reused by the prefetch. Insert the prefetch lookup before the fetch. `isStreamStale` / `STREAM_RENEW_MARGIN_MS` (l.~29-35) are the #313 staleness rule. Add a `NextTrackPrefetcher({ player })` component next to `QueueAutoAdvance` (l.~63) / `StreamWatchdog`, rendered where they are, reading `useAudioPlayerStatus(player)` (`currentTime`, `duration`) so status updates re-render only it.
- `store/playerStore.ts` -- `currentTrack`, `queueItemId` (set by `playTrack(track, queueItemId)`), `playbackState`.
- `store/queueStore.ts` -- `useActiveQueue()`, `selectQueue(state, ownerId)`; `runStep` (l.~185) plays the new current item with `playTrack(trackToSoundCloud(item), item.id)`, so the loaded `queueItemId` is the queue item id and the permalink comes from `trackToSoundCloud(item).permalink_url`.
- `store/queueSelectors.ts` -- `currentItem`, `selectHasNext`; add a `nextItem(state)` selector (item after the current one, or the first when nothing is current) beside them.
- New `store/streamPrefetch.ts` -- tiny in-memory holder: `{ queueItemId, permalink, streamUrl, expiresAt } | null`, with `set`, `take(queueItemId, permalink)` (returns and clears a fresh match, else null), `clear`.

## Tasks & Acceptance

**Execution:**
- [x] `store/queueSelectors.ts` -- `nextItem` selector (+ case in the existing selector tests if any).
- [x] `store/streamPrefetch.ts` + test -- holder; `take` returns only a matching, non-stale entry and clears it.
- [x] `contexts/PlayerContext.tsx` -- shared fetch function; load effect tries `take(queueItemId, permalink)` first; `NextTrackPrefetcher` with `PREFETCH_WINDOW_S = 20`: when local, playing, `duration - currentTime <= 20` and the next item differs from the held entry, fetch and `set`; drop the held entry when the next item changes; ignore a response that arrives after the next item changed.
- [x] `contexts/PlayerContext.test.tsx` -- jest-expo: prefetch fires once in the window and not before; not in remote mode; not without a next item; reorder switches the target; the next load uses the prefetched URL without calling the stream endpoint; a stale or mismatched entry falls back to the fetch; a failed prefetch shows nothing.

**Acceptance Criteria:**
- Given a queue playing locally, when a track ends, then the next one starts without a stream request.
- Given the queue is reordered in the last 20 seconds, then the new next track plays (prefetched if time allowed).

## Implementation Notes

- `isStreamStale` / `STREAM_RENEW_MARGIN_MS` moved from `PlayerContext.tsx` to `store/streamPrefetch.ts` (their only user was PlayerContext), so `take` applies the #313 rule without the store importing the context. Behaviour unchanged.
- `NextTrackPrefetcher` keeps the held entry while it is the queue's next item **or its current item**: the queue applies the new state (B current) before `playTrack(B)`, so dropping on "no longer next" alone would discard B just before it loads.
- No prefetch while a queue item still plays after the queue moved its current item elsewhere (`stepping`), which would otherwise fetch the item after the new current one during the step.
- Only the status of the current player counts (`status.id === player.id`), since the hook can still hold the previous player's last status near its end.
- The "once per pair" guard resets when the played queue item changes, so playing the same item again prefetches its next item again.

## Plan Change Log

## Review Triage Log

Pass 1 (quick) — high 0, medium 0, low 4, false 0, maybe-false 0. No functional bug found.

| Finding | Verdict | Route | Evidence / action |
|---|---|---|---|
| `take` doc says a mismatch clears the entry; code keeps it | low | patch | Comment fixed to match code and test. |
| Connect-target changes outside `act` in PlayerContext tests | low | patch | Wrapped in `act`; warnings gone. |
| `fetchStreamUrl` log does not tell prefetch from load | low | patch | `purpose` label in the dev log. |
| `nextItem` doc misses the "current item gone" case | low | patch | Comment completed; behaviour is safe (unused entry, normal fetch). |

## Verification

**Commands:**
- `cd mobile && npm test` -- expected: all suites pass
- `cd mobile && npm run type-check && npm run lint` -- expected: no errors
