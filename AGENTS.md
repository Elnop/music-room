## music-room (Zumik)

42 project "Music Room": Express/TypeScript API on Supabase, Redis and Socket.io in `backend/`, Expo React Native app in `mobile/`. Requirements come from `doc/subject/en.subject.pdf` (v5.3), which overrides every other document. Epics, stories and bugs are GitHub Issues. Human documentation: `doc/README.md` (index), `backend/README.md`, `mobile/README.md`.

## Policy

- `main` is the deploy branch: never commit, push or open a PR to `main`. Branch from `develop`.
- One branch per GitHub issue, named `<issue-number>-<slug>`, PR into `develop`. Commits follow Conventional Commits.
- Before starting an issue, assign yourself on it; never work an issue assigned to someone else. When work starts, label it `in-progress` and move its card on the "Music Room – Validation" board to `In Progress` (set its `Area` field). The rest is automatic once the PR body carries `Closes #<n>` (`.github/workflows/issue-status.yml` parses it, since GitHub links issues only for PRs into `main`): opening it switches the label to `review` and, when the `PROJECT_TOKEN` secret is set, the card to `Review`; merging into `develop` closes the issue, drops the label and moves the card to `Done`.
- The repository's default branch is `main`: always pass `--base develop` to `gh pr create`.
- Never implement Music Track Vote (IV.2.1); the project delivers Playlist Editor and Music Control Delegation.
- Never commit credentials or API keys; they go in `backend/.env` and `mobile/.env`, with placeholders in `.env.example`.
- Never commit installed dependencies; everything installs from manifests via `make install`. `backend/` and `mobile/` lockfiles are committed: change dependencies with `npm install <pkg>` and commit the lockfile with it. Write lockfiles with npm 10 (the CI's, bundled with Node 22): a lockfile from npm 11 makes `npm ci` fail there; run `npx -y npm@10 install --package-lock-only` after the change.
- An SDK must not do the core work the subject asks for; implement it in project code.
- Never hand-edit `backend/src/shared/types/supabase.generated.ts`; run `make generate-types`.

## Where things are

- API routers are mounted in `backend/src/app/routes.ts` and the OpenAPI document is assembled in `backend/src/app/openapi.ts` (`src/app/` is the composition root: only `server.ts` imports it, and `shared/` never imports a feature); each feature documents its endpoints in `features/<name>/<name>.openapi.ts` (Swagger UI: http://localhost:3000/api-docs), which registers its routes with `@asteasolutions/zod-to-openapi`: request and response schemas are Zod schemas from `<name>*.validators.ts` (e.g. `playlist.validators.ts`, `playlist-responses.validators.ts`), never hand-written OpenAPI. A new endpoint without its OpenAPI entry is unfinished.
- Socket.io events: server in `backend/src/realtime/` (`socket-server.ts` bootstrap, one handler per domain in `handlers/`, what features emit in `emitters/`), client in `mobile/src/shared/stores/socketStore.ts`, `mobile/src/hooks/` and the features' `hooks/` and `utils/*SocketRules.ts` (a query is kept in sync through `mobile/src/shared/query/socketCache.ts`). Read event names there; never assume them.
- Migrations: `backend/migrations/NNN_*.sql`, created with `cd backend && make migrate-create name=<name>`. `make supabase-up` applies the new ones to the local dev stack (default `SUPABASE_MODE=local`); on the hosted project they are applied by hand in the Supabase dashboard.
- Email sending: `backend/src/features/mail/services/mail.service.ts` (templates in `mail/utils/mail-templates.ts`). In local mode emails go to the dev stack's Mailpit (http://localhost:54424), not Gmail.

## Running and verifying

- The root `make` is the entry point: `make dev-docker` by default, `make dev-local` for the Android Studio emulator, `make dev-tunnel` when the phone is on another network.
- `npm run check` in `backend/` or `mobile/` runs every guardrail in parallel (type-check, lint, knip, dependency-cruiser, jscpd, semgrep, ast-grep, gitleaks, tests, exception lists) and must pass before a commit: the husky pre-commit hook runs it on the touched projects, and the CI job `check` on every PR. semgrep and gitleaks run from Docker images, so Docker must be running. Details in `.agents/rules/guardrails.md`.
- `make test` runs the backend (Vitest) and mobile (jest-expo) unit tests and exits non-zero on any failure; `npm test` runs one side. Strategy, mocks and single-test commands are in `doc/development/testing.md`. Also verify with `npm run type-check` and `npm run lint` in both `backend/` and `mobile/`, plus a call through Swagger UI for endpoints. The CI (`.github/workflows/ci.yml`) runs lint, type-check, `npm test` and the integration tests on every PR to `develop`; keep it green.
- Node 22 everywhere: `.nvmrc`, `backend/Dockerfile`, `mobile/Dockerfile`, `mobile/Dockerfile.android-build` and the CI. Change them together, with a ticket.
- The app runs only as a native debug build (`cd mobile && npx expo run:android`), never in Expo Go: it crashes there for lack of its native modules (Google/Facebook sign-in, image colors).

## Rules

Each rule `check` enforces has a section in `.agents/rules/`, and its error message links to it. Read the file before the matching work:

| When | Read |
| --- | --- |
| Adding an import across folders, a feature, or a module in `shared/` | `.agents/rules/architecture.md` |
| Creating a file or a folder | `.agents/rules/structure.md` |
| Logging anything | `.agents/rules/logging.md` |
| Writing or editing a comment | `.agents/rules/comments.md` |
| Mobile: fetching server data, or adding or reading a Zustand store | `.agents/rules/state.md` |
| Authoring or editing mobile components, orchestrators, presenters, or hooks | `.agents/rules/components.md` |
| `npm run check` fails, or touching a guardrail or an exception list | `.agents/rules/guardrails.md` |

Rules are append-only: never disable, weaken or switch a rule to `warn`, and never add an entry to an exception list (`eslint-suppressions.json`, `.dependency-cruiser-known-violations.json`, `.jscpd.json` `ignore`, semgrep `exclude`, `.gitleaks.toml` allowlists) to let code through; fix the code. Exception lists only shrink (`check:exceptions` compares them with `develop`). A new rule lands with its `.agents/rules` section.

## Conventions that differ from defaults

- Never add a file named `index.ts` under `src/`, in backend or mobile (no barrels); import the source file. Imports leaving the current folder use `@/`, never `../` (mobile: no other alias either). No direct `console.*`.
- Backend imports go through `@/features/...`, `@/shared/...` or `@/realtime/...` (Socket.io server), always with a `.js` extension.
- Backend: protect routes with `authMiddleware` from `@/features/auth/auth.middleware.js`; rate-limit sensitive routes with `shared/security/http-rate-limit.ts`; every anti-abuse limiter lives in `shared/security/` and reaches Redis only through `shared/security/counter.ts` (no in-memory fallback).
- Backend feature layout: `features/<name>/` holds `<name>.types.ts`, `<name>.validators.ts` (Zod), `<name>.controller.ts`, `<name>.routes.ts`, `<name>.openapi.ts`, logic in `services/`, authorization in `permissions/`, helpers in `utils/`. Services are function modules imported as namespaces, handlers have no `try/catch`, files stay under 150 lines: see `.agents/rules/structure.md#backend-feature` (reference: `features/auth/`).
- Validate every request input with a Zod schema; no `any`.
- `tracks.track_uri` stores the SoundCloud permalink URL. Stream URLs are fetched on demand and expire after 30 minutes; never persist them.
- A change to a backend response shape must be mirrored in `mobile/src/types/`, or in the feature's `types.ts` once it has migrated (`mobile/src/features/auth/types.ts`).
- Mobile layout: `src/shared/` (UI primitives in `shared/components/ui/`, API client, query setup, cross-cutting stores, theme), `src/providers/`, `src/navigation/`, and `src/features/<feature>/` (all features migrated #378–#385: one folder per subject, even for a single-subject feature, with `components/orchestrators`, `components/presenters`, `hooks/` and, when needed, `utils/`; React providers in the feature's `context/`); see `.agents/rules/structure.md#placement`. Touchables are `Pressable`/`Button` from `@/shared/components/ui/`, colours come from the theme, and a Zustand hook always takes a selector.
- Mobile HTTP calls go through `mobile/src/shared/services/api.ts`, which sends `X-Platform`, `X-Device-Model` and `X-App-Version`; the backend logs them (subject IV.6), so never call `fetch` around it.
- CORS origins come from `ALLOWED_ORIGINS` in `backend/.env`; add a client's origin there instead of loosening CORS in code.
