# Zumik

A collaborative music listening platform built with React Native, Node.js, and music streaming integration.

## Quick Links

- **[API Documentation](http://localhost:3000/api-docs)** - Interactive Swagger UI
- **[Backend](./backend/README.md)** / **[Mobile](./mobile/README.md)** - Architecture and commands
- **Project tracking** - GitHub Issues (epics and stories), planning in `_bmad-output/`

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

## Code Formatting

This project uses **tabs** for indentation (visually displayed as 2 spaces).

**Editor Configuration:**
- A `.editorconfig` file is provided at the root - most modern editors will read it automatically
- Configure your editor: Set **tab width = 2** for proper visual alignment
- VS Code: Install the "EditorConfig" extension for automatic configuration

**Before Committing:**
```bash
# Format code automatically
make format

# Or format individually
cd backend && npm run format
cd mobile && npm run format
```

**Working with Feature Branches:**
- If you have an existing feature branch, you may encounter merge conflicts due to the indentation change
- Use these git options to handle whitespace-only changes:
  ```bash
  git merge main -X ignore-all-space
  # OR
  git rebase main --ignore-whitespace
  ```

## Features

- 🎵 **Collaborative Playlists** - Create, share, and manage music playlists with friends
- 🎧 **SoundCloud Integration** - Search, stream, and play music with full audio controls
- 👥 **Friends System** - Follow users, build your network, view mutual friends
- 🎮 **Music Control Delegation** - Grant friends permission to control your playback
- 👤 **User Profiles** - Customizable profiles with avatars and bios
- 🔐 **Authentication** - Secure JWT-based auth with Supabase
- 📱 **Cross-platform Mobile App** - iOS + Android support via React Native & Expo
- ⚡ **Real-time Sync** - Socket.io for live playlist updates and music control
- 🎚️ **Advanced Playlist Features** - Edit modes (open/restricted), viewers, collaborators
- 🐳 **Docker Development** - Containerized environment with 0 CVE Chainguard images

## Tech Stack

### Backend

- **Runtime**: Node.js 22 + TypeScript
- **Framework**: Express.js
- **Real-time**: Socket.io for WebSocket communication
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth with JWT tokens
- **Cache & Rate Limiting**: Redis 7-alpine
- **Validation**: Zod schemas
- **Music**: SoundCloud API via `soundcloud.ts` package

### Mobile

- **Framework**: React Native 0.81 + Expo SDK 54
- **Language**: TypeScript
- **State Management**: Zustand stores + React Context
- **Navigation**: React Navigation 7 (stack-based)
- **Audio**: expo-audio for HLS AAC streaming
- **Real-time**: Socket.io client
- **Forms**: React Hook Form + Zod validation

### Infrastructure

- **Containers**: Docker Compose orchestration
- **Images**: Chainguard Images (0 CVE, distroless)
- **Development**: Hot reload for backend + Expo Metro bundler
- **Tunnel Mode**: Ngrok integration for cross-network development

## Documentation

### Main Guides

| Document | Purpose |
|----------|---------|
| [Swagger UI](http://localhost:3000/api-docs) | **Interactive API documentation** |
| [AGENTS.md](./AGENTS.md) | Rules for AI agents (branches, policy, conventions) |

### Specialized Guides

- [Tunnel Mode](./doc/TUNNEL_MODE.md) - Cross-network development (different WiFi)
- [Redis Setup](./doc/REDIS.md) - Cache and rate limiting configuration
- [Security](./doc/SECURITY.md) - What the Docker images and containers actually do (base images, users, ports)
- [Threat Model](./doc/THREAT_MODEL.md) - Hazards, their protections and tests, accepted risks (subject IV.6)
- [Testing Security](./doc/TESTING_SECURITY.md) - Subject IV.6 compliance
- [Playlist Concurrency](./doc/PLAYLIST_CONCURRENCY.md) - Concurrent track edits (subject IV.2.3)

### Architecture

- **Backend**: [backend/README.md](./backend/README.md) - Node.js + Express + Supabase
- **Mobile**: [mobile/README.md](./mobile/README.md) - React Native + Expo

## Team workflow

- Work is tracked in GitHub Issues and on the [Music Room – Validation board](https://github.com/users/Elnop/projects/1): one epic per subject section, small stories labelled `area: backend` / `area: mobile`.
- **Assign yourself** on an issue before starting it, and never take an issue assigned to someone else.
- **Keep its state current**: label `in-progress` when you start, `review` when the PR is open (with `Closes #<n>`), closed when merged; move the board card to match (`Todo` → `In Progress` → `Review` → `Done`).
- Branch `<issue-number>-<slug>` from `develop`, PR into `develop`. `main` is the deploy branch.

## Troubleshooting

**Mobile can't reach the backend**
1. Check the backend: `make ps` or `curl http://localhost:3000/health`
2. On a physical device, set `http://YOUR_LOCAL_IP:3000` in `mobile/.env` and use the same Wi-Fi (or `make dev-tunnel`)
3. Check `ALLOWED_ORIGINS` in `backend/.env`

**Docker issues**: `make clean`, then `make install` and `make dev-docker`

**Type errors after a pull**: `npm install && npm run type-check` in `backend/` and `mobile/`

**Expo cache issues**: `cd mobile && npm run reset`

**Google / Facebook sign-in fails in Expo Go**: OAuth needs a development build.

## Links

- [GitHub](https://github.com/Elnop/zumik/issues)
- [Supabase](https://supabase.com/dashboard/project/vkhspkuureoostyupsrx)
- [Expo](https://expo.dev/)
- [Ngrok](https://dashboard.ngrok.com/get-started/your-authtoken)
- [SoundCloud API](https://developers.soundcloud.com/docs/api/explorer/open-api)
