# Structure rules

Read before creating a file or a folder. Every rule here is checked by `npm run check`; the error message links to its section. Rules are append-only: see [guardrails.md](guardrails.md#append-only-rules).

## placement

Where a file goes is set by the target layout in `docs/superpowers/specs/2026-10-21-clean-codebase-refactor-design.md` and summarized in `AGENTS.md`:

- Backend: `src/features/<name>/` holds `<name>.routes.ts`, `<name>.controller.ts`, `<name>.validators.ts`, `<name>.types.ts`, `<name>.openapi.ts`, logic in `services/`, authorization in `permissions/`, helpers in `utils/`. Cross-cutting code (config, middleware, security, types) goes in `src/shared/`; the Socket.io server in `src/realtime/` (`socket-server.ts`, `handlers/`, `emitters/`); the composition root (routes registry, OpenAPI document) in `src/app/`.
- Mobile: `src/features/<feature>/` (components, hooks, services, stores of one feature), `src/shared/`, `src/navigation/`, `src/providers/` (`AppProviders.tsx`, the providers `App.tsx` wraps the app in). The legacy folders (`components/<feature>/`, `screens/`, `store/`, `hooks/`, `contexts/`, `services/`, `api/`, `utils/`) move into `features/` story by story (#378–#385); add nothing new to them. Every feature has the same layout (ESLint `components/component-role-directory`, see [components.md](components.md#component-role-directory)); a subject folder always exists, even for a single-subject feature, `*Styles.ts` files sit with their presenters, and tests sit next to their file:

  ```
  features/<feature>/
  ├── hooks/ services/ stores/ utils/ constants.ts types.ts validators.ts …   (shared by subjects)
  ├── context/                                                                 (React providers)
  └── <subject>/
      ├── components/orchestrators/
      ├── components/presenters/
      └── hooks/
  ```

  `src/shared/` holds what several features use:
  - `components/ui/`: the primitives ([ui-primitives](#ui-primitives)): `Pressable`, `Button`, `Input`, `Card`, `Skeleton`, `ThemedSwitch`, `LoadingSpinner`;
  - `components/<subject>/`: shared blocks by subject (`feedback/`, `form/`, `lists/`, `media/`, `sharing/`, `theme/`);
  - `services/`: the API client `api.ts`, `backendUrl.ts`, storage modules;
  - `query/`: TanStack Query setup ([state.md](state.md));
  - `stores/`: cross-cutting Zustand stores (`socketStore.ts`);
  - `hooks/`, `utils/` (with the `logger`), `constants/`, `theme/` (theme context, themes and tokens).
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

## ui-primitives

Mobile: every touchable element is a `Pressable` or a `Button` from `src/shared/components/ui/` (ESLint `guardrails/ui-primitives`). `TouchableOpacity`, and `Pressable` from `react-native`, are imported or used (`RN.Pressable`) only in `src/shared/components/ui/`, tests included.

- `Pressable` fixes the press opacity (`PRESSED_OPACITY`), sets the `button` role unless told otherwise, fires an optional haptic (`haptic="tap" | "selection" | "success"`, through `@/shared/utils/haptics`) and requires an `accessibilityLabel` in its type, so no control is silent for a screen reader.
- `Button` is built on it; its label (`title` or the text children) is its accessibility label unless one is given.
- Gestures (swipe, drag and drop, the mini-player) stay on `react-native-gesture-handler`.
- A `Text` primitive is not written yet: it comes with the first feature that needs themed typography (#378–#385).

## theme-tokens

Mobile: no colour literal outside `src/shared/theme/` (ESLint `guardrails/theme-tokens`): no hex string (`'#FFF'`), no `rgb(`/`rgba(`/`hsl(` string, and no named colour (`'white'`) as a colour prop or style key; a template literal that starts as a colour (`` `rgba(${r}, …)` ``) counts too. Read the colour from the theme: `const { theme } = useTheme()`, then `theme.colors.primary`. A colour every theme lacks is added to `ThemeColors` (`src/shared/theme/types.ts`) and to the four themes. `'transparent'` is allowed. Tests are covered too.

