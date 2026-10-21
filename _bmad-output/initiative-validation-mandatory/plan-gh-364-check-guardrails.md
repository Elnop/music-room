---
title: 'Commande check et garde-fous bloquants, backend et mobile (#364)'
type: 'chore'
ticket: 'https://github.com/Elnop/music-room/issues/364'
created: '2026-10-21'
status: 'built'
baseline_revision: '220497818f0ccf3eb665ff7cdb6bfde410ede415'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md', '{project-root}/docs/superpowers/specs/2026-10-21-clean-codebase-refactor-design.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #364, epic #362. Nothing stops the code from drifting: lint only covers basics, and dead code, layer violations, duplication and secrets go unchecked. The rest of the epic needs a gate that blocks from day one but lets non-migrated files through until their story cleans them.

**Approach:** `npm run check` in `backend/` and `mobile/` runs every check in parallel: type-check, lint, knip, dependency-cruiser, jscpd, semgrep, ast-grep, secret scan and tests. Today's violations are recorded in versioned suppression or baseline files, and a script fails when those grow compared with `develop`. A husky pre-commit hook runs `check` on the touched projects, and a CI job runs it on every PR. `.agents/rules/*.md` explains each rule, and each failure points to its section.

## Boundaries & Constraints

**Always:**
- Each tool is a devDependency installed by `make install`, except semgrep and the secret scanner. Those run from pinned Docker images, so no Python or Go install is needed (Docker is already required by `make dev-docker`).
- The rules are the target ones from the spec: see Design Notes.
- Every existing violation is recorded so `check` is green on this branch. No rule is weakened or switched to `warn` to get there.
- The CI keeps its current jobs (`lint`, `type-check`, `test`, `test-int`).
- Append-only rule governance is written into AGENTS.md.

**Never:**
- Fix the existing violations here. The later stories own them (only trivial, mechanical breakage caused by the tools themselves may be fixed).
- Add a root `package.json`: the root `package-lock.json` is gitignored on purpose.
- Add the component-role ESLint plugin; that is #386. Add a logger or replace `console.*`; that is #365.

</frozen-after-approval>

## Code Map

- `.github/workflows/ci.yml` -- jobs `lint`, `type-check` and `test` run on `ubuntu-slim` (no Docker), and `test-int` on `ubuntu-24.04`. Add a `check` job on `ubuntu-24.04` (Docker for semgrep and gitleaks) with a `[backend, mobile]` matrix, running `npm ci` then `npm run check`. It must fetch `origin/develop` for the decrease script (`fetch-depth: 0`, or fetch the base ref). The `check` job duplicates lint, type-check and test; keep the existing jobs anyway, since the Constraints say so.
- `backend/eslint.config.js` -- flat config. It already bans `../` through `no-restricted-imports`. Add `no-console: error` and a rule that bans files named `index.ts`.
- `mobile/eslint.config.mjs` -- `no-console` is `warn` and allows `log`, `warn` and `error`; make it `error` with nothing allowed. There is no `../` rule and the code uses several aliases (`@components`, `@store`…, see `babel.config.js` and `tsconfig.json`). Add a `no-restricted-imports` rule that bans `../*` and every alias other than `@/`, plus the `index.ts` ban (`src/constants/index.ts` exists and goes into suppressions).
- ESLint 9.39 is installed in both projects, so use native bulk suppressions (`eslint --suppress-all` creates `eslint-suppressions.json`, and `--prune-suppressions` shrinks it). That file is the ESLint exception list.
- `backend/knip.json` and `mobile/knip.json` -- added in #363; knip is already clean, so it needs no baseline. Add `knip` as a devDependency.
- dependency-cruiser -- `.dependency-cruiser.cjs` per project. Rules:
  - everywhere: `no-circular`, and no import from one `features/<a>` into `features/<b>`;
  - backend: `shared` must not import `features` or `realtime`, and inside a feature, `services/` must not import the controller or the routes;
  - mobile, target layout: `shared/` must not import `features/` or `navigation/`, and `features/` must not import `navigation/`. These rules match nothing until #377 creates the folders.

  Record today's violations with `depcruise --output-type baseline` into `.dependency-cruiser-known-violations.json` and run with `--ignore-known`.
