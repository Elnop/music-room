---
title: 'Refactor : documentation et justification des choix techniques (#387)'
type: 'documentation'
ticket: 'https://github.com/Elnop/music-room/issues/387'
created: '2026-10-23'
status: 'complete'
baseline_revision: ''
route: 'full'
route_source: 'auto'
risk: 'low'
review: ''
review_source: ''
lenses_ran: []
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md', '{project-root}/docs/superpowers/specs/2026-10-21-clean-codebase-refactor-design.md', '{project-root}/.agents/rules/architecture.md', '{project-root}/.agents/rules/structure.md', '{project-root}/.agents/rules/state.md', '{project-root}/.agents/rules/logging.md', '{project-root}/.agents/rules/guardrails.md', '{project-root}/.agents/rules/components.md']
---

## Intent

**Problem:** GitHub #387, concluding epic #362. Following the complete refactoring of backend and mobile features (#363 to #386), repository documentation needed full synchronization with the target architecture. Technical decisions of the epic (TanStack Query, StyleSheet + tokens, React Navigation, OpenAPI from Zod, unified guardrails, pure functions) required formal written justification against named alternatives (feeding #97). Furthermore, acceptance criteria mandated that all exception lists are emptied.

**Approach:**
1. **Technical Choices & Architectural Justifications (`doc/TECH_CHOICES.md`):**
   - Author comprehensive architectural documentation covering both core platform choices (#97) and epic #362 decisions:
     - Core: Node/Express/TypeScript, Supabase (Postgres, Auth, RLS), Redis, Socket.io, Expo React Native (native debug build), REST & JSON.
     - Epic #362: TanStack Query vs Zustand/RTK/SWR, StyleSheet + Design Tokens vs NativeWind/styled-components, React Navigation vs Expo Router, OpenAPI from Zod schemas vs manual OpenAPI/tsoa, pure function modules vs singleton classes, strict guardrail suite (`npm run check`).
     - Every choice explicitly contrasted with named rejected alternatives and technical rationale.
2. **Exception Lists Emptying:**
   - Eliminate all remaining color literals across shared and navigation files in `mobile/src/` (`AppNavigator.tsx`, `EmptyState.tsx`, `ThemedSwitch.tsx`, `Button.tsx`, `ConnectionBanner.tsx`, `ErrorBoundary.tsx`, `QueueSwipe.tsx`, `SwipeableTrackItem.tsx`, `SwipeableUserItem.tsx`, `ThemeSelector.tsx`, `user.types.ts`).
   - Empty `mobile/eslint-suppressions.json` to `{}` (0 suppressions).
   - Verify `check-exceptions.mjs` and all guardrails.
3. **Documentation Updates:**
   - `README.md`: Update architecture, modern tech stack, links to `doc/TECH_CHOICES.md` and `doc/TESTING.md`.
   - `mobile/README.md`: Document completed feature migrations (#378–#385), HTTP client with telemetry headers, test commands, and component roles plugin.
   - `backend/README.md`: Ensure composition root `src/app/`, realtime domain split, and anti-abuse architecture are clear.
   - `AGENTS.md`: Update mobile layout and components rules.
   - `socket-logger.middleware.ts`: Refactored to 99 lines (under 150-line maximum).
