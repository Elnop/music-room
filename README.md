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

- 🎵 Collaborative music playlists
- 🎧 Music search and streaming (SoundCloud planned)
- 👤 User profiles and authentication
- 📱 Cross-platform mobile app (iOS + Android)
- 🔄 Real-time synchronization
- 🐳 Docker-based development

## Tech Stack

- **Backend**: Node.js + Express + Socket.io + TypeScript + Supabase
- **Mobile**: React Native 0.81 + Expo SDK 54 + TypeScript + Zustand
- **Infrastructure**: Docker Compose + Chainguard Images (0 CVE)

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Complete development guide
- [doc/README.md](./doc/README.md) - Project overview
- [doc/GETTING_STARTED.md](./doc/GETTING_STARTED.md) - Setup instructions
- [doc/PLAN.md](./doc/PLAN.md) - Implementation roadmap
- [doc/DOCKER.md](./doc/DOCKER.md) - Docker architecture
- [doc/SOUNDCLOUD_MIGRATION_PLAN.md](./doc/SOUNDCLOUD_MIGRATION_PLAN.md) - SoundCloud integration plan
- [doc/TUNNEL_MODE.md](./doc/TUNNEL_MODE.md) - Cross-network development

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
