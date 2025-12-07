# Music Room

A collaborative music listening platform built with React Native, Node.js, and Spotify integration.

## Quick Links

- **[Full Documentation](./doc/README.md)** - Complete project overview and setup instructions
- **[Getting Started](./doc/GETTING_STARTED.md)** - Detailed setup guide for developers
- **[Development Guide](./CLAUDE.md)** - Architecture, commands, and development workflow
- **[API Documentation](./backend/API_DOCUMENTATION.md)** - Backend API reference

## Quick Start

```bash
# First-time setup
make install

# Start development environment (Docker)
make dev

# View logs
make logs

# Stop services
make stop
```

## Features

- 🎵 Collaborative music playlists
- 🎧 Spotify integration (OAuth + search)
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
- [doc/SPOTIFY_OAUTH.md](./doc/SPOTIFY_OAUTH.md) - Spotify integration details
- [doc/TUNNEL_MODE.md](./doc/TUNNEL_MODE.md) - Cross-network development

## Contributing

See [doc/GIT_WORKFLOW.md](./doc/GIT_WORKFLOW.md) for Git workflow and contribution guidelines.

## License

[Your License Here]
