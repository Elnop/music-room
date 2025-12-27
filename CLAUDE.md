# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL: Project Guidelines Priority

**THIS PROJECT MUST STRICTLY FOLLOW THE REQUIREMENTS SPECIFIED IN `doc/en.subject.pdf` (Version 5.3).**

All development decisions, architectural choices, and feature implementations MUST align with the official project subject guidelines. When there is any conflict or ambiguity between this documentation and the subject PDF, **the subject PDF takes absolute priority**.

### Mandatory Requirements from Subject PDF

The project must implement:

1. **User Management (IV.1)**:
   - Account creation via email/password OR Facebook/Google OAuth
   - Link network accounts (Facebook/Google) after registration
   - Email validation and password reset for email/password accounts
   - Profile with public, friends-only, private, and music preferences sections

2. **Core Services (IV.2)** - At least 2 of the following 3:
   - **Music Track Vote** (IV.2.1): Live voting system with visibility (public/private) and license management
   - **Music Control Delegation** (IV.2.2): Device-specific music control delegation to friends
   - **Music Playlist Editor** (IV.2.3): Real-time multi-user playlist editing with visibility and license management

3. **Backend & API (IV.3, IV.4)**:
   - Backend as single source of truth for all data
   - RESTful API with JSON format
   - API documentation (methods, inputs, outputs) - can use Swagger
   - Configurable backend address in mobile app

4. **Security (IV.6)**:
   - User data isolation and protection
   - Malicious behavior protection (bruteforce, session theft)
   - Backend logging (Platform, Device, Application Version)
   - ⚠️ **CRITICAL**: NO credentials/API keys in git - use .env files

5. **Performance (IV.7)**:
   - Ramp-up testing with load evaluation tools (AB, Gatling, Siege, etc.)
   - Document max concurrent users with server specifications

6. **Quality (IV.8)**:
   - Agile development with team collaboration
   - Layer-specific testing
   - Automatic dependency management via Makefile

### Technology Constraints

- **Backend**: Free choice (Node.js, PHP, Golang, Firebase, etc.) - must justify decisions
- **Mobile**: Android OR iOS with technology of choice
- **Dependencies**: Must be auto-downloadable from repo (no committed libraries)
- **SDK Warning**: SDKs must not do the core work for you

### Bonus Features (Only if Mandatory Part is PERFECT)

- Multi-platform support (Web responsive)
- IoT integration (IBeacon for events)
- Subscription tiers (Free vs Paid)
- Offline mode with synchronization

**Current Implementation Status**: The project has implemented Music Playlist Editor and Music Control Delegation (2/3 mandatory services). Continue development following subject requirements.

---

## Project Overview

Music Room is a collaborative music listening platform built with:
- **Backend**: Node.js + Express + Socket.io + TypeScript + Supabase (PostgreSQL + Auth)
- **Mobile**: React Native 0.81 + Expo SDK 54 + TypeScript + Zustand
- **Infrastructure**: Docker Compose for orchestrated development

The app allows users to create collaborative music playlists with friends, featuring real-time synchronization and music streaming integration.

## Development Commands

Music Room provides **three development modes** orchestrated by a modular Makefile system. Use `make help` to see all available commands.

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

See [TUNNEL_MODE.md](./TUNNEL_MODE.md) for complete documentation.

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

Music Room provides build commands for backend validation and production mobile releases.

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
make clean-docker     # Music Room Docker resources only
make prune            # Unused Docker resources across all projects

# Global/system-wide cleanup (affects ALL projects - use with caution)
make clean-global-cache   # Expo, Metro, Watchman caches (needs 'yes' confirmation)
make clean-gradle         # Gradle/Android caches (needs 'yes' confirmation)

