# Zumik

A collaborative music listening platform built with React Native, Node.js, and music streaming integration.

## Quick Links

- **[Development Guide](./DEVELOPMENT.md)** - Complete development guide (setup, commands, architecture)
- **[Build Guide](./BUILD.md)** - Production builds (Android, EAS, Google Play)
- **[API Documentation](http://localhost:3000/api-docs)** - Interactive Swagger UI (45 endpoints)

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
| [DEVELOPMENT.md](./DEVELOPMENT.md) | **Complete development guide** (setup, commands, architecture) |
| [BUILD.md](./BUILD.md) | Production builds (Android, EAS, Google Play) |
| [Swagger UI](http://localhost:3000/api-docs) | **Interactive API documentation** (45 endpoints) |

### Specialized Guides

- [Tunnel Mode](./doc/TUNNEL_MODE.md) - Cross-network development (different WiFi)
- [Redis Setup](./doc/REDIS.md) - Cache and rate limiting configuration
- [Security](./doc/SECURITY.md) - Docker security (Chainguard Images, 0 CVE)
- [Testing Security](./doc/TESTING_SECURITY.md) - Subject IV.6 compliance

### Architecture

- **Backend**: [backend/README.md](./backend/README.md) - Node.js + Express + Supabase
- **Mobile**: [mobile/README.md](./mobile/README.md) - React Native + Expo

## Links

- [GitHub](https://github.com/Elnop/zumik/issues)
- [Supabase](https://supabase.com/dashboard/project/vkhspkuureoostyupsrx)
- [Expo](https://expo.dev/)
- [Ngrok](https://dashboard.ngrok.com/get-started/your-authtoken)
- [SoundCloud API](https://developers.soundcloud.com/docs/api/explorer/open-api)
