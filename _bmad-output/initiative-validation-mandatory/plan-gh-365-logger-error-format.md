---
title: "Logger structuré et format d'erreur unique (#365)"
type: 'refactor'
ticket: 'https://github.com/Elnop/music-room/issues/365'
created: '2026-10-21'
status: 'built'
baseline_revision: 'b13ac97d074b0817792a998ee7670b3ce5b7ca4d'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md', '{project-root}/docs/superpowers/specs/2026-10-21-clean-codebase-refactor-design.md', '{project-root}/.agents/rules/logging.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #365, epic #362. Logs go through `console.*` in 88 places in the mobile, and the backend has a logger but about 20 places still answer errors by hand (`res.status(4xx).json(...)`) instead of going through the error handler. Error responses do not all share one shape, and nothing carries a technical reason or a fix hint.

**Approach:** One logger per project, which is the only code allowed to touch `console`. One error type and one error middleware in the backend, which every error response goes through. The format is `{ success: false, error: { message, code, details?, why?, fix? }, meta }`. The mobile `ApiError` reads that format and keeps the HTTP status on every path.

## Boundaries & Constraints

**Always:**
- `message` stays user-facing and safe to show. `why` (technical reason) and `fix` (hint) are always logged, and only included in the response when `NODE_ENV !== 'production'`.
- Keep every status code, `code` value and user message the API sends today; the mobile maps on `code` and `status`.
- Action logs from the mobile headers (`X-Platform`, `X-Device-Model`, `X-App-Version`, subject IV.6) keep every field they log today.
- Remove the `no-console` entries from both `eslint-suppressions.json` files (prune). Only the logger files may use `console`, through an ESLint override that points to `.agents/rules/logging.md`.
- Write `.agents/rules/logging.md` for real: levels, the error format, no raw `console`.

**Never:**
- Change the Socket.io event payloads.
- Add a logging library: the existing backend logger is enough. Turn it into exported functions or a plain object, not a class, as the epic's style requires.
- Move files into the future `shared/` layout of the mobile; that is #377. The mobile logger lives in `src/utils/logger.ts` until then.

</frozen-after-approval>

## Code Map

