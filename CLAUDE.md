# CLAUDE.md

**AI Assistant Instructions for Zumik Project**

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

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
   - API documentation (methods, inputs, outputs) - Swagger UI at http://localhost:3000/api-docs
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

### Current Implementation Status

The project has implemented **Music Playlist Editor** and **Music Control Delegation** (2/3 mandatory services). Continue development following subject requirements.

---

## Project Stack & Architecture

### Tech Stack

**Backend:**
- Node.js 22 + TypeScript + Express.js
- Supabase (PostgreSQL + Auth with JWT)
- Socket.io for real-time communication
- Redis 7 for caching and rate limiting
- Zod for validation
- SoundCloud API via `soundcloud.ts` npm package

**Mobile:**
- React Native 0.81 + Expo SDK 54 + TypeScript
- Zustand for state management
- React Navigation 7 (stack-based)
- expo-audio for HLS AAC streaming
- Socket.io client for real-time updates
- React Hook Form + Zod for validation

**Infrastructure:**
- Docker Compose orchestration
- Chainguard Images (0 CVE, distroless for production)
- Makefile-based development workflow

### Backend Architecture

**Feature-first structure** (`backend/src/features/`):
```
features/
├── auth/              # Authentication (register, login, OAuth, JWT)
├── playlists/         # Playlist CRUD + tracks + collaborators
├── soundcloud/        # Music search and streaming
├── profile/           # User profiles
├── friends/           # Follow/unfollow system
├── music-control/     # Playback control delegation
└── mail/              # Transactional emails (Gmail SMTP)
```

**Key patterns**:
- **No `index.ts` files** - All imports are direct from source files
- Services layer for business logic (< 150 lines each)
- Permissions layer for authorization checks (e.g., `playlist.permissions.ts`)
- Utils layer for helpers and formatters
- Zod validators aligned with TypeScript types
- Standard structure per feature: `feature.types.ts`, `feature.validators.ts`, `feature.service.ts`, `feature.controller.ts`, `feature.routes.ts`

**See `backend/CLAUDE.md` for detailed backend architecture.**

### Mobile Architecture

**Component + feature structure** (`mobile/src/`):
```
src/
├── screens/          # Feature-based screens (Auth, Playlists, Profile, Friends, Search)
├── components/       # Reusable UI components
├── store/            # Zustand stores (auth, playlists, player, socket, soundcloud)
├── contexts/         # React contexts (ThemeContext, PlayerContext)
├── services/         # API clients (authApi, playlistApi, friendsApi, etc.)
├── navigation/       # React Navigation stacks
└── utils/            # Helpers and constants
```

