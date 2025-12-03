# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Music Room is a collaborative music listening platform built with:
- **Backend**: Node.js + Express + Socket.io + TypeScript + Supabase (PostgreSQL + Auth)
- **Mobile**: React Native 0.81 + Expo SDK 54 + TypeScript + Zustand
- **Infrastructure**: Docker Compose for orchestrated development

The app allows users to create collaborative music playlists with friends, featuring real-time synchronization and Spotify integration.

## Development Commands

### Root Level (Orchestration via Makefile)

All primary development happens through the root Makefile which orchestrates Docker containers:

```bash
# First-time setup
make install          # Install deps, create .env files

# Daily development
make dev              # Start all services (backend + mobile) in Docker
make stop             # Stop all services
make restart          # Restart all services
make logs             # View all logs (backend + mobile)
make logs-backend     # Backend logs only
make logs-mobile      # Mobile logs only

# Quality checks
make lint             # Run linters (backend + mobile)
make format           # Format code with Prettier
make test             # Run all tests

# Utilities
make qr               # Show Expo QR code for mobile testing
make health           # Health check all services
make ps               # Show container status
make shell-backend    # Open shell in backend container
make shell-mobile     # Open shell in mobile container

# Tunnel Mode (Cross-Network Development)
make tunnel-setup     # One-time automatic setup (auto EAS login)
make dev-tunnel       # Start all services in tunnel mode (different WiFi networks)
make qr-tunnel        # Show tunnel QR code and URLs
make tunnel-info      # Display detailed tunnel information

# Cleanup
make clean            # Remove containers, images, dependencies (with confirmation)
make prune            # Clean up unused Docker resources
```

### Tunnel Mode (Cross-Network Development)

Use tunnel mode when your phone and PC are on **different WiFi networks**:

```bash
# First-time setup (one command, automatic)
make tunnel-setup          # Auto-configures EAS using credentials from mobile/.env

# Daily usage
make dev-tunnel            # Start all services in tunnel mode
make qr-tunnel             # Show tunnel QR code and URLs

# Multi-device testing
# Just share the QR code - supports unlimited devices!
```

**When to use:**
- Phone on cellular data while PC on WiFi
- Different WiFi networks
- Multiple devices simultaneously (unlimited connections)
- Remote development/testing

**Performance:** ~50-200ms latency vs <10ms LAN mode.

See [TUNNEL_MODE.md](./TUNNEL_MODE.md) for complete documentation.
```

### Backend (Non-Docker Development)

When working directly in `backend/` without Docker:

```bash
cd backend

# Development
npm run dev           # Start dev server with hot reload (tsx watch)
npm run build         # Build TypeScript to dist/
npm start             # Start production server (requires build first)
npm run type-check    # Type check without emitting

# Makefile shortcuts
make dev              # Same as npm run dev
make build            # Same as npm run build
make setup            # Install deps + create .env from .env.example
```

Backend runs on `http://localhost:3000`

### Mobile (Non-Docker Development)

When working directly in `mobile/` without Docker:

```bash
cd mobile

# Start Expo
npm start             # Normal mode
npm run start:lan     # LAN mode (recommended for physical devices)
npm run start:tunnel  # Tunnel mode (different WiFi networks)
npm run start:clear   # Clear cache and start

# Platform-specific
npm run android       # Launch on Android emulator/device
npm run ios           # Launch on iOS simulator (macOS only)

# Code quality
npm run check         # Type check + lint (fast pre-commit check)
npm run fix           # Format + lint fix (auto-fix everything)
npm run lint          # ESLint only
npm run format        # Prettier only
npm run type-check    # TypeScript only

# Troubleshooting
npm run reset         # Clear cache and restart Expo
npm run clean:cache   # Clear Expo cache (~5 seconds)
npm run doctor        # Diagnose Expo configuration issues
```

Expo DevTools: `http://localhost:19000`
Metro Bundler: `http://localhost:8081`

### Testing Mobile App on Physical Device

1. Ensure device and computer on same WiFi
2. Run `make dev` (or `make qr` if already running)
3. Install Expo Go app on device (Play Store / App Store)
4. Scan QR code from terminal or http://localhost:19000

## Architecture

### Backend: Feature-First Architecture

