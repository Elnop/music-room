---
title: 'Mobile : authentification entièrement via le backend, Supabase retiré (#376)'
type: 'refactor'
ticket: 'https://github.com/Elnop/music-room/issues/376'
created: '2026-10-22'
status: 'built'
baseline_revision: '3ca947606fff46ef0fdfb70391fcd91d1354c368'
route: 'full'
route_source: 'auto'
risk: 'high'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md', '{project-root}/docs/superpowers/specs/2026-10-21-clean-codebase-refactor-design.md', '{project-root}/.agents/rules/architecture.md', '{project-root}/.agents/rules/logging.md', '{project-root}/.agents/rules/guardrails.md', '{project-root}/doc/TUNNEL_MODE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #376, epic #362. The subject (v5.3) wants the app to be a "remote control" of the backend, which is the reference, and wants every app action logged on the backend. The mobile app still embeds a Supabase client (`mobile/src/lib/supabase.ts`). After the backend `/api/auth/login`, `authStore.login` also signs in to Supabase directly with the password. It mirrors every session into that client (`setSession` ×3), signs out of it, and `RootNavigator` listens to its `onAuthStateChange` (`SIGNED_OUT`, and `TOKEN_REFRESHED` from its auto-refresh). The backend also keeps a dev-only reverse proxy (`shared/dev/supabase-auth-proxy.ts`) so that client can reach the local stack in tunnel mode.

**Approach:**
- Remove the Supabase client from the mobile app. The session lives only in `authStore`, persisted as today. It is refreshed only through the backend `/api/auth/refresh`: the proactive refresh and the refresh on 401 already exist in `services/api.ts` and `authStore.refreshAccessToken`. Sign-out goes only through `/api/auth/logout` plus clearing local state.
- Remove `@supabase/supabase-js`, `react-native-url-polyfill` (if only the client used it) and the `EXPO_PUBLIC_SUPABASE_*` variables from the mobile app.
- Remove the now-unused backend dev proxy, its env, and the tunnel-script setup that only fed that client.

## Boundaries & Constraints

**Always:**
- Each auth flow works as on `develop` from the user's point of view:
  - password login;
  - Google and Facebook login;
  - register and email verification;
  - password reset;
  - session restore at app start, including a refresh when the stored token is expired or close to expiry;
  - refresh during use, including concurrent requests sharing one refresh;
  - a refresh failure, which signs the user out;
  - logout;
  - the socket reconnecting with the new token after a refresh.
- Every one of these actions is an HTTP call to the backend, so it appears in the backend logs (subject IV.6).
- Everything that `RootNavigator`'s `onAuthStateChange` did is still covered:
  - a session revoked or expired so that the refresh fails ends in the signed-out state (store and storage cleared);
  - a refreshed token is written to the store.
- Tests: update the `authStore`, `RootNavigator` and `api` tests that mock `@/lib/supabase`, and add cases for session restore and refresh failure if they are missing. Mobile `npm run check` is green with exception entries removed and none added, and the backend `npm run check` and `test:int` are green.
- Update the docs that mention the mobile Supabase variables or the proxy: `mobile/README.md`, `mobile/.env.example`, `doc/TUNNEL_MODE.md`, `doc/SECURITY.md`/`THREAT_MODEL.md` if they mention it, and `AGENTS.md` if needed.

**Never:**
- Add backend endpoints: `/login`, `/refresh` and `/logout` already exist.
- Change the backend auth responses or the mobile UI texts.
- Store tokens anywhere new.

</frozen-after-approval>

## Code Map

- `mobile/src/lib/supabase.ts` -- the `createClient` with AsyncStorage, auto-refresh and persisted session. It throws at import if `EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_ANON_KEY` is missing. Delete it; `src/lib/` then becomes empty.
- `mobile/src/store/authStore.ts` --
  - l.100: `supabase.auth.signInWithPassword` after `authApi.login`. Delete it.
  - l.314, 388, 638: `supabase.auth.setSession`, after OAuth/verify, reset and refresh. Delete them.
  - l.699: `supabase.auth.signOut({ scope: 'local' })`. Delete it.
  - `refreshAccessToken` (around l.600–690) already calls the backend and handles a refresh already in flight. Keep it as the only refresh path.
