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
