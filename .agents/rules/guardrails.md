# Guardrails

Read before changing a guardrail, an exception list, or when `npm run check` fails. Pattern rules (semgrep and ast-grep on the backend, oxlint on the mobile) and the secret scan are explained here; layer and import rules in [architecture.md](architecture.md), file rules in [structure.md](structure.md), logs in [logging.md](logging.md).

## what-check-runs

`npm run check` in `backend/` or `mobile/` runs every check in parallel and prints `<check> OK`, or `FAILED` with the output of the failure.

- Backend: `tools/guardrails/run-checks.mjs` runs the scripts below, unit tests included, and shows the last 30 lines of a failure. Run one check alone with `npm run check:<name>` (`type-check` and `test` are the usual scripts).
- Mobile: `brutal-check` (`@brutalway/check`) runs the scripts `format:check` (prettier with `@brutalway/prettier-config`; `npm run format` rewrites the files), `typecheck`, `lint` (oxlint), `deps`, `tree`, `duplicates`, `unused` (knip, then `knip --production`, which ignores tests and so reports code that only a test uses), `secrets` and `exceptions`, each one runnable alone with `npm run <name>`. The mobile has no ESLint, semgrep or ast-grep: every rule comes from a brutalway package. The unit tests are not part of the mobile check: `npm test` and the CI job `test` run them.

