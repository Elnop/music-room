---
title: 'Documenter les menaces et corriger SECURITY.md'
type: 'chore'
ticket: '6'
created: '2026-10-10'
status: 'built'
baseline_revision: '2c1f210603fda190bfdd37d8a1891e9cd7aada69'
route: 'full'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #67 (story 2.6, CAP-10: "a document lists each hazard (including bruteforce, session theft, data isolation and realtime abuse) with its protection or accepted risk, and `doc/SECURITY.md` matches the real Dockerfiles"). There is no threat model, and `doc/SECURITY.md` describes Chainguard / distroless images, uid 65532 and "0 CVE guaranteed", none of which the Dockerfiles use.

**Approach:** Write `doc/THREAT_MODEL.md`: one entry per hazard — at least bruteforce, session theft, a token revoked while a socket is already connected, data isolation, realtime abuse, access kept in a room after it is withdrawn, per-device control, concurrent playlist edits, and the account-takeover / enumeration holes fixed in this cycle (#188, #187) — each with the threat, the protection, and links to the code and the test that cover it, or marked **accepted risk** with the reason. Rewrite `doc/SECURITY.md` to describe what `backend/Dockerfile`, `mobile/Dockerfile`, `mobile/Dockerfile.android-build` and the compose files actually do (base images, users, stages, exposed ports, what runs as root), plus a short pointer to the threat model. English or French: follow the existing `doc/` files' language (French).

## Boundaries & Constraints

**Always:** Every claim is checked against the current code: a protection is cited by file (and function or line) and by the test that proves it; if no test proves it, say so. Accepted risks are explicit (e.g. the token is checked once at the socket handshake: a socket opened before logout stays connected until the client disconnects it — #70 covers the app, not a malicious client). No marketing claims ("0 CVE", "maximum security").

**Never:** No code, Dockerfile or config change; if a doc review reveals a real gap, list it as an accepted risk or open question and report it (it becomes a ticket), do not fix it here. No secrets or real hostnames.

## Code Map

- Auth abuse: `backend/src/features/auth/middleware/rate-limit.middleware.ts` (Redis limiters: login, register, oauth, global; whitelist; fail closed 503), `backend/src/features/auth/middleware/account-lockout.middleware.ts` + `backend/src/shared/services/brute-force.service.ts` (lockout), IP blacklist (`checkIPBlacklist` in `auth.routes.ts`), `backend/src/features/auth/utils/token-verify-limiter.ts` (#160, failed token verifications per IP). Tests: `rate-limit.int.test.ts`, `token-verify-limiter.int.test.ts`, related unit tests.
- Sessions: `backend/src/features/auth/services/session.service.ts` (`verifyToken`, `refreshToken` 401 vs 503 #126, `logout`), `token-revocation.service.ts` (Redis denylist), `auth.middleware.ts`. Tests: `logout.int.test.ts`, `admin-session.int.test.ts`, `session.service.test.ts`, `socket-auth.int.test.ts` ("refuses a token revoked by logout", #71). Mobile: `mobile/src/store/authStore.ts` (`endSessionLocally`, socket disconnect via `socketStore` subscription).
- Email verification / password reset: `email-verification.service.ts` + `auth.controller.ts` (`verifyEmail`, `resendVerification`, #188), `password-reset.service.ts` + `password-reset-cooldown.service.ts` (#187, #189). Tests: `email-verification.int.test.ts`, `password-reset-resend.int.test.ts`, `password-reset-oauth.int.test.ts`. Known open: #194 (listUsers pagination), #196 (has_password data).
- Realtime: `backend/src/realtime/socket-auth.ts` (handshake JWT, device registration), `backend/src/realtime/index.ts` (events, payload validation, `revalidateListeningAccess`, `notifyPermissionChange`), Socket.io CORS from `ALLOWED_ORIGINS` (#137, `shared/config/cors.config.ts`). Tests: `socket-auth.int.test.ts`, `socket-origin.int.test.ts`, `music-control-access.int.test.ts`, `playlist-room.int.test.ts`.
- Per-device control: `backend/src/features/music-control/services/control-access.service.ts`, `device-license.service.ts` (#183). Tests: `device-license.int.test.ts`, `music-control-access.int.test.ts`.
- Data isolation: Supabase RLS policies in `backend/migrations/*.sql` (37 `ENABLE ROW LEVEL SECURITY` / `CREATE POLICY` lines) vs the backend using the service key (`shared/config/supabase.ts`: `supabaseAdmin` bypasses RLS, so isolation is enforced in code: `features/playlists/permissions/playlist.permissions.ts`, privacy filters in `features/profile`); check which client each feature uses and say plainly where RLS does and does not apply.
- Concurrency: `doc/PLAYLIST_CONCURRENCY.md` and the playlist services/tests it cites.
- Existing docs to stay consistent with (not rewrite): `doc/TESTING_SECURITY.md`, `doc/REDIS.md`, `backend/README.md` (realtime section).
- Docker: `backend/Dockerfile` (node:22-alpine; dev stage runs as root; production stage user `nodejs` uid 1001), `mobile/Dockerfile` (node:22-bookworm-slim, user `node`, Expo ports 8081/19000-19002, root steps), `mobile/Dockerfile.android-build` (node:22-bookworm, build image), the compose file(s) at the repo root (which stage/target, ports, volumes).

## Tasks & Acceptance

**Execution:**
- [ ] `doc/THREAT_MODEL.md` (new) -- hazards table/sections per Intent, each with protection + code link + test link, or accepted risk + reason; a short "open gaps" list for anything found uncovered.
- [ ] `doc/SECURITY.md` -- rewrite to the real Docker setup; link to the threat model.

**Acceptance Criteria:**
- Given `doc/THREAT_MODEL.md`, when each hazard is read, then it names the code and the test that cover it, or is marked accepted risk.
- Given `doc/SECURITY.md`, when compared with the three Dockerfiles and the compose file, then no statement contradicts them.

## Verification

**Manual checks (if no CLI):**
- Every file path and test name cited exists (`ls` / `grep` each one).
- SECURITY.md statements checked line by line against the Dockerfiles.

## Review Triage Log

Before review: the doc found L1–L3 (direct table access with the anon key); fixed by #201 (migration 017, applied to the hosted project) and the doc updated; L5, L7, L8, L9 → #203–#206; L6 accepted risk.

Pass 1 (quick): 7 findings, all real.

| # | Finding | Verdict | Route | Evidence / action |
|---|---------|---------|-------|-------------------|
| 1 | SECURITY.md claims `.env*` is excluded from images | medium | patch + ticket | `.dockerignore` lacks `.env.test` / `.env.example`; `.env.test` (local keys) lands in the backend dev image. Doc corrected; fix in #207. |
| 2 | IP blacklist presented as working; cannot trigger with defaults | low | patch | `globalAuthRateLimiter` 20/15 min per IP < 50 needed. |
| 3 | Lockout tiers 8/10 unreachable; `ACCOUNT_LOCKED` hidden behind the login limiter | low | patch | `loginRateLimiter` 429 at the 6th failure. |
| 4 | M2 reasoning wrong (3 codes/h also scales with N IPs); 899,999 codes | low | patch | Keyed email+IP. |
| 5 | "All inputs validated by Zod" false; public unthrottled SoundCloud proxy uncovered | medium | patch + ticket | `soundcloud.routes.ts` public, no limiter, only `search` uses Zod. Gap L10 → #208. |
| 6 | Dev CORS accepts any origin containing "ngrok" | low | patch + ticket | `cors.config.ts:25` `includes('ngrok')`. Gap L11 → #209. |
| 7 | TUNNEL_MODE.md / REDIS.md still describe Compose | low | defer | Pre-existing; #210. |
