# Testing Strategy

How the backend and the mobile app are tested. Every epic follows this document; change it through a PR, not per feature.

Subject requirement: IV.8 (tests for each layer). Goal (CAP-3): `make test` runs backend and mobile tests covering the critical paths of each layer, and exits non-zero when one fails. There is no coverage threshold.

## Frameworks

| Layer | Framework | Why |
| --- | --- | --- |
| Backend (services, permissions, utils, routes) | [Vitest](https://vitest.dev) + Node's `fetch` | The backend is ESM (`"type": "module"`, `.js` imports, `@/` aliases); Vitest runs it without Babel or experimental Node flags. Route tests start the Express app on port 0 of `127.0.0.1` and call it with `fetch`, so no HTTP test library is needed. |
| Mobile (stores, utils, components) | [jest-expo](https://docs.expo.dev/develop/unit-testing/) + [@testing-library/react-native](https://callstack.github.io/react-native-testing-library/) | Expo's official preset, with the native modules already mocked. Zustand stores are tested directly, without rendering. |

## Two kinds of backend tests

| | Unit | Integration |
| --- | --- | --- |
| File name | `*.test.ts` | `*.int.test.ts` |
| Location | Next to the file under test | Next to the file under test |
| External services | None: every client is mocked | Local Supabase stack, Redis, real Socket.io server |
| Secrets | None | None: only local-stack keys |
| Command | `npm test` | `npm run test:int` |
| Runs in | `make test`, CI job `test` | `make test-int`, CI job `test-int` |

Unit tests are the default. Write an integration test only for behavior that lives in the database or the wire protocol: RLS policies, constraints, concurrent playlist edits (IV.2.3), socket authentication and rooms.

### Environment for tests

`src/shared/config/env.ts` validates `process.env` at import and calls `process.exit(1)` when a variable is missing, so importing almost any module needs a valid environment.

- Unit tests: a Vitest setup file (`backend/src/test/setup-env.ts`) sets placeholder values for every required variable before any import. No real URL or key is ever used.
- Integration tests: `backend/.env.test` (git-ignored) is written by `scripts/test-db.sh up` with the local stack's URL and keys, which are local-only demo keys. `src/test/setup-int-env.ts` loads it before any import and refuses to run without it.

## External dependencies

| Dependency | Unit tests | Integration tests |
| --- | --- | --- |
| Supabase (Postgres, PostgREST, Auth) via `@/shared/config/supabase.js` | `vi.mock` the module; the test sets what `supabaseAdmin.from(...)` returns. Pure functions such as `canViewPlaylist` need no mock. | Local Supabase stack (see below), with `backend/migrations` applied. The real `supabase-js` client talks to it unchanged. |
| Redis via `@/shared/config/redis.js` | `vi.mock` the module. The client is created with `lazyConnect`, so importing it does not connect, but nothing may call it unmocked. | Real Redis: `scripts/test-db.sh up` starts a `redis:7-alpine` container (`music-room-test-redis`, pulled from ECR Public: Docker Hub rate-limits anonymous pulls on CI runners) on a free port and writes `REDIS_HOST`/`REDIS_PORT` to `.env.test`; `down` removes it. A test that needs Redis calls `connectRedis()` in `beforeAll` and `disconnectRedis()` in `afterAll`. The logout denylist and rate limiting have no in-memory fallback and `rate-limit-redis` relies on Lua scripts, so Redis is never simulated. |
| Socket.io (`src/realtime/index.ts`) | Mock the emitter (`io.to(...).emit`) and assert the event name and payload. Read event names from the source; never retype them. | Start the HTTP + Socket.io server on port `0` (random) and connect with `socket.io-client`. |
| SoundCloud (`soundcloud.ts`) | Always mocked. Tests never call SoundCloud: it is rate-limited and its stream URLs expire. | Mocked as well. |
| Mail (`features/mail/mail.service.ts`) | Mock the service and assert the call (recipient, template). | Mocked as well; no email is ever sent. |
| Google / Facebook sign-in | Mock the token verification (`google-auth-library`, Graph API call). | Mocked as well. |

Mobile tests never reach the network. `mobile/src/services/api.ts`, the socket store and Expo modules are mocked; the jest-expo preset covers the native ones.

## Integration database: local Supabase stack

The backend uses `supabase-js`, which goes through PostgREST and Supabase Auth, and the migrations rely on `auth.uid()` and `auth.users`. A plain Postgres cannot run them, so integration tests run against the local Supabase stack from the Supabase CLI, already a backend dev dependency (`supabase`).

- `make test-db-up` (`backend/scripts/test-db.sh up`) starts the stack in Docker with only Postgres, PostgREST, Auth and Kong, resets the database, applies `backend/migrations/*.sql` in file order, starts the test Redis container and writes `backend/.env.test`. It takes about 20 s once the images are pulled.
- `make test-int` runs `make test-db-up`, then `npm run test:int`. Every run starts from a fresh database.
- `make test-db-down` stops the stack, drops its data and removes the Redis container.
- The stack is named `music-room-test` and listens on ports 554xx (API `http://127.0.0.1:55421`, Postgres `127.0.0.1:55422`), set in `backend/supabase/config.toml`, so it runs next to another local Supabase project on the default 543xx ports.
- In CI: the `test-int` job of `.github/workflows/ci.yml` runs the same script.
- Integration test files run one after another (they share the database). Tests create their own users and rows, delete them afterwards, and never depend on data left by another test.

The migrations must build the schema from an empty database: a column added by hand in the dashboard and not committed breaks `make test-int`. The cloud Supabase project is never used by tests.

The cloud Supabase project is never used by tests.

## Running tests

From the repository root:

```bash
make test        # backend unit tests + mobile tests (no services needed)
make test-int    # backend integration tests (local Supabase stack)
```

From a package:

```bash
# backend/
npm test                                              # all unit tests
npm run test:int                                      # all integration tests
npx vitest run src/features/playlists/permissions     # one folder
npx vitest run -t "canViewPlaylist"                   # tests whose name matches

# mobile/
npm test                                              # all tests
npx jest src/utils/formatters.test.ts                 # one file
npx jest -t "formatDuration"                          # tests whose name matches
```


## Load tests (HTTP and real time)

Subject IV.7 asks how many users the API supports. `make perf-test` creates or refreshes load test users in the Supabase project of `backend/.env` (`backend/src/test/perf-fixtures.ts`), then runs the Artillery scenarios of `tests/performance/scenarios/` (Docker image `artilleryio/artillery:2.0.34`) against `PERF_TARGET` (default `http://localhost:3000`), then the Socket.io scenario `backend/src/test/perf-socket.ts` (clients join `perf-shared`, edit it over HTTP and send control commands to `perf_0`'s device; connections and event latencies), and writes `tests/performance/results/<timestamp>/summary.md` (req/s, latencies, status codes, run conditions).

| Variable | Default | Effect |
| --- | --- | --- |
| `PERF_TARGET` | `http://localhost:3000` | Backend under test; it must answer `/health` |
| `PERF_USERS` | `20` | Fixture users (`perf-<i>@zumik.test`), reused across runs |
| `PERF_SOCKET_CLIENTS` | fixture user count | Socket.io clients of the real-time scenario, users reused round-robin |
| `PERF_SOCKET_DURATION` | `30` | Seconds of real-time load |

The backend's global auth limiter (20 `/api/auth` requests per 15 minutes per IP) throttles a second login run within 15 minutes unless `RATE_LIMIT_ENABLED=false` or the client IP is in `RATE_LIMIT_WHITELIST_IPS`; Supabase Auth caps password sign-ins per IP; Artillery uses host networking (Linux). Details: `tests/performance/README.md`. Load tests are not part of `make test` or the CI.


## Writing a test

- Test behavior through the public function, route or store action, not private helpers.
- One file per module under test, named after it: `playlist.permissions.ts` → `playlist.permissions.test.ts`.
- Route tests mount the router on an Express app listening on port 0 of `127.0.0.1` (closed in `afterAll`) and call it with `fetch`, as a user that a mocked `authMiddleware` sets (unit) or a user created in the local stack (integration).
- A bug fix comes with the test that would have caught it.
- No test may depend on another test's order or state; reset mocks in `beforeEach`.

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request to `develop` and every push to it, with the Node version from `.nvmrc` and `npm ci` (lockfiles are committed):

| Job | Runs | Packages |
| --- | --- | --- |
| `lint` | `npm run lint` | backend, mobile |
| `type-check` | `npm run type-check` | backend, mobile |
| `test` | `npm test` | backend, mobile |
| `test-int` | `scripts/test-db.sh up` (Supabase stack + Redis), then `npm run test:int` | backend |

A failing job marks the pull request red. Lint warnings do not fail it; errors do.

`lint`, `type-check` and `test` run on `ubuntu-slim` (1 vCPU container, 15-minute cap, no Docker); `test-int` needs Docker for the Supabase stack and runs on `ubuntu-24.04`. Actions are pinned to commit SHAs and bumped by Dependabot (`.github/dependabot.yml`).
