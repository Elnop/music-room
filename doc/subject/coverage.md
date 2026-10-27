# Subject coverage

How the code meets each mandatory requirement of the 42 subject "Music Room" v5.3 ([en.subject.pdf](en.subject.pdf)). The subject overrides every other document. Bonuses (chapter V) are only graded once the mandatory part is perfect, so the project targets the mandatory part first; bonuses V.1 (responsive web client), V.2 (IoT, nearby events by iBeacon) and V.3 (free and paid subscription) are delivered too, see [Bonus V.1](#bonus-v1-multi-platform-support), [Bonus V.2](#bonus-v2-reflection-on-the-iot) and [Bonus V.3](#bonus-v3-free-and-paid-subscription).

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
- *"Collaborate with your friends or people with the same musical tastes"*: **Accueil** suggests profiles whose public music preferences overlap the user's (`GET /api/profile/recommendations`, [accounts-auth.md](../features/accounts-auth.md#similar-tastes)).
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

## Bonus V.1 Multi-platform support

Details: [web-client.md](../features/web-client.md); the choice of Expo web over a separate client in [decisions.md](../decisions.md#3-bonus-v1-web-client-epic-474).

| Subject | Where |
| --- | --- |
| Service available on another platform | The same `mobile/` app built for the browser with Expo web (`react-native-web`); each native module has a `.web.ts` variant (`mobile/src/**/*.web.ts`). Static build `npx expo export -p web`, published on GitHub Pages (`https://elnop.github.io/music-room/`, `.github/workflows/pages.yml`) |
| Responsive web client (phone, tablet, desktop) | `shared/hooks/useBreakpoint.ts`: phone < 768 px (the Android layout), tablet, desktop ≥ 1024 px; side navigation, centred content, grids, docked player, centred dialogs, mouse and keyboard (`shared/components/layout/`, `navigation/screenLayout.tsx`) |
| Same service in the browser | Playlist Editor in real time, Music Control Delegation with the browser as a device (HLS player with hls.js, Media Session), Google and Facebook sign-in (GIS, Facebook JavaScript SDK), events by browser geolocation; the backend is unchanged except `GET /api/events/geocode`, and the browser sends the IV.6 headers (`X-Platform: web`) |

Assumed gaps:

- **No iBeacon on the web**: a browser can neither advertise nor scan Bluetooth LE. Nearby events are found by GPS only, and the organiser's page says the broadcast is « Disponible depuis l'app Android ».
- **No colours from the artwork**: `react-native-image-colors` is native only; the web uses the theme's colour.
- **No reverse geocoding**: « Utiliser ma position actuelle » fills the coordinates as the address, so the position never leaves the browser. A typed address is geocoded by the backend (Nominatim, cached, one request per second).
- Session tokens are in `localStorage`, an accepted risk in [threat-model.md](../security/threat-model.md#m14-web-session-tokens-and-third-party-scripts).

Demo scenario: [web-client.md](../features/web-client.md#demo-scenario).

## Bonus V.2 Reflection on the IoT

Details: [events.md](../features/events.md). Music Track Vote's "event" is not reused (IV.2.1 is not implemented): the bonus works on a physical event, purely informative, that can link to a public playlist of the Playlist Editor.

| Subject | Where |
| --- | --- |
| *a mechanism such as IBeacon* | The organiser's phone broadcasts an iBeacon frame (Zumik UUID, the event's minor): `mobile/src/features/events/utils/ibeacon.ts`, `mobile/modules/beacon-advertiser/`. Other phones scan and decode it in project code (`services/beaconScanner.ts`, `utils/ibeacon.ts`, `utils/beaconDistance.ts`); GPS distance as a fallback (`utils/geo.ts`) |
| *a public event registered on your service* | `events` table (migration `032_events.sql`), `backend/src/features/events/`, `GET/POST/PATCH/DELETE /api/events`; every event is public |
| *how to access it, the kind of music* | `accessInfo` and `genres` of the event, on its page (`features/events/detail/`), with its address, dates and linked playlist |
| *automatically receive* | The event appears in « Événements à proximité » on **Accueil** with no action, and leaves on its own (`features/events/nearby/`, `utils/nearbyEvents.ts`); `event:*` Socket.io events keep the list current |

Assumed gap: the information is received **in the foreground, on the home screen**, not as a notification in the background. Scanning and location stop when the home is not shown or the app is in the background, which spares the battery and needs no background location permission. Also, Android shows iBeacon scan results only with the location permission and the location setting on (see [events.md](../features/events.md#permissions-android)).

Demo scenario: [events.md](../features/events.md#demo-with-two-phones).

## Bonus V.3 Free and paid subscription

- Each user is on the free or the premium plan (`user_profiles.plan`); Premium unlocks a custom playlist cover. The switch is simulated, without payment: **Profile › Settings › Abonnement**. Details: [subscription.md](../features/subscription.md).
- The access check is server-side (`assertPremium`, 403 `PREMIUM_REQUIRED`); the app only hides or locks the action.

Demo scenario (#485), on a phone, with a playlist the account owns:

1. Free account: open the playlist, ⋯ › **Changer la cover** shows a lock and « Réservé au Premium »; pressing it explains the Premium and offers **Paramètres**, and no upload request is sent.
2. **Paramètres** › switch **Premium** on: the plan changes at once, no restart.
3. Back on the playlist: ⋯ › **Changer la cover**, pick an image: the cover changes, and live on a second phone that has the playlist open.
4. Settings › switch **Premium** off (back to free).
5. The cover stays on the playlist; ⋯ › **Changer la cover** is locked again (the server would answer 403 `PREMIUM_REQUIRED`), while **Retirer la cover** still works and brings back the first track's artwork.
