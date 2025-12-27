# Music Room

A collaborative music listening platform built with React Native, Node.js, and music streaming integration.

## Quick Links

- **[Full Documentation](./doc/README.md)** - Complete project overview and setup instructions
- **[Getting Started](./doc/GETTING_STARTED.md)** - Detailed setup guide for developers
- **[Development Guide](./CLAUDE.md)** - Architecture, commands, and development workflow
- **[API Documentation](./backend/API_DOCUMENTATION.md)** - Backend API reference

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

- [CLAUDE.md](./CLAUDE.md) - Complete development guide
- [doc/README.md](./doc/README.md) - Project overview
- [doc/GETTING_STARTED.md](./doc/GETTING_STARTED.md) - Setup instructions
- [doc/REDIS.md](./doc/REDIS.md) - Redis cache & brute force protection
- [doc/TESTING_SECURITY.md](./doc/TESTING_SECURITY.md) - Security testing guide (IV.6 Securing)
- [doc/DOCKER.md](./doc/DOCKER.md) - Docker architecture
- [doc/TUNNEL_MODE.md](./doc/TUNNEL_MODE.md) - Cross-network development
- [doc/REALTIME.md](./doc/REALTIME.md) - Real-time Socket.io documentation
- [doc/SECURITY.md](./doc/SECURITY.md) - Security best practices

## Links

- [GitHub](https://github.com/Elnop/music-room/issues)
- [Supabase](https://supabase.com/dashboard/project/vkhspkuureoostyupsrx)
- [Expo](https://expo.dev/)
- [Ngrok](https://dashboard.ngrok.com/get-started/your-authtoken)
- [SoundCloud API](https://developers.soundcloud.com/docs/api/explorer/open-api)

## Contributing

See [doc/GIT_WORKFLOW.md](./doc/GIT_WORKFLOW.md) for Git workflow and contribution guidelines.

## License

[Your License Here]
