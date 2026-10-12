---
title: 'HTTP load fixtures and scenarios (make perf-test)'
type: 'feature'
ticket: '2'
created: '2026-10-10'
status: 'built'
baseline_revision: 'c0ff512f3b2eafe5d579912846e477a79b6eb1d3'
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

**Problem:** Subject IV.7 asks to measure how many users the API and real-time services support; the repo has no load test, no fixtures and no command to run one (GitHub #104, epic #102).

**Approach:** `make perf-test` (new `make/perf.mk`) creates or refreshes test users directly in Supabase (friends, a shared open playlist, a device licence, fresh access tokens), then runs Artillery HTTP scenarios from `tests/performance/` — login then playlist read, then track editing — and writes a requests-per-second and latency summary to `tests/performance/results/`.

## Boundaries & Constraints

**Always:** Artillery 2.0.34 through its pinned Docker image (no new npm manifest; Artillery is "an equivalent" of the subject's list and also speaks Socket.io, which #105 needs). Fixture users are idempotent (`perf-<i>@zumik.test`, username `perf_<i>`), reused across runs, with a random password set on every run, so no credential is committed. Fixture files with tokens or passwords and result files are git-ignored. The summary records the run conditions: target URL, user count, and the backend's `RATE_LIMIT_ENABLED` / `RATE_LIMIT_WHITELIST_IPS` values (warn when rate limiting would throttle the run).

**Never:** No performance optimisation, no backend behaviour change, no socket scenario (that is #105), no measurement campaign or capacity report (#106), no reference-machine doc (#103). Do not touch `doc/PERFORMANCE.md`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First run | backend running, no perf users | users, profiles (`email_verified`), mutual follows with `perf_0`, device + licences, shared playlist created; scenarios run; summary written | No error expected |
| Re-run | perf users exist | users reused, passwords and tokens refreshed, no duplicates | No error expected |
| Backend down | nothing on `PERF_TARGET` | stop before Artillery with a clear message | non-zero exit |
| Missing Supabase env | no `backend/.env` keys | fixture step fails with the env error | non-zero exit |

</frozen-after-approval>

## Code Map

- `Makefile` -- add `include make/perf.mk`; targets documented with `##` show in `make help`.
- `make/config.mk` -- `BACKEND_URL`, `BACKEND_DIR`, colours; `make/helpers/echo.mk` -- `print_*` helpers to reuse.
- `backend/src/shared/config/supabase.ts` -- reuse `supabaseAdmin` and `createSignInClient()` (never sign in on a shared client).
- `backend/src/features/playlists/services/playlist-track.int.test.ts` -- pattern for `auth.admin.createUser` + `user_profiles` insert.
- `backend/src/features/auth/auth.service.ts:136` -- login needs `user_profiles.email_verified = true` for password accounts.
- `backend/migrations/007_follows.sql` (friends = mutual follows), `015_devices.sql` (`devices`, `device_control_licenses`, FK to `follows(grantee, owner)`).
- `backend/src/features/playlists/permissions/playlist.permissions.ts` -- public + open playlist: everyone can view and edit.
- Endpoints: `POST /api/auth/login` (`data.session.accessToken`), `GET /api/playlists`, `GET /api/playlists/:id` (`tracksVersion`), `POST /api/playlists/:id/tracks` (`data.track.id`, `data.tracksVersion`), `POST /:id/tracks/:trackId/move` (`afterRank`, `expectedVersion`; 409 on stale version is expected under contention), `DELETE /:id/tracks/:trackId`.
- `backend/src/features/auth/middleware/rate-limit.middleware.ts:45` -- limiter `skip` when disabled or IP whitelisted.
- `backend/tsconfig.json` type-checks `src/**`; `tsconfig.build.json` excludes `src/test` -> fixture script there is linted and type-checked but not built.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/test/perf-fixtures.ts` -- create/refresh `PERF_USERS` (default 20) users, profiles, follows, `perf_0` device and licences, shared public open playlist `perf-shared`; sign each user in; write `tests/performance/fixtures/users.csv` (email,password,token,userId) and `fixtures/env.json` (sharedPlaylistId, ownerId, deviceId) -- one place for all fixture data, reused by #105.
- [x] `tests/performance/scenarios/login-read.yml` -- CSV payload; login, capture token, list playlists, read shared playlist.
- [x] `tests/performance/scenarios/track-edit.yml` -- CSV payload with token; add a uniquely named track, move it to first, delete it.
- [x] `tests/performance/summarize.mjs` -- dependency-free Node script turning Artillery JSON reports into `results/<timestamp>/summary.md` (requests, req/s, latency min/median/p95/p99/max, status codes, errors, run conditions).
- [x] `make/perf.mk` -- `perf-fixtures`, `perf-test` (health check, fixtures, each scenario through `docker run --network host --user $(id -u):$(id -g)` with `PERF_TARGET ?= $(BACKEND_URL)`, summary).
- [x] `.gitignore`, `tests/performance/results/.gitkeep` -- ignore fixtures and results.
- [x] `tests/performance/README.md`, `doc/TESTING.md` -- how to run, variables, conditions (rate limit, hosted Supabase auth limits, Linux host networking).

**Acceptance Criteria:**
- Given a running backend, when `make perf-test` runs, then both scenarios execute and `tests/performance/results/<timestamp>/summary.md` holds req/s and latencies per scenario.
- Given `make perf-test` ran twice, then Supabase holds one set of perf users and one `perf-shared` playlist.

## Implementation Notes

- Fixture script also empties `perf-shared` and deletes `tracks` rows under `https://soundcloud.com/zumik-perf/` (the URI prefix the edit scenario uses) at the start of every run: removing a track from a playlist leaves its `tracks` row, so each run would otherwise leave ~500 rows.
- `env.json` carries `userCount` too; `make perf-test` passes the whole file to Artillery with `--variables`.
- Scenarios use the built-in `metrics-by-endpoint` plugin so the summary has per-endpoint latencies. A failed capture (e.g. add not 201) ends the virtual user.
- Rate-limit values are read from `backend/.env` by `make/perf.mk` (warning before Artillery) and passed to `summarize.mjs`; they describe `backend/.env`, not necessarily the running backend's environment.
- Recipe variable is `rc`, not `status` (read-only in zsh, the Makefile shell).
- Verified end to end against a backend on port 3001 pointed at the local Supabase stack (`backend/.env.test` sourced, rate limit off), not against the hosted project.

## Plan Change Log

## Review Triage Log

Quick review, 4 findings: 2 medium, 2 low, all patched.

- medium, patched: the rate-limit warning (perf.mk, summarize.mjs, README, TESTING.md) blamed `loginRateLimiter`, which only counts failed attempts (`skipSuccessfulRequests`) per email+IP; the limiter that throttles successful logins is `globalAuthRateLimiter` (`router.use` in auth.routes.ts, 20 requests / 15 min / IP). Text now names it and its variables.
- low, patched: `perf.mk` kept dotenv quotes (`RATE_LIMIT_ENABLED="false"` read as `"false"`), giving a false warning and wrong recorded conditions; quotes are stripped.
- medium, patched: README advised the local stack for larger runs, but `backend/supabase/config.toml` caps it at `sign_in_sign_ups = 30` / 5 min and the default run uses 30; README now says to wait 5 minutes between runs and to raise that value for a larger `PERF_USERS`; `PERF_USERS=50` example replaced.
- low, patched: README told Docker Desktop users to target `host.docker.internal`, which the host-side `curl` health check cannot resolve; now advises enabling Docker Desktop host networking and keeping `localhost`.

## Design Notes

Tokens are re-issued on every `make perf-test` (Supabase access tokens expire after an hour). Hosted Supabase caps password sign-ins per IP, so the login scenario stays at a low arrival rate and the edit scenario uses pre-issued tokens; a larger `PERF_USERS` is meant for the local stack (`make test-db-up`), whose limits live in `backend/supabase/config.toml`.

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint` -- expected: clean.
- `make -n perf-test` -- expected: parses.
- `make perf-test` against a running backend -- expected: summary file with both scenarios, 2xx majority.
