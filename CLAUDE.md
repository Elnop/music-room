# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Music Room is a collaborative music listening platform built with:
- **Backend**: Node.js + Express + Socket.io + TypeScript + Supabase (PostgreSQL + Auth)
- **Mobile**: React Native 0.81 + Expo SDK 54 + TypeScript + Zustand
- **Infrastructure**: Docker Compose for orchestrated development

The app allows users to create collaborative music playlists with friends, featuring real-time synchronization and music streaming integration.

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

**Automatic Tunnel URL Sharing:**

The tunnel system is now **100% automatic**:

1. Backend starts ngrok tunnel → writes URL to `/tmp/shared/backend-tunnel-url.txt`
2. Mobile container waits for file → reads URL automatically
3. Expo starts with correct backend tunnel URL
4. **No manual configuration needed!**

**Technical Details:**
- Backend and mobile containers share a Docker volume at `/tmp/shared`
- Dockerfiles create directory with correct permissions (node:node, UID 65532)
- `start-with-tunnel.sh` writes tunnel URL after ngrok initializes
- `start-expo-tunnel.sh` reads URL and exports as `EXPO_PUBLIC_API_URL`
- No hardcoded URLs in `.env` files - always uses fresh tunnel URL

**Troubleshooting:**

If mobile can't find backend tunnel URL:
```bash
# 1. Check backend tunnel initialized
docker logs music-room-backend | grep "Tunnel URL"

# 2. Verify file exists and is readable
docker exec music-room-backend cat /tmp/shared/backend-tunnel-url.txt

# 3. Check mobile can access shared volume
docker exec music-room-mobile ls -la /tmp/shared

# 4. Rebuild with fresh volumes
make stop && docker compose down -v && make dev-tunnel
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

### Backend: Feature-First Architecture (Refactored for Team Collaboration)

```
backend/src/
├── features/              # Features organized by domain
│   ├── auth/             # Authentication feature (194 lines, refactored)
│   │   ├── services/           # Business logic services
│   │   │   └── session.service.ts    # Session and token management
│   │   ├── utils/              # Auth helpers
│   │   │   └── auth.helpers.ts       # Format response, fetch profile
│   │   ├── auth.types.ts       # TypeScript types
│   │   ├── auth.validators.ts  # Zod validation schemas
│   │   ├── auth.service.ts     # Main auth service (register, login)
│   │   ├── auth.controller.ts  # Express request handlers
│   │   ├── auth.middleware.ts  # JWT verification middleware
│   │   └── auth.routes.ts      # Express routes
│   ├── playlists/        # Playlist management (254 lines main service, refactored)
│   │   ├── services/           # Business logic services
│   │   │   ├── playlist-track.service.ts  # Track management (add/remove/reorder)
│   │   │   └── collaborator.service.ts    # Collaborator management
│   │   ├── permissions/        # Authorization checks
│   │   │   └── playlist.permissions.ts    # Ownership and edit permissions
│   │   ├── utils/              # Helpers
│   │   │   └── playlist.helpers.ts        # Format responses, reindex positions
│   │   ├── playlist.types.ts
│   │   ├── playlist.validators.ts
│   │   ├── playlist.service.ts          # Main playlist CRUD service
│   │   ├── playlist.controller.ts       # Express request handlers
│   │   └── playlist.routes.ts
│   ├── soundcloud/       # SoundCloud integration (75 lines main service, refactored)
│   │   ├── services/           # Business logic services
│   │   │   ├── soundcloud-search.service.ts  # Search and track retrieval
│   │   │   └── soundcloud-stream.service.ts  # Stream URL management
│   │   ├── utils/              # Helpers
│   │   │   ├── soundcloud-cache.ts           # Cache management with TTL
│   │   │   └── client-extractor.ts           # Client ID extraction
│   │   ├── soundcloud.types.ts
│   │   ├── soundcloud.validators.ts
│   │   ├── soundcloud.service.ts      # Main orchestrator service
│   │   ├── soundcloud.controller.ts
│   │   └── soundcloud.routes.ts
│   ├── profile/          # User profile management (124 lines, refactored for consistency)
│   │   ├── services/           # Business logic services
│   │   │   └── profile.service.ts    # Profile CRUD operations
│   │   ├── profile.types.ts
│   │   ├── profile.validators.ts
│   │   ├── profile.service.ts         # Re-export for backward compatibility
│   │   ├── profile.controller.ts
│   │   └── profile.routes.ts
│   └── [future features: friends, rooms]
├── shared/                # Shared code across features
│   ├── config/           # Environment vars (env.ts), Supabase clients
│   ├── middleware/       # Global middleware (error-handler.ts)
│   ├── types/            # Global TypeScript types
│   └── utils/            # Logger, helpers
│       ├── logger.ts
│       └── database.helpers.ts  # Shared DB utilities (fetchSingle, fetchMany, etc.)
└── server.ts             # Entry point (Express + Socket.io setup)
```

**Key Backend Patterns** (Updated for Team Collaboration):
- **Feature-first structure**: Each feature is self-contained with clear boundaries
- **Services layer**: Business logic split into focused services (< 150 lines each)
- **Permissions layer**: Authorization checks separated for testability (playlists)
- **Utils layer**: Reusable helpers and formatters to reduce duplication
- **Consistent structure**: All features follow the same organizational pattern
- **Improved maintainability**: Smaller files, clearer responsibilities, easier code reviews
- **Testability**: Isolated services and helpers are easier to unit test
- **Reduced debug noise**: Excessive logging removed, cleaner codebase

**Refactoring Results**:
- **Playlists**: 657 lines → 254 lines main service (60% reduction)
- **SoundCloud**: 342 lines → 75 lines main service (78% reduction)
- **Auth**: 307 lines → 194 lines main service (37% reduction)
- **Profile**: 124 lines → organized in services/ for consistency

**Standard Feature Structure**:
```
feature/
  ├── services/          # Business logic divided by responsibility
  │   ├── feature.service.ts        # Main CRUD operations
  │   └── feature-secondary.service.ts  # Secondary operations
  ├── utils/            # Helpers and utilities
  │   └── feature.helpers.ts
  ├── permissions/      # Authorization checks (if needed)
  │   └── feature.permissions.ts
  ├── feature.types.ts
  ├── feature.validators.ts
  ├── feature.controller.ts
  ├── feature.routes.ts
  └── feature.middleware.ts (if applicable)
