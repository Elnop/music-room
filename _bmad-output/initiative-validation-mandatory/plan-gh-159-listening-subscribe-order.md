---
title: 'Process listening subscribe/unsubscribe in arrival order'
type: 'bugfix'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: 'cb2f1822ab662eae0b85dda658a6f2b25eb788e5'
route: 'oneshot'
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

**Problem:** `listening:subscribe` joins `listening:<owner>` after awaiting access checks while `listening:unsubscribe` leaves at once, so a quick subscribe(X) + unsubscribe(X) ends with the socket in the room, receiving X's `listening:status` (GitHub #159; reachable from `mobile/src/hooks/useMusicControl.ts` on a fast screen change).

**Approach:** Run a socket's `listening:subscribe` / `listening:unsubscribe` events one after another in arrival order, with the per-socket promise queue #64 uses for `playlist:join` / `playlist:leave`.

</frozen-after-approval>

## Implementation Notes

Oneshot, all in `backend/src/realtime/index.ts`:
- The queue from `registerPlaylistHandlers` moved to `createSocketQueue(socket, failureAction)`; playlists keep `playlist_room_task_failed`, listening uses `listening_room_task_failed`. One queue per handler group: playlist and listening events do not wait on each other.
- The subscribe handler body moved unchanged into `subscribeToListening(socket, payload)`, so the second access check (after join) stays inside the queued task.
- Test in `backend/src/realtime/music-control-access.int.test.ts`, modeled on playlist-room's "handles join then leave in order": an invalid subscribe queued last answers `INVALID_PAYLOAD`, marking both earlier events as processed. Fails on the old code.
- `doc/THREAT_MODEL.md` M10: #159 removed from accepted risks.

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test` -- expected: green
- `cd backend && npm run test:int` -- expected: green

## Review Triage Log

Quick review: no findings (checked acceptance criteria, the test failing on the old code, AGENTS.md rules).
