- source_plan: `_bmad-output/initiative-validation-mandatory/epic-securite/story-authentifier-la-connexion-socket-io-par-jwt-backend-plan.md`
  summary: Token verification (Socket.io handshake and every `authMiddleware` route) is not rate-limited, so garbage tokens turn into unlimited Supabase Auth `getUser` calls.
  evidence: `authenticateSocket` and `authMiddleware` both call `SessionService.verifyToken` → `supabase.auth.getUser`; `server.ts` mounts no global limiter; AGENTS.md asks to rate-limit sensitive routes with the Redis limiter.
- source_plan: `_bmad-output/initiative-validation-mandatory/epic-securite/story-authentifier-la-connexion-socket-io-par-jwt-backend-plan.md`
  summary: AGENTS.md lists backend imports as `@/features/...` or `@/shared/...`, but `src/realtime/` is imported as `@/realtime/...` (server.ts, music-control.service.ts, socket-auth.ts); either add it to the rule or move the module.
  evidence: grep `@/realtime/` in backend/src.
- source_plan: `_bmad-output/initiative-validation-mandatory/epic-comptes-auth/story-lier-google-ou-facebook-a-un-compte-connecte-backend-plan.md`
  summary: Sign-ins (`signInWithPassword`, `verifyOtp`, `refreshSession`) run on the shared `supabaseAdmin` client, which then queries PostgREST as the last signed-in user under RLS instead of service role; do them on a throwaway client.
  evidence: supabase-js 2.117.2 `_getAccessToken` returns the in-memory session token before `supabaseKey` even with `persistSession: false`; calls at auth.service.ts:140, user.service.ts:82, auth.controller.ts:428, session.service.ts:40; the #73 integration test had every write after a Google login refused by RLS until it signed the client out.

