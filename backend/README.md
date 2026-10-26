# Zumik Backend

Backend of Zumik, a collaborative music listening app with integrated streaming: an Express/TypeScript API on Supabase, Redis and Socket.io.

How it fits with the rest of the system: [doc/architecture/overview.md](../doc/architecture/overview.md). Full documentation index: [doc/README.md](../doc/README.md).

## Architecture

The code is organized **feature first** (everything about a feature lives in its folder):

```
backend/
├── src/
│   ├── app/                # Composition root: route mounting (routes.ts), OpenAPI document (openapi.ts)
│   ├── features/
│   │   ├── auth/           # Sign-up, login, refresh, Google/Facebook OAuth, email verification, password reset
│   │   ├── friends/        # Follow / unfollow, status, stats
│   │   ├── mail/           # Transactional emails (Gmail SMTP, or Mailpit in dev, through nodemailer)
│   │   ├── music-control/  # Devices, per-device licenses, playback control delegation to friends
│   │   ├── playlists/      # Playlists, tracks, collaborators, viewers
│   │   ├── profile/        # Profile, privacy, music preferences, avatar
│   │   ├── queue/          # Play queue, delegated queue access, playback transfer
│   │   ├── soundcloud/     # Search, track details, stream URLs
│   │   └── subscription/   # Free or premium plan, simulated switch (bonus V.3)
│   ├── realtime/           # Socket.io server
│   │   ├── socket-server.ts  # Server creation, origin, auth, limits, handler wiring
│   │   ├── handlers/       # One handler per domain: playlist, listening, control
│   │   ├── emitters/       # What features call: notify*, sendDeviceCommand, revalidate*, isDeviceOnline
│   │   └── state.ts        # Module state: server, connected devices, listening statuses
│   ├── shared/
│   │   ├── config/         # env, Supabase, Redis, Swagger building blocks, rate limits; imports no feature
│   │   ├── middleware/     # error handler, action logger (HTTP + socket)
│   │   ├── security/       # anti-abuse: rate limiting, lockout, IP reputation, token and socket event limits
│   │   ├── subscription/   # getPlan, assertPremium (403 PREMIUM_REQUIRED), used by Premium-only features
│   │   ├── types/          # Global types + supabase.generated.ts (generated: make generate-types)
│   │   └── utils/          # logger, database.helpers.ts
│   └── server.ts           # Express + Socket.io entry point
├── migrations/             # SQL migrations (local stack: make supabase-up; hosted: by hand in the dashboard)
├── scripts/dev-db.sh       # Local Supabase dev stack (make supabase-up/down/reset)
└── supabase-dev/           # CLI config of the dev stack (music-room-dev, ports 544xx)
```

The layout and the rules that enforce it: [doc/architecture/code-layout.md](../doc/architecture/code-layout.md).

## Quick start

### 1. Initial setup

```bash
make setup
```

This installs the npm dependencies and creates `.env` from `.env.example`.

### 2. Supabase: local stack (default) or hosted project

`SUPABASE_MODE` (a make variable, `local` by default) chooses the database used by `make dev-docker`, `make dev-local` and `make generate-types`. Any value other than `local` or `hosted` stops make before it starts anything.

**`SUPABASE_MODE=local` (default)**: a local Supabase stack, `music-room-dev`, which keeps its data. No hosted key is needed: `.env` can stay a copy of `.env.example`.

| Command | Effect |
| --- | --- |
| `make supabase-up` | Starts the stack (Postgres, PostgREST, Auth, Storage, Kong, Mailpit, Studio), applies the files of `migrations/` not applied yet, writes `.env.supabase.local` |
| `make supabase-down` | Stops the stack; data is kept |
| `make supabase-reset` | Empties the database, reapplies every migration and loads the demo data (accounts, friends, playlists: [demo-accounts.md](../doc/development/demo-accounts.md)) |
| `make logs-supabase` | Follows the stack's logs (prefixes `[SB-DB]`, `[SB-AUTH]`, `[SB-REST]`, `[SB-KONG]`, `[SB-MAIL]`, `[SB-STUDIO]`, `[SB-META]`); `make logs` includes them in local mode |

