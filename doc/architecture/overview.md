# Architecture overview

Zumik is a mobile app backed by one API server. The app is a remote control: it holds no data of its own, and every action goes through the backend, which is the reference and logs it.

```
┌─────────────────────┐   HTTPS (REST, JSON)    ┌──────────────────────────┐
│  Mobile app         │ ──────────────────────▶ │  Backend                 │
│  Expo React Native  │                         │  Express + TypeScript    │
│  mobile/            │ ◀────────────────────▶  │  backend/                │
└─────────────────────┘   Socket.io (events)    └───┬──────────┬───────┬───┘
                                                    │          │       │
                                       service key  │          │       │ HTTPS
                                                    ▼          ▼       ▼
                                          ┌──────────────┐ ┌───────┐ ┌────────────┐
                                          │  Supabase    │ │ Redis │ │ SoundCloud │
                                          │  Postgres,   │ │       │ │ API        │
                                          │  Auth,       │ └───────┘ └────────────┘
                                          │  Storage     │
                                          └──────────────┘
```

## The pieces

| Piece | Role | More |
|---|---|---|
| **Mobile app** (`mobile/`) | Expo React Native, native build. TanStack Query holds server data, Zustand the client state (session, player, UI). Every HTTP call goes through `shared/services/api.ts`, which adds the token and the `X-Platform` / `X-Device-Model` / `X-App-Version` headers. | [mobile/README.md](../../mobile/README.md) |
| **Backend** (`backend/`) | Express 5 API, one folder per feature (auth, profile, friends, playlists, queue, music-control, soundcloud, mail). Validates every input with Zod, checks rights, and talks to Supabase with the service key. | [backend/README.md](../../backend/README.md) |
| **Real time** (`backend/src/realtime/`) | Socket.io server on the same process. Authenticates each connection with the token at the handshake, registers the device, and keeps rooms: `playlist:<id>` for editors of a playlist, `user:<id>` for a user's devices, `listening:<id>` for the friends allowed to see and control a user's playback. | [backend/README.md](../../backend/README.md#real-time-socketio) |
| **Supabase** | PostgreSQL (all data), Auth (passwords, sessions, tokens) and Storage (avatars). Reached only by the backend: the anon key has no privilege on the tables (#201). Local stack in development, hosted project in production. | [backend/README.md](../../backend/README.md#2-supabase-local-stack-default-or-hosted-project) |
| **Redis** | Rate limiting, account lockout, IP blacklist, token revocation list, attempt counters. No in-memory fallback. | [redis.md](redis.md) |
| **SoundCloud** | Track search and streaming. Results are cached; stream URLs are fetched on demand and never stored. | [backend/README.md](../../backend/README.md#soundcloud) |

## How a request flows

1. The app calls the API with its access token. `authMiddleware` checks the token against the Redis revocation list, then with Supabase Auth (failures are rate-limited per IP).
2. The controller parses the input with its Zod schema, the service checks rights (`permissions/`) and reads or writes Supabase. Operations that must be atomic (playlist tracks, the play queue) are Postgres functions that lock the row they change.
3. After a change, the feature calls an emitter of `realtime/emitters/`, which pushes the new state to the right room. Each event carries a version where order matters, so clients drop stale states.
4. On the app, the socket event updates the TanStack Query cache directly (`shared/query/socketCache.ts`), so every screen shows the server's state.

## Main flows

- **Collaborative playlist**: [playlist-editor.md](../features/playlist-editor.md), [playlist-concurrency.md](../features/playlist-concurrency.md).
- **Delegated control and Connect**: [control-delegation.md](../features/control-delegation.md), [queue-and-connect.md](../features/queue-and-connect.md).
- **Accounts and sessions**: [accounts-auth.md](../features/accounts-auth.md).
- **API contract and the app's backend address**: [mobile-api.md](../features/mobile-api.md).

## Environments

- **Development**: `make dev-docker` (backend, Redis and Metro in Docker, local Supabase stack), `make dev-local` (Android Studio emulator), `make dev-tunnel` (phone on another network, see [tunnel-mode.md](../development/tunnel-mode.md)).
- **Production**: the backend is deployed from `main` (`https://zumik.cluzhub.com`), and the release APK is built by `.github/workflows/release-apk.yml` and published in the GitHub Releases.

Code organization inside each project: [code-layout.md](code-layout.md). Why these technologies: [decisions.md](../decisions.md).
