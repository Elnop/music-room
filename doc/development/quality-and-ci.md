# Quality and continuous integration

Subject IV.8: an agile process, tests on each layer, and continuous integration. This page explains, for a human, what checks the code and when. The exact rules, with the reason for each, are in `.agents/rules/` (each error message links to its section).

## How work flows

- Epics, stories and bugs are GitHub Issues, on the "Music Room – Validation" board (Todo → In Progress → Review → Done).
- One branch per issue, `<issue-number>-<slug>`, from `develop`; one pull request into `develop`, with `Closes #<n>` in its body. `main` is the deploy branch and only receives releases.
- Commits follow Conventional Commits.

## `npm run check`

One command per project (`backend/`, `mobile/`) runs every guardrail in parallel:

| Check | Tool | Catches |
|---|---|---|
| `type-check` | `tsc --noEmit` | type errors (strict mode, no `any`) |
| `lint` | ESLint 9 + in-house plugins | component roles, `@/` imports, no `console.*`, UI primitives, theme tokens, Zustand selectors… |
| `check:dead-code` | knip | unused files, exports, types and dependencies |
| `check:deps` | dependency-cruiser | layer violations, imports between features, cycles |
| `check:duplication` | jscpd | copied code |
| `check:semgrep`, `check:ast-grep` | semgrep (Docker image), ast-grep | patterns lint misses: `fetch` outside the API client, AsyncStorage outside the storage modules, `eval`, `@ts-ignore`… |
| `check:secrets` | gitleaks (Docker image) | committed keys and tokens |
| `test` | Vitest (backend), jest-expo (mobile) | unit tests |
| `check:exceptions` | `tools/guardrails/check-exceptions.mjs` | an exception list that grew compared with `develop` |

semgrep and gitleaks run from Docker images, so Docker must be running. Details: [guardrails.md](../../.agents/rules/guardrails.md#what-check-runs).

**Rules only get stricter.** No rule is disabled, weakened or switched to a warning to let code through, and the exception lists (`eslint-suppressions.json`, `.dependency-cruiser-known-violations.json`, …) can only shrink: fix the code instead. A new rule comes with its section in `.agents/rules/`.

## When it runs

- **Pre-commit** (husky, `.husky/pre-commit`): `npm run check` in each project the commit touches; a failure blocks the commit.
- **CI** (`.github/workflows/ci.yml`), on every pull request to `develop`:
  - `lint`, `type-check`, `test` and `check` for both projects;
  - `test-int`: the integration tests, on a full VM that starts the local Supabase stack and Redis (`scripts/test-db.sh`). Docker images are cached between runs (#327).
- **Release** (`.github/workflows/release-apk.yml`): on every push to `main`, builds the release APK and publishes a GitHub Release.

## Tests

- **Backend**: Vitest + Supertest. Unit tests mock Supabase, Redis and Socket.io; integration tests (`*.int.test.ts`) run against the local Supabase stack, a real Redis and a real Socket.io server. Concurrency, security protections and real-time access are tested this way.
- **Mobile**: jest-expo and @testing-library/react-native for stores, hooks and components; the ESLint plugin's rules are tested with `node:test`.
- `make test` runs both sides and fails on any failure. Coverage floors were measured before the refactor (#364) and must not drop.

Strategy, mocks and single-test commands: [testing.md](testing.md). Security tests by hand: [security-testing.md](../security/security-testing.md).

## Load tests

`make perf-test` runs Artillery HTTP scenarios and a Socket.io scenario against a running backend and writes a summary; see [tests/performance/README.md](../../tests/performance/README.md). The reference machine and the capacity report (subject IV.7) are tracked in #103 and #106.
