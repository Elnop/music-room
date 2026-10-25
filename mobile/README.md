# Zumik - Mobile App

React Native app of Zumik, a collaborative music listening app. It is a remote control of the backend: every piece of data goes through the API.

How it fits with the rest of the system: [doc/architecture/overview.md](../doc/architecture/overview.md). Full documentation index: [doc/README.md](../doc/README.md).

## Tech stack

- **Framework**: React Native 0.81 with Expo SDK 54
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation v7
- **State**: TanStack Query v5 (server data, cache, invalidation) and Zustand v5 (local client state: session, preferences, UI, player)
- **HTTP client**: shared API client (`src/shared/services/api.ts`) on top of `fetch`, which adds the telemetry headers (`X-Platform`, `X-Device-Model`, `X-App-Version`) and refreshes the token transparently
- **Auth**: the backend API (`/api/auth/*`); the app ships no Supabase client
- **Real time**: socket.io-client v4.8
- **Validation**: Zod v4
- **Forms**: React Hook Form v7

The app's interface is in French only (#341).

## Requirements

- Node.js 22 (`.nvmrc`)
- The Zumik backend running on `http://localhost:3000`
- Android SDK (Android Studio), or Xcode on macOS, to build the debug build

## Installation

```bash
npm install
```

From the repository root, `make install` installs both projects.

## Configuration

1. Copy `.env.example` to `.env`.
2. Nothing else to fill in for local development: the OAuth IDs are already in `.env.example`. Only `EXPO_TOKEN` (tunnel mode, personal) and `EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN` (Facebook sign-in, from a teammate) are missing.
3. Check that the backend runs on port 3000.

### Environment variables

`make dev-docker` and `make dev-local` force `EXPO_PUBLIC_API_URL=http://<local IP>:3000` and `EXPO_PUBLIC_WS_URL=ws://<local IP>:3000` (variables `DEV_API_URL` and `DEV_WS_URL` in `make/config.mk`), whatever the value in `.env`. `make dev-tunnel` uses the ngrok tunnel URL. The values in `.env` are only used by an `npx expo start` run by hand. A tester can also change the backend address inside the app, without rebuilding (`BackendUrlField`, `shared/services/backendUrl.ts`).

The app never talks to Supabase: sign-in, sign-up, email verification, password reset, refresh and logout all go through the backend API (calls in `src/features/auth/services/`, through the `src/shared/services/api.ts` client), which logs them. The session (backend tokens) lives in `src/features/auth/stores/authStore.ts`, persisted in AsyncStorage by `features/auth/services/sessionStorage.ts`; it is refreshed through `/api/auth/refresh` (before a request when the token expires soon, at startup, and after a 401), and a refused refresh (401) clears the storage and goes back to the sign-in screen.

```env
# Backend API (ignored by make dev-docker, dev-local and dev-tunnel)
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000

# SoundCloud (later phase)
EXPO_PUBLIC_SOUNDCLOUD_CLIENT_ID=
```

## Running the app

The app runs only as a native debug build, "Zumik Dev" (`com.zumik.app.dev`): `plugins/withDevVariant.js` gives the debug buildType its own id and name, so it installs next to the release (`com.zumik.app`) with its own data. It does not start in Expo Go, which lacks its native modules (Google Sign-In, Facebook SDK, image colors): do not use it.

### 1. Install the debug build (once)

```bash
# Android (Android SDK required): build and install on the emulator or the USB phone
npx expo run:android --app-id com.zumik.app.dev --no-bundler   # --device to pick the device; --no-bundler: no second Metro on 8081

# iOS (macOS only)
npx expo run:ios
```

The build then loads its JavaScript from Metro: reinstall it only when native code or native dependencies change. `make open-app` copies it to the other running emulators.

### 2. Start Metro

From the root: `make dev-phone` (USB phone, any network), `make dev-docker` (Docker), `make dev-local` (Android Studio emulator) or `make dev-tunnel` (phone on another network). Without make: `npm start` in `mobile/`.

### 3. Point the app at Metro