**Key patterns**:
- Path aliases: `@components`, `@screens`, `@store`, `@utils`, `@services`
- Zustand stores for global state
- React Context for UI state (theme, player)
- Custom hooks for complex logic (e.g., `useSoundCloudPlayer`, `useMusicControl`)
- Music-inspired dark theme (#1DB954 green, #121212 background)

**See `mobile/CLAUDE.md` for detailed mobile architecture.**

---

## Development Workflow

### Quick Start Commands

```bash
# First-time setup
make install          # Install deps, create .env files

# Development (choose one mode)
make dev-docker       # Docker mode (recommended)
make dev-local        # Local mode (for Android Studio)
make dev-tunnel       # Tunnel mode (different WiFi networks)

# Useful commands
make logs             # View all logs
make ps               # Check container status
make health           # Check services health
make restart          # Restart all services
make clean            # Clean containers + artifacts
```

### When to Use Each Mode

- **Docker mode** (`make dev-docker`): Default for most development
- **Local mode** (`make dev-local`): Android Studio emulator, native debugging
- **Tunnel mode** (`make dev-tunnel`): Device on different WiFi/cellular

**Full command reference**: See [DEVELOPMENT.md](./DEVELOPMENT.md)

### Code Quality Tools

```bash
make test             # Run all tests
make lint             # Run linters
make lint-fix         # Auto-fix linting issues
make format           # Format with Prettier
```

---

## Database Schema (Supabase PostgreSQL)

**Tables:**
- `user_profiles` - User data (username, display_name, avatar_url, bio, google_id, facebook_id)
- `playlists` - Playlist metadata (name, description, cover_url, owner_id, collaborator_ids, viewer_ids, visibility, edit_mode)
- `tracks` - Universal track data (track_uri, title, artist, album, album_art, duration_ms, preview_url)
- `playlist_tracks` - Junction table (playlist_id, track_id, position, added_by)
- `follows` - Follow relationships (follower_id, following_id, can_control_music)

**Migrations location**: `backend/migrations/*.sql` (executed manually in Supabase Dashboard)

**Key fields**:
- `track_uri` stores universal identifiers (e.g., SoundCloud permalink URLs)
- `edit_mode` on playlists: `'open'` (anyone can edit) or `'restricted'` (collaborators only)
- `can_control_music` on follows: Boolean for music control delegation permission

**Create migration**: `cd backend && make migrate-create name=description`

---

## API Documentation

**Interactive Swagger UI**: http://localhost:3000/api-docs

**45 REST endpoints** across 6 features:
- **Auth** (7): register, login, OAuth (Google/Facebook), provider management
- **Playlists** (13): CRUD, tracks, collaborators, viewers, edit modes
- **Profile** (4): get, update, search users
- **Friends** (4): follow, unfollow, list, check status
- **Music Control** (4): grant, revoke, check permissions
- **SoundCloud** (3): search, track details, stream URLs

**Authentication**: JWT tokens in `Authorization: Bearer <token>` header

---

## Real-time Features (Socket.io)

**Backend**: `backend/src/realtime/index.ts` (478 lines)

**Event types**:
- `playlist:track:added` - Track added to playlist
- `playlist:track:removed` - Track removed from playlist
- `playlist:updated` - Playlist metadata changed
- `music-control:granted` - User granted control permission
- `music-control:revoked` - User revoked control permission
- `device:register` - Device registered for listening
- `device:status` - Listening status updated

**Mobile**: `socketStore` for connection management, `usePlaylistSocket` hook for playlist sync

---

## Coding Standards & Best Practices

### General Principles

1. **Follow existing patterns** - Check similar features before implementing new ones
2. **Keep services small** - Aim for < 150 lines per service file
3. **Use Zod for validation** - Define schemas aligned with TypeScript types
4. **No `index.ts` barrel files** - Import directly from source files
5. **TypeScript strict mode** - No `any` types unless absolutely necessary
6. **Error handling** - Use try/catch, return proper HTTP status codes
7. **Security first** - Never commit credentials, validate all inputs, check permissions

### Backend Patterns

**Feature structure**:
```
features/feature-name/
├── services/                    # Business logic
│   ├── feature.service.ts       # Main CRUD operations
│   └── feature-secondary.service.ts  # Secondary operations
├── utils/                       # Helpers
│   └── feature.helpers.ts
├── permissions/                 # Authorization (if needed)
│   └── feature.permissions.ts
├── feature.types.ts             # TypeScript types
├── feature.validators.ts        # Zod schemas
├── feature.controller.ts        # Express handlers
├── feature.routes.ts            # Express routes
└── feature.middleware.ts        # (optional)
```

**Import pattern**:
```typescript
// ✅ Good - direct import
import { PlaylistService } from "./services/playlist.service.js";
import { formatResponse } from "./utils/playlist.helpers.js";

// ❌ Bad - barrel file
import { PlaylistService } from "./services/index.js";
```

**Service pattern**:
```typescript
export class FeatureService {
  async getById(id: string): Promise<FeatureType> {
    // 1. Validate input
    // 2. Fetch from database
    // 3. Format response
    // 4. Return result
  }
}
```

### Mobile Patterns

**Component structure**:
```typescript
// Functional component with TypeScript
interface Props {
  title: string;
  onPress: () => void;
}

export const MyComponent: React.FC<Props> = ({ title, onPress }) => {
  // Hooks first
  const { user } = useAuthStore();
  const theme = useTheme();

  // Event handlers
  const handlePress = () => {
    // Logic here
    onPress();
  };

  // Render
  return (
    <View style={styles.container}>
      <Text>{title}</Text>
    </View>
  );
};
```

**Store pattern** (Zustand):
```typescript
interface FeatureStore {
  data: FeatureType[];
  loading: boolean;
  fetchData: () => Promise<void>;
}

export const useFeatureStore = create<FeatureStore>((set, get) => ({
  data: [],
  loading: false,

  fetchData: async () => {
    set({ loading: true });
    try {
      const response = await featureApi.getAll();
      set({ data: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
}));
```

### Git Workflow

**Branch**: `main` (NOT `master`)

**Commit format** (Conventional Commits):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

**Feature branch workflow**:
```bash
git checkout -b feature/feature-name
# Make changes
git add .
git commit -m "feat: Add feature description"
git push -u origin feature/feature-name
# Create PR on GitHub
```

---

## Common Tasks

### Adding a New Backend Feature

1. Create feature directory: `backend/src/features/feature-name/`
2. Define types: `feature.types.ts`
3. Define validators: `feature.validators.ts` (Zod schemas)
4. Implement service: `feature.service.ts` (business logic)
5. Implement controller: `feature.controller.ts` (request handlers)
6. Define routes: `feature.routes.ts` (Express router)
7. Register routes in `backend/src/server.ts`
8. Add to Swagger documentation (if applicable)
9. Test with curl or Swagger UI

### Adding a New Mobile Screen

1. Create screen file: `mobile/src/screens/FeatureScreen.tsx`
2. Define navigation params in appropriate navigator
3. Add screen to navigator stack
4. Implement screen component with proper TypeScript types
5. Use Zustand stores for state management
6. Use API services for backend communication
7. Add proper error handling and loading states

### Adding a Real-time Feature

1. **Backend**: Add event handlers in `backend/src/realtime/index.ts`
2. **Mobile**: Subscribe to events in appropriate hook or store
3. Test with multiple devices/sessions

### Running Database Migration

1. Write SQL migration file in `backend/migrations/`
2. Open Supabase Dashboard → SQL Editor
3. Copy migration content and execute
4. Verify changes in database schema
5. Update TypeScript types if schema changed

---

## Security Checklist

When implementing features, ensure:

- [ ] No credentials in git (use `.env` files)
- [ ] Input validation with Zod schemas
- [ ] JWT authentication on protected routes (use `auth.middleware.ts`)
- [ ] Permission checks for user-owned resources
- [ ] Rate limiting on sensitive endpoints (Redis-based)
- [ ] CORS configured properly (`ALLOWED_ORIGINS` in backend `.env`)
- [ ] SQL injection protection (Supabase client handles this)
- [ ] XSS protection (validate/sanitize user input)
- [ ] No sensitive data in logs

---

## Testing Guidelines

### Backend Testing

**Manual testing with Swagger UI**:
1. Start backend: `make dev-docker`
2. Open http://localhost:3000/api-docs
3. Authorize with JWT token (after login)
4. Test endpoints interactively

**Manual testing with curl**:
```bash
# Example: Test auth
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","username":"testuser"}'
```

### Mobile Testing

**Physical device**:
1. Ensure device and PC on same WiFi
2. Run `make dev-docker` or `make qr`
3. Install Expo Go app
4. Scan QR code

**Android Studio emulator**:
```bash
make dev-local        # Start in local mode
make expo-android     # Launch in emulator
```

---

## Troubleshooting

### Mobile can't connect to backend
1. Check backend running: `make ps` or `curl http://localhost:3000/health`
2. For physical device: Use `http://YOUR_LOCAL_IP:3000` in mobile `.env`
3. Ensure same WiFi network
4. Check `ALLOWED_ORIGINS` in backend `.env`

### Docker issues
```bash
make clean           # Clean everything
make install         # Reinstall
make dev-docker      # Restart
```

### Type errors after git pull
```bash
cd backend && npm install && npm run type-check
cd mobile && npm install && npm run type-check
```

### Expo cache issues
```bash
cd mobile && npm run reset
```

---

## Documentation for Humans

**This file is for AI assistants. Human developers should read:**

- [DEVELOPMENT.md](./DEVELOPMENT.md) - Complete development guide
- [README.md](./README.md) - Project overview and quick start
- [BUILD.md](./BUILD.md) - Build and deployment guide
- [backend/README.md](./backend/README.md) - Backend architecture
- [mobile/README.md](./mobile/README.md) - Mobile architecture
- [doc/TUNNEL_MODE.md](./doc/TUNNEL_MODE.md) - Tunnel mode guide
- [doc/SECURITY.md](./doc/SECURITY.md) - Security documentation
- [doc/TESTING_SECURITY.md](./doc/TESTING_SECURITY.md) - Security testing

---

## AI Assistant Guidelines

When assisting with this project:

1. **Follow the Subject PDF requirements first** - They override all other documentation
2. **Maintain existing patterns** - Check similar features before implementing new ones
3. **Keep files small** - Split large services into multiple focused files
4. **Use TypeScript properly** - No `any` types, proper interfaces/types
5. **Test your changes** - Verify with Swagger UI or Expo before marking complete
6. **Security conscious** - Always validate inputs, check permissions
7. **Document breaking changes** - Update relevant README/docs if you change architecture
8. **Git commits** - Use Conventional Commits format

When unsure, ask the user for clarification rather than guessing.