```
backend/src/
├── features/              # Features organized by domain
│   ├── auth/             # Authentication feature (complete)
│   │   ├── auth.types.ts        # TypeScript types
│   │   ├── auth.validators.ts   # Zod validation schemas
│   │   ├── auth.service.ts      # Business logic (Supabase integration)
│   │   ├── auth.controller.ts   # Express request handlers
│   │   ├── auth.middleware.ts   # JWT verification middleware
│   │   ├── auth.routes.ts       # Express routes
│   │   └── index.ts             # Public exports
│   └── [future features: friends, rooms, playlists, spotify]
├── shared/                # Shared code across features
│   ├── config/           # Environment vars (env.ts), Supabase clients
│   ├── middleware/       # Global middleware (error-handler.ts)
│   ├── types/            # Global TypeScript types
│   └── utils/            # Logger, helpers
└── server.ts             # Entry point (Express + Socket.io setup)
```

**Key Backend Patterns**:
- Each feature is self-contained with types, validators, service, controller, routes
- Supabase for PostgreSQL database + authentication
- Zod for runtime validation aligned with TypeScript types
- Error responses follow standardized format from `error-handler.ts`
- JWT tokens verified via `auth.middleware.ts` for protected routes

**Backend API Routes**:
- `/health` - Health check endpoint
- `/api/auth/*` - Authentication endpoints (register, login, me, refresh, logout)

### Mobile: Component + Feature Architecture

```
mobile/src/
├── screens/              # Screens by feature
│   ├── auth/            # WelcomeScreen, LoginScreen, RegisterScreen
│   └── playlists/       # PlaylistsScreen, CreatePlaylistScreen, PlaylistDetailScreen
├── components/
│   ├── common/          # Reusable UI (Button, Card, Input, LoadingSpinner, etc.)
│   └── playlist/        # Feature-specific (TrackItem, PlaylistCard, etc.)
├── navigation/
│   ├── RootNavigator.tsx    # Main navigator (switches Auth/App based on auth state)
│   ├── AuthNavigator.tsx    # Stack for unauthenticated users
│   └── AppNavigator.tsx     # Bottom tabs for authenticated users
├── store/               # Zustand state management
│   ├── authStore.ts    # Authentication state (user, tokens, login/logout)
│   └── playlistStore.ts # Playlist state (currently mock data)
├── types/              # TypeScript types aligned with backend
├── utils/              # Validators (Zod), formatters, mock helpers
├── constants/          # Theme colors, API URLs, spacing
└── mocks/              # Mock data for development (users, playlists, tracks)
```

