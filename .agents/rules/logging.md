# Logging rules

Read before logging anything or answering an error. Every rule here is checked by `npm run check`; the error message links to its section. Rules are append-only: see [guardrails.md](guardrails.md#append-only-rules).

## no-console

No direct `console.*` call, in backend or mobile (ESLint `no-restricted-globals` on `console`; the core `no-console` rule cannot point to this section). Log through the project logger:

- Backend: `logger` from `@/shared/utils/logger.js`.
- Mobile: `logger` from `@/utils/logger`.

Only the logger files (and their tests) may touch `console`, through an ESLint override in `eslint.config.*`. The other override is `backend/src/shared/config/env.ts`, which reports a failed environment validation before the logger can exist (the logger reads `env`). A command-line script that prints a report (`backend/src/test/perf-*.ts`) writes to `process.stdout`/`process.stderr`: that output is the result of the script, not a log. In tests, spy on or mock the logger, never `console`. The one exception is `mobile/src/components/common/ErrorBoundary.test.tsx`, which mutes `console.error` in its throwing test to silence React's own log of the caught error (not app logging) and restores it after.

## levels

Every logger has the same four levels; pick the one that matches what happened, not how loud you want it:

| Level | When | Example |
| --- | --- | --- |
| `error` | An operation failed and nothing recovers it: the user sees a failure or data is lost. Every 5xx. | a playlist save failed, an unexpected exception |
| `warn` | Something went wrong but the code recovered or the request was refused as expected: fallback, retry, 4xx. | a stored setting unreadable so the default is used, a rate limit hit, a rejected token |
| `info` | A normal event worth finding later: startup, a user action, a state change. | server started, a request handled (action log, subject IV.6) |
| `debug` | Detail for a developer reproducing a problem. | a best-effort native call that failed |

Where each level goes:

- Backend: every level is a JSON line in `backend/logs/app.log`; the console gets readable text in development and the same JSON line elsewhere (Docker logs). `debug` is written in development only.
- Mobile: `debug` and `info` print in development builds only (`__DEV__`); `warn` and `error` always reach the console (logcat in release).

Write the message as `[Area] What happened`, and put the data in the second argument (`logger.error('[queueStore] Load failed:', error)`), never concatenated into the message. Never log a password, a token or a full request body.

## error-format

Every error response of the API has one shape, built in `backend/src/shared/middleware/error-handler.ts`:

```json
{
  "success": false,
  "error": { "message": "…", "code": "…", "details": "…", "why": "…", "fix": "…" },
  "meta": { "timestamp": "…" }
}
```

- `message`: for the user, safe to show. `code`: stable, the mobile maps on it (with the HTTP status). `details`: optional data (Zod issues, `retryAfter`, `lockedUntil`…).
- `why` (technical reason) and `fix` (hint) are for developers: always logged, and sent only when `NODE_ENV` is `development` or `test` (fail closed: production or any other value hides them).

To answer an error, throw or `next()` an `AppError(status, message, code, details?, { why?, fix? })`; `errorHandler` turns it, a `ZodError` or any other exception (500 `INTERNAL_ERROR`) into that shape and logs it (`warn` below 500, `error` with the stack from 500). A middleware that answers by itself (a rate-limiter handler, `authMiddleware`) calls `sendError(req, res, appError)`, which logs and answers the same way. Never write `res.status(4xx).json(...)` by hand.

On the mobile, `ApiError` (`src/services/api.ts`) reads that format: `message`, `code`, `details`, `why`, `fix`, and the HTTP `status` on every path. Show the user `apiErrorMessage(error, fallback)` (`src/utils/apiErrorMessage.ts`), never `why` or `fix`.
