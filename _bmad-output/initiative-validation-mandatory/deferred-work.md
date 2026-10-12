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