- `mobile/src/navigation/RootNavigator.tsx` l.89–122 -- the `onAuthStateChange` effect. Delete it. Its `SIGNED_OUT` branch clears the store and storage: check that `authStore` already does this when a refresh fails (`refreshAccessToken` failing → `logout`/clear). If it does not, make the refresh-failure path do it. The earlier effect at l.~60 already refreshes an expiring token at startup; keep it.
- `mobile/src/services/api.ts` -- `registerAuthSession`, the proactive refresh and the refresh on 401 stay as they are.
- `mobile/src/store/socketStore.ts` -- check that a refreshed token reaches the socket on reconnect; the "token refused, refreshing it once" path exists.
- `mobile/package.json` -- `npm uninstall @supabase/supabase-js`, and `react-native-url-polyfill` if nothing else imports it (grep for it). Write the lockfile with npm 10 (AGENTS.md).
- `mobile/.env.example`, `mobile/README.md`, `mobile/scripts/start-expo-tunnel.sh` (l.80–120: the `SUPABASE_PROXY_URL`/anon key checks for the phone) and `mobile/app.config.js` (`extra`, if it passes Supabase values) -- remove them.
- `backend/src/shared/dev/supabase-auth-proxy.ts`, its mount in `backend/src/server.ts:15`, its env in `backend/src/shared/config/env.ts:16`, and its tests -- delete them once nothing uses the proxy. Check `make/tunnel.mk` and `doc/TUNNEL_MODE.md` for proxy steps.
- Tests:
  - mobile: `authStore.test.ts`, `RootNavigator.test.tsx` and any test mocking `@/lib/supabase` (`grep -rn "lib/supabase" mobile/src`);
  - backend: `supabase-auth-proxy` tests.

## Tasks & Acceptance

**Execution:**
- [x] `mobile/src/store/authStore.ts`, `navigation/RootNavigator.tsx` -- remove every Supabase call and make sure refresh failure signs the user out -- the backend is the only source of truth.
- [x] Delete `mobile/src/lib/supabase.ts`; uninstall the dependencies; clean env and docs.
- [x] Backend: remove the dev proxy, its env and its tests.
- [x] Tests: update the mocks; cover session restore, refresh, refresh failure and logout.

**Acceptance Criteria:**
- Given `grep -rni supabase mobile/ --exclude-dir=node_modules`, then nothing is found in code, config or env, and only historical mentions remain in docs, if any.
- Given a stored session whose access token has expired, when the app starts, then it refreshes through `/api/auth/refresh` and lands on the home screen. When the refresh fails, it lands on login with storage cleared (tests).
- Given login, OAuth, register/verify, reset and logout, when they run in tests, then each calls only backend endpoints, and no Supabase module is loaded.
- Given `npm run check` in `mobile/` and `backend/` and the backend `test:int`, then all pass.

## Implementation Notes

- The refresh-failure path already signed out: a 401 from `/api/auth/refresh` calls `endSessionLocally` (store and AsyncStorage cleared, socket closed). Other failures (network, 5xx) keep the session, as on `develop`. No change needed beyond dropping the Supabase calls.
- `TUNNEL_MODE` and `SUPABASE_MODE` were read by the backend only for the proxy: removed from `env.ts` and from the tunnel backend's `docker run`. The mobile containers lose their `zumik.supabase` label (no Supabase value left to depend on); the backend keeps it.
- Also cleaned beyond the code map: `make/helpers/docker.mk` (`write_mobile_dev_env` no longer writes `EXPO_PUBLIC_SUPABASE_*`, `start_mobile_tunnel` no longer passes the anon key), `display_supabase_tunnel_url` in `make/helpers/echo.mk`/`make/tunnel.mk`, the two Supabase secrets of `.github/workflows/release-apk.yml`, and the stale semgrep `exclude` entries for `lib/supabase.ts` and `RootNavigator.tsx`.
- Lockfile written with `npx npm@10 uninstall` (npm 11 rewrote unrelated entries).

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd mobile && npm run check` -- expected: all OK.
- `cd backend && npm run check && sh scripts/test-db.sh up && npm run test:int; sh scripts/test-db.sh down` -- expected: all pass.
- `grep -rni supabase mobile --exclude-dir=node_modules --exclude-dir=android` -- expected: nothing in code or config.

**Manual checks:**
- On the next `main` build:
  - a cold start with a saved session;
  - password login, Google and Facebook;
  - using the app for more than an hour, past the token expiry;
  - logout;
  - tunnel mode on a phone.

### Pass 1 (quick) — high 0 / medium 2 / low 2 / false 0 / maybe-false 0

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| The old supabase-js session (`sb-*-auth-token`) stays in AsyncStorage on updated devices, beyond reach of logout | medium | patch | The client used `persistSession: true` with AsyncStorage; `clearStorage` only clears the `@zumik/*` keys. Purge them at startup and in `clearStorage`. |
| A caller waiting on a refresh in flight gets `true` even when that refresh failed | medium | patch | Pre-existing, but `authStore` is now the only refresh path; the plan requires refresh failure to sign the user out. |
| No guard that Supabase never loads; no test that register only calls the backend | low | patch | The AC says "no Supabase module is loaded". |
| `RootNavigator` session-restore tests leak global mocks | low | patch | Order-dependent tests. |
