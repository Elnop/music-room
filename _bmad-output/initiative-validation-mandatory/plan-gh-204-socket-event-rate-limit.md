---
title: 'Per-socket event rate limit and bounded listening:update'
type: 'bugfix'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: 'a039e35c28946524d846f77f7bc975248711d888'
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

**Problem:** Socket.io events are validated but not rate-limited, so an authenticated client can flood `listening:update`, `control:action` or `playlist:join`, and `listening:update` strings have no maximum length (threat model L7, GitHub #204).

**Approach:** A per-socket, per-event limit with an error event past it, and `max()` on the strings of a Zod schema for `listening:update`.

</frozen-after-approval>

## Implementation Notes

Oneshot:
- `backend/src/realtime/event-rate-limit.ts`: `SocketEventLimiter`, in-memory fixed window per event name, one instance per socket (dies with it). 20 per 10 s for `listening:update` and `control:action`, 30 for the other app events; any other name shares one fallback counter so random names cannot grow the map. `check` returns `limited` on the first refusal of a window (logged once) and `still-limited` after.
- `index.ts`: the existing `socket.use` logger also checks the limiter; past the limit the event is dropped (no `next()`) and `RATE_LIMITED` goes to the event's error channel in that channel's shape (`rateLimitedErrorFor`: `{ message, code }` on `listening:error` / `control:error`, plus `playlistId: null` on `playlist:error`, whose code union gains `RATE_LIMITED`). The app has no `playlist:error` listener and no response type changes. The warning logs the name through `loggableEventName` (moved out of `incomingLog`).
- `music-control-access.ts`: `listeningUpdateSchema` replaces `isValidListeningUpdatePayload` (title, artist ≤ 300, artworkUrl ≤ 2048, nullish → null; unknown keys such as an old `device` stripped). An invalid update now answers `listening:error` `INVALID_PAYLOAD` (it was only logged).
- Limits sit far above app traffic (`useMusicControl` emits on track or play/pause change, subscribe/join once per screen).
- Socket.io middleware `next()` is async: a refusal can reach the client before answers to earlier events; the integration test counts codes instead of checking order.
- Tests: `event-rate-limit.test.ts` (windows, per-event counters, shared fallback, error channel), two cases in `socket-auth.int.test.ts` (title too long → INVALID_PAYLOAD; 21 `control:action` → 20 INVALID_PAYLOAD + 1 RATE_LIMITED, another socket not limited). Both fail on the old code.
- `backend/README.md`: socket contracts (listening:update row, RATE_LIMITED, Débit paragraph). `doc/THREAT_MODEL.md`: L7 fixed; accepted risks (limit per socket, many connections; a dropped unsubscribe/leave under flood).

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test` -- expected: green
- `cd backend && npm run test:int` -- expected: green

## Review Triage Log

Quick review, 5 findings: 2 medium, 2 low patched, 1 low rejected.

- medium, patched: the rate_limited warning logged the raw client event name (up to ~1 MB, multi-line), bypassing the check `incomingLog` does. Extracted `loggableEventName` and used it for both.
- medium, patched: `RATE_LIMITED` on `playlist:error` broke its `{ playlistId, code, message }` contract and code union. `rateLimitedErrorFor` sends `playlistId: null`; `PlaylistRoomErrorCode` includes `RATE_LIMITED`.
- low, patched: `backend/README.md` socket contracts were stale (no listening:update row, no RATE_LIMITED, unsubscribe row). Updated.
- low, patched: THREAT_MODEL overstated the log protection (the IV.6 incoming line is still written per event). Wording fixed.
- low, rejected: errors from the device's own invalid `listening:update` or from a rate-limited event reach `useMusicControl`'s friend-view `listening:error` handler. Only a malformed or flooding client triggers them (the app sends bounded fields at a low rate); the AC asks for `INVALID_PAYLOAD` on that channel.