```

**Import Convention**:
- **No index.ts files anywhere** - All imports are direct from source files
- Example: `import { PlaylistService } from "./services/playlist.service.js"`
- Example: `import { formatResponse } from "./utils/playlist.helpers.js"`
- Example: `import authRoutes from "./features/auth/auth.routes.js"` (from server.ts)

**Database Integration**:
- Supabase for PostgreSQL database + authentication
- Zod for runtime validation aligned with TypeScript types
- Shared database helpers in `shared/utils/database.helpers.ts`
- Error responses follow standardized format from `error-handler.ts`
- JWT tokens verified via `auth.middleware.ts` for protected routes

**Backend API Routes**:
- `/health` - Health check endpoint
- `/api/auth/*` - Authentication endpoints (register, login, me, refresh, logout)
- `/api/profile/*` - Profile management endpoints (get, update profile)
- `/api/playlists/*` - Playlist CRUD and track management endpoints (create, read, update, delete playlists, add/remove/reorder tracks, manage collaborators)
- `/api/soundcloud/*` - SoundCloud music search and streaming endpoints (search, track details, stream URLs)

### Mobile: Component + Feature Architecture

```
mobile/src/
├── screens/              # Screens by feature
│   ├── auth/            # WelcomeScreen, LoginScreen, RegisterScreen
│   ├── playlists/       # PlaylistsScreen, CreatePlaylistScreen, PlaylistDetailScreen, SearchTracksScreen
│   ├── profile/         # ProfileScreen, EditProfileScreen
│   ├── settings/        # SettingsScreen
│   └── search/          # SoundCloudSearchScreen, SoundCloudTrackItem, PlaylistSelectorModal
├── components/
│   ├── common/          # Reusable UI (Button, Card, Input, LoadingSpinner, Avatar, etc.)
│   ├── playlist/        # Feature-specific (TrackItem, PlaylistCard, PlaylistHeader, AddTrackButton)
│   └── player/          # MiniPlayer, PlayerModal
├── navigation/
│   ├── RootNavigator.tsx    # Main navigator (switches Auth/App based on auth state)
│   ├── AuthNavigator.tsx    # Stack for unauthenticated users
│   └── AppNavigator.tsx     # Bottom tabs for authenticated users
├── store/               # Zustand state management
│   ├── authStore.ts    # Authentication state (user, tokens, login/logout)
│   ├── playlistStore.ts # Playlist state with API integration
│   ├── soundcloudStore.ts # SoundCloud search state
│   └── playerStore.ts  # Audio player state
├── api/                 # API client layer
│   └── playlistApi.ts  # Playlist API calls
├── services/            # Service layer
│   ├── api.ts          # Base API configuration
│   └── profileApi.ts   # Profile API calls
├── lib/                 # Third-party library configuration
│   └── supabase.ts     # Supabase client setup
├── types/              # TypeScript types aligned with backend
├── utils/              # Validators (Zod), formatters, helpers
├── constants/          # Theme colors, API URLs, spacing
└── mocks/              # Mock data for development (users, playlists, tracks)
```

**Key Mobile Patterns**:
- Path aliases: `@/*` (root), `@components`, `@screens`, `@store`, `@utils`, `@types`, `@constants`, `@mocks`, `@api`, `@services`
- Zustand stores for state management (NOT Redux or Context)
- React Hook Form + Zod for form validation
- React Navigation 7 with stack and bottom tab navigators
- Music-inspired dark theme (Green #1DB954, Black #121212)
- Authentication state persisted to AsyncStorage, loaded on app start in RootNavigator
- API layer (`@api`) for backend communication
- Service layer (`@services`) for business logic

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
- `user_profiles` table - User profile data (id, username, display_name, avatar_url, bio, created_at, updated_at)
  - Linked to Supabase auth.users via foreign key
- `playlists` table - Playlist metadata (id, name, description, cover_url, owner_id, collaborator_ids, visibility, timestamps)
- `tracks` table - Universal track data (id, track_uri, title, artist, album, album_art, duration_ms, preview_url, timestamps)
  - `track_uri` stores universal track identifiers from any music service
- `playlist_tracks` junction table - Many-to-many relationship (playlist_id, track_id, position, added_by, timestamps)

**Migrations**:
- `001_initial_schema.sql` - User profiles table with basic fields
- `002_spotify_oauth.sql` - (Deprecated) Previous Spotify OAuth integration
- `003_playlist_persistence.sql` - Playlists, tracks, and playlist_tracks tables
- `004_remove_spotify.sql` - Remove all Spotify columns from user_profiles
- `005_rename_spotify_uri_to_track_uri.sql` - Rename spotify_uri to track_uri for universal support

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

## Music Integration - SoundCloud

Music Room uses **SoundCloud** for music search and streaming via the `soundcloud.ts` npm package.

### Key Features

**Backend** (`/api/soundcloud/*`):
- **Search Tracks**: `GET /api/soundcloud/search?q=query&limit=20`
- **Get Track Details**: `GET /api/soundcloud/track/:urlOrId`
- **Get Stream URL**: `GET /api/soundcloud/stream/:trackUrl` (returns AAC HLS stream URL)

**Mobile**:
- **Search Screen**: SoundCloudSearchScreen with debounced search (500ms)
- **Track Items**: Display artwork, title, artist, duration
- **Add to Playlist**: Modal to select playlist and add SoundCloud track
- **Mini Player**: Persistent player at bottom of screen (above tab bar)
- **Full Player Modal**: Complete player with controls, progress slider, artwork

### Implementation Details

**soundcloud.ts package**:
- Automatically extracts `client_id` from SoundCloud website (no manual API registration needed)
- Provides TypeScript wrapper for SoundCloud API
- Handles track search, metadata, and stream URL retrieval

**Backend Service** (`soundcloud.service.ts`):
- In-memory cache (Map) for search results (1h TTL) and stream URLs (30min TTL)
- Filters for playable/streamable tracks only
- Converts SoundCloud tracks to internal Track format (`trackUri` = `permalink_url`)

**Mobile Audio** (`expo-audio`):
- Hook: `useSoundCloudPlayer(track)` fetches stream URL and manages playback
- Supports play/pause, seek, skip ±10s
- Progress tracking with slider
- Auto-plays when stream loads

**State Management**:
- `soundcloudStore`: Search results, loading, errors
- `playerStore`: Current track, play state, modal state

### Usage Flow

1. User searches for music in Search tab → `soundcloudStore.search(query)`
2. Backend queries SoundCloud API via `soundcloud.ts`
3. Results displayed in `SoundCloudSearchScreen`
4. User taps play → `playerStore.playTrack(track)` → mini-player appears
5. Hook `useSoundCloudPlayer` fetches stream URL from backend
6. expo-audio plays HLS AAC stream
7. User can expand to full player modal or add track to playlist

### API Routes (Public - No Auth Required)

```bash
# Search
curl "http://localhost:3000/api/soundcloud/search?q=lofi&limit=10"

# Get Track
curl "http://localhost:3000/api/soundcloud/track/user/song-name"

# Get Stream URL (URL-encoded)
curl "http://localhost:3000/api/soundcloud/stream/https%3A%2F%2Fsoundcloud.com%2Fuser%2Fsong"
```

### Track Storage

When adding SoundCloud track to playlist:
- `track_uri` = `permalink_url` (e.g., `https://soundcloud.com/artist/track`)
- `title`, `artist`, `album_art`, `duration_ms` stored in `tracks` table
- Stream URL fetched on-demand (not stored, as it expires)

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

## Music Integration

Music Room uses a universal `trackUri` field to support multiple music services.

### Planned: SoundCloud Integration

SoundCloud integration is planned to replace the previous Spotify integration. Implementation details are available in `doc/SOUNDCLOUD_MIGRATION_PLAN.md`.

**Key Features (Planned)**:
- Public API search (no OAuth required)
- Direct track streaming
- Simple architecture with single search endpoint
- Support for AAC HLS audio format

**Database Schema**:
- `tracks` table stores universal track URIs in `track_uri` column
- Supports any music service (SoundCloud, YouTube Music, etc.)
- Migrations `004_remove_spotify.sql` and `005_rename_spotify_uri_to_track_uri.sql` prepared the database

For implementation details, see `doc/SOUNDCLOUD_MIGRATION_PLAN.md`.

## Current Implementation Status

**Phase 1 - Complete**:
- Backend foundation with Express + Socket.io setup
- Authentication feature (register, login, logout, refresh, user profile)
- Mobile app with navigation (Auth stack, App stack)
- Basic UI screens (Welcome, Login, Register, Playlist views)
- State management with Zustand (auth, playlists)
- Docker development environment

**Phase 2 - Removed (Spotify Replaced)**:
- Previous Spotify OAuth integration removed
- Database cleaned: Removed all `spotify_*` columns from `user_profiles`
- Renamed `spotify_uri` to `track_uri` for universal music service support
- Migration to SoundCloud planned (see `doc/SOUNDCLOUD_MIGRATION_PLAN.md`)

**Phase 3 - Complete (Playlist Persistence)**:
- Database migration: `003_playlist_persistence.sql` (playlists, tracks, playlist_tracks tables)
- Backend feature: `/api/playlists/*` (full CRUD, track management, collaborators)
  - 10 API endpoints for playlist operations
  - Track add/remove/reorder functionality
  - Collaborator management system
- Mobile screens: PlaylistsScreen, PlaylistDetailScreen, CreatePlaylistScreen, SearchTracksScreen
- Playlist store: Zustand state with full API integration
- Playlist API client: `playlistApi.ts` for backend communication
- Real playlist persistence (no more mock data)

**Phase 4 - Complete (Profile System)**:
- Backend feature: `/api/profile/*` (profile management, updates)
- Mobile screens: ProfileScreen, EditProfileScreen
- Profile API client: `profileApi.ts`
- Profile tab in bottom navigation
- Avatar upload and display support

**Phase 5 - Planned (Music Search)**:
- SoundCloud integration for track search and streaming
- Public API access (no OAuth required)
- Search tab in bottom navigation
- Direct track playback
- See `doc/SOUNDCLOUD_MIGRATION_PLAN.md` for implementation plan

**Planned Features** (see `PLAN.md`):
- Friends system (add, manage, search friends)
- Music rooms (collaborative listening spaces)
- Music playback control
- Real-time sync with Socket.io

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
