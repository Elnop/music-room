# Structure rules

Read before creating a file or a folder. Every rule here is checked by `npm run check`; the error message links to its section. Rules are append-only: see [guardrails.md](guardrails.md#append-only-rules).

## placement

Where a file goes is set by the target layout in `docs/superpowers/specs/2026-10-21-clean-codebase-refactor-design.md` and summarized in `AGENTS.md`:

- Backend: `src/features/<name>/` holds `<name>.routes.ts`, `<name>.controller.ts`, `<name>.validators.ts`, `<name>.types.ts`, `<name>.openapi.ts`, logic in `services/`, authorization in `permissions/`, helpers in `utils/`. Cross-cutting code (config, middleware, security, types) goes in `src/shared/`; the Socket.io server in `src/realtime/`.
- Mobile: `src/features/<feature>/` (components, hooks, services, stores of one feature), `src/shared/` (UI primitives, API client, query setup, cross-cutting stores, theme), `src/navigation/`, `src/providers/`. The current folders (`components/`, `screens/`, `store/`…) move there story by story.
- Tests sit next to the file they test.

## no-index-files

No file named `index.ts` (or `index.tsx`) under `src/` (ESLint `no-restricted-syntax`). An index file is either a barrel that re-exports, which hides where code lives and creates cycles, or a module with a name that says nothing. Name the file after what it holds and import that file directly.

The app entry points outside `src/` (`mobile/index.ts`, required by Expo) are not concerned.
