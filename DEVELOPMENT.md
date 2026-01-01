# Zumik Development Guide

**Complete guide for developers working on Zumik - a collaborative music listening platform.**

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Development Commands](#development-commands)
   - [Quick Start](#quick-start)
   - [Development Modes](#development-modes)
   - [Build Commands](#build-commands)
   - [Redis Management](#redis-management)
   - [Code Quality](#code-quality)
   - [Cleanup](#cleanup)
3. [Architecture](#architecture)
   - [Backend](#backend)
   - [Mobile](#mobile)
4. [API Documentation](#api-documentation)
5. [Environment Configuration](#environment-configuration)
6. [Database Migrations](#database-migrations)
7. [Docker Architecture](#docker-architecture)
8. [Git Workflow](#git-workflow)
9. [Testing the Backend API](#testing-the-backend-api)
10. [Security](#security)
11. [Music Integration](#music-integration)
12. [Current Implementation Status](#current-implementation-status)
13. [Common Issues & Solutions](#common-issues--solutions)
14. [Additional Documentation](#additional-documentation)

---

## Project Overview

Zumik is a collaborative music listening platform built with:
- **Backend**: Node.js + Express + Socket.io + TypeScript + Supabase (PostgreSQL + Auth)
- **Mobile**: React Native 0.81 + Expo SDK 54 + TypeScript + Zustand
- **Infrastructure**: Docker Compose for orchestrated development

The app allows users to create collaborative music playlists with friends, featuring real-time synchronization and music streaming integration.

## Development Commands

Zumik provides **three development modes** orchestrated by a modular Makefile system. Use `make help` to see all available commands.

### Quick Start

```bash
# 1. First-time setup (required once)
make install          # Install all dependencies, create .env files

# 2. Choose your development mode
make dev              # Interactive menu to select mode

# OR directly start your preferred mode:
make dev-docker       # Docker mode (containerized, recommended for most)
make dev-local        # Local mode (native, for Android Studio users)
make dev-tunnel       # Tunnel mode (cross-network, different WiFi)
```

### Development Modes

#### 🐳 Docker Mode (Recommended)
Containerized development using Docker Compose. Best for most developers.

```bash
# Start services
make dev-docker       # Start backend + mobile in containers
make stop             # Stop all containers
make restart          # Restart all services
make start            # Start existing containers (no rebuild)
make down             # Stop and remove containers + networks

# View logs
make logs             # View all logs (backend + mobile)
make logs-backend     # Backend logs only
make logs-mobile      # Mobile logs only

# Testing
make qr               # Show Expo QR code (device must be on same WiFi)
make ps               # Show container status
make health           # Check services health status

# Container access
make shell-backend    # Open shell in backend container
make shell-mobile     # Open shell in mobile container
make build            # Rebuild Docker images
```

**When to use:** Default choice for development. Works out of the box.

#### 💻 Local Mode (Native Development)
Run services directly on your machine without Docker. Required for Android Studio emulator integration.

```bash
# Start services
make dev-local        # Start backend + mobile locally
make backend-local    # Start backend only
make mobile-local     # Start Expo only

# Android development
make dev-android      # Start Expo for Android emulator
make expo-android     # Quick launch in Android emulator
make expo-clear       # Start Expo with cleared cache
make check-devices    # Check connected Android devices
```

**When to use:**
- Using Android Studio emulator
- Need native debugging
- Docker not available
- Prefer native development

**Requirements:** Node.js 20+, npm installed locally

#### 🌐 Tunnel Mode (Cross-Network Development)
Uses ngrok tunneling for development across different networks. Adds ~50-200ms latency.

```bash
# One-time setup (required once)
make tunnel-setup     # Auto-configures EAS, requires EXPO_TOKEN in mobile/.env

# Daily usage
make dev-tunnel       # Start all services with tunnel
make qr-tunnel        # Show tunnel QR code and URLs
make tunnel-info      # Display detailed tunnel information
```

**When to use:**
- Phone on cellular data while PC on WiFi
- Different WiFi networks
- Testing from multiple devices simultaneously
- Remote development/testing

**Performance:** ~50-200ms latency vs <10ms LAN mode.

See [doc/TUNNEL_MODE.md](./doc/TUNNEL_MODE.md) for complete documentation.

### 📱 Native Builds (Custom Development Builds)
Required for OAuth (Google/Facebook Sign-In) and native modules. Keeps hot reload functionality.

```bash
# One-time setup
make dev-build-setup  # Configure EAS for development builds

# Build custom development APK
make dev-build        # Cloud build (~15-20 minutes)
make dev-build-local  # Local build (requires Android SDK)

# Cleanup
make clean-native     # Clean android/ios/expo folders
```

**When to use:**
- Need Google/Facebook OAuth
- Testing native modules
- Expo Go limitations

### Build Commands

Zumik provides build commands for backend validation and production mobile releases.

#### Backend Builds

```bash
# TypeScript compilation (validation)
make compile-backend    # Build backend TypeScript (fast validation)
make verify-backend     # Check backend/dist/ artifacts exist
make build-clean        # Remove build artifacts only

# Production Docker image
make compile-backend-docker # Build production backend image
```

**When to use backend builds**:
- `make compile-backend` - Quick validation before commits (check TypeScript compiles)
- `make verify-backend` - CI/CD pipelines to verify artifacts exist
- `make compile-backend-docker` - Build production Docker image for deployment

**Note**: Normal development does **not** need builds - `make dev-docker` and `make dev-local` use hot reload (tsx watch / Metro bundler).

#### Production Mobile Builds (Android)

Build production Android apps (AAB format) for Google Play Store deployment.

```bash
# Build production AAB for Google Play Store
make prod-build         # EAS cloud build (~15-25 min, recommended)
make prod-build-local   # EAS local build (requires Android SDK)
make prod-build-manual  # Manual Gradle build (full control)

# Version management
make prod-version-bump  # Interactive version bump (e.g., 1.0.0 → 1.0.1)
make prod-version-auto  # Auto-increment versionCode only

# Deployment
make prod-submit        # Submit AAB to Google Play Store
make prod-info          # Display build information

# Setup (one-time, for manual builds only)
make prod-keystore-setup # Generate production keystore for signing
```

**Production Release Workflow**:
```bash
# 1. Bump version
make prod-version-bump   # e.g., 1.0.0 → 1.0.1

# 2. Build production AAB
make prod-build          # Cloud build (easiest, ~15-25 min)

# 3. Submit to Play Store
make prod-submit         # Automatic submission via EAS
```

**Build Options Explained**:

- **`prod-build`** (EAS Cloud - Recommended)
  - Builds AAB on EAS servers
  - No local Android SDK needed
  - Auto-increments versionCode
  - Duration: ~15-25 minutes
  - Requires: EAS CLI (`npm install -g eas-cli`), Expo account

- **`prod-build-local`** (EAS Local)
  - Builds AAB on your machine
  - Faster (~5-15 min, no queue)
  - Requires: Android SDK, ANDROID_HOME set

- **`prod-build-manual`** (Gradle)
  - Full control over build process
  - No EAS dependency
  - Requires: Keystore setup (`make prod-keystore-setup`)

**First-Time Setup**:
```bash
# Install EAS CLI (if using cloud/local builds)
npm install -g eas-cli

# Login to Expo
cd mobile && eas login

# For manual builds only
make prod-keystore-setup  # Generate signing keystore
```

**Documentation**: See [BUILD.md](./BUILD.md) for complete build guide, troubleshooting, and CI/CD integration.

### Redis Management

Redis can be launched independently for local development, useful for brute force protection and rate limiting.

```bash
# Start Redis container
make redis-start       # Start Redis independently
make redis-stop        # Stop Redis
make redis-restart     # Restart Redis

# Monitoring
make redis-logs        # View Redis logs (live)
make redis-health      # Check Redis health status
make redis-status      # Quick status check

# Management
make redis-shell       # Open Redis CLI shell (debug/inspect data)
make redis-info        # Display Redis server info
make redis-flush       # Flush all data (with confirmation)
make redis-help        # Show all Redis commands
```

**Common Workflows**:
```bash
# Start Redis with local backend
make redis-start && make backend-local

# Inspect rate limit data
make redis-shell
> KEYS *
> GET failed_login:test@example.com:127.0.0.1
> TTL failed_login:test@example.com:127.0.0.1

# Check memory usage
make redis-info | grep -A 10 "# Memory"
```

**When to use:**
- Running backend locally (`make backend-local`)
- Testing rate limiting and brute force protection
- Debugging authentication lockouts
- Inspecting cached data

**Note:** Redis automatically starts with `make dev-docker`. Standalone commands are for local development mode only.

### Code Quality

```bash
make test             # Run all tests
make lint             # Run linters on all code
make lint-fix         # Auto-fix linting issues
make format           # Format all code with Prettier
```

### Cleanup

```bash
# Project-level cleanup (recommended for most cases)
make clean            # Containers + volumes + project artifacts (with confirmation)
make clean-deps       # Dependencies + build artifacts only (no Docker)
make clean-cache      # Project caches only (.expo, coverage, logs)
make clean-native     # Native build folders (android/, ios/)
make clean-project    # All project artifacts (comprehensive, no Docker/global)

# Docker-specific cleanup
make clean-docker     # Zumik Docker resources only
make prune            # Unused Docker resources across all projects

# Global/system-wide cleanup (affects ALL projects - use with caution)
make clean-global-cache   # Expo, Metro, Watchman caches (needs 'yes' confirmation)
make clean-gradle         # Gradle/Android caches (needs 'yes' confirmation)

# Nuclear option (use with extreme caution)
make clean-all            # EVERYTHING: Docker + project + global caches (needs 'yes' confirmation)
```

### Cleanup Matrix

| Command | Files/Deps | Docker (Zumik) | Docker (System) | Global Caches | Confirmation |
|---------|-----------|---------------------|-----------------|---------------|--------------|
| `make clean` | ✓ | ✓ | ✗ | ✗ | Yes (y/n) |
| `make clean-deps` | ✓ | ✗ | ✗ | ✗ | No |
| `make clean-cache` | Cache only | ✗ | ✗ | ✗ | No |
| `make clean-docker` | ✗ | ✓ | ✗ | ✗ | No |
| `make clean-native` | Native only | ✗ | ✗ | ✗ | No |
| `make clean-project` | ✓ (all) | ✗ | ✗ | ✗ | No |
| `make prune` | ✗ | Unused | Unused | ✗ | No |
| `make clean-global-cache` | ✗ | ✗ | ✗ | ✓ (Expo, Metro) | Yes (type 'yes') |
| `make clean-gradle` | ✗ | ✗ | ✗ | ✓ (Android) | Yes (type 'yes') |
| `make clean-all` | ✓ | ✓ | ✓ | ✓ | Yes (type 'yes') |

### What Gets Cleaned

**Project Artifacts:**
- `backend/node_modules`, `mobile/node_modules` - Dependencies
- `backend/dist` - TypeScript build output
- `mobile/.expo` - Expo development cache
- `mobile/android`, `mobile/ios` - Native builds (clean-native only)
- `backend/coverage`, `mobile/coverage` - Test coverage reports
- `*.tsbuildinfo` - TypeScript incremental build info
- `.eas-build-*.json` - EAS build artifacts
- `/tmp/ngrok.log`, `/tmp/backend-tunnel-url.txt` - Build logs

**Docker Resources:**
- Containers: `zumik-backend`, `zumik-mobile`
- Images: `zumik-backend`, `zumik-mobile`
- Volumes: Associated with Zumik services
- Network: `zumik-network`
- System: ALL Docker resources when using `clean-all`

**Global Caches (only with explicit commands):**
- `~/.expo/`, `~/.cache/expo/` - Expo global cache
- `~/.cache/metro-bundler/` - Metro bundler cache
- `~/.watchman` - Watchman file watcher cache
- `~/.gradle/`, `~/.android/` - Gradle/Android SDK caches

### Utilities

```bash
make info             # Show system information
make fix-permissions  # Fix file permissions for Docker
make fix-node-modules # Fix node_modules ownership (for local builds)
```

### Common Workflows

```bash
# Different WiFi networks?
make tunnel-setup && make dev-tunnel

# Android Studio emulator?
make dev-local

# Need Google Sign-In?
make dev-build-setup && make dev-build

# Fresh start after git pull?
make restart          # Docker mode
# OR
make backend-local    # Local mode (restart manually)
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
2. Run `make dev-docker` (or `make qr` if already running)
3. Install Expo Go app on device (Play Store / App Store)
4. Scan QR code from terminal or http://localhost:19000

## Architecture

### Backend

**Feature-first architecture** with Express + Socket.io + TypeScript + Supabase.

- **Features**: auth, playlists, soundcloud, profile, friends, music-control, mail
- **Services layer** for business logic (< 150 lines each)
- **Real-time sync** via Socket.io (playlist updates, music control delegation)
- **45 REST API endpoints**
- **No index.ts files** - All imports are direct from source files

**Key Patterns**:
- Feature-first structure with clear boundaries
- Services, permissions, and utils layers for separation of concerns
- Zod validation aligned with TypeScript types
- Supabase for PostgreSQL + authentication
- JWT verification via `auth.middleware.ts`

**See `backend/README.md` for complete architecture details.**

### Mobile

**Component + feature architecture** with React Native + Expo + TypeScript + Zustand.

- **Screens** organized by feature (auth, playlists, profile, friends, search)
- **Zustand** for state management (auth, playlists, player, socket)
- **React Navigation 7** with bottom tabs
- **Custom hooks** for audio playback and real-time sync
- **Path aliases**: `@components`, `@screens`, `@store`, `@utils`, etc.

**Key Patterns**:
- Zustand + React Context (ThemeContext, PlayerContext)
- React Hook Form + Zod for validation
- expo-audio for SoundCloud streaming
- Socket.io for real-time updates
- Music-inspired dark theme (#1DB954, #121212)

**See `mobile/README.md` for complete architecture details.**

## API Documentation

Zumik backend exposes **45 REST endpoints** documented via **interactive Swagger UI**.

### Access Swagger UI

```bash
# 1. Start backend
make dev-docker    # or make backend-local

# 2. Open browser
http://localhost:3000/api-docs
```

### Features

- **Interactive endpoint testing** - Test API calls directly in browser
- **Request/response schemas** - View detailed data structures with examples
- **Authentication support** - Manage JWT tokens for protected routes
- **Real-time validation** - Instant feedback on request format

### Endpoints by Feature

| Feature | Endpoints | Description |
|---------|-----------|-------------|
| **Auth** | 7 endpoints | Register, login, OAuth (Google/Facebook), providers management |
| **Playlists** | 13 endpoints | CRUD operations, tracks, collaborators, viewers, edit modes |
| **Profile** | 4 endpoints | Get profile, update, search users |
| **Friends** | 4 endpoints | Follow, unfollow, list mutual friends, check status |
| **Music Control** | 4 endpoints | Grant/revoke playback control, check permissions |
| **SoundCloud** | 3 endpoints | Search tracks, get track details, stream URLs |

### Quick API Examples

**Health Check** (no auth required):
```bash
curl http://localhost:3000/health
```

**Register**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","username":"testuser"}'
```

**Login**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

**Get Current User** (requires JWT):
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

For complete API documentation with all endpoints, schemas, and interactive testing, use the Swagger UI interface.

## Environment Configuration

**Quick start:**
```bash
make install  # Creates .env files from templates
```

See backend `.env.example` and mobile `.env.example` for all available variables.

## Database Migrations

Migrations are SQL files in `backend/migrations/` executed manually in Supabase Dashboard:

1. Open Supabase Dashboard → SQL Editor
2. Create new query
3. Copy content from migration file (e.g., `001_initial_schema.sql`)
4. Execute

**Current schema**:
- `user_profiles` table - User profile data (id, username, display_name, avatar_url, bio, created_at, updated_at)
  - Linked to Supabase auth.users via foreign key
- `playlists` table - Playlist metadata (id, name, description, cover_url, owner_id, collaborator_ids, viewer_ids, visibility, edit_mode, timestamps)
  - `edit_mode` - 'open' (anyone can edit) or 'restricted' (only collaborators)
- `tracks` table - Universal track data (id, track_uri, title, artist, album, album_art, duration_ms, preview_url, timestamps)
  - `track_uri` stores universal track identifiers from any music service
  - `album` field is nullable (some tracks may not have album info)
- `playlist_tracks` junction table - Many-to-many relationship (playlist_id, track_id, position, added_by, timestamps)
- `follows` table - Follow relationships (follower_id, following_id, can_control_music, timestamps)
  - `can_control_music` - Boolean flag for music control delegation permission

**Migrations** (in execution order):
1. `001_initial_schema.sql` - User profiles table with basic fields
2. `002_spotify_oauth.sql` - ⚠️ **Deprecated** - Previous Spotify OAuth integration
3. `003_playlist_persistence.sql` - Playlists, tracks, and playlist_tracks tables
4. `004_remove_spotify.sql` - Remove all Spotify columns from user_profiles
5. `005_rename_spotify_uri_to_track_uri.sql` - Rename spotify_uri to track_uri for universal support
6. `006_make_album_nullable.sql` - Make album field nullable in tracks table
7. `006_oauth_providers.sql` - ⚠️ **Deprecated** - Initial OAuth provider support attempt
8. `007_follows.sql` - Friends system with follows table
9. `007_multi_provider_oauth.sql` - ⚠️ **Deprecated** - Multi-provider OAuth attempt
10. `007_multi_provider_oauth_safe.sql` - ✅ **Active** - Safe multi-provider OAuth implementation
11. `009_music_control.sql` - Add can_control_music column to follows table (skips 008)
12. `010_edit_mode.sql` - Add edit_mode column to playlists table and update RLS policies

**Note**: Multiple files share the same numbers (006, 007) due to iterative development. Files marked "Deprecated" were superseded by later versions. The "safe" variants include proper error handling and rollback capabilities.

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

See [doc/SECURITY.md](./doc/SECURITY.md) for detailed Docker security documentation.

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

The Swagger UI auto-saves JWT tokens after login/register for easier testing.

## Security

- **Docker Images**: Chainguard Images with 0 CVE (see [doc/SECURITY.md](./doc/SECURITY.md))
- **Authentication**: Supabase Auth with JWT tokens
- **Validation**: Zod schemas on both backend and mobile
- **CORS**: Configured for development origins only
- **Secrets**: Never commit `.env` files (in `.gitignore`)
- **Rate Limiting**: Redis-based brute force protection
- **RLS Policies**: Row-level security in Supabase

## Music Integration

Zumik uses a universal `trackUri` field to support multiple music services. SoundCloud integration is **fully implemented** and functional.

**SoundCloud Integration**:
- Public API access via `soundcloud.ts` npm package (no OAuth required)
- Backend caching: 1h for search results, 30min for stream URLs
- HLS AAC streaming via expo-audio
- Search, track details, and stream URL endpoints

## Current Implementation Status

**Project Completion: ~70%**

Zumik has evolved significantly beyond initial planning, with several major features fully implemented.

**Phase 1 - ✅ Complete (Foundation)**:
- Backend foundation with Express + Socket.io setup
- Authentication feature (register, login, logout, refresh, user profile)
- Mobile app with navigation (Auth stack, App stack, feature-based stacks)
- Basic UI screens (Welcome, Login, Register, Playlist views)
- State management with Zustand (auth, playlists, socket, player, soundcloud)
- Docker development environment with Chainguard images

**Phase 2 - ✅ Complete (Infrastructure Removed - Spotify)**:
- Previous Spotify OAuth integration removed
- Database cleaned: Removed all `spotify_*` columns from `user_profiles`
- Renamed `spotify_uri` to `track_uri` for universal music service support
- Migrated to SoundCloud (Phase 5 completed)

**Phase 3 - ✅ Complete (Playlist System)**:
- Database migration: `003_playlist_persistence.sql` (playlists, tracks, playlist_tracks tables)
- Backend feature: `/api/playlists/*` (13 API endpoints)
  - Full CRUD operations (create, read, update, delete)
  - Track management (add, remove, reorder)
  - Collaborator management (add, remove - list in playlist details)
  - Viewer management (add, remove - list in playlist details)
  - Edit modes ('open' or 'restricted')
- Mobile screens: PlaylistsScreen, PlaylistDetailScreen, CreatePlaylistScreen, PlaylistEditorScreen
- Playlist store: Zustand state with full API integration
- Playlist API client: `playlistApi.ts` for backend communication
- Real-time playlist sync via Socket.io

**Phase 4 - ✅ Complete (Profile System)**:
- Backend feature: `/api/profile/*` (4 API endpoints: get own, update, search users, get by ID)
- Mobile screens: ProfileScreen, EditProfileScreen
- Profile API client: `profileApi.ts`
- Profile tab in bottom navigation
- Avatar upload and display support

**Phase 5 - ✅ Complete (Music Search & Playback)**:
- **SoundCloud integration** (3 API endpoints: search, track details, stream URLs)
- Backend service with caching (1h for search, 30min for streams)
- Public API access via `soundcloud.ts` npm package (no OAuth required)
- **Mobile audio playback system**:
  - PlayerContext (4058 lines) for lifecycle management
  - MiniPlayer component (persistent above tab bar)
  - Full PlayerModal with controls, progress slider, skip ±10s
  - 4 custom hooks (useSoundCloudPlayer, usePlayerController, usePlayerProgress, usePlayerSync)
  - expo-audio for HLS AAC streaming
- Search tab in bottom navigation with debounced search
- SoundCloudSearchScreen with track results
- PlaylistSelectorModal to add tracks to playlists

**Phase 6 - ✅ Complete (Friends System)**:
- Database migration: `007_follows.sql` (follows table)
- Backend feature: `/api/friends/*` (4 API endpoints)
  - Follow/unfollow users
  - Get mutual friends list
  - Check follow status
- Mobile screens: FriendsScreen (455 lines with tabs), UserProfileScreen
- FriendsNavigator stack for friend-related navigation
- Friends API client: `friendsApi.ts`
- Friends tab in bottom navigation

**Phase 7 - ✅ Complete (Music Control Delegation)**:
- Database migration: `009_music_control.sql` (can_control_music column in follows)
- Backend feature: `/api/music-control/*` (4 API endpoints)
  - Grant/revoke playback control to friends
  - Check who has control permissions
  - Check if friend granted you control
- Mobile integration:
  - musicControlApi service
  - useMusicControl hook for complex delegation logic
  - DeviceListeningCard component
  - Toggle switches in FriendsScreen for control permissions
- Real-time updates via Socket.io when permissions change

**Phase 8 - ✅ Complete (Real-time Synchronization)**:
- Backend: Real-time service `realtime/index.ts` (478 lines)
- Socket.io event system for:
  - Playlist updates (track added/removed)
  - Music control delegation events
  - Device registration and listening status
- Mobile: socketStore for connection management
- Mobile: usePlaylistSocket hook for real-time playlist updates
- Auto-reconnection logic

**Phase 9 - ✅ Complete (OAuth Integration - Google & Facebook)**:
- **Google OAuth** (fully implemented):
  - Backend: `/api/auth/google` endpoint with ID token verification
  - Mobile: `@react-native-google-signin/google-signin` integration
  - Token verification via `google-auth-library`
  - **Email required** (Google always provides verified email)
- **Facebook OAuth** (fully implemented):
  - Backend: `/api/auth/facebook` endpoint with access token verification
  - Mobile: `react-native-fbsdk-next` integration with platform-specific handling
  - Token verification via Facebook Graph API (`/debug_token` + `/me` endpoints)
  - Database: `facebook_id` column in `user_profiles` table
  - **Email optional** - Works with only `public_profile` permission
  - Synthetic email generation: `facebook_{id}@zumik.local` when email not provided
- **Multi-provider support**:
  - Users can link multiple OAuth providers to single account
  - Provider management endpoints (`GET /api/auth/providers`, `DELETE /api/auth/providers/:provider`)
  - Safety: Cannot unlink last authentication method
- **Mobile OAuth service** (`oauth.ts`):
  - `configureGoogleSignIn()`, `signInWithGoogle()` for Google
  - `initializeFacebookSDK()`, `signInWithFacebook()` for Facebook
  - Platform-specific token handling (iOS Limited Login vs Android standard flow)
- **Auth store integration**:
  - `loginWithGoogle()` and `loginWithFacebook()` actions
  - Error handling with user-friendly messages
  - Session persistence to AsyncStorage
- **Synthetic email system**:
  - Format: `{provider}_{providerId}@zumik.local`
  - Supabase-compatible (auth.users requires email)
  - Allows Facebook login without email permission
  - User can add real email later via profile settings

**In Progress**:
- Multi-device music control coordination
- Playlist edit mode RLS policies

**Planned Features**:
- Music rooms (group listening spaces)
- Web responsive version
- Offline mode / caching
- Subscription system
- IoT / iBeacon integration
- Advanced social features (activity feed, recommendations)

## Common Issues & Solutions

**Mobile can't connect to backend**:
1. Check backend is running: `make ps` or `curl http://localhost:3000/health`
2. For physical device: Use `http://YOUR_LOCAL_IP:3000` in mobile `.env`
3. Ensure device and computer on same WiFi
4. Check `ALLOWED_ORIGINS` in backend `.env` includes Expo URLs

**Docker build failures**:
```bash
make clean       # Remove all containers and deps
make install     # Reinstall
make dev-docker  # Rebuild and start
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

- [README.md](./README.md) - Project overview and quick start
- [BUILD.md](./BUILD.md) - Build and deployment guide
- [doc/TUNNEL_MODE.md](./doc/TUNNEL_MODE.md) - Cross-network development
- [doc/REDIS.md](./doc/REDIS.md) - Redis configuration
- [doc/SECURITY.md](./doc/SECURITY.md) - Security details (Chainguard Images, 0 CVE)
- [doc/TESTING_SECURITY.md](./doc/TESTING_SECURITY.md) - Security testing guide (IV.6)
- [backend/README.md](./backend/README.md) - Backend architecture and API
- [mobile/README.md](./mobile/README.md) - Mobile architecture
- [backend/src/features/mail/README.md](./backend/src/features/mail/README.md) - Email service documentation