`make qr` (or `make qr-tunnel`) prints these steps with the right addresses.

- **Emulator**: automatic, it reaches Metro on `10.0.2.2:8081`; `make open-app` launches the app.
- **Phone over USB**: automatic with `make dev-phone`, which forwards Metro (8081) and the backend (3000) with `adb reverse` and points the app at `localhost` (WSL2: [wsl2.md](../doc/development/wsl2.md)). If the dev menu's bundle location was changed before, reset it to `localhost:8081`.
- **Phone on the same Wi-Fi**: shake the phone, dev menu › **Change Bundle Location** › `<HOST_IP>:8081` (address given by `make info`).
- **Phone on another network** (`make dev-tunnel`): same menu, enter the Expo tunnel host shown by `make qr-tunnel` (`xxxx-8081.exp.direct:80`). Details: [tunnel-mode.md](../doc/development/tunnel-mode.md).

"Unable to load script": the app cannot reach Metro. Check that Metro runs and the address you entered, then tap **RELOAD**.

## Scripts

### Expo

- `npm start` - Normal mode (default)
- `npm run start:lan` - LAN mode (phone on the same Wi-Fi)
- `npm run start:tunnel` - Tunnel mode (works across different networks)
- `npm run start:clear` - Start with a cleared cache
- `npm run start:lan-clear` - LAN mode + cleared cache
- `npm run android` - Debug build and launch on an Android emulator/device (`expo run:android`)
- `npm run ios` - Debug build and launch on the iOS simulator (macOS only)
- `npm run web` - Launch in the browser

### Code quality

- `npm run check` - Every guardrail in parallel (types, lint, dead code, dependencies, duplication, patterns, secrets, tests), also run at pre-commit: see [quality-and-ci.md](../doc/development/quality-and-ci.md)
- `npm run fix` - Format and fix everything automatically
- `npm run check-all` - Full check (types + lint + format)
- `npm run lint` - Lint the code
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format with Prettier
- `npm run type-check` - Check the TypeScript types only

### Maintenance and diagnosis

- `npm run clean:cache` - Clear the Expo cache (fast, ~5 seconds)
- `npm run clean:full` - Full clean + reinstall
- `npm run clean` - Clean and reinstall (alias of clean:full)
- `npm run reset` - Clear the cache and restart Expo
- `npm run doctor` - Diagnose Expo configuration problems
- `npm run update` - Check whether dependencies are up to date

### Build and release

- `npm run prebuild` - Generate the native Android/iOS folders
- `npm run build:local` - Local Android build (needs Android Studio)

