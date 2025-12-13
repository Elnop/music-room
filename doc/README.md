# Music Room

A collaborative music listening platform where friends can share and control music playback together in real-time.

## Overview

Music Room is a mobile-first application that allows users to create collaborative music playlists with their friends. The platform integrates with music streaming services to provide music playback capabilities and features real-time synchronization using Socket.io for a seamless shared listening experience.

## Project Structure

```
Music_Room/
├── backend/          # Node.js + Express + Socket.io API
├── mobile/           # React Native + Expo mobile app
├── docker-compose.yml
├── Makefile          # Orchestration commands
└── DOCKER.md         # Detailed Docker documentation
```

## Tech Stack

### Backend
- **Runtime**: Node.js 18 + TypeScript
- **Framework**: Express.js
- **Real-time**: Socket.io
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth

### Mobile
- **Framework**: React Native 0.81 + Expo SDK 54
- **Language**: TypeScript
- **Navigation**: React Navigation 7
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod

## Getting Started

### Prerequisites

- **Docker** (v20.10+) - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (v2.0+)
- **Git**

Verify your installation:

```bash
docker --version
docker-compose --version
```

### Quick Start with Docker (Recommended)

The easiest way to run the project is using Docker:

```bash
# 1. Clone the repository
git clone <repository-url>
cd Music_Room

# 2. Install dependencies and setup environment
make install

# 3. Configure Supabase credentials
nano backend/.env  # Add your Supabase URL and keys

# 4. Start all services
make dev
```

That's it! The backend and mobile services are now running in Docker containers.

**Access services:**
- Backend API: http://localhost:3000
- Expo DevTools: http://localhost:19000
- Metro Bundler: http://localhost:8081

### Manual Setup (Without Docker)

If you prefer to run services without Docker:

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
```

#### Mobile Setup

```bash
cd mobile

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Start Expo
npm start
```

## Docker Commands

The project includes a comprehensive Makefile for easy Docker management:

### Essential Commands

```bash
make help          # Show all available commands
make install       # First-time setup
make dev           # Start development environment
make stop          # Stop all services
make logs          # View all logs
make ps            # Show container status
```

### Development Commands

```bash
make restart       # Restart all services
make logs-backend  # View backend logs only
make logs-mobile   # View mobile logs only
make shell-backend # Open shell in backend container
make shell-mobile  # Open shell in mobile container
```

### Build & Quality Commands

```bash
make build         # Build all Docker images
make test          # Run all tests
make lint          # Run linters
make format        # Format code with Prettier
```

### Utility Commands

```bash
make health        # Check health of all services
make clean         # Remove all containers and dependencies
make prune         # Clean up unused Docker resources
make info          # Show system information
```

For detailed Docker documentation, see [DOCKER.md](./DOCKER.md).

## Development Workflow

### Development Modes

Music Room supports two development modes for mobile testing:

#### LAN Mode (Default - Same WiFi Network)

Use when your phone and computer are on the same WiFi network.

```bash
make dev               # Start services in LAN mode
make qr                # Show QR code for local network
```

**Advantages:**
- Fast performance (5-20ms latency)
- Quick hot reload
- No internet dependency
- No additional configuration

**Requirements:**
- Phone and PC on same WiFi network

#### Tunnel Mode (Different WiFi Networks)

Use when your phone and computer are on **different networks** (e.g., phone on cellular data, PC on home WiFi).

```bash
# First time only (automatic setup)
make tunnel-setup

# Start tunnel mode
make dev-tunnel

# Multi-device support: Just share the QR code!
```

**Advantages:**
- Works across any network (cellular, different WiFi, etc.)
- No network configuration needed
- Access from anywhere with internet
- **Unlimited devices simultaneously** (share QR code with team)

**Trade-offs:**
- Slower performance (+50-200ms latency)
- Requires EAS account (free, auto-configured)
- Internet connection required

**ngrok Web Interface:** http://localhost:4040 (monitor tunnel traffic)

📖 **Full tunnel mode documentation:** See [TUNNEL_MODE.md](./TUNNEL_MODE.md)

### Daily Development

```bash
# Start services (LAN mode)
make dev

