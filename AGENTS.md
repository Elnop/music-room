<!-- bmad:context -->
<!-- Verified 2026-10-05 against ca434a8. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## music-room (Zumik)

42 project "Music Room": Express/TypeScript API on Supabase, Redis and Socket.io in `backend/`, Expo React Native app in `mobile/`. Requirements come from `doc/en.subject.pdf` (v5.3), which overrides every other document. BMAD planning lives in `_bmad-output/`; epics, stories and bugs are GitHub Issues. Architecture notes for humans: `backend/README.md`, `mobile/README.md`.

## Policy

- `main` is the deploy branch: never commit, push or open a PR to `main`. Branch from `develop`.
- One branch per GitHub issue, named `<issue-number>-<slug>`, PR into `develop`. Commits follow Conventional Commits.
- Before starting an issue, assign yourself on it; never work an issue assigned to someone else. Keep its state current: label `in-progress` when work starts, `review` when the PR is open (with `Closes #<n>` in the PR), closed when merged into `develop`; move the card on the "Music Room – Validation" board to match (`In Progress`, `Review`, `Done`) and set its `Area` field.
- Never implement Music Track Vote (IV.2.1); the project delivers Playlist Editor and Music Control Delegation.
- Never commit credentials or API keys; they go in `backend/.env` and `mobile/.env`, with placeholders in `.env.example`.
- Never commit installed dependencies; everything installs from manifests via `make install`. `backend/` and `mobile/` lockfiles are committed: change dependencies with `npm install <pkg>` and commit the lockfile with it.
- An SDK must not do the core work the subject asks for; implement it in project code.
- Never hand-edit `backend/src/shared/types/supabase.generated.ts`; run `make generate-types`.

## Where things are

- API routers are mounted in `backend/src/shared/config/routes.ts`; each feature documents its endpoints in `features/<name>/<name>.openapi.ts` (Swagger UI: http://localhost:3000/api-docs). A new endpoint without its OpenAPI entry is unfinished.
- Socket.io events: server in `backend/src/realtime/index.ts`, client in `mobile/src/store/socketStore.ts` and `mobile/src/hooks/`. Read event names there; never assume them.
- Migrations: `backend/migrations/NNN_*.sql`, created with `cd backend && make migrate-create name=<name>`. They are applied by hand in the Supabase dashboard; no command runs them.
- Email sending: `backend/src/features/mail/mail.service.ts`.

## Running and verifying

- The root `make` is the entry point: `make dev-docker` by default, `make dev-local` for the Android Studio emulator, `make dev-tunnel` when the phone is on another network.
- `make test` runs the backend (Vitest) and mobile (jest-expo) unit tests and exits non-zero on any failure; `npm test` runs one side. Strategy, mocks and single-test commands are in `doc/TESTING.md`. Also verify with `npm run type-check` and `npm run lint` in both `backend/` and `mobile/`, plus a call through Swagger UI for endpoints. The CI (`.github/workflows/ci.yml`) runs lint, type-check, `npm test` and the integration tests on every PR to `develop`; keep it green.
- Node 22 everywhere: `.nvmrc`, `backend/Dockerfile`, `mobile/Dockerfile`, `mobile/Dockerfile.android-build` and the CI. Change them together, with a ticket.
- Google and Facebook sign-in need a development build; they fail in Expo Go.

## Conventions that differ from defaults

- Never add a barrel `index.ts` that re-exports, in backend or mobile; import the source file. `mobile/src/types/index.ts` is an existing barrel slated for removal.
- Backend imports go through `@/features/...` or `@/shared/...`, always with a `.js` extension.
- Backend: protect routes with `authMiddleware` from `@/features/auth/auth.middleware.js`; rate-limit sensitive routes with `features/auth/middleware/rate-limit.middleware.ts` (Redis-backed, no in-memory fallback).
- Backend feature layout: `features/<name>/` holds `<name>.types.ts`, `<name>.validators.ts` (Zod), `<name>.controller.ts`, `<name>.routes.ts`, `<name>.openapi.ts`, logic in `services/`, authorization in `permissions/`, helpers in `utils/`. Keep a service under ~150 lines; split it rather than grow it.
- Validate every request input with a Zod schema; no `any`.
- `tracks.track_uri` stores the SoundCloud permalink URL. Stream URLs are fetched on demand and expire after 30 minutes; never persist them.
- A change to a backend response shape must be mirrored in `mobile/src/types/`.
- Mobile HTTP calls go through `mobile/src/services/api.ts`, which sends `X-Platform`, `X-Device-Model` and `X-App-Version`; the backend logs them (subject IV.6), so never call `fetch` around it.
- CORS origins come from `ALLOWED_ORIGINS` in `backend/.env`; add a client's origin there instead of loosening CORS in code.

<!-- /bmad:context -->