- jscpd -- `.jscpd.json` per project (`src/`, tests excluded, `minLines` 5, `minTokens` 50). jscpd has no baseline, so its exception list is `ignore` globs naming the files that are part of today's clones. Final target threshold 0.
- semgrep -- `tools/semgrep/rules.yml` at the root, shared by both projects: `no-eval`, `no-async-useeffect` (mobile), `no-fetch-outside-api-client` (mobile: `fetch(` only in `src/services/api.ts`, as AGENTS.md requires), `no-asyncstorage-outside-storage` (mobile: `AsyncStorage` only in storage modules; list today's users as excluded paths in the rule). Run `semgrep/semgrep` pinned by digest.
- ast-grep -- `@ast-grep/cli` devDependency, `sgconfig.yml` per project, with one starter rule per project that is enforceable today, such as `no-non-null-assertion-on-env` (backend: `process.env.X!` outside `shared/config/env.ts`). Add a rule only if it is clean or baselined.
- Secrets -- `zricethezav/gitleaks` pinned image, `gitleaks dir` on the project. The Facebook client token in `mobile/app.config.js` is public by design; allow it in `.gitleaks.toml` with a comment.
- `tools/guardrails/run-checks.mjs` (root, shared) -- runs the named checks in parallel and prints `<check> OK` or the first 20 lines of the failure. Each project's `check` script calls it. `tools/guardrails/check-exceptions.mjs` compares every exception file with `origin/develop` (entry counts per file and rule) and fails if any grew. It is part of `check`.
- husky -- devDependency of `backend`, with `"prepare": "cd .. && husky"`. The root `.husky/pre-commit` runs `npm run check` in `backend/` and/or `mobile/` depending on the staged paths.
- Coverage floor -- add `@vitest/coverage-v8` to backend. Run `vitest run --coverage` (backend) and `jest --coverage` (mobile), then post the line/branch/function percentages as a comment on epic #362.
- `.agents/rules/` -- `architecture.md` (layers, cross-feature imports, cycles, `@/`), `structure.md` (placement, no `index.ts`), `logging.md` (`no-console`, placeholder until #365), `guardrails.md` (what `check` runs, exception files, append-only governance). Each rule's error message ends with `See .agents/rules/<file>.md#<anchor>`, through ESLint rule messages, the depcruise `comment` and semgrep `message`. Add a "when to read" table to `AGENTS.md`, plus the `check` command in "Running and verifying".

## Tasks & Acceptance

**Execution:**
- [x] `backend/`, `mobile/` -- install the tools, add their configs, the `check` script and the baselines/suppressions -- the gate.
- [x] `tools/guardrails/`, `tools/semgrep/rules.yml` -- add the orchestrator, the decrease script and the shared rules -- shared gate.
- [x] `.husky/pre-commit`, `backend/package.json` `prepare` -- add the pre-commit hook -- local gate.
- [x] `.github/workflows/ci.yml` -- add the `check` job -- CI gate.
- [x] `.agents/rules/*.md`, `AGENTS.md`, `doc/TESTING.md` -- document the rules and how to run `check` -- governance.
- [x] Epic #362 -- comment with the coverage floor -- reference for later stories.

**Acceptance Criteria:**
- Given this branch, when `npm run check` runs in `backend/` and `mobile/`, then every check prints OK.
- Given a new file that imports `../x`, uses `console.log`, or imports a feature from another feature, when `check` runs, then it fails and the message names the rule and its `.agents/rules` section.
- Given an exception file with one more entry than on `develop`, when `check` runs, then the decrease check fails.
- Given a staged change only in `mobile/`, when committing, then the hook runs `check` in `mobile/` only, and a failing `check` blocks the commit.
- Given a fresh clone, when `make install` runs, then the hooks are active and every tool is available.

## Implementation Notes

- Each check is an npm script (`check:lint`, `check:deps`…); `check` passes their names to `tools/guardrails/run-checks.mjs`, so knip sees every tool binary in use. `check:lint` is `eslint . --quiet` (errors only, so the 20 shown lines are the failures).
- `console.*` is banned with `no-restricted-globals` on `console`, not the core `no-console`: its message cannot carry the `See .agents/rules/logging.md#no-console` link. Mobile's `no-console` warn rule is replaced by it.
- knip pinned to `^5`: knip 6 also reports exported types used only in their own file (16 today), which would have needed a baseline knip does not have.
- semgrep and gitleaks run from `tools/guardrails/docker-scan.mjs` (images pinned by tag and digest). gitleaks scans a copy of `git ls-files -co --exclude-standard`, so local `.env` files are skipped. `.gitleaks.toml` also allowlists the truncated example tokens of `auth.openapi.ts` and `YOUR_TOKEN_HERE` in `backend/README.md` (false positives).
- semgrep ignores `async` in an arrow pattern, so `no-async-useeffect` matches the callback text with `metavariable-regex`.
- ast-grep starter rules: backend `no-non-null-assertion-on-env` (tests excluded: one int test reads `process.env.X!`), mobile `no-ts-ignore` (one document per grammar, `.ts` and `.tsx`).
- `check-exceptions.mjs` compares counts per exception file and rule with the fork point from `origin/develop` and with `HEAD` (a file absent from a reference is not compared with it, which covers this bootstrap branch). ESLint counts both (file, rule) pairs and occurrences.
- Coverage: `npm run test:coverage` in both projects, over all `src/` files (vitest `coverage.include`, jest `collectCoverageFrom`). `jest --coverage` crashed on the existing `glob ^10` override (test-exclude 6 needs glob 7); fixed with an override `test-exclude ^7.0.2`. Floor posted on #362 and in `doc/TESTING.md`.
- Known gaps: `src/realtime/index.ts` (backend) is suppressed by the `index.ts` ban, while the spec's target layout keeps that file name; the realtime story must rename it or renegotiate. A jscpd `ignore` hides the whole file, so code copied from an ignored file is not caught until its entry goes. `CreatePlaylistScreen.test.tsx` times out on a cold Jest cache (#389).

## Plan Change Log

## Review Triage Log

## Design Notes

Exception files only shrink: a later story fixes files, then runs `eslint --prune-suppressions`, regenerates the depcruise baseline, or deletes jscpd `ignore` entries. In the decrease script, an entry is a (file, rule) pair for ESLint, a violation for depcruise, and a glob for jscpd.

## Verification

**Commands:**
- `cd backend && npm run check` -- expected: all checks OK.
- `cd mobile && npm run check` -- expected: all checks OK.
- Temporarily add `import x from '../x'` and `console.log(1)` to one file in each project, then run `npm run check` -- expected: it fails and points to `.agents/rules`. Revert afterwards.
- Add a fake entry to `eslint-suppressions.json` and run `node tools/guardrails/check-exceptions.mjs` -- expected: it fails. Revert afterwards.

### Pass 1 (quick) — high 0 / medium 4 / low 2 / false 0 / maybe-false 0

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| `run-checks.mjs` prints the first 20 lines, which for Jest are only `PASS` lines, so the cause of a failure never shows | medium | patch | The reviewer reproduced it on a cold-cache run (`PrivacySettingsScreen` timeout). Fix: print the tail. The cold-cache flakiness itself is pre-existing and tracked in #389; `PrivacySettingsScreen` was added there by comment. |
| `docker-scan.mjs`: a tracked file deleted from disk breaks `tar`, so `check:secrets` and the hook fail | medium | patch | Reproduced by deleting `mobile/README.md` without staging. Fix: filter out paths that do not exist. |
| Inline escapes (`eslint-disable`, `nosemgrep`, `ast-grep-ignore`, `jscpd:ignore`) bypass the shrink-only exception lists | medium | patch | A probe file with `eslint-disable-next-line` passed. Fix: count the directives per file against develop. |
| `check-exceptions` counts can be gamed: a widened glob, gitleaks/semgrep entries in other syntaxes | medium | patch | Count-only comparison and parsers for a single syntax. Fix: a subset check of the entries against develop. |
| Header comments cite nonexistent `secrets.mjs` / `semgrep.sh` | low | patch | Only `docker-scan.mjs` exists. |
| The pre-commit hook checks the working tree, not the staged content | low | reject | Real, but the usual limitation of a husky hook. A fix (stash dance) adds complexity and risks losing local changes; the CI `check` job runs on the committed tree. |
