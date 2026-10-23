# Subject coverage

How the code meets each mandatory requirement of the 42 subject "Music Room" v5.3 ([en.subject.pdf](en.subject.pdf)). The subject overrides every other document. Bonuses (chapter V) are only graded once the mandatory part is perfect, so the project only targets the mandatory part.

Status: ✅ done · ⏳ in progress. Each line names where to look; the linked documents give the details.

## Scope

The subject asks for two of the three services of IV.2. Zumik delivers **Music Playlist Editor** (IV.2.3) and **Music Control Delegation** (IV.2.2). **Music Track Vote** (IV.2.1) is not implemented, on purpose.

## Summary

| Requirement | Status | Where |
|---|---|---|
| III.1 Architecture, dependencies, justified choices | ✅ | `make install`, [decisions.md](../decisions.md) |
| III.2 Mobile experience | ✅ | `mobile/` (Expo React Native, native Android build) |
| IV.1 User | ✅ | `backend/src/features/auth/`, `profile/`; [accounts-auth.md](../features/accounts-auth.md) |
| IV.2.2 Music Control Delegation | ✅ | `backend/src/features/music-control/`; [control-delegation.md](../features/control-delegation.md) |
| IV.2.3 Music Playlist Editor | ✅ | `backend/src/features/playlists/`; [playlist-editor.md](../features/playlist-editor.md) |
| IV.3 Server | ✅ | Supabase behind the backend |
| IV.4 API | ✅ | Swagger UI `/api-docs`; [mobile-api.md](../features/mobile-api.md) |
| IV.5 Mobile application | ✅ | `mobile/src/shared/services/api.ts`, `backendUrl.ts` |
| IV.6 Security | ✅ | [threat-model.md](../security/threat-model.md) |
| IV.7 Scaling | ⏳ | `make perf-test`, [tests/performance/README.md](../../tests/performance/README.md); reference machine and report: #103, #106 |
| IV.8 Agility, quality, CI | ✅ | [quality-and-ci.md](../development/quality-and-ci.md), [testing.md](../development/testing.md) |

## Details

### III.1 Software architecture

- No library is committed; every dependency installs from the manifests with `make install`, lockfiles committed.
- Every technical choice (Node/Express/TypeScript, Supabase, Redis, Socket.io, Expo, REST/JSON, TanStack Query, OpenAPI from Zod…) is justified against named alternatives in [decisions.md](../decisions.md).

### III.2 Mobile experience

- An Android/iOS app in Expo React Native that covers every action of the project. It runs as a native debug build (Expo Go lacks its native modules) and a release APK is published by `.github/workflows/release-apk.yml`.

### IV.1 User

- Sign-up with email and password, or with Google or Facebook (`/api/auth/register`, `/google`, `/facebook`).
- Email verification required before the first login, forgotten password by code (`/verify-email`, `/forgot-password`, `/reset-password`).
- A signed-in user links a Google or Facebook account to their account from the app, even when its email differs, and can unlink it; unlinking the last sign-in method is refused (`POST /api/auth/providers/:provider/link`, `DELETE /api/auth/providers/:provider`, screen `features/profile/linkedAccounts/`).
- Profile with public, friends-only and private fields (`profile_privacy`, applied when another user reads the profile), and music preferences.

Details: [accounts-auth.md](../features/accounts-auth.md).

### IV.2.2 Music Control Delegation

- A user delegates control of their music to friends, **per device**: a license on one device (`device_control_licenses`), or the "all my devices" switch (`follows.can_control_music`). Both users must be mutual friends.
- Devices are registered at each socket connection (`devices`) and listed in the app (`features/music-control/myDevices/`).
- A delegate also manages the owner's play queue, and anyone can move playback to a device they control (Spotify Connect style).

Details: [control-delegation.md](../features/control-delegation.md), [queue-and-connect.md](../features/queue-and-connect.md).

### IV.2.3 Music Playlist Editor

- Real-time multi-user editing: every change is broadcast to the playlist's room (`playlist:updated`).
- Public by default; a private playlist is visible only to its invited users. Editing is open to everyone by default (`edit_mode = open`), or restricted to invited collaborators.
- The concurrency case the subject names ("several people move different tracks or the same one") is handled: fractional ranks, one Postgres function per operation under a playlist lock, versions; a move based on a stale version of the same track gets `409`, everything else applies.

Details: [playlist-editor.md](../features/playlist-editor.md), [playlist-concurrency.md](../features/playlist-concurrency.md).

### IV.3 Server

- All data is stored by the backend in Supabase (PostgreSQL), which is the reference. Since #201 the database refuses any direct access with the anon key; since #376 the app holds no Supabase client.

### IV.4 API

- REST API with JSON payloads, documented in Swagger UI (`/api-docs`). The document is generated from the Zod schemas that validate the requests, so it cannot drift from the code; `backend/src/app/openapi-coverage.test.ts` fails if a mounted route is not documented.
- The REST/JSON choice is justified in [decisions.md](../decisions.md#16-protocol-rest-and-json).

### IV.5 Mobile application

- The app is a remote control of the backend: all data goes through the API.
- Google and Facebook sign-in in the app.
- The backend address can be changed inside the app for testing, without a rebuild (`shared/services/backendUrl.ts`, `BackendUrlField`): the next API and socket traffic goes to the new address.

### IV.6 Security

- Each user only reaches their own data: every protected route goes through `authMiddleware`, identity comes from the token, and each feature checks rights in its `permissions/`.
- The Socket.io handshake is authenticated by token; room access is checked on join and re-checked when it can be lost.
- Bruteforce, session theft (logout revokes the tokens), real-time abuse and the other threats are listed with their protection or accepted risk in [threat-model.md](../security/threat-model.md); containers in [containers.md](../security/containers.md).
- Every action of the app is logged by the backend with platform, device and app version (`X-Platform`, `X-Device-Model`, `X-App-Version` headers; `shared/middleware/action-logger.middleware.ts` and `socket-logger.middleware.ts`).
- No credentials in git: secrets live in `.env` files; `gitleaks` runs in `npm run check`.

### IV.7 Scaling

- Load tests run from the repository: `make perf-test` (Artillery HTTP scenarios and a Socket.io scenario), described in [tests/performance/README.md](../../tests/performance/README.md).
- Still open: the reference machine (#103) and the capacity report with the maximum number of simultaneous users (#106). Music Track Vote is not implemented, so it is not measured.

### IV.8 Agility, quality, continuous integration

- Work is tracked in GitHub Issues (epics and stories), one branch and one pull request per issue into `develop`.
- Unit and integration tests on each layer (Vitest + Supertest on the backend, jest-expo on mobile), run by `make test`.
- `npm run check` (types, lint, dead code, dependencies, duplication, patterns, secrets, tests) runs at pre-commit and in CI on every pull request; see [quality-and-ci.md](../development/quality-and-ci.md).
