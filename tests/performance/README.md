# HTTP load tests

Measures how many requests the API handles (subject IV.7). `make perf-test` prepares the fixtures, runs the Artillery scenarios below and writes a summary.

```bash
make perf-test                                # against http://localhost:3000, 20 users
make perf-test PERF_USERS=10                  # fewer fixture users (see Supabase sign-in cap below)
make perf-test PERF_TARGET=http://host:3000   # another backend
make perf-fixtures                            # fixtures only (users, tokens, playlist)
```

Requirements: a running backend (`make dev-docker` or `make backend-local`), Docker, Node 22 and `backend/node_modules` (`make install`). Artillery 2.0.34 runs from its Docker image `artilleryio/artillery:2.0.34`; nothing is installed from npm.

## What a run does

1. Checks `PERF_TARGET/health`; stops with an error when nothing answers.
2. `backend/src/test/perf-fixtures.ts` creates or refreshes, in the Supabase project of `backend/.env`:
   - `PERF_USERS` users `perf-<i>@zumik.test` (username `perf_<i>`, verified email), reused across runs, each with a new random password;
   - mutual follows (friends) between `perf_0` and every other user;
   - a device `perf-device-0` of `perf_0` and a control licence on it for every friend;
   - one public, open playlist `perf-shared` owned by `perf_0`, emptied of the tracks the previous run left.

   It signs every user in and writes `fixtures/users.csv` (`email,password,token,userId`) and `fixtures/env.json` (`sharedPlaylistId`, `ownerId`, `deviceId`, `userCount`). Both are git-ignored: they hold passwords and tokens. Tokens expire after an hour, so they are issued again on every run.
3. Runs each scenario of `scenarios/` against `PERF_TARGET`, with the values of `env.json` as variables:
   - `login-read.yml`: 1 new user per second for 10 s; login, list playlists, read `perf-shared`.
   - `track-edit.yml`: 2 users/s for 10 s, ramp to 10 users/s over 30 s, 10 users/s for 30 s; with a pre-issued token, add a uniquely named track to `perf-shared`, move it to the first place, delete it. A 409 on the move is expected under contention (another user changed the playlist after the add).
4. `summarize.mjs` turns the Artillery reports into `results/<timestamp>/summary.md`: requests, req/s, latency min/median/p95/p99/max for each scenario and endpoint, status codes, errors, and the run conditions. The raw reports (`<scenario>.json`) and Artillery logs (`<scenario>.log`) sit next to it. `results/` is git-ignored.

Shell variables win over `backend/.env` for the fixture script, so the fixtures can target another Supabase project, such as the local stack.

## Conditions that change the numbers

- **Backend rate limiting.** The global auth limiter (`globalAuthRateLimiter`, mounted on every `/api/auth/*` route) counts every request per IP, successes included: `RATE_LIMIT_AUTH_MAX` per `RATE_LIMIT_AUTH_WINDOW_MS`, 20 per 15 minutes by default. One run makes 10 logins through the backend (the fixture sign-ins go to Supabase directly) and passes; a second run within 15 minutes gets 429s. The login limiter does not trip: it only counts failed attempts. `make perf-test` reads `RATE_LIMIT_ENABLED` and `RATE_LIMIT_WHITELIST_IPS` from `backend/.env`, warns when the login scenario would be throttled, and records both in the summary. For a run, set `RATE_LIMIT_ENABLED=false` (or whitelist the IP the backend sees for the load generator) and restart the backend.
- **Supabase auth limits.** Supabase caps password sign-ins per IP: the local stack allows 30 per 5 minutes (`sign_in_sign_ups` in `backend/supabase/config.toml`), and the hosted project has its own per-IP limit. A run signs in `PERF_USERS` users in the fixture step plus 10 in the login scenario, so the default run (20 + 10) already uses all 30: wait 5 minutes between runs. For a larger `PERF_USERS`, run against the local stack (`make test-db-up`, backend pointed at it), raise `sign_in_sign_ups` in `config.toml` and restart the stack. The edit scenario uses pre-issued tokens and signs nobody in.
- **Host networking.** Artillery runs with `--network host`, so `localhost` in `PERF_TARGET` is the host on Linux. On Docker Desktop (macOS, Windows), enable host networking (Settings › Resources › Network › Enable host networking, Docker Desktop 4.34+) and keep `localhost`; `host.docker.internal` would break the health check, which runs on the host.
- **Leftover data.** Tracks added by `track-edit` use URIs under `https://soundcloud.com/zumik-perf/`; the fixture step deletes them and empties `perf-shared` at the start of every run.
