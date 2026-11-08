# Zumik — Music Room

Collaborative music app for Android and iOS, built for the 42 project "Music Room".

- **Playlist Editor**: public or private playlists, edited together in real time.
- **Music Control Delegation**: let a friend control your music, device by device.
- **Accounts**: email and password, Google or Facebook, profile with per-field privacy, friends.

The mobile app (Expo React Native) is a remote control of an Express/TypeScript API backed by Supabase (PostgreSQL), Redis and Socket.io. Music comes from SoundCloud.

## Layout

| Folder | Content |
| --- | --- |
| `backend/` | Express API: one folder per feature in `src/features/`, Socket.io server in `src/realtime/`, SQL migrations in `migrations/` |
| `mobile/` | Expo app: one folder per feature in `src/features/` (orchestrators, presenters, hooks), shared UI and stores in `src/shared/` |
| `make/` | Make targets used by the root `Makefile` |

## Run

Requirements: Node.js 22, Docker, make, and the Android SDK (or Xcode) for the native build.

```bash
make install       # dependencies and .env files
make dev-docker    # backend, Redis and Metro
```

Install the app once on an emulator or a phone, then open it:

```bash
cd mobile && npx expo run:android --app-id com.zumik.app.dev --no-bundler
```

The API reference is served by the backend at http://localhost:3000/api-docs.

## Test

```bash
make test          # backend and mobile unit tests
make test-int      # backend integration tests on a local Supabase stack
```