# View logs (in another terminal)
make logs

# Make changes to code (hot reload is active)
# ...

# Stop services when done
make stop
```

### Testing Mobile App on Device

#### LAN Mode (Same WiFi Network)

1. Ensure your device and computer are on the same WiFi network

2. Start services:
   ```bash
   make dev
   ```

3. Install **Expo Go** on your device (Play Store / App Store)

4. Scan QR code from http://localhost:19000 or the terminal

#### Tunnel Mode (Different Networks)

1. One-time automatic setup:
   ```bash
   make tunnel-setup
   ```

2. Start tunnel mode:
   ```bash
   make dev-tunnel
   ```

3. Install **Expo Go** on your device

4. Scan QR code from terminal (works from any network)

**Multi-device:** Share the same QR code with unlimited devices!

### Rebuilding After Changes

```bash
# If you added new npm packages
make stop
make build
make dev
```

## Project Features

### Current Features (Phase 1 - Complete)
- User authentication (email/password, social OAuth)
- User profiles
- Session management
- API foundation with Express + Socket.io
- Mobile app structure with navigation

### Planned Features
- **Friends System**: Add, manage, and interact with friends
- **Playlist Collaboration**: Create and share collaborative playlists
- **Music Search**: Browse and search music catalog (SoundCloud planned)
- **Real-time Sync**: Synchronized listening across devices
- **Device Control**: Delegate playback control to friends
- **Music Discovery**: Recommendations and shared listening stats

For detailed implementation plan, see [PLAN.md](./PLAN.md).

## Architecture

```
┌─────────────────┐
│  Mobile App     │  React Native + Expo
│  (Android)      │  Port: 8081, 19000-19002
└────────┬────────┘
         │ HTTP + WebSocket
         ▼
┌─────────────────┐
│  Backend API    │  Node.js + Express
│  + Socket.io    │  Port: 3000
└────────┬────────┘
         │ Supabase Client SDK
         ▼
┌─────────────────┐
│  Supabase       │  PostgreSQL + Auth
│  (Cloud)        │  Cloud-hosted
└─────────────────┘
```

## Environment Variables

### Backend (.env)

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Server
PORT=3000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:8081,exp://localhost:8081
```

### Mobile (.env)

```bash
# Backend API URL
API_URL=http://localhost:3000

# For physical device testing:
# API_URL=http://YOUR_LOCAL_IP:3000
```

## Documentation

- **[DOCKER.md](./DOCKER.md)**: Complete Docker guide with troubleshooting
- **[PLAN.md](./PLAN.md)**: Implementation plan and roadmap
- **[Git_Workflow.md](./Git_Workflow.md)**: Git workflow and best practices
- **Backend Makefile**: `make -C backend help` for backend-specific commands

## Git Workflow

The project follows a structured Git workflow:

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: your feature description"

# Push and create PR
git push origin feature/your-feature
```

For detailed workflow, see [Git_Workflow.md](./Git_Workflow.md).

## Troubleshooting

### Docker Issues

If you encounter Docker-related issues:

```bash
# Check service status
make ps
make health

# View logs
make logs

# Rebuild everything
make clean
make install
make dev
```

For detailed troubleshooting, see [DOCKER.md](./DOCKER.md#troubleshooting).

### Mobile Connection Issues

If the mobile app can't connect to backend:

1. Verify services are running: `make ps`
2. Check backend health: `make health`
3. For physical device: Use your local IP instead of localhost
4. Ensure device and computer are on same WiFi network

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m "feat: add amazing feature"`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues or questions:

1. Check the documentation in [DOCKER.md](./DOCKER.md)
2. Review [PLAN.md](./PLAN.md) for project structure
3. Check container logs: `make logs`
4. Create an issue in the repository

---

**Happy coding!** 🎵