- `backend/src/shared/utils/logger.ts` -- `class Logger` with an exported instance `logger`. It writes JSON lines to `backend/logs/app.log`, and to the console as readable text in dev and JSON in prod; `debug` only in dev. Keep that behaviour and turn it into a plain object or functions with the same `logger.info/warn/error/debug` call sites.
- `backend/src/shared/config/env.ts` -- 2 `console` calls before the logger exists (failed env validation). Keep them through a narrow ESLint override with a comment, as bedrock allows "before the logger is initialized".
- `backend/src/shared/middleware/error-handler.ts` -- `AppError(statusCode, message, code?, details?)` and `errorHandler`, which already covers Zod (400 `VALIDATION_ERROR`), `AppError`, objects with a `code` (400) and anything else (500 `INTERNAL_ERROR`). Add optional `why` and `fix` to `AppError` (an options object as the 5th parameter, or a small options object, whichever reads better at the call sites), include them in the log, and in the response outside production. Extract the repeated `meta` building.
- Inline error responses to route through `next(new AppError(...))` or a shared helper used by middlewares that cannot call `next` with an error:
  - `features/auth/middleware/rate-limit.middleware.ts` (7), `features/auth/auth.middleware.ts` (4), `features/auth/middleware/account-lockout.middleware.ts` (2), `features/auth/auth.controller.ts:329`, `features/soundcloud/soundcloud.controller.ts`, `server.ts` (404 fallback), `shared/dev/supabase-auth-proxy.ts` (dev proxy: keep its pass-through if it forwards Supabase's own body, and say so in a comment).
  - For each one, keep the status, `code`, message and extra fields such as `retryAfter` (put them in `details`, and check that the mobile does not read them at the top level; adapt `mobile/src/services/api.ts` if it does).
- `backend/src/shared/types/global.types.ts` -- `ApiResponse` error type: add `why?` and `fix?`.
- `mobile/src/services/api.ts` -- `ApiError(message, code, details?, status?)`. `handleResponse` (l.200–235) does not set `status` when a 2xx body has `success: false`. Add `why` and `fix` and pass `response.status` on every throw. Mirror the type in `mobile/src/types/` if the `ApiResponse` type lives there.
- New `mobile/src/utils/logger.ts` -- `logger.debug/info/warn/error(message, context?)`. `debug` and `info` are no-ops when `!__DEV__`; `warn` and `error` always go to the console. Add a unit test.
- Mobile `console.*` call sites: 88, with the most in `store/authStore.ts` (15), `store/socketStore.ts` (7), `screens/playlists/PlaylistSharingScreen.tsx` (7), `services/oauth.ts` (6) and `contexts/PlayerContext.tsx` (5). Replace each one at the level that matches its meaning (`.agents/rules/logging.md`). Tests that spy on `console` move to spying on the logger, or to mocking it.
- Backend tests: `error-handler` tests if present, plus a test per error path (Zod, `AppError` with `why`, unknown error, production hiding `why`/`fix`).

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/shared/utils/logger.ts`, `error-handler.ts`, `global.types.ts` -- logger without a class; `AppError` with `why`/`fix`; one response builder -- single format.
- [x] Backend inline error responses listed above -- go through the error path -- single format.
- [x] `mobile/src/utils/logger.ts` and the 88 call sites -- logger -- no raw console.
- [x] `mobile/src/services/api.ts` -- `ApiError` with `why`/`fix`/`status` on every path -- reads the format.
- [x] `eslint-suppressions.json` (both), ESLint overrides for the logger files, `.agents/rules/logging.md` -- the rule is enforced with no exception.
- [x] Tests for the logger and the error middleware; adapt the existing tests.

**Acceptance Criteria:**
- Given a validation error, a 401 from `authMiddleware`, a 403, a 404 (unknown route), a 429 from the rate limiter and an unexpected exception, when the API answers, then every body has the same `{ success: false, error: { message, code, … }, meta }` shape, with today's status and code.
- Given `NODE_ENV=production`, when an `AppError` with `why` is thrown, then the response has no `why` or `fix`, and the log has both.
- Given the mobile receives any of those errors, when it shows a message, then the text is the same as before.
- Given `npm run check` in both projects, then it is green, and no `no-console` suppression is left.

## Implementation Notes

- Backend: `sendError(req, res, appError)` in `error-handler.ts` logs (`warn` < 500, `error` with stack >= 500) and answers; `errorHandler` maps any error to an `AppError` and calls it. Middlewares that answer themselves (rate-limit handlers, `authMiddleware`, lockout/blacklist, dev proxy 502) use `sendError`; controllers and the 404 fallback go through `next`/`throw`.
- `retryAfter`, `lockedUntil`, `remainingTime` moved from `error.*` to `error.details.*` (the mobile never read them); OpenAPI schema/examples, backend README and int tests updated.
- Unknown 500s carry the exception message as `why` (hidden in production).
- `backend/src/test/perf-*.ts` CLI scripts print via `process.stdout/stderr.write` (report output, not logs).
- Mobile: `ApiError` gets `why`/`fix` (5th ctor arg) and `status` on every throw (2xx failure bodies included, `SESSION_EXPIRED` = 401). `PlayerContext` now checks `status >= 400` for its server-error branch so 2xx parse failures keep their old text.
- Level changes on the mobile: theme load/save, stored backend URL read and "no refresh token" are `warn` (recovered); `MediaSessionBridge` dev-only warn is `debug`.

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd backend && npm run check` -- expected: all OK.
- `cd mobile && npm run check` -- expected: all OK.
- `grep -rn "console\." backend/src mobile/src --include='*.ts' --include='*.tsx' | grep -v test` -- expected: only the two logger files and the `env.ts` bootstrap.
- `grep -c no-console backend/eslint-suppressions.json mobile/eslint-suppressions.json` -- expected: 0.

**Manual checks:**
- In Swagger UI: an invalid body, a call without a token and an unknown route each return the shared shape.

### Pass 1 (quick) — high 0 / medium 1 / low 3 / false 0 / maybe-false 0

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| `why` is exposed whenever `NODE_ENV !== 'production'`: unknown 500s now leak raw exception messages, IPs and paths if `NODE_ENV` is unset | medium | patch | `env.ts` defaults to `development`, and no Dockerfile or make target sets `production`. Fix: expose only in `development`/`test` (fail closed). This tightens the intent's wording without contradicting its purpose. |
| `String(err.code)` changes the codes sent for coded errors (`undefined` becomes `"undefined"`, numbers become strings) | low | patch | Breaks "keep every code"; direct fix. |
| `ErrorBoundary.test` now prints React's own `console.error` | low | patch | Noise every developer sees; mute React's log in that test only. |
| `backend/eslint.config.js` fully re-indented | low | patch | Hides a 13-line change; revert the whitespace. |
