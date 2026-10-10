---
title: 'Real-time load scenario (Socket.io) in make perf-test'
type: 'feature'
ticket: '3'
created: '2026-10-10'
status: 'built'
baseline_revision: '62bc13fcb5fca2c926a074b75a5c6098e8d33a37'
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

**Problem:** `make perf-test` (#104) only loads the HTTP API; subject IV.7 also asks how many users the real-time services (playlist editor, music control delegation) support (GitHub #105, epic #102).

**Approach:** Add a socket scenario to `make perf-test`: N authenticated Socket.io clients built from the #104 fixtures join the shared playlist room, edit the playlist and send control commands to `perf_0`'s licensed device; the run reports successful connections and event latencies in the same summary.

## Boundaries & Constraints

**Always:** Reuse `tests/performance/fixtures/users.csv` and `env.json` as written by `backend/src/test/perf-fixtures.ts`; no new fixture data source. The tool is a project script on `socket.io-client` (already a backend devDependency), run with `tsx` like the fixtures: none of the subject's tools (ab, Gatling, Siege, Tsung, JMeter) speaks the Socket.io protocol, and Artillery's socketio engine cannot keep the target device online across virtual users nor time a broadcast caused by another user's HTTP edit. The justification goes in `tests/performance/README.md`. Read event names and payloads from `backend/src/realtime/index.ts`; never assume them. Stay under the per-socket event limits of `backend/src/realtime/event-rate-limit.ts` so the run measures the server, not the limiter.

**Never:** No backend change, no new npm dependency, no capacity report or `doc/PERFORMANCE.md` (#106), no listening-status scenario.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy run | backend up, fixtures fresh | N clients connect, join `perf-shared`, edits broadcast `playlist:updated`, control actions answered `control:success`, `perf_0` device gets `control:command`; JSON report + summary section | No error expected |
| More clients than users | `PERF_SOCKET_CLIENTS` > fixture users | users reused round-robin, one distinct `deviceId` per client | No error expected |
| Refused handshake | expired/invalid token | counted as failed connection with its `connect_error` message | run continues, failures reported |
| Lost events | broadcast or ack not received within timeout | counted as timeout, not as a latency sample | run continues, timeouts reported |
| Backend down | nothing on target | `make perf-test` already stops at the health check | non-zero exit |

</frozen-after-approval>

## Code Map

- `backend/src/realtime/socket-auth.ts` -- handshake `auth`: `token`, `deviceId` (1-128), `deviceName`, `platform`, `model`, `appVersion`, all required; refusal reasons arrive as `connect_error.message`.
- `backend/src/realtime/index.ts` -- `playlist:join` (payload = playlist id string, no ack; `playlist:error` on refusal), `playlist:updated` broadcast to `playlist:<id>` with `{ playlistId, event, tracksVersion, track | trackId, ... }` (`notifyPlaylistUpdate`, ~line 553); `control:action` `{ targetUserId, targetDeviceId, action: 'play'|'pause' }` -> `control:success` to the sender, `control:command` `{ action, fromUserId }` to the target socket, `control:error` (`NOT_AUTHORIZED`, `DEVICE_OFFLINE`, `RATE_LIMITED`).
- `backend/src/realtime/event-rate-limit.ts` -- `control:action` 20 / 10 s per socket, `playlist:join` 30 / 10 s.
- `backend/src/realtime/music-control-access.ts` -- `controlActionSchema`; licences from fixtures let every `perf_<i>` (i > 0) control `perf_0`'s `perf-device-0`.
- `backend/src/test/perf-fixtures.ts` -- fixture writer (CSV `email,password,token,userId`; `env.json` `sharedPlaylistId`, `ownerId`, `deviceId`, `userCount`); track URIs under `https://soundcloud.com/zumik-perf/` are cleaned each run, reuse that prefix.
- `backend/src/realtime/*.int.test.ts` -- examples of `socket.io-client` connections with the handshake fields.
- `make/perf.mk` -- `perf-test` loop over Artillery scenarios then `summarize.mjs "$run_dir"`; add the socket step before the summary, same `rc` handling.
- `tests/performance/summarize.mjs` -- reads `*.json` Artillery reports in the run dir; must also render the socket report (distinguish it by file name, e.g. `socket.json` with its own shape) without breaking the Artillery sections.
- HTTP edits: `POST /api/playlists/:id/tracks` (201, `data.track.id`), `DELETE /api/playlists/:id/tracks/:trackId`.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/test/perf-socket.ts` -- read fixtures; connect `perf_0` on `perf-device-0` (control target) and `PERF_SOCKET_CLIENTS` clients (default: fixture user count; users round-robin, `deviceId` `perf-socket-<k>`), recording connect successes, failures by reason and connect time; each client joins `perf-shared`; during `PERF_SOCKET_DURATION` seconds (default 30) each client, every ~2 s with jitter, either adds a track over HTTP (uniquely named, under the cleaned URI prefix) and deletes it, or (non-owner users) sends `control:action`; measure edit latency (HTTP send -> `playlist:updated` with that track received, per receiving client: fan-out count and latency) and control latency (emit -> `control:success`, and emit -> `control:command` at `perf_0`); timeouts (5 s) counted apart; write `--out <file>` JSON (connections, per-metric count/min/median/p95/p99/max, timeouts, errors, clients, duration); exit non-zero only when no client connected.
- [x] `make/perf.mk` -- run it after the Artillery scenarios into `$run_dir/socket.json` with `PERF_TARGET`, `PERF_SOCKET_CLIENTS ?=`, `PERF_SOCKET_DURATION ?= 30`; log to `$run_dir/socket.log`.
- [x] `tests/performance/summarize.mjs` -- socket section: connections ok/failed (by reason), latency tables for edit broadcast and control, timeouts.
- [x] `tests/performance/README.md`, `doc/TESTING.md`, `make/help.mk` -- socket scenario, variables, tool justification.

**Acceptance Criteria:**
- Given a running backend, when `make perf-test` runs, then the summary has a socket section with successful connections and event latencies (playlist broadcast and control).
- Given `PERF_SOCKET_CLIENTS=60` with 20 fixture users, then 60 sockets connect without extra Supabase sign-ins.

## Implementation Notes

- `control:success` and `control:command` carry no correlation id: successes are matched FIFO per socket, commands FIFO per sender user id (several clients share a user when clients > users). A server reordering of concurrent actions of one user would swap two samples, not lose them; an answer arriving after its 5 s timeout is counted under `late`, not sampled.
- `playlist:join` has no ack: the script waits 1 s after the joins before the load and counts `playlist:error` in errors; edits are matched by `track.trackUri` of `track_added`, since the broadcast can arrive before the HTTP response.
- Verified on 2026-10-10 against a backend on the local Supabase test stack (port 3100, `RATE_LIMIT_ENABLED=false`): `make perf-test PERF_SOCKET_CLIENTS=60` with 20 fixture users, 60/60 connected, 25980/25980 broadcast deliveries, 471 control actions, no timeout; edit broadcast median 54.7 ms / p95 89.8 ms, control median 4.6 ms. Stale tokens gave 8 `INVALID_TOKEN` failures and exit 1, as specified.

## Plan Change Log

## Review Triage Log

Quick review, 6 findings: 1 medium, 5 low; 5 patched, 1 rejected.

- medium, patched: broadcast deadline started after the POST response, so deliveries up to ~15 s after send became latency samples; the 5 s deadline now counts from `sentAt` and later deliveries are counted late/timeout.
- low, patched: on a failed POST, listener samples stayed while delivery counters did not move; `deliveriesReceived` is now counted where the sample is pushed.
- low, patched: `editHttp` mixed 4xx/5xx times; only 201s are sampled.
- low, patched: each socket handshake leaves a `perf-socket-<k>` row in `devices`; the fixture step deletes them, README says so.
- low, patched: a crashed socket run left no trace in `summary.md`; a socket section now reports the failure and points at `socket.log`.
- low, rejected: FIFO matching would cascade after a reply that never arrives; the server always answers `control:action` (fails closed), so it is unreachable today and the fix adds correlation logic.

Re-verified after patches: `make perf-test PERF_TARGET=http://localhost:3100 PERF_SOCKET_CLIENTS=40 PERF_USERS=10` on the local stack: 40/40 connected, 13320/13320 deliveries, broadcast median 55.9 ms p95 129 ms, control median 5.4 ms, no timeouts.

## Design Notes

Fan-out latency is the interesting real-time number: one HTTP edit reaches every socket in the room, so N clients editing every 2 s produce about N²/2 deliveries per second. Time the delivery against the send time kept in the same process (one clock, no skew). Delete each added track right after its broadcast arrives (or after the timeout) so the playlist stays small.

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test` -- expected: clean.
- `make perf-test` against a backend on the local Supabase stack -- expected: summary with the HTTP sections and a socket section, connections all ok.