The production APK (backend `https://zumik.cluzhub.com`) is built by `.github/workflows/release-apk.yml` on every push to `main` and published in the [GitHub Releases](https://github.com/Elnop/music-room/releases/latest). It reads `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_FACEBOOK_APP_ID` and `EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN` from the repository's Actions secrets. Run by hand (`gh workflow run release-apk.yml --ref <branch>`) outside `main`, it uploads the APK as a run artifact without creating a release.

### Backend

- `npm run dev:backend` - Start the backend from the mobile folder

## Most useful commands

1. **`npm run android`** - Install the debug build (it also starts its own Metro: stop it, or use `npx expo run:android --app-id com.zumik.app.dev --no-bundler`), then `make dev-docker` for Metro
2. **`npm run fix`** - Fix the code automatically
3. **`npm run check`** - Check before a commit
4. **`npm run reset`** - Solve strange bugs
5. **`npm run doctor`** - Diagnose problems

## Architecture

From epic #362: `src/shared/`, `src/providers/`, `src/navigation/` and `src/features/<feature>/`. Every feature was fully migrated (#378–#385) to the orchestrators / presenters / hooks pattern, and every component rule is enforced by the ESLint plugin without any exception. Each feature has one layout: what its subjects share (`hooks/`, `services/`, `stores/`, `utils/`, `types.ts`…) at its root, its React providers in `context/`, and one folder per subject, even when there is only one, holding `components/orchestrators/`, `components/presenters/`, `hooks/` and, when needed, `utils/`. More in [code-layout.md](../doc/architecture/code-layout.md).

```
mobile/src/
├── shared/                 # Code common to every feature; imports neither features/ nor navigation/
│   ├── components/
│   │   ├── ui/             # Primitives: Pressable, Button, Input, Card, Skeleton, ThemedSwitch, LoadingSpinner
│   │   ├── feedback/       # AppToast, ConnectionBanner, EmptyState, ErrorBoundary, FormError
│   │   ├── form/           # SearchBar, BackendUrlField
│   │   ├── lists/          # ReorderableList, SwipeableTrackItem, SwipeableUserItem, QueueSwipe
│   │   ├── media/          # Artwork, Avatar
│   │   ├── sharing/        # ShareLinkButton
│   │   └── theme/          # ThemeSelector, ThemedSystemUI
│   ├── services/           # api.ts (HTTP client), authSession (session contract), playbackBridge
│   │                       # (playback contract), backendUrl, lastTrackStorage
│   ├── query/              # TanStack Query: queryClient (STALE profiles), keys (key factory), socketCache
│   ├── stores/             # socketStore (Socket.io connection)
│   ├── hooks/              # useConnectionStatus, useImageColors
│   ├── theme/              # ThemeContext, themes (original, royalBlue, pastelLime, christmas), tokens
│   ├── constants/app.ts    # API config, spacing
│   └── utils/              # logger, toast, haptics, apiErrorMessage, debounce, moveTarget, shareLinks...
├── providers/              # AppProviders: gestures, ErrorBoundary, QueryClient, theme, safe area
├── navigation/             # RootNavigator, AuthNavigator, AppNavigator (tabs) + stacks/
├── features/               # One feature per folder (#378–#385)
│   ├── auth/               # Sign-in, sign-up, email code, forgotten password, linked accounts
│   │   ├── <subject>/      # welcome, login, register, emailVerification, forgotPassword, resetPassword,
│   │   │                   # code, form, social: components/{orchestrators,presenters} + hooks/
│   │   ├── hooks/          # TanStack queries and mutations (linked accounts, sign-in, password)
│   │   ├── services/       # authApi, passwordApi, providersApi, signIn, googleSignIn, facebookSignIn, sessionStorage
│   │   ├── stores/         # authStore (session) and its actions
│   │   ├── utils/          # codeDigits, passwordRules
│   │   └── types.ts · validators.ts
│   ├── playlists/          # Lists, detail, create/edit, adding tracks, visibility and rights
│   │   ├── <subject>/      # list, detail, form, searchTracks, sharing, trackActions, actionSheet, header
│   │   ├── hooks/          # TanStack queries and mutations, Socket.io room (usePlaylistRoom)
│   │   ├── services/       # playlistApi, tracksApi, membersApi, usersApi, trackSearchApi
│   │   ├── stores/         # pendingMovesStore (moves in flight)
│   │   ├── utils/          # Cache (playlistCache, trackEdits, trackMoves), playlistSync, socket rules, rights
│   │   └── types.ts · validators.ts
│   ├── player/             # Audio playback, mini player, player modal, system media controls (#380)
│   │   ├── miniPlayer/ · modal/ · mediaSession/   # components/{orchestrators,presenters} + hooks/
│   │   ├── context/        # PlayerContext (player lifecycle)
│   │   ├── hooks/ · services/ · stores/           # playerStore
│   │   └── constants.ts · types.ts
│   ├── queue/              # Play queue, synchronization and Connect (#381)
│   │   ├── queueModal/     # components/{orchestrators,presenters} + hooks/
│   │   ├── devicePicker/   # components/{orchestrators,presenters} + hooks/
│   │   ├── hooks/          # useQueueSync, useRemoteTarget
│   │   ├── services/       # transferPlayback
│   │   ├── stores/         # queueStore, connectStore
│   │   └── types.ts
│   ├── friends/            # Friends list, user search, friend profile and permissions (#382)
│   │   ├── friendsList/    # components/{orchestrators,presenters} + hooks/
│   │   ├── userProfile/    # components/{orchestrators,presenters} + hooks/
│   │   ├── hooks/          # useFriendsQueries, useFriendsMutations
│   │   ├── services/       # friendsApi
│   │   └── types.ts
│   ├── profile/            # Profile, edit, privacy, music preferences, linked accounts, settings (#383)
│   │   ├── profileScreen/ · editProfile/ · privacySettings/ · musicPreferences/ · linkedAccounts/ · settings/ · common/
│   │   ├── hooks/ · services/ · utils/
│   │   └── types.ts
│   ├── music-control/      # Delegated control, device management, listening permissions (#384)
│   │   ├── myDevices/      # components/{orchestrators,presenters} + hooks/ + utils/
│   │   ├── hooks/          # useMusicControl, useFriendListening, useControllableDevices...
│   │   ├── services/       # musicControlApi
│   │   └── types.ts
│   └── search/             # SoundCloud track search (#385)
│       ├── searchScreen/   # components/{orchestrators,presenters} + hooks/
│       ├── hooks/          # useSoundCloudSearch (TanStack Query)
│       ├── services/       # searchApi
│       └── types.ts
├── services/               # api-clients.test.ts (tests of the API clients)
└── types/                  # Types matching the backend's responses
```

## Navigation

- **RootNavigator** switches between `AuthNavigator` and `AppNavigator` depending on the auth state (persisted by `features/auth/stores/authStore.ts`).
- **AuthNavigator**: Welcome, Login, Register, EmailVerification, ForgotPassword, ResetPassword; each screen is the orchestrator of `features/auth/<subject>/`.
- **AppNavigator** (tabs):
  - Playlists → Playlists, PlaylistDetail, CreatePlaylist, SearchTracks, PlaylistSharing (the orchestrators of `features/playlists/<subject>/`)
  - Search → Search (the orchestrator of `features/search/searchScreen/components/orchestrators`)
  - Friends → Friends, UserProfile, PlaylistDetail, SearchTracks
  - Profile → Profile, EditProfile, PrivacySettings, MusicPreferences, LinkedAccounts, MyDevices, Settings (the orchestrators of `features/profile/<subject>/` and `features/music-control/myDevices/components/orchestrators`)

## State, real time and playback

- **HTTP calls**: always through `shared/services/api.ts`, which adds the token and the `X-Platform`, `X-Device-Model`, `X-App-Version` headers the backend logs.
- **Server data**: TanStack Query (`AppProviders` provides the client). A query key is built with `queryKeys` (`shared/query/keys.ts`), freshness is chosen among the `STALE` profiles (`shared/query/queryClient.ts`), and a Socket.io event updates the cache (`setQueryData`) or invalidates it through `useSocketCache` (`shared/query/socketCache.ts`). Zustand only keeps client state. Rules: `.agents/rules/state.md`.
- **Session and shared layer**: `shared/` does not import auth; the session store registers itself in `shared/services/authSession.ts` (token, refresh) and announces each session end there (`onSessionEnd`), on which the socket closes and the player empties.
- **Real time**: `shared/stores/socketStore.ts` manages the Socket.io connection; `features/playlists/hooks/usePlaylistRoom.ts` joins a playlist's room, whose events update the cache (`utils/playlistSocketRules.ts`); `useMusicControl` handles friends' listening and delegated control commands.
- **Playback contract**: playlists start and display playback through `shared/services/playbackBridge.ts`, which `navigation/playbackBridge.ts` wires to `playerStore` and `queueStore` when `AppNavigator` loads; no feature imports the player or the queue.
- **Audio playback**: expo-audio plays the SoundCloud HLS stream; `PlayerContext` manages the player's lifecycle, `playerStore` its state (current track, play/pause, modal), `MiniPlayer` and `PlayerModal` the display.
- **Background playback (Android)**: React Native pauses JS timers once the app is in the background, and `fetch` resolves through `setTimeout`, so the next track's requests would wait for the app to come back. The local Expo module `modules/js-keep-alive/` runs a headless JS task while this device plays or loads a track (`features/player/hooks/useBackgroundKeepAlive.ts`), which keeps the timers firing. Native code: reinstall the debug build (`npx expo prebuild --clean -p android`, then `npx expo run:android --app-id com.zumik.app.dev --no-bundler`) after pulling it.
- **OAuth**: `features/auth/services/googleSignIn.ts` and `facebookSignIn.ts` (Google Sign-In, Facebook SDK). The token obtained is verified by the backend (`/api/auth/google`, `/api/auth/facebook`). Native modules: like the rest of the app, this needs the debug build, not Expo Go.
- **Android signing**: `plugins/withDebugKeystore.js` replaces, during `expo prebuild`, the Expo template's debug keystore (shared by every Expo app) with `keystores/debug.keystore`. Its SHA-1 `5D:26:8F:52:F7:A8:2D:71:3A:D9:68:BF:60:6A:79:BB:85:AA:71:C0` is the one to register, with the `com.zumik.app` (release) and `com.zumik.app.dev` (debug) packages, in the Android OAuth clients of the Google Cloud project that holds `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`. Otherwise Google Sign-In returns `DEVELOPER_ERROR`.

## Development

### Imports

A single alias, `@/` (to `src/`), for every import that leaves the current folder; never `../` (ESLint):

```typescript
import { Button } from '@/shared/components/ui/Button';
```

### Primitives and theme

Every pressable element goes through `Pressable` or `Button` from `@/shared/components/ui/`: one press opacity, optional haptic feedback (`haptic`), `button` role by default and a required `accessibilityLabel`. `TouchableOpacity` and `Pressable` from `react-native` are forbidden elsewhere (ESLint `guardrails/ui-primitives`). Gestures (swipe, drag and drop) stay on `react-native-gesture-handler`.

Four themes live in `src/shared/theme/` (original, royalBlue, pastelLime, christmas), selectable through `ThemeSelector`; the shared tokens are in `src/shared/theme/tokens.ts`. No hard-coded color outside `src/shared/theme/` (ESLint `guardrails/theme-tokens`): read `theme.colors.*`.

### Component roles (in-house ESLint plugin)

Component roles are checked automatically, without exception (#386, documentation: `.agents/rules/components.md`):

- **`components/screen-orchestrator-only`**: a navigation screen only imports orchestrators from `features/`, never presenters.
- **`components/presenter-pure`**: a presenter is a pure view (props in, JSX out): no state (`useState`), no effect (`useEffect`), no Zustand store, no TanStack query, no direct network call.
- **`components/hook-no-jsx`**: a hook contains no JSX element or fragment (logic only).
- **`components/one-component-per-file`**: at most one React component per source file.
- **`components/component-role-directory`**: every component of a feature lives in `features/<feature>/<subject>/components/orchestrators/` or `.../components/presenters/`, a React provider in `features/<feature>/context/`.
- **`components/orchestrator-no-fetch`**: an orchestrator leaves network calls to TanStack Query or service hooks, with no direct `fetch`.

### Hot reload

Expo supports hot reload: change any file and the app updates within 1-2 seconds.

## Alignment with the backend

Types, validators and versions match the backend:

- **TypeScript types** (`src/types/`, `src/features/<feature>/types.ts`) match the backend's schemas.
- **Zod validators** (`src/features/playlists/validators.ts`, `src/features/auth/validators.ts`) use the same rules.
- **Versions**: Socket.io and Zod are the same as the backend's.

## Tests

Unit and component tests run with jest-expo, and the ESLint plugin's rules with `node:test`:

```bash
npm test                # Runs the ESLint rule tests then the Jest suite
npm test -- <path>      # Run one test suite
npm run test:coverage   # Jest coverage report (above the #364 floor: 69.06% lines)
```

Strategy and mocks: [testing.md](../doc/development/testing.md).

## Documentation

- [Project README](../README.md) and [documentation index](../doc/README.md)
- [Backend documentation](../backend/README.md)
- [Expo documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)

## Remaining work

Tracked in the repository's GitHub Issues.

## License

MIT
