# Testing Strategy

How the backend and the mobile app are tested. Every epic follows this document; change it through a PR, not per feature.

Subject requirement: IV.8 (tests for each layer). Goal (CAP-3): `make test` runs backend and mobile tests covering the critical paths of each layer, and exits non-zero when one fails. There is no coverage threshold.

## Frameworks

| Layer | Framework | Why |
| --- | --- | --- |
| Backend (services, permissions, utils, routes) | [Vitest](https://vitest.dev) + [Supertest](https://github.com/ladjs/supertest) | The backend is ESM (`"type": "module"`, `.js` imports, `@/` aliases); Vitest runs it without Babel or experimental Node flags. Supertest drives the Express app without opening a port. |
| Mobile (stores, utils, components) | [jest-expo](https://docs.expo.dev/develop/unit-testing/) + [@testing-library/react-native](https://callstack.github.io/react-native-testing-library/) | Expo's official preset, with the native modules already mocked. Zustand stores are tested directly, without rendering. |

## Two kinds of backend tests

| | Unit | Integration |
| --- | --- | --- |
| File name | `*.test.ts` | `*.int.test.ts` |
| Location | Next to the file under test | Next to the file under test |
| External services | None: every client is mocked | Local Supabase stack, Redis, real Socket.io server |
| Secrets | None | None: only local-stack keys |
| Command | `npm test` | `npm run test:int` |
| Runs in | `make test`, CI | `make test-int`, CI (services job) |

Unit tests are the default. Write an integration test only for behavior that lives in the database or the wire protocol: RLS policies, constraints, concurrent playlist edits (IV.2.3), socket authentication and rooms.

### Environment for tests

`src/shared/config/env.ts` validates `process.env` at import and calls `process.exit(1)` when a variable is missing, so importing almost any module needs a valid environment.

- Unit tests: a Vitest setup file (`backend/test/setup-env.ts`) sets placeholder values for every required variable before any import. No real URL or key is ever used.
- Integration tests: `backend/.env.test` (git-ignored, template in `backend/.env.test.example`) points at the local stack. The keys printed by `supabase start` are local-only demo keys.

## External dependencies

| Dependency | Unit tests | Integration tests |
| --- | --- | --- |
| Supabase (Postgres, PostgREST, Auth) via `@/shared/config/supabase.js` | `vi.mock` the module; the test sets what `supabaseAdmin.from(...)` returns. Pure functions such as `canViewPlaylist` need no mock. | Local Supabase stack (see below), with `backend/migrations` applied. The real `supabase-js` client talks to it unchanged. |
| Redis via `@/shared/config/redis.js` | `vi.mock` the module. The client is created with `lazyConnect`, so importing it does not connect, but nothing may call it unmocked. | Real Redis (container). Rate limiting has no in-memory fallback and `rate-limit-redis` relies on Lua scripts, so it is never simulated. |
| Socket.io (`src/realtime/index.ts`) | Mock the emitter (`io.to(...).emit`) and assert the event name and payload. Read event names from the source; never retype them. | Start the HTTP + Socket.io server on port `0` (random) and connect with `socket.io-client`. |
| SoundCloud (`soundcloud.ts`) | Always mocked. Tests never call SoundCloud: it is rate-limited and its stream URLs expire. | Mocked as well. |
| Mail (`features/mail/mail.service.ts`) | Mock the service and assert the call (recipient, template). | Mocked as well; no email is ever sent. |
| Google / Facebook sign-in | Mock the token verification (`google-auth-library`, Graph API call). | Mocked as well. |

Mobile tests never reach the network. `mobile/src/services/api.ts`, the socket store and Expo modules are mocked; the jest-expo preset covers the native ones.

## Integration database: local Supabase stack

The backend uses `supabase-js`, which goes through PostgREST and Supabase Auth, and the migrations rely on `auth.uid()` and `auth.users`. A plain Postgres cannot run them, so integration tests run against the local Supabase stack from the Supabase CLI, already a backend dev dependency (`supabase`).

- Locally: `supabase start` (Docker) starts Postgres, PostgREST and Auth; `backend/migrations/*.sql` are then applied in file order. Story [1.10] (#58) wires this behind a make target and documents the exact commands here.
- In CI: the same CLI runs in the integration job (story [1.11], #59).
- Tests create their own users and rows and never depend on data left by another test.

The cloud Supabase project is never used by tests.

## Running tests

From the repository root:

```bash
make test        # backend unit tests + mobile tests (no services needed)
make test-int    # backend integration tests (local Supabase stack + Redis)
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

`make test` and `make test-int` are wired by stories [1.9] (#57) and [1.10] (#58); until then use the package commands.

## Writing a test

- Test behavior through the public function, route or store action, not private helpers.
- One file per module under test, named after it: `playlist.permissions.ts` → `playlist.permissions.test.ts`.
- Route tests go through Supertest with a token from a mocked `authMiddleware` (unit) or a user created in the local stack (integration).
- A bug fix comes with the test that would have caught it.
- No test may depend on another test's order or state; reset mocks in `beforeEach`.
