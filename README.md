# Zumik

Zumik is a collaborative music app for Android and iOS, built for the 42 project "Music Room". Friends edit playlists together in real time, hand each other control of their music device by device, and move what is playing from one phone to another. Music comes from SoundCloud.

- **Collaborative playlists**: public or private, open to everyone or to invited collaborators; concurrent edits stay consistent.
- **Music control delegation**: let a friend play and pause your music on one device, or on all of them.
- **Play queue and Connect**: one queue shared by your devices and your delegates; send playback to any device you control.
- **Accounts**: email and password, Google or Facebook, linked accounts, a profile with per-field privacy, friends.

The app is a remote control of an Express/TypeScript API backed by Supabase (PostgreSQL), Redis and Socket.io.

## Documentation

- **[doc/README.md](doc/README.md)**: the documentation index (architecture, features, security, development).
- **[doc/subject/coverage.md](doc/subject/coverage.md)**: how each requirement of the subject is met.
- **[backend/README.md](backend/README.md)** and **[mobile/README.md](mobile/README.md)**: each project's structure and commands.
- **[Swagger UI](http://localhost:3000/api-docs)**: the API reference, once the backend runs.

## Quick Start

```bash
# First-time setup
make install

# Choose development mode
make dev

# OR start Docker directly
make dev-docker

# View logs
make logs

# Stop services
make stop
```

### Run the app

The app runs only as the native debug build, "Zumik Dev" (`com.zumik.app.dev`), which installs next to the release (`com.zumik.app`, GitHub Releases) with its own data. It does not start in Expo Go, which lacks its native modules (Google and Facebook sign-in, image colors).

1. **Install the debug build once**: `cd mobile && npx expo run:android --app-id com.zumik.app.dev --no-bundler` (Android SDK required) builds it and installs it on the running emulator or USB phone (`--device` to pick one); `--no-bundler` keeps it from starting its own Metro on 8081, which would clash with the one `make` starts. `make open-app` copies it to every other running emulator. iOS: `npx expo run:ios` on macOS.
2. **Start Metro**: `make dev-docker`, `make dev-local` (Android Studio emulator) or `make dev-tunnel` (phone on another network).
3. **Point the app at Metro** (`make qr` / `make qr-tunnel` print these steps):
   - Emulator: automatic, it reaches Metro on `10.0.2.2:8081`; `make open-app` launches it.
   - Phone over USB: `adb reverse tcp:8081 tcp:8081`, then open Zumik.
   - Phone on the same Wi-Fi: shake the phone, dev menu › **Change Bundle Location** › `<HOST_IP>:8081` (`make info` shows the address).
   - Phone on another network: same menu, enter the Expo tunnel host shown by `make qr-tunnel` (`xxxx-8081.exp.direct:80`).

"Unable to load script" means the app cannot reach Metro: check that Metro runs and the address above, then tap **RELOAD**.

To try the app with ready-made data, `make supabase-reset` loads the [demo accounts](doc/development/demo-accounts.md).

The latest release APK is in the [GitHub Releases](https://github.com/Elnop/music-room/releases/latest).

## Tech Stack

| | |
|---|---|
| **Backend** | Node.js 22, Express 5, TypeScript, Zod, Socket.io 4 |
| **Data** | Supabase (PostgreSQL, Auth, Storage), Redis 7 |
| **Mobile** | React Native 0.81, Expo SDK 54, React Navigation 7, TanStack Query 5, Zustand 5, expo-audio |
| **Music** | SoundCloud API |
| **Tooling** | Docker (`docker run` from the make targets), ngrok tunnel, GitHub Actions |

Why these choices: [doc/decisions.md](doc/decisions.md).

## Contributing

- Work is tracked in GitHub Issues and on the [Music Room – Validation board](https://github.com/users/Elnop/projects/1): one epic per subject section, small stories labelled `area: backend` / `area: mobile`.
- **Assign yourself** on an issue before starting it, and never take an issue assigned to someone else.
- **Keep its state current**: label `in-progress` when you start, `review` when the PR is open (with `Closes #<n>`), closed when merged; move the board card to match (`Todo` → `In Progress` → `Review` → `Done`).
- Branch `<issue-number>-<slug>` from `develop`, PR into `develop`. `main` is the deploy branch.
- `npm run check` must pass in `backend/` and `mobile/` (the pre-commit hook and the CI run it): see [quality-and-ci.md](doc/development/quality-and-ci.md).
- The code uses **tabs** for indentation (shown as 2 spaces); `.editorconfig` sets it for most editors. `make format` formats both projects.
- Rules for AI agents working on the repository: [AGENTS.md](AGENTS.md).

## Troubleshooting

**Mobile can't reach the backend**
1. Check the backend: `make ps` or `curl http://localhost:3000/health`
2. On a physical device, set `http://YOUR_LOCAL_IP:3000` in `mobile/.env` and use the same Wi-Fi (or `make dev-tunnel`), or change the backend address in the app's settings
3. Check `ALLOWED_ORIGINS` in `backend/.env`

**Docker issues**: `make clean`, then `make install` and `make dev-docker`

**Type errors after a pull**: `npm install && npm run type-check` in `backend/` and `mobile/`

**Expo cache issues**: `cd mobile && npm run reset`

**The app crashes at startup in Expo Go**: expected, it needs its native modules. Install the debug build (`cd mobile && npx expo run:android --app-id com.zumik.app.dev --no-bundler`), see [Run the app](#run-the-app).

## Links

- [GitHub Issues](https://github.com/Elnop/music-room/issues)
- [Supabase](https://supabase.com/dashboard/project/vkhspkuureoostyupsrx)
- [Expo](https://expo.dev/)
- [Ngrok](https://dashboard.ngrok.com/get-started/your-authtoken)
- [SoundCloud API](https://developers.soundcloud.com/docs/api/explorer/open-api)
