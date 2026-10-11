---
title: 'Local Supabase stack for development (SUPABASE_MODE=local by default)'
type: 'feature'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: 'afa39d3f8fe9325d4c20e8cd9704b9d386444aac'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/doc/TESTING.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Dev depends on the hosted Supabase project (it was paused on 2026-10-06 and everything failed), and everyone shares its data. The only local stack, `music-room-test`, is wiped by every `make test-int`.

**Approach:** Add a second local stack that keeps its data: `music-room-dev`, ports 544xx, with its own CLI workdir. It is driven by `make supabase-up/down/reset`, which apply only the files in `backend/migrations` not yet applied. `SUPABASE_MODE=local|hosted` (default `local`) points `dev-docker`, `dev-local` and `generate-types` at it.

**Decision (2026-10-10, human):** Local is the default; `SUPABASE_MODE=hosted` opts out. A fresh clone must reach a working `make dev-docker` in local mode without hosted keys (`make install` copies `backend/.env.example`).

**Decision (2026-10-10, human):** Tunnel support for the local stack moves to a follow-up ticket (see Deferred). Until then, `make dev-tunnel` with `SUPABASE_MODE=local` stops with a message: use `SUPABASE_MODE=hosted make dev-tunnel`.

**Decision (2026-10-10, human):** The dev stack's `config.toml` sets up `[auth.external.google]` and `[auth.external.facebook]`, with secrets read from env (`backend/.env`). The docs say today's backend flow does not use them.

**Decision (2026-10-10, human):** These go to a follow-up ticket, except what the local-by-default path strictly needs: demo data, `migrate-create` naming, `setup`/`check-setup`, `set-backend-url`, and `down`/`clean-docker`.

**Decision (2026-10-10, human):** The e-mail check (that no mail goes out through Supabase Auth) is a read-only step during implementation. Anything found goes to a new ticket.

## Boundaries & Constraints

**Always:** The dev stack has its own `project_id` (`SUPABASE_PROJECT_ID=music-room-dev` exported, as `test-db.sh` does), its own `config.toml` and port range (544xx), and runs only Postgres, PostgREST, Auth and Kong (the same `-x` list as `test-db.sh`). `supabase-down` keeps the data. `SUPABASE_MODE=hosted` behaves exactly as today. Local keys live only in generated, git-ignored files.

**Never:** Touch `backend/supabase/config.toml`, the behaviour of `test-db.sh`, or the `music-room-test` containers and volumes. No `db reset` in `supabase-up`. No hand edit of `supabase.generated.ts`. No change to `start-with-tunnel.sh` or `start-expo-tunnel.sh`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Fresh clone | `.env` = `.env.example` | `make dev-docker` starts the stack, the backend boots, sign-up works | Docker or CLI missing → clear message |
| Re-up | data + 1 new migration | only the new file runs | names the failing file, exit 1 |
| Reset | data present | empty DB, every migration re-applied | — |
| Test run | dev stack holds data | `make test-int` passes, dev rows intact | — |
| Hosted | `SUPABASE_MODE=hosted` | no stack started, values from `backend/.env` | — |
| Bad mode | `SUPABASE_MODE=foo` | make stops before starting anything | lists `local|hosted` |
| Tunnel, local | `make dev-tunnel` (default mode) | nothing starts | tells the user to rerun with `SUPABASE_MODE=hosted` |

</frozen-after-approval>

## Code Map

- `backend/scripts/test-db.sh` -- reference for the project-id pinning, the excluded services, the psql apply loop and the `supabase status -o env` parsing
- `backend/supabase/config.toml` -- test config (554xx); copy it as the starting point
- `make/config.mk` -- `HOST_IP`, `MOBILE_DEV_ENV`; `make/supabase.mk` -- `generate-types`
- `make/helpers/docker.mk` -- `write_mobile_dev_env`, `start_backend` (`--env-file backend/.env`), `start_mobile`, `docker_up_build`
- `make/local.mk` -- `dev-local` (backend on the host; dotenv does not override variables already set, see `backend/src/shared/config/env.ts`)
- `make/tunnel.mk` -- `dev-tunnel` (gets the mode check)
- `mobile/src/lib/supabase.ts`, `mobile/src/store/authStore.ts` -- the app calls Supabase directly, so it needs `EXPO_PUBLIC_SUPABASE_*`
- `backend/src/features/auth/services/oauth.service.ts` -- the backend verifies Google/Facebook tokens itself and creates users through `auth.admin`
- `make/install.mk` -- the message after copying `.env` asks for hosted credentials

## Tasks & Acceptance