# Nuclear option (use with extreme caution)
make clean-all            # EVERYTHING: Docker + project + global caches (needs 'yes' confirmation)
```

### Cleanup Matrix

| Command | Files/Deps | Docker (Music Room) | Docker (System) | Global Caches | Confirmation |
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
- Containers: `music-room-backend`, `music-room-mobile`
- Images: `music_room-backend`, `music_room-mobile`
- Volumes: Associated with Music Room services
- Network: `music-room-network`
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
│   ├── friends/          # Friends system (follow/unfollow, mutual friends)
│   │   ├── friends.types.ts
│   │   ├── friends.validators.ts
│   │   ├── friends.service.ts         # Follow/unfollow logic, get friends
│   │   ├── friends.controller.ts
│   │   └── friends.routes.ts
│   ├── music-control/    # Music control delegation system
│   │   ├── music-control.types.ts
│   │   ├── music-control.validators.ts
│   │   ├── music-control.service.ts   # Grant/revoke control permissions
│   │   ├── music-control.controller.ts
│   │   └── music-control.routes.ts
│   └── [future features: rooms, social features]
├── shared/                # Shared code across features
│   ├── config/           # Environment vars (env.ts), Supabase clients
│   ├── middleware/       # Global middleware (error-handler.ts)
│   ├── types/            # Global TypeScript types
│   └── utils/            # Logger, helpers
│       ├── logger.ts
│       └── database.helpers.ts  # Shared DB utilities (fetchSingle, fetchMany, etc.)
├── realtime/             # Socket.io real-time service (478 lines)
│   └── index.ts          # WebSocket event handlers (playlist sync, music control, device management)
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

**Backend API Routes** (37 total endpoints):
- `/health` - Health check endpoint
- `/api/auth/*` - Authentication endpoints (8 routes):
  - Email/password: register, login, me, logout
  - OAuth: google, facebook
  - Provider management: get providers, unlink provider
- `/api/profile/*` - Profile management endpoints (4 routes: get own profile, update profile, search users, get user profile)
- `/api/playlists/*` - Playlist CRUD and track management (13 routes)
  - CRUD operations (create, get all, get by ID, update, delete)
  - Track management (add, remove, reorder tracks)
  - Collaborator management (add, remove - list returned in playlist details)
  - Viewer management (add, remove - list returned in playlist details)
- `/api/soundcloud/*` - SoundCloud music search and streaming (3 routes: search, track details, stream URLs)
- `/api/friends/*` - Friends system (4 routes: get friends, follow, unfollow, check follow status)
- `/api/music-control/*` - Music control delegation (4 routes: grant control, revoke control, get permissions, check if user can control)

### Mobile: Component + Feature Architecture

```
mobile/src/
├── screens/              # Screens by feature
│   ├── auth/            # WelcomeScreen, LoginScreen, RegisterScreen
│   ├── playlists/       # PlaylistsScreen, CreatePlaylistScreen, PlaylistDetailScreen, PlaylistEditorScreen
│   ├── profile/         # ProfileScreen, EditProfileScreen
│   ├── friends/         # FriendsScreen (455 lines - tabs for friends list + search), UserProfileScreen
│   ├── settings/        # SettingsScreen
│   └── search/          # SoundCloudSearchScreen, SoundCloudTrackItem, PlaylistSelectorModal
├── components/
│   ├── common/          # Reusable UI (Button, Card, Input, LoadingSpinner, Avatar, etc.)
│   ├── playlist/        # Feature-specific (TrackItem, PlaylistCard, PlaylistHeader, AddTrackButton)
│   ├── player/          # MiniPlayer, PlayerModal (full player with controls, progress, artwork)
│   └── music-control/   # DeviceListeningCard (displays friends listening with control delegation)
├── navigation/
│   ├── RootNavigator.tsx    # Main navigator (switches Auth/App based on auth state)
│   ├── AuthNavigator.tsx    # Stack for unauthenticated users
│   ├── AppNavigator.tsx     # Bottom tabs for authenticated users
│   └── stacks/              # Feature-specific navigation stacks
│       ├── PlaylistsStack.tsx
│       ├── FriendsStack.tsx
│       ├── ProfileStack.tsx
│       └── SearchStack.tsx
├── contexts/             # React Context providers
│   ├── ThemeContext.tsx     # Theme state and colors (2705 lines)
│   └── PlayerContext.tsx    # Audio player lifecycle management (4058 lines)
├── store/               # Zustand state management
│   ├── authStore.ts         # Authentication state (user, tokens, login/logout)
│   ├── playlistStore.ts     # Playlist state with API integration
│   ├── soundcloudStore.ts   # SoundCloud search state
│   ├── playerStore.ts       # Audio player state (current track, play state, modal state)
│   └── socketStore.ts       # Socket.io connection management
├── hooks/               # Custom React hooks
│   ├── useSoundCloudPlayer.ts   # Audio playback hook (fetch stream, manage player)
│   ├── usePlayerController.ts   # Player controls (play, pause, seek, skip)
│   ├── usePlayerProgress.ts     # Progress tracking and slider
│   ├── usePlayerSync.ts         # Sync player state across components
│   ├── useMusicControl.ts       # Music control delegation (7849 lines!)
│   └── usePlaylistSocket.ts     # Real-time playlist updates
├── api/                 # API client layer
│   └── playlistApi.ts  # Playlist API calls
├── services/            # Service layer
│   ├── api.ts          # Base API configuration
│   ├── profileApi.ts   # Profile API calls
│   ├── friendsApi.ts   # Friends API calls (follow, unfollow, get friends)
│   ├── musicControlApi.ts  # Music control delegation API
│   ├── oauth.ts        # OAuth integration (Google, etc.)
│   └── deviceService.ts    # Device registration and management
├── lib/                 # Third-party library configuration
│   └── supabase.ts     # Supabase client setup
├── types/              # TypeScript types aligned with backend
├── utils/              # Validators (Zod), formatters, helpers
├── constants/          # Theme colors, API URLs, spacing
└── mocks/              # Mock data for development (users, playlists, tracks)
```

**Key Mobile Patterns**:
- Path aliases: `@/*` (root), `@components`, `@screens`, `@store`, `@utils`, `@types`, `@constants`, `@mocks`, `@api`, `@services`, `@hooks`, `@contexts`
- Zustand stores for state management (auth, playlists, soundcloud, player, socket)
- React Context for cross-cutting concerns (ThemeContext, PlayerContext)
- React Hook Form + Zod for form validation
- React Navigation 7 with stack-based organization and bottom tab navigators
- Custom hooks for complex logic (7 hooks for audio, music control, real-time)
- Music-inspired dark theme (Green #1DB954, Black #121212)
- Authentication state persisted to AsyncStorage, loaded on app start in RootNavigator
- API layer (`@api`, `@services`) for backend communication
- Socket.io for real-time updates (playlist changes, music control delegation)
- expo-audio for SoundCloud streaming playback

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

# Tunnel Mode (for cross-network development)
NGROK_AUTHTOKEN=your_ngrok_token  # Get from https://dashboard.ngrok.com/get-started/your-authtoken
TUNNEL_URL=  # Auto-configured by tunnel script, leave empty

# OAuth (Google)
GOOGLE_CLIENT_ID=your_google_client_id  # Get from Google Cloud Console

# OAuth (Facebook)
FACEBOOK_APP_ID=your_facebook_app_id  # Get from Facebook Developers
FACEBOOK_APP_SECRET=your_facebook_app_secret  # Keep secret!
```

### Mobile `.env`
```bash
# Backend API (use local IP for physical devices)
EXPO_PUBLIC_API_URL=http://localhost:3000

# For physical device testing:
# EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000

# WebSocket URL (for real-time features)
EXPO_PUBLIC_WS_URL=ws://localhost:3000

# Supabase (optional, primarily using backend API)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# EAS / Tunnel Mode
EXPO_TOKEN=your_expo_token  # For tunnel mode, get from expo.dev

# OAuth (Google Sign-In)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME=your_ios_scheme

# OAuth (Facebook)
EXPO_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id  # Get from Facebook Developers
EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN=your_facebook_client_token  # Get from Facebook Developers
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

## Real-time Features (Socket.io)

Music Room implements real-time synchronization using **Socket.io** for live updates across devices.

### Backend Real-time Service

**Location**: `backend/src/realtime/index.ts` (478 lines)

**Key Features**:
- **Playlist Sync**: Real-time updates when tracks are added/removed from playlists
- **Music Control Delegation**: Live updates when friends grant/revoke playback control
- **Device Management**: Register devices and track listening status
- **Room-based Events**: Events scoped to specific playlists or user groups

**Event Types**:
```typescript
// Playlist events
'playlist:track:added' - Track added to playlist
'playlist:track:removed' - Track removed from playlist
'playlist:updated' - Playlist metadata updated

// Music control events
'music-control:granted' - User granted control permission
'music-control:revoked' - User revoked control permission

// Device events
'device:register' - Device registered for listening
'device:status' - Listening status updated
```

### Mobile Integration

**Socket Store** (`mobile/src/store/socketStore.ts`):
- Connection state management
- Auto-reconnection logic
- Event subscription handling

**Custom Hooks**:
- `usePlaylistSocket` - Subscribe to playlist updates in real-time
- `useMusicControl` - Handle music control delegation events (7849 lines!)

**Usage Example**:
```typescript
// In PlaylistDetailScreen
const { socket, isConnected } = socketStore();

usePlaylistSocket(playlistId, {
  onTrackAdded: (track) => {
    // Refresh playlist when track added by another user
    playlistStore.fetchPlaylist(playlistId);
  },
  onTrackRemoved: (trackId) => {
    // Remove track from local state
    playlistStore.removeTrackLocally(playlistId, trackId);
  }
});
```

**Connection Flow**:
1. User logs in → `socketStore` connects to backend WebSocket
2. User opens playlist → Subscribe to `playlist:${id}` room
3. Another user adds track → Backend emits `playlist:track:added` event
4. All connected clients in room receive event and update UI
5. User leaves playlist → Unsubscribe from room

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

Music Room uses a universal `trackUri` field to support multiple music services. SoundCloud integration is **fully implemented** and functional.

## Current Implementation Status

**Project Completion: ~70%**

Music Room has evolved significantly beyond initial planning, with several major features fully implemented.

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
  - useMusicControl hook (7849 lines!) for complex delegation logic
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
  - Synthetic email generation: `facebook_{id}@music-room.local` when email not provided
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
  - Format: `{provider}_{providerId}@music-room.local`
  - Supabase-compatible (auth.users requires email)
  - Allows Facebook login without email permission
  - User can add real email later via profile settings

**In Progress**:
- Multi-device music control coordination
- Playlist edit mode RLS policies

**Planned Features** (see `PLAN.md`):
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

- `README.md` - Project overview and quick start
- `GETTING_STARTED.md` - Detailed setup instructions
- `PLAN.md` - Complete implementation plan and roadmap
- `DOCKER.md` - Docker architecture and troubleshooting
- `GIT_WORKFLOW.md` - Git workflow and best practices
- `SECURITY.md` - Security details (Chainguard Images, 0 CVE)
- `docs/README.md` - Documentation index
- `docs/backend/` - Backend technical documentation
  - `SUPABASE_TYPES_MIGRATION.md` - Guide migration types Supabase
  - `EXAMPLE_TYPED_SERVICE.md` - Exemple de service typé
  - `TYPESCRIPT_LINT_SOLUTIONS.md` - Solutions TypeScript/ESLint
- `backend/README.md` - Backend-specific documentation
- `backend/API_DOCUMENTATION.md` - Complete API reference
- `backend/DOCS.md` - Pointer to backend docs
- `mobile/README.md` - Mobile-specific documentation
