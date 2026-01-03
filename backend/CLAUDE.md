# Backend Architecture - Zumik (AI Context)

**AI Assistant Instructions for Backend Development**

This file provides backend-specific architecture context for AI agents working on the Zumik backend codebase.

---

## Feature-First Architecture

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
│   ├── mail/             # Email service (transactional emails, templates, rate limiting)
│   │   ├── services/           # Email services
│   │   │   ├── mail.service.ts              # Main email sending (Gmail SMTP)
│   │   │   ├── rate-limiter.service.ts      # Generic rate limiting (Redis + in-memory)
│   │   │   └── template-renderer.service.ts # Template registry
│   │   ├── templates/          # Email templates
│   │   │   ├── base.template.ts             # Base HTML layout (dark theme)
│   │   │   └── verification-email.template.ts # Verification email
│   │   ├── utils/              # Email helpers
│   │   │   └── mail.helpers.ts              # Validation, formatting
│   │   ├── mail.types.ts       # TypeScript types
│   │   ├── mail.config.ts      # Gmail SMTP config
│   │   └── README.md           # Documentation
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

---

## Key Backend Patterns

- **Feature-first structure**: Each feature is self-contained with clear boundaries
- **Services layer**: Business logic split into focused services (< 150 lines each)
- **Permissions layer**: Authorization checks separated for testability (playlists)
- **Utils layer**: Reusable helpers and formatters to reduce duplication
- **Consistent structure**: All features follow the same organizational pattern
- **Improved maintainability**: Smaller files, clearer responsibilities, easier code reviews
- **Testability**: Isolated services and helpers are easier to unit test
- **Reduced debug noise**: Excessive logging removed, cleaner codebase

---

## Standard Feature Structure

When creating new features, follow this structure:

```
features/feature-name/
├── services/                        # Business logic divided by responsibility
│   ├── feature.service.ts           # Main CRUD operations
│   └── feature-secondary.service.ts # Secondary operations (optional)
├── utils/                           # Helpers and utilities
│   └── feature.helpers.ts
├── permissions/                     # Authorization checks (if needed)
│   └── feature.permissions.ts
├── feature.types.ts                 # TypeScript types
├── feature.validators.ts            # Zod schemas
├── feature.controller.ts            # Express request handlers
├── feature.routes.ts                # Express router
└── feature.middleware.ts            # (optional)
```

**Implementation Steps**:

1. Define types in `feature.types.ts`
2. Define Zod validators in `feature.validators.ts`
3. Implement main service in `feature.service.ts` or `services/feature.service.ts`
4. Implement controller in `feature.controller.ts`
5. Define routes in `feature.routes.ts`
6. Register routes in `server.ts`

---

## Import Convention

⚠️ **CRITICAL**: No `index.ts` barrel files anywhere in the backend codebase.

**Always import directly from source files**:

```typescript
// ✅ Good - direct imports
import { PlaylistService } from './services/playlist.service.js';
import { formatResponse } from './utils/playlist.helpers.js';
import authRoutes from './features/auth/auth.routes.js';

// ❌ Bad - barrel file imports
import { PlaylistService } from './services/index.js';
import { formatResponse } from './utils/index.js';
import authRoutes from './features/auth/index.js';
```

**File extension**: Always use `.js` extension in TypeScript imports (ESM requirement).

---

## Database Integration (Supabase)

- **Client**: Supabase PostgreSQL client
- **Authentication**: Supabase Auth with JWT tokens
- **Validation**: Zod schemas aligned with TypeScript types
- **Helpers**: Shared utilities in `shared/utils/database.helpers.ts`
- **Error handling**: Standardized format from `shared/middleware/error-handler.ts`

**Protected Routes**:

```typescript
import { authenticateJWT } from '@features/auth/auth.middleware.js';

router.get('/protected', authenticateJWT, controller.getProtected);
```

**Database Tables**:

- `user_profiles` - User data (id, username, display_name, avatar_url, bio, google_id, facebook_id)
- `playlists` - Playlist metadata
- `tracks` - Universal track data (track_uri, title, artist, album, album_art)
- `playlist_tracks` - Junction table (playlist_id, track_id, position)
- `follows` - Follow relationships (can_control_music flag)

---

## Backend API Routes (45 endpoints)

- **`/health`** - Health check (no auth)
- **`/api/auth/*`** (7 routes):
  - POST `/register`, `/login`, `/logout`
  - GET `/me`, `/providers`
  - POST `/google`, `/facebook` (OAuth)
  - DELETE `/providers/:provider`
