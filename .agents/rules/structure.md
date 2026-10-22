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

## backend-feature

The shape of a backend feature once migrated (epic #362; `src/features/auth/` is the reference, #368–#373 follow it). Review enforces it; `check` catches part of it (dependency-cruiser layers, jscpd, knip).

- **Services are modules of exported functions** in `services/`, never a class instantiated once or a class of static methods. Module state (a client, a limiter) is a module constant. No `<name>.service.ts` at the feature root.
- **Call sites use a namespace import**: `import * as sessionService from '@/features/auth/services/session.service.js'`, then `sessionService.verifyToken(token)`. Tests mock the module: `vi.mock('…/session.service.js', () => ({ verifyToken }))`. A function another test must replace lives in its own module, since `vi.spyOn` cannot reach a call inside the same module.
- **Controllers are exported handler functions without `try/catch`**: Express 5 forwards a rejected promise to `errorHandler`, and a Zod `parse` throws a `ZodError` that becomes a 400 `VALIDATION_ERROR`. A handler catches only to act on a failure (record a failed login, then rethrow). Answer with `sendSuccess(res, data, status?)` from `@/shared/utils/send-success.js`. A large controller splits by subject into `<name>-<subject>.controller.ts` at the feature root, matching the `<name>-<subject>.openapi.ts` files.
- **Routes pass the handlers directly**, `router.post('/login', loginRateLimiter, checkAccountLockout, session.login)`, with the controller imported as a namespace. No arrow wrapper and no `@route` JSDoc: the OpenAPI files document the endpoints.
- **Files stay at 150 lines or less** (tests excepted): split a service by use case rather than grow it.
- **Request input types come from the validators** (`export type LoginInput = z.infer<typeof loginSchema>` in `<name>.validators.ts`); `<name>.types.ts` keeps response and domain types, inferred from the response schemas when one exists. No DTO interface that repeats a schema.
