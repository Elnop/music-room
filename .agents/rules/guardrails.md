# Guardrails

Read before changing a guardrail, an exception list, or when `npm run check` fails. Pattern rules (semgrep, ast-grep) and the secret scan are explained here; layer and import rules in [architecture.md](architecture.md), file rules in [structure.md](structure.md), logs in [logging.md](logging.md).

## what-check-runs

`npm run check` in `backend/` or `mobile/` runs every check in parallel (`tools/guardrails/run-checks.mjs`) and prints `<check> OK`, or `FAILED` with the first 20 lines of the failure. Run one check alone with `npm run check:<name>` (`type-check` and `test` are the usual scripts).

| Check | Tool | Config | What fails |
| --- | --- | --- | --- |
| type-check | tsc | `tsconfig.json` | a type error |
| lint | ESLint (`eslint . --quiet`) | `eslint.config.*`, `eslint-suppressions.json` | an ESLint error (warnings do not fail) |
| dead-code | knip | `knip.json` | an unused file, export, type or dependency |
| deps | dependency-cruiser | `.dependency-cruiser.cjs`, `.dependency-cruiser-known-violations.json` | a layer violation, a cross-feature import or a cycle ([architecture.md](architecture.md)) |
| duplication | jscpd | `.jscpd.json` | a clone of 5 lines and 50 tokens or more in `src/` (tests excluded) |
| semgrep | semgrep (Docker) | `tools/semgrep/rules.yml` | a pattern rule below |
| ast-grep | ast-grep | `sgconfig.yml`, `ast-grep/rules/` | a pattern rule below |
| secrets | gitleaks (Docker) | `.gitleaks.toml` | a secret in a file git would commit ([no-secrets](#no-secrets)) |
| test | Vitest / jest-expo | | a failing unit test |
| exceptions | `tools/guardrails/check-exceptions.mjs` | | an exception list that grew ([exception-lists](#exception-lists)) |

Every tool is a devDependency installed by `make install`, except semgrep and gitleaks, which run from Docker images pinned by digest in `tools/guardrails/docker-scan.mjs`: Docker must be running (it already is for `make dev-docker`). The CI job `check` runs the same command for both projects on every PR to `develop`.

## exception-lists

The rules block from day one; the violations that existed when a rule arrived are recorded in versioned exception lists, so `check` stays green while later stories clean them:

| Tool | Exception list | Entry |
| --- | --- | --- |
| ESLint | `<project>/eslint-suppressions.json` (native bulk suppressions) | a (file, rule) pair, with its count |
| dependency-cruiser | `<project>/.dependency-cruiser-known-violations.json` | a violation |
| jscpd | the `ignore` globs of `<project>/.jscpd.json` | a glob (the first globs, tests and generated files, are permanent) |
| semgrep | the `exclude` lists of `tools/semgrep/rules.yml` | a path (storage modules and `api.ts` are permanent) |
| gitleaks | the `[[allowlists]]` of `.gitleaks.toml` | an allowed value or path, public by design |

An exception list only shrinks. `check:exceptions` counts the entries of each list per rule and fails when a count is higher than at the fork point from `origin/develop` or than at `HEAD`. A story that cleans files then shrinks the list:

- ESLint: `npx eslint . --prune-suppressions` (ESLint itself fails while a suppression is no longer needed).
- dependency-cruiser: `npx depcruise <targets of check:deps> --config .dependency-cruiser.cjs --output-type baseline --output-to .dependency-cruiser-known-violations.json`.
- jscpd, semgrep, gitleaks: delete the entries by hand.

Never add an entry to make new code pass: fix the code. A jscpd `ignore` entry hides the whole file, so code copied from an ignored file is not caught; that gap closes as the list empties. Every list must be empty (permanent entries aside) at the end of epic #362.

## pre-commit

`make install` runs `npm install` in `backend/`, whose `prepare` script runs husky: git then uses `.husky/` as its hooks folder. `.husky/pre-commit` runs `npm run check` in each project the staged files touch (`backend/`, `mobile/`, or both for `tools/` and `.gitleaks.toml`). A failing check blocks the commit. Fix the failure; do not bypass the hook with `--no-verify`.

## append-only-rules

- Every rule has a section in `.agents/rules/<topic>.md`, and its error message ends with `See .agents/rules/<topic>.md#<section>`.
- A rule is never disabled, downgraded to a warning, narrowed or given a new exception to let code through. Change the code instead.
- A rule may be added. It lands with its section here and either matches no code or records today's violations in an exception list.
- Changing or removing a rule takes a dedicated ticket explaining why.

## no-eval

semgrep, backend and mobile: no `eval()` and no `new Function()`. They run arbitrary strings as code. Parse data with `JSON.parse` or a Zod schema instead.

## no-async-useeffect

semgrep, mobile: a `useEffect` callback is never `async`. React expects it to return nothing or a cleanup function, not a Promise. Declare an async function inside the effect and call it.

## no-fetch-outside-api-client

semgrep, mobile: `fetch(` appears only in `src/services/api.ts`. The API client adds the `X-Platform`, `X-Device-Model` and `X-App-Version` headers the backend logs (subject IV.6). Call the backend through it.

## no-asyncstorage-outside-storage

semgrep, mobile: `@react-native-async-storage/async-storage` is imported only by storage modules (today `src/services/lastTrackStorage.ts` and `src/services/backendUrl.ts`) and tests. Other code calls a storage module, so keys and formats live in one place. The other files importing it today are listed in the rule's `exclude` and leave it as they migrate.

## no-non-null-assertion-on-env

ast-grep, backend: no `process.env.X!` outside `src/shared/config/env.ts` (tests excepted). `env.ts` validates every variable at startup; read the value from it instead of asserting it exists.

## no-ts-ignore

ast-grep, mobile: no `@ts-ignore` or `@ts-nocheck` comment. Fix the type, or, when the error is expected, use `@ts-expect-error` with a reason; it fails once the error is gone.

## no-secrets

gitleaks (default rules, `.gitleaks.toml`) scans the files git would commit: tracked files and untracked files that are not ignored, so local `.env` files are skipped. On a finding, remove the secret, move it to `backend/.env` or `mobile/.env` with a placeholder in `.env.example`, and rotate it if it was ever pushed. Only a value public by design (such as the Facebook client token in `mobile/app.config.js`) goes in an allowlist of `.gitleaks.toml`, with a comment saying why.
