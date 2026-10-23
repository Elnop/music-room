---
title: 'Mobile : une seule arborescence de feature, imposée par ESLint (#414)'
type: 'refactor'
ticket: 'https://github.com/Elnop/music-room/issues/414'
created: '2026-10-23'
status: 'built'
baseline_revision: '712e242cfb30ea29c77c8f15b4f7851f65c6b03e'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md', '{project-root}/.agents/rules/structure.md', '{project-root}/.agents/rules/components.md', '{project-root}/.agents/rules/guardrails.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #414, epic #362. The migration #379–#386 left three feature layouts in `mobile/src/features/` (`<subject>/components/{orchestrators,presenters}`, `<subject>/{orchestrators,presenters}`, `components/<subject>/components/…`, plus a mix in `friends/userProfile`), and `components/component-role-directory` accepts any path containing `/orchestrators/`, `/presenters/` or `/context/`, so nothing stops it.

**Approach:** Move every feature to layout A (decided by the user), harden the rule so only layout A passes, and make the docs describe it.

Target layout (user decisions: a subject folder always exists, even for a single-subject feature; `*Styles.ts` stay with presenters; `context/` stays allowed at the feature root for React providers; tests move with their file):

```
features/<feature>/
├── hooks/ services/ stores/ utils/ constants.ts types.ts validators.ts …   (shared by subjects)
├── context/                                                                 (React providers)
└── <subject>/
    ├── components/orchestrators/
    ├── components/presenters/
    └── hooks/
```

## Boundaries & Constraints

**Always:** pure moves (`git mv`) and import-path updates; cross-folder imports stay `@/…` (never `../`); one ticket, one PR into `develop`; `npm run check` green in `mobile/`.

**Never:** change logic, props, hooks or presenter content; add any entry to an exception list (`eslint-suppressions.json`, `.dependency-cruiser-known-violations.json`, `.jscpd.json` `ignore`, semgrep `exclude`); weaken another rule; touch `backend/`.

## I/O & Edge-Case Matrix

Rule `components/component-role-directory`, on a file under `src/features/` that contains JSX (paths relative to `src/features/`):

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Presenter in layout A | `foo/bar/components/presenters/X.tsx` | no report | No error expected |
| Orchestrator in layout A | `foo/bar/components/orchestrators/X.tsx` | no report | No error expected |
| Provider | `foo/context/XProvider.tsx` | no report | No error expected |
| Role dir without `components/` | `foo/bar/presenters/X.tsx` | one report | `componentOutsideRoleDir` |
| Doubled `components/` | `foo/components/bar/components/presenters/X.tsx` | one report | `componentOutsideRoleDir` |
| No subject folder | `foo/components/presenters/X.tsx` | one report | `componentOutsideRoleDir` |
| Arbitrary folder | `foo/feedback/X.tsx`, `foo/bar/components/X.tsx` | one report | `componentOutsideRoleDir` |
| No JSX / test file / outside features | `foo/bar/hooks/useX.ts`, `*.test.tsx`, `src/shared/…` | no report | No error expected |

</frozen-after-approval>

## Code Map

- `mobile/eslint/rules/component-role-directory.mjs` -- the rule; today `ALLOWED_ROLE_DIRECTORIES.some(dir => filename.includes(dir))`. Replace with a match on the path after `src/features/`: `^[^/]+/[^/]+/components/(orchestrators|presenters)/[^/]+$` or `^[^/]+/context/[^/]+$`. Keep the existing early returns (non-feature file, `.test.`) and the single report per file.
- `mobile/eslint/plugin-components.test.mjs:166` -- `component-role-directory` RuleTester cases; current valid cases `features/foo/presenters/MyView.tsx` and `features/foo/orchestrators/MyOrch.tsx` become invalid under layout A. Other rules' cases use `presenters/`/`orchestrators/` substrings and stay untouched.
- Moves (89 files, tests included):
  - `src/features/friends/{friendsList,userProfile}/presenters/` → `<subject>/components/presenters/` (their `components/orchestrators/` already conform).
  - `src/features/music-control/myDevices/{orchestrators,presenters}/` → `myDevices/components/…`.
  - `src/features/profile/<subject>/{orchestrators,presenters}/` for `common`, `editProfile`, `linkedAccounts`, `musicPreferences`, `privacySettings`, `profileScreen`, `settings` → `<subject>/components/…`.
  - `src/features/search/searchScreen/{orchestrators,presenters}/` → `searchScreen/components/…`.
  - `src/features/player/components/{mediaSession,miniPlayer,modal}/` → `src/features/player/{mediaSession,miniPlayer,modal}/` (their inner `components/` and `hooks/` move as-is).
  - `src/features/queue/components/{devicePicker,queueModal}/` → `src/features/queue/{devicePicker,queueModal}/`.