- Script: `scripts/dev-db.sh`; CLI config: `supabase-dev/supabase/config.toml` (a workdir separate from `supabase/`, which serves the `music-room-test` test stack).
- Storage (profile pictures, #351): a dev stack started before Storage was added runs without `storage-api`, which `make supabase-up` does not start on a stack already running. Once after this update, run `make supabase-down` then `make supabase-up`; otherwise uploads fail and migration 027 may fail. On the hosted project, Storage must be enabled before applying `027_avatars_bucket.sql`.
- Ports 544xx: API `http://127.0.0.1:54421`, Postgres `127.0.0.1:54422`, Studio (dashboard) `http://127.0.0.1:54423`, Mailpit `http://127.0.0.1:54424` (web UI) and `54425` (SMTP). The test stack (554xx) and `make test-int` do not touch them.
- Migrations are tracked in `zumik_dev.applied_migrations` (outside `public`): each file runs in a transaction with its tracking row; a failing file is named and nothing of it remains. No `db reset` in `supabase-up`.
- `.env.supabase.local` (git-ignored, local demo keys) contains `SUPABASE_URL=http://<LAN IP>:54421`, the anon and service keys, and `SMTP_HOST`/`SMTP_PORT` (Mailpit). `make dev-docker` passes it to the backend container as a second `--env-file` (it overrides `.env`; only `SUPABASE_URL` and `SMTP_HOST` are replaced, see below). The mobile app receives none of it: it only talks to the backend (#376). `make dev-local`, `make backend-local` and `make perf-fixtures` export the same values with `localhost`. The targets that start the backend or write to the database (`dev-docker`, `dev-local`, `backend-docker`, `backend-local`, `perf-fixtures`, `generate-types`) run `supabase-up` first. `expo-android` and `expo-clear` (Metro only) do not start the stack.
- `make containers-restart` also stops and restarts the stack (`supabase-down` then `supabase-up`, data kept). `make down` stops it too (data kept); `make clean-docker` and `make clean` stop it and delete its data.
- A backend container started in the other mode (label `zumik.supabase`) is recreated by `make dev-docker`.
- `make generate-types` applies the migrations first (`supabase-up`), generates the types from the local stack (no login or project ID), formats them with Prettier and reports any difference with the committed file.
- `make dev-tunnel`: `supabase-up` first, then the backend with the same variables as `dev-docker`. The phone only needs the backend's tunnel: the app goes through the API for all authentication (#376), so the `/supabase/auth/v1` relay of #251 was removed.
- Google and Facebook: `config.toml` declares `[auth.external.google]` and `[auth.external.facebook]` with `GOOGLE_CLIENT_ID` and `FACEBOOK_APP_ID` read from `.env`. The current flow does not use them: `oauth.service.ts` verifies the tokens itself and creates accounts through `auth.admin`. No secret is needed: Google ID tokens are checked against Google's public keys, Facebook tokens through `GET /app` with the user token (the Facebook app's "Require App Secret" setting must stay off). Works locally with a development build.
- Every developer starts from an empty database; the hosted project's data is not copied. `make supabase-reset` loads the demo data (`supabase-dev/seed.sql`).
- Emails: in local mode, the backend sends its emails (verification code, password reset) to the stack's Mailpit instead of Gmail, without credentials. They show up on http://localhost:54424; nothing goes to real addresses. `GMAIL_USER` stays the displayed sender. In hosted mode, `SMTP_HOST` is not set and Gmail is used.
- Security: the stack listens on every interface (54421 for the API, 54422 for Postgres, 54423 for Studio, 54424 and 54425 for Mailpit), because the phone reaches it through the LAN IP and the Supabase CLI (2.119) cannot choose the listening address. The Postgres login `postgres`/`postgres` and the demo service-role key are public: anyone on the same network can read and change the database, and read the codes received in Mailpit. It must only hold local dev data.
- `make dev-docker` gives the backend container `SUPABASE_URL=http://host.docker.internal:54421` and `SMTP_HOST=host.docker.internal` (the host gateway), which stays valid when the LAN IP changes; the mobile file keeps the LAN IP.

**`SUPABASE_MODE=hosted`**: the project whose URL and keys are in `.env`. No local stack is started.

1. Create an account on [supabase.com](https://supabase.com) and a "zumik" project.
2. Get `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_KEY` in Dashboard → Settings → API, and `SUPABASE_PROJECT_ID` from the dashboard URL.
3. Add them to `.env`, then run for example `SUPABASE_MODE=hosted make dev-docker`.

### 3. SQL migrations

- New migration: `make migrate-create name=<name>` creates `migrations/NNN_<name>.sql` with the prefix after the largest existing one (files are applied in name order).
- Local mode: `make supabase-up` applies the new files of `migrations/`.
- Hosted project: apply each new file by hand (Dashboard → SQL Editor).

### 4. Start the server

```bash
make dev
```

The server starts on `http://localhost:3000`.

## Commands

```bash
make help          # Quick start and categories (make emulator, make docker…)
make install       # Install the dependencies
make dev           # Start in development mode
make build         # Build for production
make start         # Start in production
make type-check    # Check the TypeScript types
make clean         # Remove build artifacts
```

`npm run check` runs every guardrail (see [quality-and-ci.md](../doc/development/quality-and-ci.md)); tests are described in [testing.md](../doc/development/testing.md).

## API documentation

Interactive OpenAPI 3 documentation through Swagger UI:

- **Swagger UI:** http://localhost:3000/api-docs
- **OpenAPI spec (JSON):** http://localhost:3000/api-docs.json

To try an endpoint: register or log in to get a token, click "Authorize" in Swagger UI, paste the token, then use "Try it out".

The document is generated from the Zod schemas with `@asteasolutions/zod-to-openapi`; nothing is written by hand in OpenAPI form:

- Request schemas are the validators the controllers parse with (`features/<name>/<name>.validators.ts`); response schemas sit next to them (or in `<name>-responses.validators.ts` for a big feature).
- Each `features/<name>/<name>.openapi.ts` exports `register<Name>Openapi(registry)`, which registers the routes (method, path, tags, summary, request, responses); a big feature splits them by subject (e.g. `playlist-tracks.openapi.ts`).
- `shared/config/swagger.schemas.ts` (success envelope, body and parameter helpers) and `shared/config/swagger.errors.ts` (`ErrorResponse`, shared error responses) are the building blocks; `app/openapi.ts` calls every feature and generates the document.

`src/app/openapi-coverage.test.ts` fails when a mounted route is not documented, or a documented one is not mounted.

```bash
npm run swagger:export     # Export the OpenAPI spec to a JSON file (importable in Postman)
npm run swagger:validate   # Validate the OpenAPI spec
npm run swagger:serve      # Serve the documentation with Redoc
```

### Quick examples

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Test1234","username":"john_doe"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Test1234"}'

# Current user
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Endpoints

Mounted in `src/app/routes.ts`, documented in Swagger (`/api-docs`):

| Prefix | Endpoints |
|---|---|
| `/api/auth` | register, login, refresh, logout, me, Google/Facebook OAuth, providers (list, link, unlink), verify-email, resend-verification, forgot-password, reset-password |
| `/api/profile` | profile (get, patch), search, privacy, music-preferences (+ genres), avatar, another user's profile |
| `/api/playlists` | CRUD, public, per user, tracks (add, remove, move `POST /:id/tracks/:trackId/move`), collaborators, viewers |
| `/api/friends` | list, stats, status, follow / unfollow |
| `/api/music-control` | permissions (list, grant, revoke), can-control, devices (list, rename), per-device licenses, controllable devices, a user's devices |
| `/api/queue` | the caller's play queue: state, add, remove, move, play an item, play a playlist, next, previous |
| `/api/users/:userId/queue` | the same routes on a friend's queue, for a delegate |
| `/api/queue/transfer` | move playback to another device |
| `/api/soundcloud` | search, track, stream |
| `/api/subscription` | the caller's plan (get), switch free / premium (put) |
| `/health` | server and Redis health (no auth) |

**Invalid token limit (#160)**: every protected route (`authMiddleware`) and every Socket.io handshake verifies the token with Supabase. Failures (`INVALID_TOKEN`, `TOKEN_REVOKED`) are counted per IP in Redis (`rl:auth:token:{ip}`, fixed window `RATE_LIMIT_TOKEN_WINDOW_MS`, 15 min by default). At `RATE_LIMIT_TOKEN_MAX` failures (20 by default), the IP is refused without calling Supabase until the end of the window, for any token, valid or not: every protected route then answers `429 RATE_LIMIT_EXCEEDED` (with `error.details.retryAfter`), a route with optional auth (`optionalAuthMiddleware`) goes on anonymously, and the handshake is refused with `TOO_MANY_ATTEMPTS`. Successful verifications are never counted. Same switch and same whitelist as the other limiters (`RATE_LIMIT_ENABLED`, `RATE_LIMIT_WHITELIST_IPS`); Redis not ready: the limit neither blocks nor counts, and `verifyToken` already answers 503. Each verification reserves a slot before calling Supabase (given back on success or on an uncounted failure): beyond `RATE_LIMIT_TOKEN_MAX` simultaneous verifications from one IP, the next ones get a transient 429.

**Shared IP**: this limit covers every protected route and the socket, per IP. Behind a shared IP (ngrok tunnel, reverse proxy without `TRUST_PROXY`, NAT of a shared network), one client's failures block every client of that IP, protected routes and socket included, until the end of the window. Add the IP to `RATE_LIMIT_WHITELIST_IPS` or configure `TRUST_PROXY` if needed.

**Client IP behind a proxy (`TRUST_PROXY`, #173)**: every per-IP limit (auth, tokens, lockout, blacklist) reads `req.ip`, and the Socket.io handshake the same IP (`clientIp`, `src/shared/config/trust-proxy.ts`). By default (`TRUST_PROXY` empty), it is the connection's address and `X-Forwarded-For` is ignored: a client cannot choose its IP. Behind a reverse proxy or a tunnel that adds `X-Forwarded-For`, set the number of proxies (`TRUST_PROXY=1`) or their addresses (`loopback`, `uniquelocal`, IPs, subnets, comma-separated), with Express's `trust proxy` syntax. Only if every request goes through that proxy: otherwise a client reaching the backend directly can forge its IP.

## Redis

Redis holds the rate limiting and bruteforce protection state, the token revocation list and the real-time throttles. Configuration in `.env`:

```bash
# Connection
REDIS_HOST=redis          # "redis" in Docker, "localhost" locally
REDIS_PORT=6379
REDIS_PASSWORD=           # Optional
REDIS_DB=0

# Rate limiting (express-rate-limit)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_LOGIN_WINDOW_MS=900000     # 15 minutes
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_REGISTER_WINDOW_MS=3600000 # 1 hour
RATE_LIMIT_REGISTER_MAX=3
RATE_LIMIT_OAUTH_WINDOW_MS=900000
RATE_LIMIT_OAUTH_MAX=10
RATE_LIMIT_AUTH_WINDOW_MS=900000
RATE_LIMIT_AUTH_MAX=20
RATE_LIMIT_TOKEN_WINDOW_MS=900000     # token verification failures per IP
RATE_LIMIT_TOKEN_MAX=20
RATE_LIMIT_SOUNDCLOUD_WINDOW_MS=60000  # /api/soundcloud requests per user
RATE_LIMIT_SOUNDCLOUD_MAX=120

# Account lockout (shared/security/account-lockout.ts)
ACCOUNT_LOCKOUT_ENABLED=true
ACCOUNT_LOCKOUT_THRESHOLD=5
ACCOUNT_LOCKOUT_DURATION_SOFT=900     # 15 min
ACCOUNT_LOCKOUT_DURATION_HARD=3600    # 1 hour
ACCOUNT_LOCKOUT_DURATION_SEVERE=86400 # 24 hours

# IP reputation
IP_THROTTLE_THRESHOLD=10
IP_BLOCK_THRESHOLD=20
IP_BLACKLIST_THRESHOLD=50

# Whitelisted IPs (comma-separated)
RATE_LIMIT_WHITELIST_IPS=
```

Key files:

- `src/shared/config/redis.ts` - Redis client (ioredis) with auto-reconnect
- `src/shared/config/rate-limit.config.ts` - Central configuration
- `src/shared/security/counter.ts` - The limiters' only access to Redis (fixed-window counters and flags, atomic Lua scripts)
- `src/shared/security/http-rate-limit.ts` and `rate-limit-store.ts` - express-rate-limit middlewares and their Redis store
- `src/shared/security/attempt-limit.ts` and `password-reset-limit.ts` - Attempt counters (verification and reset codes, resends)
- `src/shared/security/account-lockout.ts`, `ip-reputation.ts` and `account-lockout.middleware.ts` - Account lockout and IP blacklist
- `src/shared/security/token-verify-limit.ts` - Token verification failure limit per IP
- `src/shared/security/socket-event-limit.ts` - Per-socket, per-event limit (in memory, per connection)

**No in-memory fallback.** Nothing is ever counted in memory: an in-memory fallback would give each backend instance its own state behind a load balancer. Without Redis, the rate limiters and the revocation fail closed (503), while the lockout and the blacklist let requests through (the login limiter before them still fails closed). Details and the accepted risks: [threat-model.md](../doc/security/threat-model.md#m13-redis-unavailable). For local development without Redis, set `RATE_LIMIT_ENABLED=false` and `ACCOUNT_LOCKOUT_ENABLED=false` in `backend/.env`: this turns every protection off.

```bash
make redis-start    # Start Redis
make redis-health   # Check the connection
make redis-shell    # Inspect the data (e.g. KEYS rl:*)
make redis-info     # Statistics
```

Every key, threshold and command: [redis.md](../doc/architecture/redis.md).

## Tech stack

- **Runtime**: Node.js 22 (`Dockerfile`, `.nvmrc`)
- **Framework**: Express 5 + TypeScript 5
- **Database / auth**: Supabase (PostgreSQL + Supabase Auth, JWT)
- **Cache / rate limiting**: Redis (ioredis), no in-memory fallback
- **Validation**: Zod 4
- **Real time**: Socket.io 4
- **Email**: nodemailer (Gmail SMTP; the local Supabase stack's Mailpit in dev)

Why these choices: [decisions.md](../doc/decisions.md).

## Feature structure

Each feature follows this structure (no `index.ts` file: import the source file directly, through `@/features/...`, `@/shared/...` or `@/realtime/...`, with the `.js` extension):

```
features/<name>/
├── services/                  # Business logic, split by responsibility (~150 lines max per file)
├── permissions/               # Authorization checks (when needed)
├── utils/                     # Helpers and formatters
├── middleware/                # Feature-specific middleware (when needed)
├── <name>.types.ts            # TypeScript types
├── <name>.validators.ts       # Zod schemas
├── <name>.controller.ts       # Express handlers
├── <name>.routes.ts           # Express router
└── <name>.openapi.ts          # OpenAPI registration of the routes, from the Zod schemas
```

Adding a feature: types → validators → service → controller → routes → openapi, then mount the router in `src/app/routes.ts` and call its `register<Name>Openapi` in `src/app/openapi.ts`.

## Database

Supabase tables used by the backend (schema in `migrations/`):

- `user_profiles`: profile (username, display_name, avatar_url, bio, google_id, facebook_id)
- `profile_privacy`: per-field profile visibility (email, bio, avatar, music preferences): `public`, `friends_only` or `private`
- `music_preferences`: favorite genres (5 max)
- `playlists`: metadata (owner_id, visibility `public` / `private`, edit_mode `open` / `restricted`, `tracks_version`)
- `playlist_tracks`: a playlist's tracks (fractional `rank`, `added_by`, `moved_at_version`; see [playlist-concurrency.md](../doc/features/playlist-concurrency.md))
- `tracks`: universal track data; `track_uri` holds the SoundCloud permalink
- `follows`: follow relations, with `can_control_music` (the "all my devices" switch) for delegation
- `devices`, `device_control_licenses`: a user's devices and the per-device control licenses
- `play_queues`, `play_queue_items`: each user's play queue (versioned; see [queue-and-connect.md](../doc/features/queue-and-connect.md))

## Real time (Socket.io)

Server: `src/realtime/socket-server.ts` (creation, origin, auth, per-event limit), one handler per domain in `src/realtime/handlers/` (`playlist`, `listening`, `control`). Features emit through `src/realtime/emitters/` (`playlist`, `queue`, `control`), imported as namespaces: `import * as realtime from '@/realtime/emitters/queue.emitters.js'`.

### Handshake authentication

Every connection is authenticated at the handshake by `src/realtime/socket-auth.ts` (an `io.use` middleware). The client passes six required strings in `io(url, { auth: { ... } })`:

| Field | Content |
| --- | --- |
| `token` | Supabase access token (JWT), verified by `verifyToken` (`services/session.service.ts`) |
| `deviceId` | stable device identifier (1 to 128 characters) |
| `deviceName` | device name |
| `platform` | platform (`ios`, `android`, ...) |
| `model` | device model |
| `appVersion` | app version |

Refusal: a `connect_error` whose `message` is `NO_TOKEN` (no `token`), `INVALID_HANDSHAKE` (missing field or not a string), `INVALID_TOKEN` (invalid or expired token), `TOO_MANY_ATTEMPTS` (too many token verification failures from this IP, see the invalid token limit above; refreshing the token does not help) or `DEVICE_REGISTRATION_FAILED` (the device could not be registered; Socket.io does not retry a refusal, the client does). Accepted: the device is registered in `devices` before acceptance (one row per user and `deviceId`, `last_seen_at` refreshed) and `socket.data` contains `{ userId, email, device, appVersion }`, identity coming from the token only; the device is registered for control and the socket joins `user:<id>`. The token is only checked at connection time. `listening:update` takes the device from the handshake, never from the payload.

### Events

- **Client → server**: `playlist:join`, `playlist:leave`, `listening:subscribe`, `listening:unsubscribe`, `listening:update`, `control:action`
- **Server → client**: `playlist:updated`, `playlist:details`, `playlist:tracks-availability`, `playlist:deleted`, `playlist:error`, `listening:status`, `listening:error`, `permission:changed`, `control:command`, `control:success`, `control:error`, `control:revoked`, `queue:updated`

A playlist's clients join the `playlist:<id>` room and receive `playlist:updated` on every change.

- `playlist:details` `{ playlistId, name, description?, visibility, editMode }`: sent to `playlist:<id>` after each successful `PATCH /api/playlists/:id` (name, description, visibility or edit mode), before access is re-checked. It has no version: the last one received replaces the displayed metadata. It does not touch the tracks nor `tracksVersion`.
- `playlist:tracks-availability` `{ playlistId, tracks: [{ trackId, unavailable }] }`: sent to `playlist:<id>` after `GET /api/playlists/:id` rechecked on SoundCloud the tracks not checked for 24 h, with only the tracks whose availability changed. It has no version and does not touch `tracksVersion`.
- `playlist:deleted` `{ playlistId }`: sent to `playlist:<id>` after the owner deletes the playlist, before its sockets are removed from the room (they then receive `playlist:error` `PLAYLIST_NOT_FOUND`).

`playlist:join <id>` only adds the socket to the room if its user (`socket.data.userId`) can see the playlist (`canViewPlaylist`: public, or owner / viewer / collaborator), checked in `src/realtime/playlist-room.ts`. Otherwise the socket receives `playlist:error` `{ playlistId, code, message }`:

| `code` | Case |
| --- | --- |
| `INVALID_PAYLOAD` | the id is not a UUID string (`playlistId` is `null` if it is not a string) |
| `PLAYLIST_NOT_FOUND` | unknown playlist (or failed database read), or deleted while the socket was in the room |
| `PLAYLIST_ACCESS_DENIED` | the user cannot see the playlist, or lost access |
| `RATE_LIMITED` | too many `playlist:join` / `playlist:leave` on this socket (see Rate below; `playlistId` is `null`) |

Access is re-checked when it can be lost: after a viewer or collaborator is removed, after a playlist update (visibility) or its deletion, the sockets of `playlist:<id>` without access leave the room and receive `playlist:error`. A failure of this re-check is only logged.

#### Listening and control

`listening:subscribe <ownerId>` and `control:action` only pass if the socket's user and the owner are mutual friends and the owner has turned on the "all my devices" switch for them (`follows.can_control_music`) or granted a license on the device (`device_control_licenses`): on the targeted device for `control:action`, on at least one device for `listening:subscribe`, which then shows the status of all the owner's devices (rule in `features/music-control/services/control-access.service.ts`; a database error refuses). Identity always comes from the socket: extra payload fields (`fromUserId`, `controllerId`...) are ignored and `control:command.fromUserId` is the socket's user. The owner is also allowed on their own devices (`listening:subscribe` on themselves, `control:action` to one of them), without switch or license. Payloads are validated by Zod in `src/realtime/music-control-access.ts`, before any database read:

| Event | Payload | Error |
| --- | --- | --- |
| `listening:subscribe` | user id (UUID) | `listening:error` |
| `listening:unsubscribe` | user id (UUID) | none for an invalid payload (ignored); `listening:error` `RATE_LIMITED` past the rate |
| `listening:update` | `{ track: { id: number, title: string (≤ 300), artist: string (≤ 300), artworkUrl: string (≤ 2048) \| null } \| null, isPlaying: boolean }` | `listening:error` |
| `control:action` | `{ targetUserId: UUID, targetDeviceId: string (1-128), action: 'play' \| 'pause' }` | `control:error` |

Errors have the shape `{ message, code }`: `INVALID_PAYLOAD` (invalid payload), `NOT_AUTHORIZED` (no control right), `DEVICE_OFFLINE` (`control:action` to a device that is not connected), `RATE_LIMITED` (rate exceeded).

**Rate (#204)**: each socket has an in-memory counter per event, over a fixed 10 s window: 20 `listening:update` or `control:action`, 30 for each of the app's other events, one shared counter for any other name (`src/shared/security/socket-event-limit.ts`). Beyond that, the event is not handled and the socket receives `RATE_LIMITED` on `listening:error`, `playlist:error` or `control:error` depending on the event. The counter is per socket: another connection of the same user has its own.

**Play queue (#294).** `queue:updated` (the whole queue) goes to the owner's `user:<id>` and `listening:<id>`: their devices and the delegates listening to them receive the same state (a single emission; a socket in both rooms receives it once). Friends who control at least one of the owner's devices manage the queue through the `/api/users/:userId/queue/...` routes (the same as `/api/queue/...`, see Swagger); an action that changes what plays (play a track, next, previous, play a playlist) targets a device (`deviceId`, required for a delegate, who must control it, and it must be online, otherwise nothing changes). The server then sends that device `control:command` `{ action: 'play-item', fromUserId, item, positionMs, version }`. When a controller loses their last controllable device, their sockets receive `control:revoked` `{ ownerId }`.

**Playback transfer (#295).** `listening:update` accepts an optional `positionMs` (integer ≥ 0, otherwise the status carries `positionMs: null`). `POST /api/queue/transfer` (no version under `/api/users/:userId/queue`) moves playback to a device of the caller or of a friend: `{ targetUserId, targetDeviceId, positionMs, playing: { queueItemId } or { track }, source? }`. Before any change, the server checks the target's license and online presence (`403` or `409 DEVICE_OFFLINE`), control of `source` (`403`) and that the item is in the caller's queue (`404`). To a friend, the track and what follows it are inserted as a block after their current track (`queue:updated`). The target receives `control:command` `play-item` or, for a track outside the queue, `play-track` `{ action, fromUserId, track, positionMs }`; `source` then receives `pause` `{ action, fromUserId }`. The response is `{ ownerId, deviceId, queue }`, `queue` being the friend's new queue or `null`.

`GET /api/music-control/controllable-devices` lists the devices where the caller can play: their own first (`isSelf`), then those of mutual friends who allow them (switch or license), sorted by `username`, each with `online`; a friend without an allowed device and a non-friend never appear.

The controller receives `permission:changed` (`{ ownerId, targetUserId, canControl }`) when the switch changes (`grantControl` / `revokeControl`) and when a device license is granted or withdrawn; for a license, `canControl` says whether at least one controllable device remains, and the app then reloads its list of controllable devices.

When access can be lost, it is re-checked: after the switch is turned off, a license is withdrawn, or an `unfollowUser` in either direction. The controller's sockets only leave `listening:<ownerId>`, and stop receiving `listening:status`, when no controllable device remains. A failure of this eviction is only logged and never fails the HTTP request.

## SoundCloud

- Result cache: search and track details 1 h (`features/soundcloud/utils/soundcloud-cache.ts`). Stream URLs are never cached: a URL reused a few minutes later can already answer 403.
- Only tracks that can be streamed are returned: not blocked in the region (`policy: BLOCK`), with at least one unencrypted transcoding (`hls` or `progressive`; about a third of the catalogue only has DRM `cbc-encrypted-hls` / `ctr-encrypted-hls`, which the app cannot play) (`shared/soundcloud/track-availability.ts`). A 30-second preview (`SNIP`) is kept. The same rule marks a playlist track unavailable. A search reads up to 3 SoundCloud pages of 50 to reach `limit` playable tracks.
- The stream URL is fetched on demand and expires: never store it in the database.
- **Unavailable tracks**: `tracks.unavailable_at` marks a track deleted, made private or blocked on SoundCloud. It is set when `stream` finds no stream, and rechecked in the background when a playlist is opened (tracks not checked for 24 h, `tracks.availability_checked_at`); a track available again is cleared. Playlist tracks carry `unavailable`. The queue SQL functions never queue nor play one (`409 TRACK_UNAVAILABLE`), skip it on next, previous and remove, and leave it out when a playlist is played (migration 029).
- Routes authenticated (`authMiddleware`) and rate-limited per user in Redis (`rl:soundcloud:`, 120 requests per minute by default, `RATE_LIMIT_SOUNDCLOUD_MAX` / `RATE_LIMIT_SOUNDCLOUD_WINDOW_MS`): `429 RATE_LIMIT_EXCEEDED` beyond, `503` without Redis (`REVOCATION_UNAVAILABLE` from auth, which runs first) (#208).
- `track/:urlOrId` accepts a numeric id or an https URL on `soundcloud.com`, `www.soundcloud.com`, `m.soundcloud.com` or `on.soundcloud.com`; `stream` only accepts such a URL: otherwise `400 VALIDATION_ERROR`, without calling SoundCloud.

## Remaining work

Tracked in the repository's GitHub Issues.
