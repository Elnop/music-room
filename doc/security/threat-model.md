# Threat model - Zumik

This document lists the threats considered for the API (`backend/`), real time (Socket.io) and the mobile app (`mobile/`), subject requirement IV.6 ("plan malicious behaviors (bruteforce of your API, session theft, etc.)"). For each threat: what blocks it, the code that does it, the test that proves it, or else **accepted risk** with the reason. The holes found while writing this document are in [Open gaps](#open-gaps); they are not fixed here and become tickets.

Docker containers and images: [containers.md](containers.md). How to test by hand: [security-testing.md](security-testing.md). Redis keys: [redis.md](../architecture/redis.md).

State recorded on `develop` at commit `8477871`. Paths are relative to the repository root; `int.test` = integration test (local Supabase + Redis, see [testing.md](../development/testing.md)).

## Overview

| # | Threat | Coverage |
|---|--------|----------|
| M1 | Password bruteforce | Redis limiters + lockout + IP blacklist. Only the login limiter is tested. |
| M2 | Bruteforce of 6-digit codes (email verification, reset) | Attempt counter per account and IP. Not tested. Accepted risk for an attack spread over many IPs. |
| M3 | Account takeover and enumeration through email verification and reset (#188, #187, #189, #194, #196) | Fixed and tested. |
| M4 | Token bruteforce and replay (#160) | Limit on verification failures per IP, tested. |
| M5 | Session theft (stolen token) | Logout revokes the access and refresh tokens, tested. Accepted risks: token lifetime, plaintext storage on the phone, plain HTTP in dev. |
| M6 | Token revoked while a socket is already open | **Accepted risk**: the token is checked at the handshake only. The app closes its socket (#70, tested). |
| M7 | Access to another user's data through the API | Checks in code (service key), tested for playlists and music control. Profile privacy filter not tested. SoundCloud routes authenticated and rate-limited per user (L10 fixed, #208). |
| M8 | Direct Supabase access with the anon key | Fixed by #201 (migration 017): `anon` and `authenticated` no longer have any privilege on `public` tables; tested. The app no longer ships the key since #376. |
| M9 | Real-time abuse (origin, forged identity, payloads, flood) | Origin, handshake and payloads checked and tested; in dev, any origin on an ngrok subdomain passes, including an attacker's tunnel (L11 reduced, #209). Rate limit per socket and per event, `listening:update` strings bounded (L7 fixed, #204). |
| M10 | Room access kept after it is withdrawn | Re-check and eviction, tested. |
| M11 | Music control of an unauthorized device | Per-device rule, fail closed, tested. |
| M12 | Concurrent playlist edits | Per-playlist lock + versions, tested. |
| M13 | Redis unavailable | Limiters and revocation fail closed (503), tested. Lockout and blacklist fail open. |

## M1. Password bruteforce

**Threat.** An attacker tries passwords on `POST /api/auth/login`, on one account or on many.

**Protection.** In the middleware order of `backend/src/features/auth/auth.routes.ts`:

1. `checkIPBlacklist` (`backend/src/shared/security/account-lockout.middleware.ts`) on every `/api/auth/*` route: a blacklisted IP gets `403 IP_BLOCKED`. An IP is blacklisted after `IP_BLACKLIST_THRESHOLD` (50) login or OAuth failures in 15 min, for 24 h (`recordIPActivity` in `backend/src/shared/security/ip-reputation.ts`). With the default values this threshold is never reached: the global limiter (point 2) stops the IP at 20 requests per 15 min.
2. `globalAuthRateLimiter` (`backend/src/shared/security/http-rate-limit.ts`): 20 requests per IP and 15 min on `/api/auth/*`.
3. `loginRateLimiter`: 5 failures per email + IP pair and 15 min (`skipSuccessfulRequests`).
4. `checkAccountLockout`: after 5 failures for an email + IP pair (`recordFailedAttempt`, called by the `login` handler in `backend/src/features/auth/auth.controller.ts`), the pair is locked for 15 min, 1 h from 8 failures, 24 h from 10 (`lockAccount`). `429 ACCOUNT_LOCKED`.

Actual effect with the default values: the limiters do the work. At the 5th failure, `loginRateLimiter` reaches its limit and the pair is locked for 15 min; the next request gets `429 RATE_LIMIT_EXCEEDED` from `loginRateLimiter`, which sits before `checkAccountLockout`, so `ACCOUNT_LOCKED` is never returned. Since no new failure is counted meanwhile and the counter expires after 15 min, the 8- and 10-failure tiers are never reached. The blacklist and the higher tiers only matter if the limiter thresholds are raised.

The thresholds come from `backend/src/shared/config/rate-limit.config.ts` (environment variables, default values quoted here). The counters are in Redis, all through `backend/src/shared/security/counter.ts` (`express-rate-limit` store: `backend/src/shared/security/rate-limit-store.ts`).

**Tests.**
- `backend/src/features/auth/middleware/rate-limit.int.test.ts`: "stores failed attempts under rl:auth:login: and answers 429 past the limit".
- `backend/src/shared/security/rate-limit-store.test.ts`: the store fails closed (503) without Redis.
- `backend/src/features/auth/account-lockout.int.test.ts`: account lockout and IP blacklist through the auth router (#206).

**Accepted risks.**
- Every counter is per IP or per email + IP. An attack spread over many IPs is not bounded per account. Reason: a per-account lock alone would let anyone lock someone else's account.
- The client IP behind a proxy depends on `TRUST_PROXY` (#173), read by Express (`req.ip`) and by the Socket.io handshake. Empty by default: `X-Forwarded-For` is ignored (a client does not choose its IP), but every client of the same proxy shares one IP. Set it on a deployment behind a proxy, only if all traffic goes through it (`backend/README.md`). Tests: `backend/src/app/trust-proxy.int.test.ts`, and "ignores a client-sent X-Forwarded-For without TRUST_PROXY (#173)" in `token-verify-limit.int.test.ts`.
- `RATE_LIMIT_ENABLED=false` and `ACCOUNT_LOCKOUT_ENABLED=false` turn these protections off; it is a dev setting, keep them on elsewhere.

## M2. Bruteforce of 6-digit codes

**Threat.** Guess the email verification code (`POST /api/auth/verify-email`, it opens a session) or the reset code (`POST /api/auth/reset-password`, it changes the password). `crypto.randomInt(100000, 999999)` gives 899,999 possible codes (the upper bound is excluded), valid for 15 min.

**Protection.**
- Code drawn by `crypto.randomInt`, compared with `crypto.timingSafeEqual`, format validated by Zod (`auth.validators.ts`).
- Email verification: `EMAIL_VERIFICATION_MAX_ATTEMPTS` attempts per `userId` + IP over the code's lifetime (`verifyCode`, `backend/src/features/auth/services/email-verification.service.ts`); the route also has `loginRateLimiter`, keyed on email + IP; since the body has no email, that is 5 failures per IP and 15 min.
- Reset: 5 attempts per email + IP and 15 min (`resetPassword`, `backend/src/features/auth/services/password-reset.service.ts`), plus `globalAuthRateLimiter`.
- Both counters go through `attempt-limit.ts` (`backend/src/shared/security/attempt-limit.ts`), which answers 503 without Redis.

**Tests.** `email-verification.int.test.ts`: "refuses a wrong code with INVALID_CODE". **No test** checks the maximum number of attempts, neither for verification nor for reset (L9).

**Accepted risk.** As for M1, every counter is per IP, none per account: with N IP addresses an attacker gets about 5 × N attempts per reset code during its 15 min of validity, i.e. a chance of about 5 × N / 899,999 per code. The limit of 3 code requests per hour (`PasswordResetCooldownService`) has the same email + IP key: it also becomes 3 × N and does not bound a distributed attack. Same for email verification (attempts per `userId` + IP). Reason: same trade-off as M1; a per-account limit would let anyone block someone else's reset or verification. The attack needs a large number of IPs.

## M3. Account takeover and enumeration through email verification and reset

**Threat.** Get a session on someone else's account, or learn whether an email has an account.

**Protection.**
- `verifyCode` refuses an already verified account (`400 ALREADY_VERIFIED`): no session is issued without a valid code any more (#188).
- `resendVerification` (`auth.controller.ts`) sends the code to the account's email, never to the one in the body, and only if the body email matches (`resolveVerificationRecipient`). Same answer in every case, cooldown counted before any lookup: a 429 does not reveal an existing account (#188).
- `forgotPassword` always answers "If this email exists…"; the hourly quota and the cooldown are consumed whether the email exists or not (`PasswordResetCooldownService.consumeRequest`, #187). `GET /reset-password/can-resend` gives the same answer for an unknown email.
- A Google/Facebook account without a password can receive a code and set one (#189): reading the mailbox is still required.
- `has_password` is false on accounts created through Google/Facebook before #189 (migration 019, #196): `LAST_PROVIDER` no longer counts a password that does not exist.
- A reset ends every session of the account: Supabase Auth (GoTrue v2.197.0, same version locally and on the hosted project) deletes them when `auth.admin.updateUserById` changes the password. Access and refresh tokens issued before the reset are refused immediately (L5, #203). The test runs on the local stack only: a GoTrue upgrade must be re-checked.
- Reset and sign-up find the account through `find_auth_user_id_by_email` (migration 018, service key only), case-insensitively and whatever the number of accounts; the reset code attempt counter is keyed on the lowercased email, so it is shared by every case variant (#194).

**Tests.**
- `backend/src/features/auth/services/email-verification.int.test.ts`: "refuses a verified account with ALREADY_VERIFIED and returns no session", "sends nothing when the body email is not the account email", "answers 429 RESEND_COOLDOWN on a second call even when the email does not match", "sends nothing for an unknown user".
- `backend/src/features/auth/services/password-reset-resend.int.test.ts`: "reports the same cooldown for an email with no account (no enumeration)".
- `backend/src/features/auth/services/password-reset-oauth.int.test.ts`: "sends a code, resets, records the password and allows password sign-in".
- `backend/src/features/auth/services/has-password-backfill.int.test.ts`: "sets false on Google and Facebook sign-ups made before #189", "keeps password accounts and later sign-ups that set a password".
- `backend/src/features/auth/services/password-reset-sessions.int.test.ts`: "refuses the access and refresh tokens issued before the reset".
- `backend/src/features/auth/utils/find-auth-user.int.test.ts`: "sends a reset code and resets the password, whatever the case of the email", "refuses a sign-up with the email of a verified account, whatever its case", "counts reset attempts once per account across case variants of the email".

**Open.**
- Codes are stored in plaintext in `user_profiles`; they were readable with the anon key (L1), they no longer are since #201.

## M4. Token bruteforce and replay

**Threat.** Send forged, expired or revoked tokens in a loop to protected routes or to the Socket.io handshake, to find a valid one or to saturate Supabase Auth.

**Protection.** `verifyTokenLimited` (`backend/src/shared/security/token-verify-limit.ts`, #160), used by `authMiddleware`, `optionalAuthMiddleware` (`backend/src/features/auth/auth.middleware.ts`) and `authenticateSocket` (`backend/src/realtime/socket-auth.ts`): `INVALID_TOKEN` and `TOKEN_REVOKED` failures are counted per IP (20 per 15 min by default). Beyond that, the IP gets `429` (HTTP) or `TOO_MANY_ATTEMPTS` (socket) without any call to Supabase. Details in `backend/README.md`.

**Tests.**
- `backend/src/features/auth/token-verify-limit.int.test.ts`: "counts failures with an expiry, then answers 429 without calling getUser", "refuses the socket handshake with TOO_MANY_ATTEMPTS without calling getUser".
- `backend/src/shared/security/token-verify-limit.test.ts`: "lets at most max of a parallel burst of invalid tokens reach verify".

**Accepted risk.** Without Redis this limiter neither blocks nor counts; `verifyToken` already answers 503 in that case (M13). IP behind a proxy: `TRUST_PROXY` (#173).

## M5. Session theft

**Threat.** A third party obtains a user's access token or refresh token and acts on their behalf.

**Protection.**
- `POST /api/auth/logout` puts the SHA-256 hash of the access token in a Redis revocation list until its `exp` (`revoke`, `backend/src/features/auth/services/token-revocation.service.ts`), then ends the Supabase session with `signOut(token, 'local')`, which invalidates the refresh token (`logout`, `backend/src/features/auth/services/session.service.ts`). The user's other devices stay signed in.
- Every request checks the revocation list before Supabase (`verifyToken`, `session.service.ts`); without Redis, `503 REVOCATION_UNAVAILABLE`, never an acceptance.
- `POST /api/auth/refresh` answers 401 to a refused refresh token and 503 if Supabase is unavailable (#126): the app does not sign the user out because of an outage.
- Mobile: `endSessionLocally` (`mobile/src/features/auth/stores/sessionActions.ts`) clears the session even if the backend call fails.

**Tests.**
- `backend/src/features/auth/services/logout.int.test.ts`: "rejects the old access token and the old refresh token", "keeps the same user's other session signed in".
- `backend/src/features/auth/services/session.service.test.ts`: "rejects a revoked token with 401 TOKEN_REVOKED without calling Supabase", "keeps the 503 REVOCATION_UNAVAILABLE from the denylist check", 401 / 503 cases of `refreshToken`.
- `backend/src/features/auth/services/token-revocation.service.test.ts`: "stores a SHA-256 hash of the token, never the token".
- `backend/src/features/auth/auth.middleware.test.ts`: "answers 401 TOKEN_REVOKED for a token revoked by a logout".
- `mobile/src/features/auth/stores/authStore.test.ts`: "still ends the session when the backend logout fails".

**Accepted risks.**
- A stolen token stays valid until it is revoked or expires (lifetime set by Supabase Auth). The token is not bound to the device.
- Tokens are stored in AsyncStorage (`mobile/src/features/auth/services/sessionStorage.ts`), unencrypted. Reason: it needs a rooted phone or physical access; `expo-secure-store` would be the improvement.
- In `make dev-docker` and `make dev-local`, the app talks to the backend over `http://` and `ws://` on the local network (`DEV_API_URL` in `make/config.mk`): tokens in clear text on the Wi-Fi. `make dev-tunnel` goes through HTTPS (ngrok). Reason: development environment, no production deployment.

## M6. Token revoked while a socket is already open

**Threat.** After a logout (or token expiry), a socket opened before keeps receiving events (`playlist:updated`, `listening:status`, `control:command`) and sending them.

**Protection.**
- At the handshake, a revoked token is refused (`authenticateSocket` goes through `verifyToken` in `session.service.ts`): #71.
- The app closes its socket at every session end: `useAuthStore.subscribe` subscription in `mobile/src/shared/stores/socketStore.ts` (#70).

**Tests.**
- `backend/src/realtime/socket-auth.int.test.ts`: "refuses a token revoked by logout with INVALID_TOKEN (#71)".
- `mobile/src/features/auth/stores/authStore.test.ts`: "revokes the session on the backend, disconnects the socket and clears the session".

**Accepted risk.** The token is checked at the handshake only (documented in `backend/README.md`). A malicious client that keeps its socket open after logout, or past its token's expiry, stays connected until it disconnects or the server restarts. #70 covers the app, not a modified client. Reason: only the official app disconnects by itself; re-checking the token on every event, or disconnecting the user's sockets at logout, would be the fix (L6). Room rights are still re-checked on every change (M10), so such a socket gains no access.

## M7. Access to another user's data through the API

**Threat.** An authenticated user reads or modifies someone else's playlists, devices, profile or settings by changing an identifier in the request.

**Protection.** The backend talks to Supabase with the service key (`supabaseAdmin`, `backend/src/shared/config/supabase.ts`), which **bypasses RLS**: every feature (`auth`, `friends`, `music-control`, `playlists`, `profile`, `realtime`) uses it. Isolation is therefore in the code:
- Every route of `playlists`, `profile`, `friends`, `music-control`, `soundcloud` goes through `authMiddleware` (`router.use(authMiddleware)` in each `*.routes.ts`); identity comes from the token (`req.user.id`), never from the body.
- Playlists: `canViewPlaylist`, `canEditPlaylist`, `checkOwnership`, `checkEditPermission` in `backend/src/features/playlists/permissions/playlist.permissions.ts`.
- Music control: `ControlAccessService` (M11); a device can only be licensed by its owner (`findOwnedDevice` in `DeviceLicenseService.grant`).
- Another user's profile: `getFilteredProfile` (`backend/src/features/profile/services/filtered-profile.service.ts`) applies their privacy settings.
- Inputs of authenticated routes are validated by Zod (`*.validators.ts`).
- SoundCloud routes (`backend/src/features/soundcloud/soundcloud.routes.ts`, `GET /api/soundcloud/search`, `/track/:urlOrId`, `/stream`, `/stream/:trackUrl`), fixed by #208 (L10): `authMiddleware` then `soundcloudRateLimiter` (`backend/src/shared/security/http-rate-limit.ts`), counted in Redis per user (120 requests per minute by default, `RATE_LIMIT_SOUNDCLOUD_MAX` / `RATE_LIMIT_SOUNDCLOUD_WINDOW_MS`), `429 RATE_LIMIT_EXCEEDED` beyond, `503` without Redis (`REVOCATION_UNAVAILABLE` from auth, which runs first). Every input goes through Zod (`soundcloud.validators.ts`): `track/:urlOrId` only accepts a numeric id or an https URL on `soundcloud.com`, `www.soundcloud.com`, `m.soundcloud.com` or `on.soundcloud.com`, `stream` only such a URL (`400 VALIDATION_ERROR` otherwise, without calling SoundCloud). The backend is therefore no longer an open proxy to SoundCloud.

**Tests.**
- `backend/src/features/playlists/permissions/playlist.permissions.test.ts` (`canViewPlaylist`, `canEditPlaylist`, `checkEditPermission`).
- `backend/src/features/playlists/services/playlist-track.int.test.ts`: "refuses every operation to a user without the edit right".
- `backend/src/features/music-control/services/device-license.int.test.ts`: "refuses a grant on another user's device or an unknown device", "refuses a revoke on another user's device and leaves its license untouched".
- `backend/src/features/soundcloud/soundcloud.int.test.ts`: "answers 401 without a token on every route, without calling SoundCloud", "answers 400 VALIDATION_ERROR for a stream url that is not a SoundCloud URL", "answers 429 past the per-user limit, in Redis, without affecting another user", "fails closed with 503 RATE_LIMIT_UNAVAILABLE while Redis is down".
- **No test** for `getFilteredProfile` nor for the profile routes (planned by #98) (L9).

## M8. Direct Supabase access with the anon key

**Threat.** Anyone who knows the URL and the anon key of the Supabase project can call PostgREST directly, anonymously or with their own token. Only RLS and SQL privileges then protect the tables. Until #376 the app shipped them (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) and they could be extracted from the APK; since then it only talks to the backend and no longer contains them, but the anon key remains a public value by design.

**Protection.** Since migration `backend/migrations/017_revoke_direct_table_access.sql` (#201), `anon` and `authenticated` have no privilege at all on the tables, sequences and functions of `public` (including objects later created by `postgres`): any direct PostgREST request answers `42501`. Only the backend, with the service key, reaches the tables.

**RLS policies, now a second barrier.** They only apply to these direct accesses, never to the backend (service key). State before 017, in `backend/migrations/*.sql`:

| Table | RLS | Read | Write |
|-------|-----|------|-------|
| `user_profiles` | yes (001) | **everyone** (`USING (true)`) | the user's own row, **all columns** |
| `playlists` | yes (003) | public, owner or collaborator | owner |
| `playlist_tracks` | yes (003, 016) | as `playlists` | no policy since 016: write refused |
| `tracks` | **no** | **everyone** | **everyone** |
| `follows` | yes (007) | everyone | insert / delete by the `follower_id` |
| `profile_privacy` | yes (011) | self | self |
| `music_preferences` | yes (011) | everyone (ignores privacy) | self |
| `devices`, `device_control_licenses` | yes (015) | self / owner or grantee | self / owner |
| `rank_*`, `playlist_*` functions | — | `EXECUTE` revoked from `anon` and `authenticated` (016) | same |

Before 017, `anon` and `authenticated` had Supabase's default table privileges: an anonymous request read `password_reset_code` (L1). The migration was applied to the hosted project.

**Tests.**
- `backend/src/shared/config/supabase-direct-access.int.test.ts`: anonymous reads of `user_profiles`, `follows`, `tracks`, `music_preferences`, `playlists` refused; a signed-in user can neither read the codes, mark themselves verified, nor give themselves `can_control_music`; anonymous write to `tracks` refused; the service key still reads.
- `backend/src/features/playlists/services/track-operations.int.test.ts`: "refuses every 016 function to the anon key with a permission error", "refuses direct inserts and deletes on playlist_tracks to the playlist owner".

**Gaps.** L1, L2, L3 below, fixed by #201.

## M9. Real-time abuse

**Threat.** Connect from a third-party website, impersonate another user or another device, send malformed payloads or flood the server with events.

**Protection.**
- Origin: `allowRequest` and `cors` in `initialize` (`backend/src/realtime/socket-server.ts`) apply `isOriginAllowed` / `isSameOrigin` (`backend/src/shared/config/cors.config.ts`, `ALLOWED_ORIGINS`, #137). A connection without an `Origin` header (native app) is accepted: the origin rule only protects against browsers, authentication does the rest. With `NODE_ENV=development`, `isOriginAllowed` also accepts `exp://` origins and https subdomains of the ngrok domains (`isNgrokOrigin`: `ngrok-free.app`, `ngrok-free.dev`, `ngrok.app`, `ngrok.dev`, `ngrok.io`), compared on the parsed host name: `https://ngrok.attacker.example` is refused (#209). Still open: anyone can get a free ngrok subdomain, so a page served by an attacker's tunnel still passes (the project's tunnel is also allowed exactly through `TUNNEL_URL`). The backend started by `make` always runs in `development` ([containers.md](containers.md)); token authentication is still required.
- Handshake: token required and verified, fields validated by Zod (`handshakeAuthSchema`), device registered in the database before acceptance (`authenticateSocket`, `backend/src/realtime/socket-auth.ts`). Identity (`socket.data.userId`) comes from the token alone.
- Events: `playlist:join` / `leave` (UUID), `listening:subscribe` / `unsubscribe` (UUID), `control:action` (`controlActionSchema`, unknown fields stripped) validated before any database read (`backend/src/realtime/playlist-room.ts`, `backend/src/realtime/music-control-access.ts`); `listening:update` validated by `listeningUpdateSchema` (title and artist ≤ 300 characters, URL ≤ 2048, optional integer `positionMs` ≥ 0 (#295), otherwise `INVALID_PAYLOAD`, #204) and limited to one application per second and per device (`createLatestThrottle`, `backend/src/realtime/latest-throttle.ts`, #151). The device comes from the handshake, never from the payload.
- Rate (#204): each socket has an in-memory counter per event (fixed 10 s window: 20 `listening:update` or `control:action`, 30 for the app's other events, one shared counter for any other name). Beyond that, the event is not handled and the client gets `RATE_LIMITED` on `listening:error` / `playlist:error` / `control:error` (`backend/src/shared/security/socket-event-limit.ts`). The refusal is logged as a warning once per window, with a filtered event name (`loggableEventName`); the incoming-event log line (subject IV.6) is still written for every event, refused ones included: the limit protects the handlers and the database, not the log volume.
- Every incoming event is logged with platform, device and version (subject IV.6).

**Tests.**
- `backend/src/realtime/socket-origin.int.test.ts`: "refuses a %s connection from an origin outside ALLOWED_ORIGINS", "accepts a connection without Origin header".
- `backend/src/shared/config/cors.config.test.ts`: "allows %s", "refuses %s" (ngrok look-alikes, http, bare domain).
- `backend/src/realtime/socket-auth.int.test.ts`: "refuses a handshake without token with NO_TOKEN", "refuses a missing or non-string device field with INVALID_HANDSHAKE", "ignores a forged userId in the handshake", "stores listening:update with the handshake device, not the payload one", "keeps the latest listening:update of a burst (#151)", "answers INVALID_PAYLOAD to a listening:update with a title too long (#204)", "refuses events past the per-socket limit with RATE_LIMITED (#204)".
- `backend/src/realtime/music-control-access.int.test.ts`: "refuses Carol even when the payload claims to come from Bob", "ignores a forged sender field from an allowed controller", "answers malformed payloads with INVALID_PAYLOAD and keeps serving the socket".

**Accepted risk.** The limit is per socket: a user who opens many connections multiplies their rate (no limit on the number of connections per user; each handshake still goes through token verification, #160). A `listening:unsubscribe` or `playlist:leave` refused for rate leaves the socket in the room until the next one; only a flooding client can cause it.

## M10. Room access kept after it is withdrawn

**Threat.** A removed viewer or collaborator, a friend who is no longer a friend, or a controller whose license was withdrawn stays in `playlist:<id>` or `listening:<ownerId>` and keeps receiving events.

**Protection.**
- Playlists: after a viewer (`viewer.service.ts`) or collaborator (`collaborator.service.ts`) is removed, after an update (visibility) or a deletion (`playlist-update.service.ts`), `revalidatePlaylistRoom` (`backend/src/realtime/emitters/playlist.emitters.ts`) re-runs `canViewPlaylist` for each socket in the room and evicts those that lost access (`revalidatePlaylistRoom`, `backend/src/realtime/playlist-room.ts`). A socket's `join` / `leave` are handled in arrival order.
- Listening: after the switch or a license is withdrawn (`notifyPermissionChange`, `backend/src/realtime/emitters/control.emitters.ts`) and after an `unfollowUser` (`friends.service.ts`, `backend/src/features/friends/utils/listening-access.ts`), `revalidateListeningAccess` removes the controller's sockets from `listening:<ownerId>` if they have no device left; an error evicts (fail closed). `listening:subscribe` re-checks access after joining the room. A socket's `subscribe` / `unsubscribe` are handled in arrival order (#159).

**Tests.**
- `backend/src/realtime/playlist-room.int.test.ts`: "evicts a viewer removed while in the room", "evicts a collaborator removed while in the room", "evicts the outsider when a public playlist becomes private", "evicts everyone when the playlist is deleted", "handles join then leave in order: the socket ends outside the room".
- `backend/src/realtime/music-control-access.int.test.ts`: "removes Bob's sockets when Alice revokes his control", "removes Bob's sockets when he unfollows Alice", "evicts Bob when Alice revokes his last license", "keeps Bob subscribed when the switch is cut but a license remains", "handles subscribe then unsubscribe in order: the socket ends outside the room (#159)".
- `backend/src/realtime/playlist-room.test.ts`: "evicts nobody when the lookup fails".

**Accepted risks.**
- `revalidatePlaylistRoom` evicts nobody if reading the playlist fails (fail open, chosen so as not to expel the members of a playlist that still exists; test above). The re-check is started without waiting (fire-and-forget): a few events may go out between the change and the eviction.

## M11. Music control of an unauthorized device

**Threat.** Send `play` / `pause` to a device one has no right to control, or see the listening status of a user without access.

**Protection.** `ControlAccessService` (`backend/src/features/music-control/services/control-access.service.ts`): the two users must be mutual friends, and the owner must have turned on the "all my devices" switch (`follows.can_control_music`) or granted a license on that device (`device_control_licenses`, `DeviceLicenseService`, `backend/src/features/music-control/services/device-license.service.ts`). The owner always passes on their own devices. Any database error answers "no access" (`safeAccess`). `control:action` checks access before looking at whether the device is online: a refused caller learns nothing about the devices. The grantee is told about license grants and withdrawals by `permission:changed` (#183).

**`/api/users/:userId/queue` surface (#294).** A friend manages the owner's play queue (add, remove, move, play) if they are the owner or control at least one of the owner's devices (`assertCanManageQueue`, otherwise `403 QUEUE_ACCESS_DENIED`). A playback action (play a track or a playlist, next, previous) also requires a `deviceId`: a license on that device (or the switch) and the device online, checked before any change to the queue (`resolvePlaybackDevice`, otherwise `403` or `409 DEVICE_OFFLINE`). A delegate losing their last controllable device gets `control:revoked` and leaves `listening:<ownerId>`, which also carries `queue:updated`.

**`POST /api/queue/transfer` surface (#295).** It always starts from the caller (not mounted under `/api/users/:userId/queue`). Three checks, all before any change: the target (license or owner, device online: `403` or `409 DEVICE_OFFLINE`), the optional `source` (`canControlDevice`, otherwise `403 QUEUE_ACCESS_DENIED`) and the played item, which must be in the caller's queue (`404 QUEUE_ITEM_NOT_FOUND`): one can neither read nor copy someone else's queue. The transfer only changes the target's queue, with a block inserted after its current track; `pause` is only sent to a device the caller controls.

**Tests.**
- `backend/src/features/music-control/services/control-access.service.test.ts`: "allows the licensed device only, between mutual friends with the switch off", "refuses a stale switch when the owner does not follow back", "refuses when the client throws".
- `backend/src/realtime/music-control-access.int.test.ts` ("per-device access (story 4.5)" block): "delivers to the licensed device only, until B is licensed or the switch is on", "refuses B once the switch is cut, and still reaches the licensed A", "tells Bob when Alice revokes a license, with whether access remains (#183)".
- `backend/src/features/music-control/services/device-license.int.test.ts`: "refuses a grant to a non-friend (one-way follow or none)".

**Fixed gap.** Through direct Supabase access, a controller could give themselves the switch (L2); closed by #201.

## M12. Concurrent playlist edits

**Threat.** Two editors change the same playlist at the same time: lost or duplicated tracks, a different order depending on the client.

**Protection.** Described in [playlist-concurrency.md](../features/playlist-concurrency.md): each operation is a Postgres function (migration 016) that locks the playlist row; fractional ranks; `tracks_version` and `moved_at_version`; a move based on a stale version of the same track gets `409`. Direct writes to `playlist_tracks` are closed (M8).

**Tests.** Those listed in [playlist-concurrency.md](../features/playlist-concurrency.md#tests), including `backend/src/features/playlists/services/track-operations.int.test.ts`: "lets exactly one of N concurrent moves of the same track win", "keeps every invariant under a burst of concurrent moves, adds and removes".

**Accepted risk.** The `viewer_ids` and `collaborator_ids` lists are changed by read-then-write, without a lock (`viewer.service.ts`, `collaborator.service.ts`): two simultaneous changes by the owner may lose one. Only the owner changes them, the effect is visible and is fixed by doing it again.

## M13. Redis unavailable

**Threat.** Take Redis down or saturate it to disable the limits and the revocation.

**Protection.** Fail closed: the `express-rate-limit` limiters answer `503 RATE_LIMIT_UNAVAILABLE` (`rate-limit-store.ts`), `attempt-limit.ts` answers `503 REDIS_UNAVAILABLE`, revocation answers `503 REVOCATION_UNAVAILABLE`, so no protected route accepts a token without Redis. Choice documented in [redis.md](../architecture/redis.md) ("No In-Memory Fallback").

**Tests.** `rate-limit-store.test.ts`: "throws 503 and sends nothing while Redis is not ready", "fails closed again when Redis drops, then resumes"; `token-revocation.service.test.ts`: "throws 503 REVOCATION_UNAVAILABLE when Redis is not ready"; `auth.middleware.test.ts`: "answers 503 REVOCATION_UNAVAILABLE when the denylist cannot be checked".

**Accepted risk.** `checkAccountLockout`, `checkIPBlacklist`, `account-lockout.ts` and `ip-reputation.ts` (`backend/src/shared/security/fail-open.ts`) let requests through on a Redis error (fail open). The login limiter, placed before them, fails closed, so a complete Redis outage blocks login instead of opening it; only a one-off error on a Redis command lets an attempt through. In dev, Redis has no password but is published on `127.0.0.1` only (L8, #205).

## Open gaps

Found while writing this document. L1 to L3 were fixed by #201, L4 by #173, L7 by #204, L8 by #205, L10 by #208, L11 reduced by #209 (remaining risk accepted), L5 was not reproducible (#203); the others each have their ticket, except L6, an accepted risk.

| # | Severity | Gap | Where | Tracking |
|---|----------|-----|-------|----------|
| L1 | **Critical**, fixed (#201) | `user_profiles` is readable by everyone (`USING (true)`), including `password_reset_code` and `verification_code`. With the APK's anon key: request a reset for the victim (`forgot-password`), read the code, change their password. Account takeover without access to the mailbox. Also exposes every profile without the privacy filter. | `backend/migrations/001_initial_schema.sql`, `013_email_verification.sql`, `014_password_reset.sql` | #201 |
| L2 | High, fixed (#201) | The UPDATE policy of `user_profiles` allows every column of one's own row: a user can set `email_verified = true` without a code. The INSERT policy of `follows` does not check `can_control_music`: a controller can delete then recreate their `follows` row towards the owner with `can_control_music = true` and, if the owner follows them, control all their devices. | `001_initial_schema.sql`, `007_follows.sql`, `009_music_control.sql` | #201 |
| L3 | High, fixed (#201) | `tracks` has no RLS: read, update and delete with the anon key. `music_preferences` and `follows` are readable by everyone, without the privacy settings. | `003_playlist_persistence.sql`, `011_profile_privacy_and_preferences.sql`, `007_follows.sql` | #201 |
| L4 | Medium, fixed (#173) | Every anti-bruteforce limit is per IP (M1, M2); behind a proxy, every client had the same IP. `TRUST_PROXY` sets which proxies may set `X-Forwarded-For`, for HTTP and the socket. | `backend/src/shared/config/trust-proxy.ts` | #173 |
| L5 | Medium, not reproduced (#203) | A password reset would not end open sessions. Checked on GoTrue v2.197.0 (local and hosted): Supabase Auth deletes every session of the account when the admin changes the password; an integration test locks this behavior on the local stack. | `resetPassword` (`backend/src/features/auth/services/password-reset.service.ts`) | #203 |
| L6 | Medium | An open socket survives logout and token expiry (M6). | `backend/src/realtime/socket-auth.ts` | accepted risk (M6) |
| L7 | Low, fixed (#204) | No rate limit per socket event and no max length on `listening:update` (M9). Limit per socket and per event, strings bounded by Zod. | `backend/src/shared/security/socket-event-limit.ts`, `backend/src/realtime/music-control-access.ts` | #204 |
| L8 | Low (dev), fixed (#205) | Redis was published on port 6379 of every host interface, without a password: someone on the same network could clear the locks, the blacklist and the revocation list. Published on `127.0.0.1` only; still without a password for host processes and containers on the Docker network. | `make/helpers/docker.mk` (`start_redis`), see [containers.md](containers.md) | #205 |
| L9 | Tests | Account lockout and IP blacklist tested by `backend/src/features/auth/account-lockout.int.test.ts` (real auth router: lockout at the threshold even with the right password, reset after a successful login, IP blacklist at the threshold and `403 IP_BLOCKED` on every auth route). Still untested: the max number of attempts for the verification and reset codes, `getFilteredProfile`. | `backend/src/features/auth/account-lockout.int.test.ts` | #206 |
| L10 | Medium, fixed (#208) | SoundCloud routes public, without rate limit, and without Zod validation except `search`: open proxy to SoundCloud (M7). | `backend/src/features/soundcloud/soundcloud.routes.ts` | #208 |
| L11 | Medium (dev), reduced (#209) | In development, any origin containing "ngrok" was accepted by HTTP and socket CORS; only https subdomains of the ngrok domains are now, on the parsed host name. Accepted risk: an ngrok subdomain comes with a free account, so an attacker's tunnel still passes; token authentication is still required (M9). | `backend/src/shared/config/cors.config.ts` (`isOriginAllowed`) | #209 |