**Key Mobile Patterns**:
- Path aliases: `@components`, `@screens`, `@store`, `@utils`, `@types`, `@constants`
- Zustand stores for state management (NOT Redux or Context)
- React Hook Form + Zod for form validation
- React Navigation 7 with stack and bottom tab navigators
- Spotify-inspired dark theme (Green #1DB954, Black #121212)
- Authentication state persisted to AsyncStorage, loaded on app start in RootNavigator

## Environment Configuration

### Backend `.env`
```bash
# Supabase (required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key  # Keep secret!

# Server
PORT=3000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:8081,exp://localhost:8081
```

### Mobile `.env`
```bash
# Backend API (use local IP for physical devices)
EXPO_PUBLIC_API_URL=http://localhost:3000

# For physical device testing:
# EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000

# Supabase (optional, primarily using backend API)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## Database Migrations

Migrations are SQL files in `backend/migrations/` executed manually in Supabase Dashboard:

1. Open Supabase Dashboard → SQL Editor
2. Create new query
3. Copy content from migration file (e.g., `001_initial_schema.sql`)
4. Execute

**Current schema**:
- `user_profiles` table (id, username, display_name, avatar_url, created_at, updated_at)
- Linked to Supabase auth.users via foreign key

**Create new migration**:
```bash
cd backend
make migrate-create name=add_friends_table
```

## Docker Architecture

The project uses Docker Compose with two services:

- **Backend**: Runs Node.js dev server with hot reload, exposed on port 3000
- **Mobile**: Runs Expo with Metro bundler, exposed on ports 8081, 19000-19002

Both services use **Chainguard Images** (0 CVE, Wolfi OS, updated daily):
- Dev: `cgr.dev/chainguard/node:latest-dev` (with shell and tools)
- Prod: `cgr.dev/chainguard/node:latest` (distroless, minimal attack surface)

See `DOCKER.md` for detailed Docker documentation and troubleshooting.

## File Permissions

### Why This Matters

Music Room uses Chainguard container images that run as non-root user (UID 65532, user `node`). This is a security best practice that prevents potential privilege escalation attacks.

Source code files must be readable by this user for:
- Metro bundler to scan and watch files during development
- Hot reload to work properly
- Docker bind mounts (`./mobile:/app`) to function correctly

**The Issue**: When source files have owner-only permissions (0700 for directories, 0600 for files), the Docker container's `node` user cannot read them, causing errors like:
```
Error: EACCES: permission denied, scandir '/app/src/mocks'
```

### Expected Permissions

Source code should have standard readable permissions:
- **Directories**: 0755 (drwxr-xr-x) - owner write, everyone read+execute
- **Files**: 0644 (-rw-r--r--) - owner write, everyone read

These are standard for shared development environments and are tracked by git.

### Fixing Permission Issues

If you see `EACCES: permission denied` errors (e.g., `scandir '/app/src/mocks'` or `open '/app/babel.config.js'`):

```bash
# Fix Mobile directory (excluding node_modules and .expo)
find mobile -type d \( -name node_modules -o -name .expo \) -prune -o -type d -exec chmod 0755 {} \;
find mobile -type d \( -name node_modules -o -name .expo \) -prune -o -type f -exec chmod 0644 {} \;
chmod +x mobile/*.sh  # Make shell scripts executable

# Fix Backend directory (excluding node_modules and dist)
find backend -type d \( -name node_modules -o -name dist \) -prune -o -type d -exec chmod 0755 {} \;
find backend -type d \( -name node_modules -o -name dist \) -prune -o -type f -exec chmod 0644 {} \;
chmod +x backend/*.sh  # Make shell scripts executable

# Verify fix
ls -la mobile/babel.config.js mobile/src/mocks/  # Should show -rw-r--r-- and drwxr-xr-x
ls -la backend/src/  # Should show drwxr-xr-x

# Restart Docker
make restart
```

**Why this works**: The chmod commands make files readable by all users (including Docker's non-root `node` user), while keeping write permissions restricted to the owner. Shell scripts need execute permissions (+x) to run. Git tracks execute permissions, so the fix persists across commits.

## Git Workflow

Branch: `main` (NOT `master`)

**Commit message format** (Conventional Commits):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

**Feature branch workflow**:
```bash
git checkout -b feature/friends-system
# ... make changes ...
git add .
git commit -m "feat: Add friends system"
git push -u origin feature/friends-system
# ... create PR on GitHub ...
git checkout main
git merge feature/friends-system
git push
```

See `GIT_WORKFLOW.md` for detailed Git guidance.

## Testing the Backend API

**Manual testing with curl**:
```bash
# Health check
curl http://localhost:3000/health

# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","username":"testuser"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# Get current user (replace TOKEN)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

**Postman collection** available:
- `backend/Music_Room_API.postman_collection.json`
- `backend/Music_Room_Local.postman_environment.json`

The collection auto-saves JWT tokens after login/register.

## Security

- **Docker Images**: Chainguard Images with 0 CVE (see `SECURITY.md`)
- **Authentication**: Supabase Auth with JWT tokens
- **Validation**: Zod schemas on both backend and mobile
- **CORS**: Configured for development origins only
- **Secrets**: Never commit `.env` files (in `.gitignore`)

## Current Implementation Status

**Phase 1 - Complete**:
- Backend foundation with Express + Socket.io setup
- Authentication feature (register, login, logout, refresh, user profile)
- Mobile app with navigation (Auth stack, App stack)
- Basic UI screens (Welcome, Login, Register, Playlist views)
- State management with Zustand (auth, playlists)
- Docker development environment

**Planned Features** (see `PLAN.md`):
- Friends system (add, manage, search friends)
- Music rooms (collaborative listening spaces)
- Spotify integration (OAuth, playback control)
- Real-time sync with Socket.io
- Playlist collaboration

## Common Issues & Solutions

**Mobile can't connect to backend**:
1. Check backend is running: `make ps` or `curl http://localhost:3000/health`
2. For physical device: Use `http://YOUR_LOCAL_IP:3000` in mobile `.env`
3. Ensure device and computer on same WiFi
4. Check `ALLOWED_ORIGINS` in backend `.env` includes Expo URLs

**Docker build failures**:
```bash
make clean    # Remove all containers and deps
make install  # Reinstall
make dev      # Rebuild and start
```

**Expo cache issues**:
```bash
cd mobile
npm run reset    # Clear Expo cache and restart
```

**Type errors after pulling changes**:
```bash
# Backend
cd backend && npm install && npm run type-check

# Mobile
cd mobile && npm install && npm run type-check
```

## Additional Documentation

- `README.md` - Project overview and quick start
- `GETTING_STARTED.md` - Detailed setup instructions
- `PLAN.md` - Complete implementation plan and roadmap
- `DOCKER.md` - Docker architecture and troubleshooting
- `GIT_WORKFLOW.md` - Git workflow and best practices
- `SECURITY.md` - Security details (Chainguard Images, 0 CVE)
- `backend/README.md` - Backend-specific documentation
- `backend/API_DOCUMENTATION.md` - Complete API reference
- `mobile/README.md` - Mobile-specific documentation
