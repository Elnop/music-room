# Logging rules

Read before logging anything. Every rule here is checked by `npm run check`; the error message links to its section. Rules are append-only: see [guardrails.md](guardrails.md#append-only-rules).

The structured logger (levels `error`, `warn`, `info`, `debug`) arrives with #365, which completes this file.

## no-console

No direct `console.*` call, in backend or mobile (ESLint `no-restricted-globals` on `console`; the core `no-console` rule cannot point to this section). Logs go through the project logger once #365 adds it; until then, a new log is not added. Existing calls are recorded in `eslint-suppressions.json` and disappear as #365 replaces them.
