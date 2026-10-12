---
title: "Adresse du backend modifiable dans l'app"
type: 'feature'
ticket: '3'
created: '2026-10-09'
status: 'built'
baseline_revision: '22b2833f202f3ed9352f53db62d10ce9c68e6c48'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 6.3 (#96). The backend address is baked in at build time (`EXPO_PUBLIC_API_URL`), read separately by eight modules (`services/api.ts`, `api/playlistApi.ts`, `store/socketStore.ts` via `API_CONFIG`, `store/soundcloudStore.ts`, `contexts/PlayerContext.tsx`, `services/friendsApi.ts`, `profileApi.ts`, `privacyApi.ts`, `musicControlApi.ts`). Pointing the app at another server (another laptop, a tunnel, a defense machine) needs a rebuild, and several modules call `fetch` directly, skipping the `X-Platform` / `X-Device-Model` / `X-App-Version` headers the backend logs (IV.6).

**Approach:** One runtime source for the backend URL: a small module that loads the persisted address at startup (default: the build-time env value), validates and saves a new one, and notifies listeners. Every module reads it at call time. A field in Settings and on the Welcome screen (reachable before login) edits it. Changing it reconnects the socket. `api.ts` exports its `apiRequest`, and `playlistApi`, `soundcloudStore` and `PlayerContext` go through it instead of raw `fetch`.

## Boundaries & Constraints

**Always:** The new URL applies to the very next API call and to the socket without restarting the app. Only `http://` or `https://` URLs with a host are accepted; trailing slash trimmed; an invalid entry is refused with a message and the old address kept. Persisted with AsyncStorage (already used); a storage failure falls back to the default and never crashes. A "reset to default" restores the build-time value. Calls through `apiRequest` keep the client headers and the token refresh.

**Never:** No change to the Supabase client URL (`lib/supabase.ts`, a separate service). No backend change. `friendsApi`, `profileApi`, `privacyApi`, `musicControlApi` only switch their URL source; moving them onto `apiRequest` is out of scope (record it as deferred work). No new dependency.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First launch | nothing stored | URL = `EXPO_PUBLIC_API_URL` (or `http://localhost:3000`) | none |
| Save | `http://192.168.1.20:3000/` | stored as `http://192.168.1.20:3000`; next `apiRequest` hits it | none |
| Relaunch | address stored | app starts on the stored address | storage read fails → default |
| Invalid | `foo`, `ftp://x`, empty | refused, message shown, old address kept | none |
| Reset | stored address | back to the build-time default, storage cleared | none |
| Socket connected | address changed | socket disconnects and reconnects to the new URL | none |
| Socket not connected | address changed (e.g. on Welcome) | next connect uses the new URL | none |
| Stream / search | track played, search run after a change | `PlayerContext` and `soundcloudStore` call the new URL with client headers | none |

</frozen-after-approval>

## Code Map

- `mobile/src/constants/index.ts` -- `API_CONFIG.BASE_URL` / `WS_URL` (build-time). Keep as the default source only; nothing else should read `BASE_URL` for requests.
- `mobile/src/services/backendUrl.ts` (new) -- `loadBackendUrl()` (at app start), `getBackendUrl()` (sync, current value), `setBackendUrl(input)` (validate, normalize, persist, notify; returns an error for invalid input), `resetBackendUrl()`, `onBackendUrlChange(listener)`. AsyncStorage key e.g. `zumik.backendUrl`, wrapped in try/catch like `deviceService.ts`.
- App start -- call `loadBackendUrl()` before the first request; `navigation/RootNavigator.tsx` or `App.tsx` already awaits startup work (auth restore); hook it there.
- `mobile/src/services/api.ts` -- `API_URL` constant (line 8) → `getBackendUrl()` inside `apiRequest`; export `apiRequest` (line 106) without changing its behavior.
- `mobile/src/api/playlistApi.ts` -- 16 uses of `API_CONFIG.BASE_URL` with raw `fetch` + manual token: switch to `apiRequest` (it adds the token and headers).
- `mobile/src/store/soundcloudStore.ts:4,38` and `mobile/src/contexts/PlayerContext.tsx:~122–130` -- raw `fetch` with their own `API_URL`: switch to `apiRequest` (PlayerContext passes its `AbortController` signal through `options`).
- `mobile/src/store/socketStore.ts:83` -- `API_CONFIG.BASE_URL` → `getBackendUrl()` at connect time; subscribe to `onBackendUrlChange` to `disconnect()` + `connect()` when a socket exists.
- `mobile/src/services/friendsApi.ts`, `profileApi.ts`, `privacyApi.ts`, `musicControlApi.ts` -- their `API_URL` / `API_CONFIG.BASE_URL` → `getBackendUrl()` at call time.
- `mobile/src/screens/settings/SettingsScreen.tsx` and `mobile/src/screens/auth/WelcomeScreen.tsx` -- add the address field (text input, Save, Reset, current value, error message); one shared component in `components/` used by both.
- Tests: `src/store/socketStore.test.ts` (fake socket pattern), `src/hooks/usePlaylistSocket.test.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `services/backendUrl.ts` + `backendUrl.test.ts` -- load/get/set/reset/notify; matrix rows First launch, Save, Relaunch (incl. storage failure), Invalid, Reset.
- [x] App start -- `loadBackendUrl()` before the first call.
- [x] `services/api.ts` -- runtime URL, `apiRequest` exported; test: after `setBackendUrl`, the next request goes to the new URL with client headers.
- [x] `api/playlistApi.ts`, `store/soundcloudStore.ts`, `contexts/PlayerContext.tsx` -- through `apiRequest`.
- [x] `store/socketStore.ts` + test -- runtime URL and reconnect on change (connected and not connected rows).
- [x] `friendsApi.ts`, `profileApi.ts`, `privacyApi.ts`, `musicControlApi.ts` -- runtime URL.
- [x] Shared address component + Settings and Welcome screens.
- [x] `_bmad-output/initiative-validation-mandatory/deferred-work.md` -- entry: move the four remaining API clients onto `apiRequest`.

**Acceptance Criteria:**
- Given the app running on a device, when the address is changed in Settings to another reachable backend, then the next screen load and the socket use it, without a rebuild or restart (story Verify, manual demo).
- Given the codebase, when searching for `EXPO_PUBLIC_API_URL` and `API_CONFIG.BASE_URL`, then they only appear in `constants/index.ts` and `backendUrl.ts`.

## Verification

**Commands:**
- `cd mobile && npm run type-check && npm run lint && npm test` -- expected: pass, no new warning.

**Manual checks:**
- On a device or emulator: change the address on the Welcome screen, log in, play a track, then change it in Settings and watch the socket reconnect (dev logs).

## Implementation Notes

- `ApiError` gained an optional `status` (HTTP status on error responses), additive; `PlayerContext` uses it to keep its 404 "track no longer available" message, and detects its timeout through `controller.signal.aborted` because `apiRequest` wraps the abort in an `ApiError`.
- `playlistApi` errors are now `ApiError` (backend message and code) instead of plain `Error` / raw JSON; `PlaylistSelectorModal.parseApiError` maps `ApiError` codes (`TRACK_DUPLICATE`, `FORBIDDEN`) as it did for the raw JSON.
- URL validation is a regex, not `new URL()` (React Native's URL polyfill has no `hostname`).
- Welcome screen: the field sits behind a "Server settings" toggle under the Login button, in a ScrollView/KeyboardAvoidingView.
- Socket reconnect is a module-level `onBackendUrlChange` subscription in `socketStore.ts`.
- Found `playlistApi.reorderTracks` targets a removed route; logged in deferred-work, not fixed.

## Plan Change Log

## Review Triage Log

Quick review, pass 1: 0 high, 3 medium, 2 low (4 patched, 1 rejected), 0 false.

- medium, patch: `SearchTracksScreen.getErrorMessage` matched the old raw JSON error; `addTrack` now throws `ApiError`, so the access-denied / deleted / duplicate messages fell back to raw backend text. Codes now read from `ApiError.code`.
- medium, patch: `backendUrl` validation accepted host-less (`http://:3000`), query and fragment URLs (every request malformed) against the Always rule. Now parsed: http(s), non-empty hostname, no credentials, query or fragment.
- medium, patch: an address with a path was accepted and normalized; socket.io reads the pathname as a namespace (`/api` not registered → handshake fails) and HTTP calls doubled the path. Paths other than `/` are refused.
- low, patch: `PlaylistSelectorModal`'s new `ApiError` branch mapped `FORBIDDEN`, never sent for add-track; now `PLAYLIST_ACCESS_DENIED`.
- low, rejected: AC 2 grep also matches `backendUrl.test.ts` (asserts the default comes from `API_CONFIG.BASE_URL`). Test-only.
