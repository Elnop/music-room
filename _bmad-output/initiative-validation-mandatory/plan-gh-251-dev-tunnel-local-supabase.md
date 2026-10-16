---
title: 'make dev-tunnel avec la stack Supabase locale'
type: 'feature'
ticket: ''
created: '2026-10-16'
status: 'built'
baseline_revision: '371dabbb843e1850bcb887b13bf29c5f22d45e27'
route: 'full'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** In `SUPABASE_MODE=local` (the default), `make dev-tunnel` refuses to start: a phone on another network cannot reach the local Supabase API (GitHub #251). The ticket's plan (two ngrok endpoints in one agent) cannot work on ngrok's free plan: it has one dev domain, and a second endpoint on it is rejected (ERR_NGROK_334).

**Approach:** Decision (user, 2026-10-16): proxy in the backend. When `TUNNEL_MODE=true` in development, the backend forwards `/supabase/auth/v1/*` to the local stack (`SUPABASE_URL`), so the single existing ngrok endpoint serves both. The tunnel backend container gets the local stack's env, and the mobile tunnel script points `EXPO_PUBLIC_SUPABASE_URL` at `<backend tunnel>/supabase`.

## Boundaries & Constraints

**Always:** proxy mounted only when `TUNNEL_MODE=true` and `NODE_ENV=development`, before `express.json()`/`urlencoded` (raw body streamed through) and before CORS. Forward method, path (prefix stripped), query, headers (Host rewritten to the upstream), body, status and response headers; stream both ways. Upstream failure → 502 JSON in the app's error shape. `SUPABASE_MODE=hosted make dev-tunnel` behaves as today. Never put `SUPABASE_SERVICE_KEY` in the mobile container.

**Never:** a second ngrok endpoint or a paid ngrok feature; forward paths outside `/auth/v1` (no PostgREST, Studio, storage); a new npm dependency (use `node:http`); an OpenAPI entry (dev-only infrastructure, not an API endpoint — exclude it from the coverage test if needed).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Auth call | `POST /supabase/auth/v1/token?grant_type=password` with JSON body and `apikey` | upstream receives `POST /auth/v1/token?grant_type=password`, same body and headers; client gets the upstream status, headers and body | — |
| Outside auth | `GET /supabase/rest/v1/profiles` | 404, nothing forwarded | — |
| Upstream down | stack stopped | 502 JSON `{ success:false, error:{ code:'SUPABASE_UNREACHABLE' } }` | logged with `logger.warn` |
| Not tunnel mode | `TUNNEL_MODE` unset | `/supabase/...` falls through to the app's 404 | — |

</frozen-after-approval>

## Code Map

- `backend/src/server.ts` -- app setup; mount the proxy right after `configureTrustProxy(app)`, before `cors`.
- `backend/src/shared/config/env.ts` -- add `TUNNEL_MODE` (string `'true'` → boolean, default false) next to `TUNNEL_URL`.
- `backend/src/shared/config/openapi-coverage.test.ts` -- check whether it walks `app` routes; the proxy is not in `routes.ts`, so probably untouched.
- `backend/scripts/start-with-tunnel.sh` -- unchanged (one endpoint on port 3000).
- `make/helpers/docker.mk` -- `start_backend` shows the local-mode flags to copy (`--env-file $(SUPABASE_LOCAL_ENV)`, `SUPABASE_URL=http://host.docker.internal:$(SUPABASE_LOCAL_PORT)`, `SMTP_HOST`, `--add-host`, label `zumik.supabase`); `start_backend_tunnel` and `start_mobile_tunnel` lack them; `docker_up_tunnel` does not run `supabase-up`; `container_supabase_mode` exists.
- `make/tunnel.mk` -- `dev-tunnel` refusal in local mode to remove; `qr-tunnel`/`tunnel-info` print the backend URL.
- `make/helpers/echo.mk` `display_tunnel_urls` -- add the Supabase URL line in local mode.
- `make/help.mk:94,133` -- texts saying dev-tunnel needs hosted.
- `mobile/scripts/start-expo-tunnel.sh` -- after the backend URL is live, in local mode wait for Supabase and append `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` to `.env.development.local`.
- `backend/README.md:67`, `doc/TUNNEL_MODE.md`, `doc/SECURITY.md:48` -- docs to update.
- Test pattern: `backend/src/shared/config/trust-proxy.int.test.ts` (express app on `createServer`, ephemeral port, `fetch`).

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/shared/config/env.ts` -- add `TUNNEL_MODE` -- gate the proxy.
- [x] `backend/src/shared/dev/supabase-auth-proxy.ts` -- `createSupabaseAuthProxy(upstreamUrl): RequestHandler` streaming with `node:http`/`node:https` per the matrix -- the proxy.
- [x] `backend/src/shared/dev/supabase-auth-proxy.test.ts` -- unit test the four matrix rows against a fake upstream `http` server -- matrix coverage.
- [x] `backend/src/server.ts` -- `if (env.TUNNEL_MODE && env.NODE_ENV === 'development') app.use('/supabase', createSupabaseAuthProxy(env.SUPABASE_URL))` + info log -- mount.
- [x] `make/helpers/docker.mk` -- `start_backend_tunnel`: label `zumik.supabase` and local-mode env flags, recreate when the running container's Supabase mode differs; `start_mobile_tunnel`: `-e SUPABASE_MODE` and, in local mode, `-e SUPABASE_ANON_KEY=<value read from SUPABASE_LOCAL_ENV>`; `docker_up_tunnel`: `supabase-up` first in local mode -- container wiring.
- [x] `mobile/scripts/start-expo-tunnel.sh` -- local mode: poll `<backend>/supabase/auth/v1/health` with `apikey` (12×5 s, fail like the backend wait), then append `EXPO_PUBLIC_SUPABASE_URL=<backend>/supabase` and the anon key to `.env.development.local` and export them -- app points at the local stack.
- [x] `make/tunnel.mk`, `make/helpers/echo.mk`, `make/help.mk` -- remove the refusal, print the Supabase URL in local mode, fix the help texts.
- [x] `backend/README.md`, `doc/TUNNEL_MODE.md`, `doc/SECURITY.md` -- document the proxy and the local-mode tunnel.

**Acceptance Criteria:**
- Given `SUPABASE_MODE=local`, when `make dev-tunnel` runs, then it starts the dev stack, the backend tunnel and Expo without refusing, and `make qr-tunnel` shows `<backend tunnel>/supabase`.
- Given that setup, when the app on a phone on mobile data signs up, signs in and creates a playlist, then the account and playlist exist in the local stack (manual check, done by the user at the end).
- Given `SUPABASE_MODE=hosted make dev-tunnel`, then `.env.development.local` has no `EXPO_PUBLIC_SUPABASE_*` lines and the app uses `mobile/.env`'s project.

## Implementation Notes

- The gate lives in `mountSupabaseAuthProxy(app, env)` (same file as the proxy) so the "not tunnel mode" row is unit-tested; `server.ts` calls it right after `configureTrustProxy(app)` and logs when mounted.
- The proxy parses `req.url` with WHATWG `URL` before the `/auth/v1` check, so `..` and `%2e%2e` segments cannot reach PostgREST; hop-by-hop headers are dropped both ways.
- `start_mobile_tunnel` reads the anon key with `$$(sed ...)` at run time, not `$(shell ...)`: make expands the whole recipe before `supabase-up` writes `backend/.env.supabase.local`.
- `openapi-coverage.test.ts` only walks `routes.ts`, so it needed no change.
- Smoke-checked against the running local stack: health 200, wrong password 400 from GoTrue, `/rest/v1` 404.

## Plan Change Log

## Review Triage Log

Pass 1 (quick lens): high 0, medium 3, low 2, false 0, maybe-false 0.

| # | Finding | Verdict | Route | Evidence / action |
|---|---------|---------|-------|-------------------|
| 1 | `make/build-apk.mk:42,254` call `start_backend_tunnel` without `supabase-up` | medium | patch | Confirmed in build-apk.mk; local default now needs `.env.supabase.local` and diverges from the APK's hosted keys. Forced hosted mode on both targets. |
| 2 | `display_supabase_tunnel_url` reads the invocation's mode, not the container's | low | patch | Macro tests `$(SUPABASE_MODE)`; switched to `container_supabase_mode`. |
| 3 | Proxy mounted in hosted tunnel mode too | medium | patch | `TUNNEL_MODE=true` passed in both modes; gated on a new `SUPABASE_MODE=local` env passed to the tunnel backend. |
| 4 | Upstream abort after headers / hung upstream leaves the client hanging | medium | patch | No `aborted`/`error` listener on `proxyRes`, no timeout; added both. |
| 5 | `doc/TUNNEL_MODE.md:333` says both containers read the env file | low | patch | Mobile only gets `SUPABASE_MODE`/`SUPABASE_ANON_KEY`; sentence fixed. |

## Design Notes

ngrok's interstitial page only targets browsers; okhttp requests from the app are not affected, and the script's own checks send `ngrok-skip-browser-warning`. Restricting the proxy to `/auth/v1` keeps the public tunnel from exposing PostgREST or Studio of the local stack; the app uses Supabase only for auth (`mobile/src/store/authStore.ts`).

## Verification

**Commands:**
- `cd backend && npm test && npm run type-check && npm run lint` -- expected: all green.
- `sh -n mobile/scripts/start-expo-tunnel.sh && make -n dev-tunnel` -- expected: no syntax error, local-mode flags and `supabase-up` in the dry run, no refusal.
- `make test` -- expected: green.

**Manual checks (if no CLI):**
- On-device run of the second AC: listed in the PR for the user's final test on a `main` build.
