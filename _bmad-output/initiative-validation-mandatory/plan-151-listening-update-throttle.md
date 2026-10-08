---
title: 'Listening status: the listening:update throttle keeps the latest state'
type: 'bugfix'
ticket: ''
created: '2026-10-08'
status: 'built'
baseline_revision: 'f84fccddfd3d4ef0b8d6d9dec3be99b82ec9bac4'
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

**Problem:** GitHub issue #151. The `listening:update` handler in `backend/src/realtime/index.ts` accepts one update per device per second and drops every update that arrives inside the window. When playback starts, the client sends `isPlaying: false` then `isPlaying: true` less than a second apart, so the `true` is lost and subscribers see the track paused while it plays.

**Approach:** Turn the throttle into a leading + trailing one: the first update in a window is applied at once, the most recent update received during the window is kept and applied when the window ends. The rate limit (one broadcast per device per second) stays.

## Boundaries & Constraints

**Always:** Keep `LISTENING_UPDATE_THROTTLE_MS = 1000` and the per-device key `${userId}:${deviceId}`. The applied status keeps taking the device from `socket.data.device` (handshake, #62). Payload validation and the `unauthenticated` check still run on every update, before throttling. A device whose current socket disconnects has its pending update and timer dropped, so no status is broadcast for a device that left.

**Never:** No change on the mobile emitter (`mobile/src/hooks/useMusicControl.ts`). No change to the event names or payload shapes (`listening:update`, `listening:status`). No Redis or persistence for this state; it stays in memory like `listeningStatuses`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Single update | One update, no update for this device in the last second | Applied and broadcast at once | No error expected |
| Burst | `false` then `true` within 1 s | `false` broadcast at once, `true` broadcast when the window ends; final state `true` | No error expected |
| Longer burst | `A`, `B`, `C` within 1 s | `A` at once, only `C` at window end (`B` replaced) | No error expected |
| Disconnect with pending | Update pending, device's current socket disconnects | Pending update discarded, timer cleared, device removed as today | No error expected |
| Invalid payload during window | Invalid payload while an update is pending | Ignored and logged `invalid_payload`; pending update kept | Existing warn log |

</frozen-after-approval>

## Code Map

- `backend/src/realtime/index.ts` -- `RealtimeService`. `lastListeningUpdate` map (l.81) and `LISTENING_UPDATE_THROTTLE_MS` (l.82); throttle check in the `listening:update` handler (l.205-212) is the bug; status build + log + `broadcastUserListeningStatus` (l.214-240) is the "apply" part to reuse; `handleDisconnect` (l.378) already deletes `lastListeningUpdate` for the device key and returns early when a newer socket owns the device: the pending cleanup goes beside that delete.
- `backend/src/realtime/socket-auth.int.test.ts` -- integration suite with a real Socket.io server, two users (bob may control alice) and helpers `connect`, `connected`, `nextEvent(socket, event, match)`; its last test (`stores listening:update with the handshake device`) is the pattern for the new burst test.
- `backend/vitest.config.ts` / `vitest.int.config.ts` -- unit tests are `src/**/*.test.ts` without Supabase; `*.int.test.ts` run with `npm run test:int` against the local Supabase stack.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/realtime/latest-throttle.ts` -- new class keyed by string: `submit(key, run)` runs `run` now when the key's window is open, otherwise stores it as the key's pending call (replacing an older one) and schedules it at the window end; `cancel(key)` clears the key's timer, pending call and window; a run at window end opens a new window. -- isolates the timing logic so it can be unit-tested with fake timers and keeps `index.ts` from growing.
- [x] `backend/src/realtime/latest-throttle.test.ts` -- Vitest with fake timers: single call runs at once; burst runs first now and last at window end; middle call replaced; `cancel` drops the pending call; a call after the window runs at once. -- covers the matrix without Supabase.
- [x] `backend/src/realtime/index.ts` -- replace `lastListeningUpdate` with a `LatestThrottle` instance; in the handler, validate and resolve `socketInfo` first, then `submit(deviceKey, () => apply…)` where the apply builds the status from the payload and `socket.data.device`, logs and broadcasts as today; in `handleDisconnect`, `cancel(deviceKey)` where `lastListeningUpdate.delete` was. -- the fix.
- [x] `backend/src/realtime/socket-auth.int.test.ts` -- new test: alice's device sends `isPlaying: false` then `true` back to back; bob, subscribed, receives a `listening:status` with the device `isPlaying: true`. -- end-to-end proof required by the issue.

**Acceptance Criteria:**
- Given a device that sends `isPlaying: false` then `isPlaying: true` within one second, when its subscribers receive the broadcasts, then the last `listening:status` they get shows the device playing.
- Given a device with an update pending, when its socket disconnects, then no `listening:status` is broadcast for that device after the disconnect cleanup.

## Implementation Notes

- Matrix audit (orchestrator): the "Invalid payload during window" row had no test; added `keeps the pending listening:update when an invalid one arrives in the window` to `backend/src/realtime/socket-auth.int.test.ts`. All matrix rows now covered by tests that ran and passed (7 unit in `latest-throttle.test.ts`, 3 integration after review pass 1).

## Plan Change Log

## Review Triage Log

### Pass 1 (quick) — high 0 / medium 2 / low 2 / false 0 / maybe-false 0

| # | Finding | Verdict | Route | Evidence / action |
|---|---------|---------|-------|-------------------|
| 1 | Invalid-payload int test matches `d.isPlaying` (truthy); `'yes'` would also match | medium | patch | Confirmed in socket-auth.int.test.ts: predicate is truthy, the matrix row is not proven. Fix: `=== true`. |
| 2 | Second AC (no broadcast after disconnect with pending) has no test through RealtimeService | medium | patch | Only `LatestThrottle.cancel` is unit-tested; the `handleDisconnect` key wiring is untested. Fix: add an integration test. |
| 3 | index.ts l.83 over Prettier printWidth 100 | low | patch | `npx prettier --check` flags index.ts; direct reformat. |
| 4 | Old socket's pending update runs after it disconnects when the device already reconnected on a new socket | low | rejected | Real, but the applied state is the same device's latest reported state, and the client re-emits its status on reconnect (useMusicControl effect depends on `isConnected`), replacing the pending call within the window. Rare and harmless; fix needs a new guard branch. |

## Design Notes

The window starts when an update is applied (leading edge), not when it is received. The trailing run is the last pending call; it opens its own window, so a steady stream of updates gives at most one broadcast per second per device and always ends on the latest state.

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint` -- expected: no error
- `cd backend && npm test` -- expected: all pass, including `latest-throttle.test.ts`
- `make test-int` (repo root; starts the local Supabase stack and writes `backend/.env.test`) -- expected: all pass, including the new burst test

**Manual checks (if no CLI):**
- On the emulator, start a track: a subscriber sees it playing (`isPlaying: true`) within about one second.
