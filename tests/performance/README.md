# Load tests

Measures how many requests the API handles and how many users the real-time services support (subject IV.7). `make perf-test` prepares the fixtures, runs the Artillery HTTP scenarios and the Socket.io scenario below, and writes a summary.

```bash
make perf-test                                # against http://localhost:3000, 20 users
make perf-test PERF_USERS=10                  # fewer fixture users (see Supabase sign-in cap below)
make perf-test PERF_TARGET=http://host:3000   # another backend
make perf-test PERF_SOCKET_CLIENTS=60         # 60 Socket.io clients (fixture users reused round-robin)
make perf-test PERF_SOCKET_DURATION=60        # longer real-time load (default 30 s)
make perf-fixtures                            # fixtures only (users, tokens, playlist)
```

Requirements: a running backend (`make dev-docker` or `make backend-local`), Docker, Node 22 and `backend/node_modules` (`make install`). Artillery 2.0.34 runs from its Docker image `artilleryio/artillery:2.0.34`; nothing is installed from npm.

## What a run does

1. Checks `PERF_TARGET/health`; stops with an error when nothing answers.
2. `backend/src/test/perf-fixtures.ts` creates or refreshes, in the Supabase project of `backend/.env`:
   - `PERF_USERS` users `perf-<i>@zumik.test` (username `perf_<i>`, verified email), reused across runs, each with a new random password;
   - mutual follows (friends) between `perf_0` and every other user;
   - a device `perf-device-0` of `perf_0` and a control licence on it for every friend (the `perf-socket-<k>` devices of the previous socket run are deleted);
   - one public, open playlist `perf-shared` owned by `perf_0`, emptied of the tracks the previous run left.

   It signs every user in and writes `fixtures/users.csv` (`email,password,token,userId`) and `fixtures/env.json` (`sharedPlaylistId`, `ownerId`, `deviceId`, `userCount`). Both are git-ignored: they hold passwords and tokens. Tokens expire after an hour, so they are issued again on every run.
3. Runs each scenario of `scenarios/` against `PERF_TARGET`, with the values of `env.json` as variables:
   - `login-read.yml`: 1 new user per second for 10 s; login, list playlists, read `perf-shared`.
   - `track-edit.yml`: 2 users/s for 10 s, ramp to 10 users/s over 30 s, 10 users/s for 30 s; with a pre-issued token, add a uniquely named track to `perf-shared`, move it to the first place, delete it. A 409 on the move is expected under contention (another user changed the playlist after the add).
4. Runs the real-time scenario, `backend/src/test/perf-socket.ts` (see below), into `socket.json` and `socket.log`.
5. `summarize.mjs` turns the reports into `results/<timestamp>/summary.md`: requests, req/s, latency min/median/p95/p99/max for each Artillery scenario and endpoint, status codes, errors, the socket section, and the run conditions. The raw reports (`<scenario>.json`, `socket.json`) and logs (`<scenario>.log`, `socket.log`) sit next to it. `results/` is git-ignored.

## Real-time scenario (Socket.io)

`perf-socket.ts` loads the playlist editor and music control delegation over Socket.io, from the same fixtures (no extra sign-in: the pre-issued tokens are reused).

| Variable | Default | Effect |
| --- | --- | --- |
| `PERF_SOCKET_CLIENTS` | fixture user count | Socket.io clients; users are reused round-robin, each client with its own `deviceId` `perf-socket-<k>` |
| `PERF_SOCKET_DURATION` | `30` | Seconds of load after every client has joined |