**Execution:**
- [x] `backend/supabase-dev/supabase/config.toml` -- copy of the test config with `project_id = "music-room-dev"`, ports 554xx moved to 544xx, and seeding off. Add `[auth.external.google]` and `[auth.external.facebook]` with `env(GOOGLE_CLIENT_ID)`, `env(FACEBOOK_APP_ID)` and `env(FACEBOOK_APP_SECRET)`. Rationale: the CLI wants `<workdir>/supabase/config.toml`, so a separate workdir keeps the two stacks apart
- [x] `backend/scripts/dev-db.sh` -- commands `up|down|reset`. Every CLI call passes `--workdir supabase-dev`, and `backend/.env` is sourced first so the `env()` values resolve. `up`: start the stack, create `zumik_dev.applied_migrations` (outside `public`), apply each unrecorded file in one transaction with its insert, reload PostgREST, then write `backend/.env.supabase.local` (`SUPABASE_URL=http://$HOST_IP:54421` plus the anon and service keys). `down`: `supabase stop`. `reset`: `db reset --local --no-seed`, then the same apply step. `test-db.sh` is not changed
- [x] `make/config.mk` -- `SUPABASE_MODE ?= local`, and reject any other value
- [x] `make/supabase.mk` -- `supabase-up/down/reset`. `generate-types` follows the mode; in local mode it runs `gen types typescript --local --workdir supabase-dev` and skips the login and project-id checks
- [x] `make/helpers/docker.mk` -- in local mode: `docker_up_build` runs `supabase-up` first; `start_backend` gets a second `--env-file backend/.env.supabase.local` (the later file wins); `write_mobile_dev_env` adds `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [x] `make/local.mk` -- in local mode `dev-local` runs `supabase-up`, then exports the local file's `SUPABASE_*` (`localhost:54421`) before `npm run dev`
- [x] `make/tunnel.mk` -- the `dev-tunnel` mode check described in the decision
- [x] `make/install.mk` -- change the message: hosted credentials are needed only with `SUPABASE_MODE=hosted`
- [x] `make/help.mk`, `backend/README.md` -- document the new targets, the mode, the tunnel limit for now, and the note that the OAuth blocks are unused
- [ ] Read-only: confirm no auth flow makes Supabase Auth send a mail (`generateLink` in `user.service.ts` returns a link and sends nothing; `mail.service.ts` sends). Record the result in Implementation Notes

**Acceptance Criteria:**
- Given a fresh clone after `make install`, when `make dev-docker` runs with `*.supabase.co` blocked, then sign-up, login and playlist creation work in the app, and the playlist survives `make containers-restart`.
- Given rows in the dev stack, when `make supabase-down && make supabase-up` runs, then the rows remain and no migration is applied.
- Given rows in the dev stack, when `make test-int` runs, then it passes and the rows are unchanged.
- Given `SUPABASE_MODE=hosted`, when `make dev-docker` or `make dev-tunnel` runs, then no `music-room-dev` container starts and the backend uses the values in `backend/.env`.
- Given the dev stack is up, when `make generate-types` runs, then `supabase.generated.ts` shows no diff, or the drift is reported.

## Implementation Notes

- **E-mail check (read-only):** no auth flow makes Supabase Auth send a mail. The backend calls only admin endpoints: `auth.admin.createUser` (register and OAuth sign-up), `auth.admin.generateLink({ type: 'magiclink' })` in `user.service.ts` and `auth.controller.ts`, which returns the hashed token that is then exchanged through `verifyOtp` and sends nothing, and `auth.admin.updateUserById` (password reset). The `password_changed` notification stays disabled in both configs. The mobile app calls only `signInWithPassword`, `setSession`, `signOut` and `onAuthStateChange`. Mail goes out only through `mail.service.ts` (Gmail SMTP). Also, the dev stack runs without mailpit and has no SMTP set up.
- **Finding, outside this plan (needs a ticket):** on a fresh clone (`.env` = `.env.example`), `POST /api/auth/register` answers 500 `REGISTRATION_ERROR`. The Supabase user and the verification code are created, then the Gmail send fails on the placeholder `GMAIL_*` credentials (`EAUTH 535`). `EMAIL_VERIFICATION_ENABLED` is validated in `env.ts` but no code reads it, so verification cannot be switched off. Login then gives 403 `EMAIL_NOT_VERIFIED`. Supabase itself works offline; to test it I confirmed the user by hand (`auth.users.email_confirmed_at`).
- **Finding: type drift.** `make generate-types` in local mode reports drift against the committed `supabase.generated.ts`. Hosted-only columns `user_profiles.email_verification_token` and `email_verification_expires_at` appear in no migration and no code. `__InternalSupabase.PostgrestVersion` is emitted only for a hosted project. Two generator differences: `Args: never` vs `Record<PropertyKey, never>`, and line wrapping. The generated file was restored and not committed.
- `dev-db.sh` does not source the whole of `backend/.env`. It reads only `GOOGLE_CLIENT_ID`, `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET`, the three values the `env()` calls in `config.toml` need, so a `.env` value that is not valid shell (or that contains `$(...)`) cannot break or run inside the script. `[auth.external.google]` has `secret = ""`: `backend/.env` has no Google secret, and the CLI accepts an empty secret, as well as empty values when `.env` is missing.
- `reset` runs `supabase start` before `db reset` (`db reset` needs a running stack).
- Local `generate-types` depends on `supabase-up`, so the types reflect `backend/migrations`. It writes to a temporary file, so a failure never truncates the committed file. It runs Prettier, so the diff shows only real drift, and it prints `git diff --stat` when the file changed.
- `start_backend`/`start_mobile` add a label, `zumik.supabase=<mode>`. A running container started in the other mode (or before this change, with no label) is recreated instead of being reported as "already running" with the wrong Supabase.
- `write_mobile_dev_env` warns (and writes no Supabase lines) when `backend/.env.supabase.local` is missing, for `expo-android`/`expo-clear` run before any `supabase-up`.

## Plan Change Log

## Review Triage Log

Thorough-style review (one lens, deep), 10 findings: 8 patched, 2 already ticketed.

- medium, patched: the backend container's `SUPABASE_URL` used the LAN IP captured at creation, stale after a network change; the container now uses `http://host.docker.internal:54421` with `--add-host=host.docker.internal:host-gateway` (checked from a container on another bridge network).
- medium, patched: `backend-docker` / `docker_up_service backend` added the local env file without `supabase-up`; they now start the stack first in local mode.
- medium, patched: `backend-local` and `perf-fixtures` ignored `SUPABASE_MODE` (fixtures in the hosted project while the backend used the local stack, breaking #106); shared `SUPABASE_UP_IF_LOCAL` / `LOCAL_SUPABASE_ENV` in config.mk, used by dev-local, backend-local and perf-fixtures.
- medium, patched: the dev stack listens on all interfaces with well-known credentials; documented in backend/README.md (local dev data only).
- low, patched: `expo-android` / `expo-clear` now run `supabase-up` in local mode; the types `.tmp` file is git-ignored; `supabase start` output is shown; mobile/README.md describes the local `EXPO_PUBLIC_SUPABASE_*` override.
- deferred (ticketed): AGENTS.md still says migrations are only applied by hand (agent-context file; comment on #252). Type drift between migrations and `supabase.generated.ts`: #254.

Re-verified: `make -n` of dev-docker, dev-local, backend-local, perf-fixtures, generate-types in both modes (local shows the stack steps, hosted none); `make test-int` 30 files, 219 tests; backend type-check and lint clean. Also found during implementation: register returns 500 without Gmail credentials (#253).

## Design Notes

OAuth in local mode does not go through GoTrue: `oauth.service.ts` checks the Google and Facebook tokens itself and creates users through `auth.admin`. It works as long as `GOOGLE_CLIENT_ID` and `FACEBOOK_*` are set, and it still needs a development build. The `[auth.external.*]` blocks are there because the human asked for them.

## Verification

**Commands:**
- `make supabase-up && make supabase-down && make supabase-up` -- expected: the second up applies 0 migrations
- `make test-int` -- expected: passes, and `docker exec supabase_db_music-room-dev psql -U postgres -c 'select count(*) from auth.users'` gives the same count before and after
- `make generate-types && git diff --stat backend/src/shared/types/` -- expected: empty
- `sh -n backend/scripts/dev-db.sh`; `make -n dev-docker dev-local` -- expected: no errors
- `cd backend && npm run lint && npm run type-check && npm test`, then the same in `mobile/` -- expected: green

**Manual checks:**
- Emulator with `make dev-docker` in the default mode and `*.supabase.co` blocked: sign up, log in, create a playlist, restart, and the playlist is still listed.

## Deferred

For follow-up issues:
- **`make dev-tunnel` with the local stack** (separate ticket). In local mode, `backend/scripts/start-with-tunnel.sh` runs one ngrok agent, because the free plan allows one agent session. A generated v3 config with `ngrok start --all` opens two endpoints: `backend` on port 3000 and `supabase` on `$HOST_IP:54421`. The script reads each URL by endpoint name and writes the Supabase one to `/tmp/shared/supabase-tunnel-url.txt`, removing an old copy at start. `mobile/scripts/start-expo-tunnel.sh` (given `SUPABASE_MODE` and the anon key) waits for a live `<url>/auth/v1/health` with the `apikey` header, then writes `EXPO_PUBLIC_SUPABASE_URL=<ngrok URL>` and the anon key to `.env.development.local`. `display_tunnel_urls`/`qr-tunnel` print the URL, and the `dev-tunnel` mode check is removed. Check on a real phone that ngrok's browser warning page does not block the app's okhttp requests; if it does, add the `ngrok-skip-browser-warning` header. The Expo tunnel is untouched.
- Demo data (users, friends, playlists) loaded by `supabase-reset`.
- `migrate-create`: use the next `NNN_` prefix instead of a timestamp.
- `setup`/`check-setup`: show the active mode and the stack state; stop requiring hosted keys in local mode.
- `set-backend-url`: write to `mobile/.env.development.local`, or remove the target.
- `down`/`clean-docker`: also stop the dev stack (`clean` drops its data).
- Moving existing hosted data into the dev stack: not planned; each developer starts empty.