| Check | Tool | Config | What fails |
| --- | --- | --- | --- |
| type-check | tsc | `tsconfig.json` | a type error |
| lint | ESLint (backend, `eslint . --quiet`) | `eslint.config.*` | an ESLint error (warnings do not fail) |
| oxlint | oxlint (mobile) | `oxlint.config.mjs`, `oxlint-suppressions.json` | a violation of the brutalway oxlint presets beyond the suppressions ([oxlint](#oxlint)) |
| dead-code | knip | `knip.json` | an unused file, export, type or dependency |
| deps | dependency-cruiser | `.dependency-cruiser.cjs` (mobile: preset `@brutalway/dependency-cruiser-config/layers`), backend: `.dependency-cruiser-known-violations.json` | a layer violation, a cross-feature import or a cycle ([architecture.md](architecture.md), mobile: [mobile-layers](architecture.md#mobile-layers)) |
| tree | check-tree (mobile) | | a folder outside the layout, an empty folder, a kind folder with a single child ([structure.md](structure.md#check-tree)) |
| duplication | jscpd | `.jscpd.json` | a clone of 5 lines and 50 tokens or more in `src/` (tests excluded) |
| semgrep | semgrep (backend, Docker) | `tools/semgrep/rules.yml` | a pattern rule below |
| ast-grep | ast-grep (backend) | `sgconfig.yml`, `ast-grep/rules/` | a pattern rule below |
| secrets | gitleaks: Docker image (backend), `@brutalway/check-secrets` (mobile) | `.gitleaks.toml` (backend), `mobile/.gitleaksignore` | a secret in a file git would commit ([no-secrets](#no-secrets)) |
| test | Vitest (backend only, see above) | | a failing unit test |
| exceptions | `tools/guardrails/check-exceptions.mjs` (backend), `@brutalway/check-exceptions` (mobile) | | an exception list that grew ([exception-lists](#exception-lists)) |

Every tool is a devDependency installed by `make install`, except the backend's semgrep and gitleaks, which run from Docker images pinned by digest in `tools/guardrails/docker-scan.mjs`: Docker must be running for the backend check (it already is for `make dev-docker`). The mobile check needs no Docker: `check-secrets` downloads the gitleaks binary on its first run and checks it against a pinned checksum. semgrep lists its files with git, so in a git worktree the script also mounts the main checkout's `.git`; a scan that reaches no file fails instead of passing. The CI job `check` runs the same command for both projects on every PR.

## exception-lists

The rules block from day one; the violations that existed when a rule arrived are recorded in versioned exception lists, so `check` stays green while later stories clean them. A list that reaches zero is deleted with its tooling, and `check:exceptions` fails if it comes back: the ESLint lists of both projects and the dependency-cruiser and check-tree lists of the mobile are gone (#655), so a violation of those tools fails outright. The lists left:

| Tool | Exception list | Entry |
| --- | --- | --- |
| dependency-cruiser | `backend/.dependency-cruiser-known-violations.json` | a violation |
| oxlint | `mobile/oxlint-suppressions.json`, written by oxlint | a (file, rule) pair, with its count |
| jscpd | the `ignore` globs of `<project>/.jscpd.json` | a glob (the first globs, tests and generated files, are permanent) |
| semgrep | the `exclude` lists of `tools/semgrep/rules.yml` (backend) | a path (the test globs are permanent; a rule's `metadata.allowed-paths` globs are its definition, not exceptions) |
| gitleaks | the `[[allowlists]]` of `.gitleaks.toml` (backend), the fingerprints of `mobile/.gitleaksignore` | an allowed value or path, public by design |

An exception list only shrinks. `check:exceptions` counts the entries of each list per rule and fails when a count is higher than at the fork point from `origin/develop` (the backend script also compares with `HEAD`). A story that cleans files then shrinks the list:

- dependency-cruiser: `npx depcruise src --config .dependency-cruiser.cjs --output-type baseline --output-to .dependency-cruiser-known-violations.json` from `backend/`.
- oxlint: `npm run lint -- --prune-suppressions` from `mobile/` (`lint` fails while a suppression allows more than what is left).
- jscpd, semgrep, gitleaks: delete the entries by hand.

For jscpd `ignore`, semgrep `exclude` and every string of the `.gitleaks.toml` allowlist and `[extend]` sections, the comparison is by value: every entry must already exist on `develop`, so an entry can be neither added nor widened (such as `**/src/store/authStore.ts` turned into `**/src/**`).

A semgrep rule whose scope is a naming convention can declare it in `metadata.allowed-paths` and repeat each glob in `paths.exclude`: `check:exceptions` then does not count that exclude entry, and a new glob fails unless it is recorded for the rule under `allowedPaths` in `tools/guardrails/new-rule-baselines.json`. No rule uses it today.

The next two paragraphs describe the backend script, `tools/guardrails/check-exceptions.mjs`, which also watches `tools/semgrep/rules.yml` and `.gitleaks.toml`. The mobile runs `@brutalway/check-exceptions --base origin/develop`: it reads `oxlint-suppressions.json`, `knip.json`, `.jscpd.json`, `.gitleaksignore` and the inline escapes of `mobile/` (`oxlint-disable`, `eslint-disable`, `@ts-expect-error`, `@ts-ignore`, `@ts-nocheck`, `jscpd:ignore-start`, `gitleaks:allow`), and counts per rule over the whole project, so a moved file changes nothing. A rule absent at the fork point starts at 0; the ticket that adds it writes its count under `check-exceptions.newRules` in `mobile/package.json`, and the next ticket deletes that entry.

Two changes are not growth. A file moved with git (a rename) keeps its entries and inline escapes under its new path: update the path in the list, nothing else. A new rule lands with exceptions only through the versioned allowlist `tools/guardrails/new-rule-baselines.json` (`{ "<project>": { "<rule id>": <max entries> } }`): a rule listed there, with no entry in the reference list, may record up to that many entries (dependency-cruiser: violations), and `check:exceptions` prints `new rule, baseline accepted`. Adding the rule to the allowlist, with today's count, is part of the ticket that creates the rule. A baseline only counts while it is absent from `develop`'s copy of the allowlist: once on `develop`, the rule only shrinks like any other, even after its last entry is gone, and `check:exceptions` fails until the next ticket removes the stale baseline. A rule not in the allowlist (a renamed one included) starts at 0. The rename logic is in `tools/guardrails/renames.mjs`; the tests of `tools/guardrails/` (`*.test.mjs`) run in the mobile's `npm test`.

Inline escapes count too: the backend's `check:exceptions` counts `eslint-disable`, `oxlint-disable`, `nosemgrep`, `ast-grep-ignore` and `jscpd:ignore-start` per file under the project's `src/`, and fails when a file has more than on `develop` (a new file starts at 0).

Never add an entry or an inline escape to make new code pass: fix the code. A jscpd `ignore` entry hides the whole file, so code copied from an ignored file is not caught; that gap closes as the list empties. Every list must be empty (permanent entries aside) at the end of epic #362.

## oxlint

Mobile only. `npm run lint` runs oxlint with `oxlint.config.mjs`, which extends three presets of [brutalway](https://brutalway.elnop.dev/): `@brutalway/oxlint-config-react-native` (itself built on `@brutalway/oxlint-config-react`, `-typescript` and `-zustand`), `@brutalway/oxlint-config-tanstack-query` and `@brutalway/oxlint-config-react-hook-form`. Two opt-in presets of the React Native package complete them: `designSystemPrimitives` ([ui-primitives](structure.md#ui-primitives)) and `colorFiles` ([theme-tokens](structure.md#theme-tokens)). It lints `src/`, `test-utils/` and `main.ts`. Each rule, what it rejects and how to fix it is described in the README of its preset, in `node_modules/@brutalway/oxlint-config-*/README.md`; the main ones:

- styles: no colour literal outside `*ThemeConfig.ts`, no literal size, spacing, font, `fontWeight` or shadow in `StyleSheet.create`, no object written in a `style` prop, no unused style, no raw text outside `<Text>` (`theme-colors`, `theme-styles`, `react-native/*`);
- design system and storage: `Pressable`, `TouchableOpacity`, `Text` and `TextInput` of `react-native` only under `src/shared/theme/`, AsyncStorage only in `*Storage.ts` (`design-system`, `storage-placement`);
- stores: a store hook always takes a selector (`store-selector`, [state.md](state.md#zustand-selectors));
- code shape: no comment, function declarations, small functions, types where they belong, exports at the end, no relative import (`no-comments`, `func-style`, `function-size`, `type-definitions`, `export-placement`, `no-restricted-imports`);
- components: roles by name, no orchestrator in `shared/`, a hook named `use*` (`component-roles`, `hook-naming`);
- TanStack Query: keys from a key factory, complete `queryKey` dependencies (`query-conventions`, `tanstack-query/*`);
- tests: `it` inside `describe`, `toStrictEqual`, `toHaveBeenCalledWith` (`jest/*`).

oxlint reads `oxlint-suppressions.json` itself: the file recorded the 5205 violations left when oxlint arrived (#629) and holds 4 today. A count above its suppression fails and prints the violations; a suppression that allows more than what is left fails too, until `npm run lint -- --prune-suppressions` lowers it. The list only shrinks ([exception-lists](#exception-lists)); `--suppress-all` rewrites it from scratch and is for the ticket that adds a rule, with its `newRules` entry.

## pre-commit

`make install` runs `npm install` in `backend/`, whose `prepare` script runs husky: git then uses `.husky/` as its hooks folder. `.husky/pre-commit` runs `npm run check` in each project the staged files touch: the backend for `backend/`, `tools/` and `.gitleaks.toml`, the mobile for `mobile/`. A failing check blocks the commit. Fix the failure; do not bypass the hook with `--no-verify`.

## append-only-rules

- Every rule has a section in `.agents/rules/<topic>.md`, and its error message ends with `See .agents/rules/<topic>.md#<section>`.
- A rule is never disabled, downgraded to a warning, narrowed or given a new exception to let code through. Change the code instead.
- A rule may be added. It lands with its section here and either matches no code or records today's violations in an exception list.
- Changing or removing a rule takes a dedicated ticket explaining why.

## no-eval

No `eval()` and no `new Function()` (backend: semgrep; mobile: oxlint `no-eval`, `no-new-func` and `typescript/no-implied-eval`, which also refuses a string given to `setTimeout`). They run arbitrary strings as code. Parse data with `JSON.parse` or a Zod schema instead.

## no-async-useeffect

Mobile, oxlint `react-hooks/exhaustive-deps` (brutalway preset): a `useEffect` callback is never `async`. React expects it to return nothing or a cleanup function, not a Promise. Declare an async function inside the effect and call it.

## no-fetch-outside-api-client

Mobile, oxlint `fetch-placement` (brutalway preset): `fetch(` appears only in a file named `<thing>Client.ts`, and never in an effect. The backend has one client, `src/shared/backend/lib/apiClient.ts`, which adds the `X-Platform`, `X-Device-Model` and `X-App-Version` headers the backend logs (subject IV.6) and a default timeout. Call the backend through `apiRequest` (`src/shared/backend/lib/apiRequest.ts`), which adds the session token on top of it; never write a second client for the backend.

## no-asyncstorage-outside-storage

Mobile, oxlint `storage-placement/no-restricted-syntax` (brutalway preset): `@react-native-async-storage/async-storage` is imported only by storage modules and tests. A storage module is named `<thing>Storage.ts` (`src/shared/playback/lastTrackStorage.ts`, `src/features/user/features/auth/shared/sign-in/lib/sessionStorage.ts`). Other code calls a storage module, so keys and formats live in one place. A test may seed or clear the AsyncStorage mock.

## no-non-null-assertion-on-env

ast-grep, backend: no `process.env.X!` outside `src/shared/config/env.ts` (tests excepted). `env.ts` validates every variable at startup; read the value from it instead of asserting it exists.

## no-ts-ignore

Mobile, oxlint `typescript/ban-ts-comment` (brutalway preset): no `@ts-ignore` or `@ts-nocheck` comment. Fix the type, or, when the error is expected, use `@ts-expect-error` with a reason; it fails once the error is gone.

## no-secrets

gitleaks (default rules, `.gitleaks.toml`) scans the files git would commit: tracked files and untracked files that are not ignored, so local `.env` files are skipped. On a finding, remove the secret, move it to `backend/.env` or `mobile/.env` with a placeholder in `.env.example`, and rotate it if it was ever pushed. Only a value public by design goes in an allowlist of `.gitleaks.toml`, with a comment saying why. The mobile runs the same gitleaks through `@brutalway/check-secrets`: a value public by design there (the Facebook client token in `mobile/app.config.js` and `mobile/.env.example`) is listed by its fingerprint in `mobile/.gitleaksignore`, which the failure message prints.