- **`/api/profile/*`** (4 routes): get, update, search, get by ID
- **`/api/playlists/*`** (13 routes): CRUD, tracks, collaborators, viewers
- **`/api/soundcloud/*`** (3 routes): search, track details, stream URLs
- **`/api/friends/*`** (4 routes): follow, unfollow, list, check status
- **`/api/music-control/*`** (4 routes): grant, revoke, check permissions

**Swagger UI**: http://localhost:3000/api-docs

---

## Real-time Features (Socket.io)

**Location**: `backend/src/realtime/index.ts` (478 lines)

**Event Types**:

```typescript
// Playlist events
'playlist:track:added'; // Track added to playlist
'playlist:track:removed'; // Track removed from playlist
'playlist:updated'; // Playlist metadata changed

// Music control events
'music-control:granted'; // User granted control permission
'music-control:revoked'; // User revoked control permission

// Device events
'device:register'; // Device registered for listening
'device:status'; // Listening status updated
```

**Room Management**:

- Users join rooms: `socket.join('playlist:${playlistId}')`
- Emit to room: `io.to('playlist:${playlistId}').emit('playlist:track:added', data)`
- Leave room: `socket.leave('playlist:${playlistId}')`

**Connection Flow**:

1. Client connects → Socket.io handshake
2. Client joins playlist room → `socket.join('playlist:${id}')`
3. Track added → Backend emits to room
4. All clients in room receive event and update UI
5. Client leaves playlist → `socket.leave('playlist:${id}')`

---

## SoundCloud Integration

**Backend Service** (`soundcloud.service.ts`):

- In-memory cache (Map) for search results (1h TTL) and stream URLs (30min TTL)
- Filters for playable/streamable tracks only
- Converts SoundCloud tracks to internal Track format

**API Routes** (Public - No Auth):

```bash
# Search
GET /api/soundcloud/search?q=lofi&limit=20

# Get Track
GET /api/soundcloud/track/:urlOrId

# Get Stream URL (URL-encoded)
GET /api/soundcloud/stream/:trackUrl
```

**Track Storage**:

- `track_uri` = SoundCloud permalink URL (e.g., `https://soundcloud.com/artist/track`)
- Metadata stored in `tracks` table
- Stream URL fetched on-demand (expires after 30min)

---

## Mail Service

**Location**: `backend/src/features/mail/`

**Core Services**:

1. **MailService** - Gmail SMTP email sending
2. **RateLimiterService** - Redis + in-memory rate limiting
3. **TemplateRendererService** - Email template registry

**Available Templates**:

- `verification-email` - Email verification code (dark theme, monospace code)

**Usage Example**:

```typescript
import { MailService } from '@features/mail/services/mail.service.js';

const mailService = new MailService();
await mailService.sendTemplatedEmail('user@example.com', 'verification-email', {
	code: '123456',
	expiresInMinutes: 15,
});
```

See `backend/src/features/mail/README.md` for complete documentation.

---

## AI Assistant Guidelines for Backend

When working on the backend:

1. **Follow feature-first structure** - Check similar features before creating new ones
2. **Keep services small** - Aim for < 150 lines per service file
3. **No barrel files** - Import directly from source files with `.js` extension
4. **Use Zod for validation** - Define schemas aligned with TypeScript types
5. **Protected routes** - Use `authenticateJWT` middleware for authenticated endpoints
6. **Permission checks** - Verify user ownership before modifying resources
7. **Error handling** - Use try/catch and return proper HTTP status codes
8. **Rate limiting** - Apply Redis-based rate limiting on sensitive endpoints
9. **Test with Swagger** - Verify endpoints in Swagger UI before marking complete

**When adding features**:

- Create feature directory following standard structure
- Implement types → validators → service → controller → routes
- Register routes in `server.ts`
- Test with Swagger UI (http://localhost:3000/api-docs)

**Security Checklist**:

- [ ] Input validated with Zod
- [ ] JWT authentication on protected routes
- [ ] Permission checks for user-owned resources
- [ ] No credentials in code (use environment variables)
- [ ] Rate limiting on auth endpoints
- [ ] SQL injection protection (Supabase handles this)

---

## Refactoring History

Backend services have been refactored for maintainability:

- **Playlists**: 657 lines → 254 lines main service (60% reduction)
- **SoundCloud**: 342 lines → 75 lines main service (78% reduction)
- **Auth**: 307 lines → 194 lines main service (37% reduction)
- **Profile**: 124 lines → organized in services/ for consistency

**Pattern**: Split large services into focused services, permissions, and utils.
