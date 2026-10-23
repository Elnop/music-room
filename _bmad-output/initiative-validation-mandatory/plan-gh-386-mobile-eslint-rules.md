---
title: 'Mobile : plugin ESLint des rôles de composants, sans exception (#386)'
type: 'refactor'
ticket: 'https://github.com/Elnop/music-room/issues/386'
created: '2026-10-23'
status: 'complete'
baseline_revision: ''
route: 'full'
route_source: 'auto'
risk: 'medium'
review: ''
review_source: ''
lenses_ran: []
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md', '{project-root}/docs/superpowers/specs/2026-10-21-clean-codebase-refactor-design.md', '{project-root}/.agents/rules/architecture.md', '{project-root}/.agents/rules/structure.md', '{project-root}/.agents/rules/state.md', '{project-root}/.agents/rules/logging.md', '{project-root}/.agents/rules/guardrails.md']
---

## Intent

**Problem:** GitHub #386, epic #362. Component roles (orchestrators, presenters, hooks, screens) were introduced during stories #378–#385, but without automated ESLint rules to enforce their boundaries. Without enforcement, regressions can reintroduce state/effects in presenters, JSX in hooks, multiple components per file, direct fetch in orchestrators, or presenter imports in navigation screens.

**Approach:**
- **ESLint Plugin:** Implement a custom ESLint plugin `components` with 6 blocking rules:
  1. `screen-orchestrator-only`: navigation screens only import orchestrators from features, never presenters.
  2. `presenter-pure`: presenters are pure UI (no `useState`, `useEffect`, stores, queries, or raw fetch).
  3. `hook-no-jsx`: hooks contain logic only and zero JSX elements.
  4. `one-component-per-file`: at most one component declared per file.
  5. `component-role-directory`: feature components must live inside `orchestrators/` or `presenters/` (or `context/`).
  6. `orchestrator-no-fetch`: orchestrators never make raw network calls (`fetch`, `apiRequest`, `axios`).
- **Tests:** Add comprehensive tests for every rule using ESLint's `RuleTester`.
- **Refactoring:** Fix any existing violations across `mobile/src/`:
  - Split multi-component files into individual files (`PlaylistsSkeleton`, `DetailStates`, `MyDevicesStates`, `QueueItemRow`, etc.).
  - Ensure `RenameDeviceModal` is a pure presenter.
  - Ensure `PlayerErrorToast` lives in a role directory or hook.
- **Documentation:** Create `.agents/rules/components.md` documenting every rule, with error links and fixes. Update `AGENTS.md`.
- **Zero Exceptions:** All 6 rules active as `error` with 0 suppressions.