- source_plan: `_bmad-output/initiative-validation-mandatory/epic-delegation-controle/story-schema-des-appareils-et-des-licences-par-appareil-migration-plan.md`
  summary: Stories 4.4 and 4.5 check mutual follow (friendship) both when a device license is granted and on every control check, not only the license row.
  evidence: 015_devices.sql ties a license to follows(grantee_id → owner_id) only; when the owner unfollows the grantee the friendship ends but the license row stays (it cascades only on the grantee's follow).
- source_plan: `_bmad-output/initiative-validation-mandatory/epic-comptes-auth/story-revoquer-la-session-au-logout-backend-plan.md`
  summary: The socket handshake (`backend/src/realtime/socket-auth.ts`) refuses a revoked token and a Redis outage both as `INVALID_TOKEN`, hiding `TOKEN_REVOKED` and `REVOCATION_UNAVAILABLE`; settle it in #71 (3.3) together with the mobile `socketStore` handling.
  evidence: `verifyToken` now checks the logout denylist and throws 401 TOKEN_REVOKED or 503 REVOCATION_UNAVAILABLE; the handshake's bare `catch {}` maps every error to INVALID_TOKEN, and mobile refreshes once on INVALID_TOKEN.
- source_plan: `_bmad-output/initiative-validation-mandatory/epic-securite/story-tester-l-acces-a-l-ecoute-et-au-controle-backend-plan.md`
  summary: A quick `listening:subscribe X` then `listening:unsubscribe X` leaves the socket subscribed, because the unsubscribe runs before the subscribe's awaited `canControl`; order a socket's listening events as #64 does for playlist rooms.
  evidence: `backend/src/realtime/index.ts` `listening:subscribe` joins after `await musicControlService.canControl(...)` while `listening:unsubscribe` leaves synchronously; pre-existing, found in #65 review.
- source_plan: `_bmad-output/initiative-validation-mandatory/epic-delegation-controle/story-verifier-la-licence-par-appareil-sur-le-temps-reel-backend-plan.md`
  summary: Story 4.7 must not read `permission:changed` with `canControl: false` as "lost all access": it only reports the "all my devices" switch, and a per-device license may remain (re-check with `GET /users/{userId}/devices`).
  evidence: Since 4.5, a switch revoke keeps the listening subscription when a license remains (`realtime.notifyPermissionChange` → `revalidateListeningAccess`), but the event payload is unchanged.
- source_plan: `_bmad-output/initiative-validation-mandatory/epic-api-mobile/story-adresse-du-backend-modifiable-dans-l-app-mobile-plan.md`
  summary: Move `friendsApi`, `profileApi`, `privacyApi` and `musicControlApi` onto the exported `apiRequest` (`mobile/src/services/api.ts`) so they send the `X-Platform` / `X-Device-Model` / `X-App-Version` headers (IV.6) and get the token refresh; #96 only switched their URL source to `getBackendUrl()`.
  evidence: each still builds its own `fetch` (friendsApi.ts, profileApi.ts, privacyApi.ts local `apiRequest`; musicControlApi.ts inline `fetch` with a manual token).
- source_plan: `_bmad-output/initiative-validation-mandatory/plan-gh-160-token-verification-rate-limit.md`
  summary: Configure Express `trust proxy` (and the matching client IP for Socket.io) so per-IP limiters key on the real client behind a tunnel or reverse proxy instead of the proxy's address.
  evidence: No `trust proxy` in `backend/src`; behind `make dev-tunnel` or a reverse proxy every client shares one IP, so the token-verification limiter (#160) and the auth limiters (#120) count all users together.
- source_plan: `_bmad-output/initiative-validation-mandatory/plan-gh-126-session-expired-logout.md`
  summary: In `mobile/src/store/authStore.ts`, the `!refreshToken` branch of `refreshAccessToken` calls `logout()`, whose `authApi.logout` goes through `apiRequest`; with an expiring access token the proactive refresh calls `refreshAccessToken` again, which calls `logout()` again (recursion). Use the local session end there too.
  evidence: `apiRequest` (`mobile/src/services/api.ts:142-145`) refreshes before any request when `isTokenExpiringSoon()`; the logout endpoint is not exempted, and the `!refreshToken` branch never clears `accessToken` before calling `logout()`.
- source_plan: `_bmad-output/initiative-validation-mandatory/plan-gh-126-session-expired-logout.md`
  summary: Document the 429 `RATE_LIMIT_EXCEEDED` answered by `loginRateLimiter` on `POST /api/auth/refresh` in `auth.openapi.ts`.
  evidence: `backend/src/features/auth/auth.routes.ts:47` puts the refresh route behind `loginRateLimiter`; the OpenAPI entry lists 200/401/503 only, unlike `/api/auth/login`.
- source_plan: `_bmad-output/initiative-validation-mandatory/epic-comptes-auth/story-couper-le-socket-au-logout-mobile-plan.md`
  summary: Since #70, `logout` always ends the session through `endSessionLocally()`, except on the #176 recursion (access token, no refresh token, expiring token), which never reaches it; fixing #176 completes the guarantee.
  evidence: `loadFromStorage` restores a session without a refresh token (`saveToStorage` writes `refreshToken || ''`); `refreshAccessToken`'s `!refreshToken` branch calls `logout()`, whose `authApi.logout` goes through `apiRequest`'s proactive refresh.
- source_plan: `_bmad-output/initiative-validation-mandatory/epic-delegation-controle/story-cibler-uniquement-les-appareils-autorises-mobile-plan.md`
  summary: Emit an event to the grantee when a device license is granted or revoked, so a friend's profile updates its controllable devices without a reload (#183).
  evidence: only the all-devices switch emits `permission:changed`; `device-license.service.ts` only calls `revalidateListeningAccess`, which can drop the subscription silently.

- source_plan: `_bmad-output/initiative-validation-mandatory/plan-gh-141-native-debug-build-docs.md`
  summary: Verify on a phone on another network that a debug build loads the bundle from the Expo tunnel host with `:80` (Change Bundle Location), as documented in README, mobile/README and doc/TUNNEL_MODE.md.
  evidence: maybe-false, unverified: no phone or tunnel run was available during #141; settle by running `make dev-tunnel`, entering the `make qr-tunnel` host plus `:80` in the debug build's dev menu, and checking the app loads.

- source_plan: `_bmad-output/initiative-validation-mandatory/epic-comptes-auth/story-tests-de-authstore-mobile-plan.md`
  summary: Align doc/TESTING.md (mobile tests "mock services/api.ts") with the authStore tests, which mock fetch under the real apiRequest.
  evidence: doc/TESTING.md:45 vs mobile/src/store/authStore.test.ts (existing refresh/logout tests and #76's tests).

- source_plan: `_bmad-output/initiative-validation-mandatory/plan-gh-271-playlist-drag-and-drop.md`
  summary: ReorderableList's vertical pan gesture (`activeOffsetY([-5, 5])`) has no `failOffsetX`, so a slightly diagonal left swipe may be captured by the list instead of the row's swipe-to-delete.
  evidence: Unverified (would be medium). Settled by trying swipe-to-delete with a diagonal swipe on a native debug build; if it fails, add `.failOffsetX([-10, 10])` to the pan gesture.

- source_plan: `_bmad-output/initiative-validation-mandatory/plan-gh-273-play-queue-backend.md`
  summary: `POST /api/playlists/:id/tracks` accepts `previewUrl` (a SoundCloud stream URL) and persists it in `tracks.preview_url`, against the rule never to persist stream URLs.
  evidence: `addTrackSchema` (playlist.validators.ts) accepts `previewUrl`; `upsertTrack` writes it; soundcloud.types.ts:77 documents it as the stream URL. The mobile app sends `undefined`, so only a crafted request stores one. Found by the gh-273 review.
- source_plan: `_bmad-output/initiative-validation-mandatory/plan-gh-310-audio-interruptions.md`
  summary: A system pause that lands while the player is buffering (for example a headset unplugged mid-rebuffer) is not mirrored, so the store keeps showing "playing".
  evidence: `AudioInterruptionSync` reacts to edges in `status.playing`. On Android `playing` is already false in `STATE_BUFFERING`, so the noisy pause gives no new edge, and the buffering status is skipped by the `isBuffering` guard. The case is rare, and a level-based check risks false pauses right after `play()`.
- source_plan: `_bmad-output/initiative-validation-mandatory/plan-gh-310-audio-interruptions.md`
  summary: Unverified (would be medium) — iOS may not resume after a call if the AVPlayer is already paused when expo-audio handles `.began`.
  evidence: `handleInterruptionBegan` (`expo-audio/ios/AudioModule.swift` l.383-398) only records players with `isPlaying` still true. Settle it on an iPhone: start a track, receive a call, end it, and check that playback resumes. If it does not, the JS side must resume after the interruption itself.
- source_plan: `_bmad-output/initiative-validation-mandatory/plan-gh-307-ux-playlists.md`
  summary: Find why the « + » on « Ajouter des titres » showed no feedback during the add call (audit #307); `extraData` was not the cause.
  evidence: React Native's FlatList (non-strictMode) rebuilds its renderer each render, so rows already re-rendered on `addingTrackId` and the existing spinner should show. Settle on device: time the call, check the white spinner on `primary` at 0.7 opacity is visible, and check the tap registers at once.
- source_plan: `_bmad-output/initiative-validation-mandatory/plan-gh-307-ux-search.md`
  summary: The `SoundCloudTrack` schema in `backend/src/features/soundcloud/soundcloud.openapi.ts` documents fields (`artist`, `trackUri`, `albumArt`) the search endpoint does not return.
  evidence: `soundcloud-search.service.ts` passes SoundCloud's search objects through unchanged (`title`, `user`, `artwork_url`, `permalink_url`…); noticed by the implementer while adding `policy` and `media`.
- source_plan: `_bmad-output/initiative-validation-mandatory/plan-gh-342-edit-delete-playlist.md`
  summary: Split `backend/src/features/playlists/playlist.service.ts` (~490 lines) into smaller services, per the ~150-line guideline of AGENTS.md.
  evidence: The file was already ~480 lines before #342; the review of #342 flagged that it keeps growing.