1. Connects `perf_0` on its device `perf-device-0`: the target of the control commands.
2. Connects the clients (handshake `auth` of `backend/src/realtime/socket-auth.ts`) and records connect time; a refused handshake is counted as a failed connection with its `connect_error` message (`INVALID_TOKEN`, ...), and the run goes on.
3. Every client sends `playlist:join` for `perf-shared`.
4. For `PERF_SOCKET_DURATION` seconds, each client acts every 2 s (±0.5 s): it adds a uniquely named track to `perf-shared` over HTTP, waits for the matching `playlist:updated` in every client of the room and deletes the track; or, for users other than `perf_0`, it sends `control:action` (play or pause) to `perf-device-0` under the licence the fixtures grant.
5. Measured on the clock of the load process: edit latency from the HTTP send to the `playlist:updated` received by each client (fan-out: one edit reaches every socket of the room, so N clients produce about N²/2 deliveries per second), and control latency from the emit to `control:success` at the sender and to `control:command` at `perf_0`. An event not received within 5 s counts as a timeout, not as a latency sample. The script exits non-zero only when no client connected.

One action per client every ~2 s stays far under the per-socket limits of `backend/src/realtime/event-rate-limit.ts` (20 `control:action` and 30 `playlist:join` per 10 s), so the run measures the server, not the limiter.

**Why a project script and not one of the subject's tools.** ab, Gatling, Siege, Tsung and JMeter speak HTTP (and plain WebSocket for some), not the Socket.io protocol (Engine.IO handshake, packet framing, namespaces, events). Artillery has a `socketio` engine, but each virtual user is short-lived and independent: it cannot keep the control target device online for the whole run, nor time a broadcast that another user's HTTP edit causes. The script uses `socket.io-client`, already a backend devDependency, and runs with `tsx` like the fixture script; nothing is added to the manifests.

Shell variables win over `backend/.env` for the fixture script, so the fixtures can target another Supabase project, such as the local stack.

## Conditions that change the numbers

- **Backend rate limiting.** The global auth limiter (`globalAuthRateLimiter`, mounted on every `/api/auth/*` route) counts every request per IP, successes included: `RATE_LIMIT_AUTH_MAX` per `RATE_LIMIT_AUTH_WINDOW_MS`, 20 per 15 minutes by default. One run makes 10 logins through the backend (the fixture sign-ins go to Supabase directly) and passes; a second run within 15 minutes gets 429s. The login limiter does not trip: it only counts failed attempts. `make perf-test` reads `RATE_LIMIT_ENABLED` and `RATE_LIMIT_WHITELIST_IPS` from `backend/.env`, warns when the login scenario would be throttled, and records both in the summary. For a run, set `RATE_LIMIT_ENABLED=false` (or whitelist the IP the backend sees for the load generator) and restart the backend.
- **Supabase auth limits.** Supabase caps password sign-ins per IP. The local test stack allows 1000 per 5 minutes (`sign_in_sign_ups` in `backend/supabase/config.toml`, raised for the integration tests); the hosted project has its own, lower per-IP limit. A run signs in `PERF_USERS` users in the fixture step plus 10 in the login scenario, so back-to-back runs or a large `PERF_USERS` against the hosted project can hit it: use the local stack (`make test-db-up`, backend pointed at it) for larger runs. The edit and socket scenarios use pre-issued tokens and sign nobody in.
- **Socket token checks.** A Socket.io handshake verifies its token; failed verifications count per IP (`RATE_LIMIT_TOKEN_MAX` per `RATE_LIMIT_TOKEN_WINDOW_MS`, 20 per 15 minutes by default), and past the limit every handshake is refused with `TOO_MANY_ATTEMPTS`. `make perf-test` issues fresh tokens before each run; running `perf-socket.ts` alone with fixtures older than an hour burns that budget with `INVALID_TOKEN`.
- **Host networking.** Artillery runs with `--network host`, so `localhost` in `PERF_TARGET` is the host on Linux. On Docker Desktop (macOS, Windows), enable host networking (Settings › Resources › Network › Enable host networking, Docker Desktop 4.34+) and keep `localhost`; `host.docker.internal` would break the health check, which runs on the host.
- **Leftover data.** Tracks added by `track-edit` and the socket scenario use URIs under `https://soundcloud.com/zumik-perf/`; every socket client handshake records a device `perf-socket-<k>` of its user. The fixture step deletes those tracks and devices and empties `perf-shared` at the start of every run.