- Import references: ~39 files under `mobile/src` (navigation stacks, orchestrators, tests' `jest.mock('@/features/…')` strings) match `features/(player|queue)/components/` or `features/(friends|profile|music-control|search)/<subject>/(orchestrators|presenters)/`. Same-folder `./X` imports need no change.
- Already conforming, do not move: `auth/*`, `playlists/*`, `player/context/PlayerProvider.tsx`.
- `.agents/rules/components.md:5-8,59-68` -- intro cites "VibeAppTemplate and bedrock principles" (remove); `component-role-directory` section lists `orchestrators/ (or components/orchestrators/)` (rewrite to layout A).
- `.agents/rules/structure.md:10` -- `#placement` mobile bullet; add the layout A tree for a feature.
- `AGENTS.md:59` -- already says `components/orchestrators`; add "always a subject folder" only if it reads ambiguous.
- `mobile/README.md:211,213` -- paths `features/search/searchScreen/orchestrators`, `features/music-control/myDevices/orchestrators`: update.
- Out of scope, leave: `mobile/src/features/music-control/hooks/useMusicControl.test.ts:71` `jest.mock('../services/musicControlApi')`.

## Tasks & Acceptance

**Execution:**
- [x] `mobile/eslint/plugin-components.test.mjs` -- rewrite the `component-role-directory` cases to the I/O matrix (valid and invalid rows) -- write the failing tests first.
- [x] `mobile/eslint/rules/component-role-directory.mjs` -- implement the layout A match; update the message to name the expected path -- tests pass.
- [x] `mobile/src/features/**` -- `git mv` per the Code Map, then rewrite import paths and `jest.mock` strings repo-wide in `mobile/` -- lint passes with the hardened rule.
- [x] `.agents/rules/components.md`, `.agents/rules/structure.md`, `AGENTS.md`, `mobile/README.md` -- describe layout A, drop the VibeAppTemplate/bedrock line, fix moved paths.

**Acceptance Criteria:**
- Given the branch, when listing `mobile/src/features/**/{orchestrators,presenters}`, then every one sits at `features/<feature>/<subject>/components/`.
- Given `git diff -M develop --stat`, when reading it, then the only non-rename changes are import lines, the rule, its tests and the four docs.
- Given a file restored to any of the three old layouts, when running `npm run lint` in `mobile/`, then `components/component-role-directory` reports it.

## Implementation Notes

- Besides the Code Map, the subject-root screen tests (`<subject>/*Screen.test.tsx` in profile, search, music-control) imported `./orchestrators/…` / `./presenters/…`; rewritten to `./components/…`.
- `player/modal/components/orchestrators/PlayerModal.tsx` (11 lines, 3 import lines changed) falls under git's 50% rename threshold and shows as delete + add in `git diff -M`; `git diff -M30%` shows it as a rename.
- Extra RuleTester case: a provider in a subject's `context/` (`foo/bar/context/X.tsx`) is reported, per the `^[^/]+/context/[^/]+$` match.

## Plan Change Log

## Review Triage Log

### Pass 1 (quick) — high 0, medium 1, low 3, false 0, maybe-false 0

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| `jest.mock` calls left unformatted in `player/context/PlayerContext.test.tsx:73`, `usePlayerHeight.test.tsx:7` | low | patch | `npx eslint` shows 2 new `prettier/prettier` warnings on the rewritten paths; `--quiet` hides them from `check`. Fix: eslint --fix on both files. |
| `component-role-directory` accepts `components`/`context`/`hooks` as subject name (`features/foo/components/components/presenters/X.tsx` passes) | medium | patch | First pattern's subject segment is `[^/]+`; the doubled-`components/` ban in `components.md` can be bypassed. Fix: negative lookahead + RuleTester case. |
| `myDevices/components/presenters/RenameDeviceModal.test.tsx` tests the orchestrator `components/orchestrators/RenameDeviceModal` | low | patch | Import at line 3 targets the orchestrator; intent says tests sit next to their file. Fix: `git mv` to `components/orchestrators/`. |
| `structure.md#placement` tree omits subject-level `utils/` (exists in `music-control/myDevices/utils/`, listed in `mobile/README.md`) | low | defer | Fix edits an agent-context rules file → defer per triage rules. |

## Verification

**Commands:**
- `cd mobile && node --test eslint/plugin-components.test.mjs` -- expected: all pass
- `cd mobile && npm run check` -- expected: exit 0 (Docker running for semgrep/gitleaks)
- `git diff -M --stat 712e242cfb30ea29c77c8f15b4f7851f65c6b03e -- mobile/src` -- expected: moves shown as renames, small line counts
- `find mobile/src/features -type d \( -name orchestrators -o -name presenters \) | grep -vE 'features/[^/]+/[^/]+/components/(orchestrators|presenters)$'` -- expected: no output
