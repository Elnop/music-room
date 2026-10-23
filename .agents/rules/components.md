# Component rules

Read before authoring or editing React components, orchestrators, presenters, hooks, or screens in `mobile/`. Every rule here is checked by `npm run check` (ESLint plugin `components`); the error message links to its section. Rules are append-only: see [guardrails.md](guardrails.md#append-only-rules).

The component architecture:
- **Screens / Navigation** (`src/navigation/`): define navigation stacks and routes; screens only mount orchestrators.
- **Orchestrators** (`features/<feature>/<subject>/components/orchestrators/`): connect hooks and stores, manage high-level presentation decisions, and select presenters.
- **Presenters** (`features/<feature>/<subject>/components/presenters/`): pure presentation components; props in, JSX out; no state, no effects, no stores, no queries.
- **Hooks** (`features/<feature>/<subject>/hooks/`): contain component logic, state, and mutations; zero JSX.

---

## screen-orchestrator-only

Screens and navigation stacks/navigators in `src/navigation/**` or screen component files (`*Screen.tsx`) must only import orchestrators from `src/features/**`.

- **Forbidden**: Importing presenters directly into a navigation stack or screen file (`import { FooView } from '@/features/.../presenters/FooView'`).
- **Allowed**: Importing orchestrators (`import { FooOrchestrator } from '@/features/.../orchestrators/FooOrchestrator'`), type definitions (`import type { ... }`), or shared navigation primitives.
- **Fix**: Mount an orchestrator that coordinates the feature's presenters and hooks.

---

## presenter-pure

Presenters in `*/presenters/**` must remain purely visual and deterministic.

- **Forbidden**:
  - State hooks: `useState`, `useReducer`, `React.useState`, `React.useReducer`.
  - Effect hooks: `useEffect`, `useLayoutEffect`, `useInsertionEffect`.
  - Store hooks or imports: `use*Store`, `useAuthStore`, `usePlayerStore`, `from '@/features/*/stores/*'`.
  - Query hooks: `useQuery`, `useMutation`, `use*Query`, `use*Mutation`.
  - Direct network calls: `fetch`, `apiRequest`, `axios`.
- **Allowed**: `useTheme()`, `useMemo()` for styles or pure formatting, and standard layout helpers (`useSafeAreaInsets()`, `useWindowDimensions()`).
- **Fix**: Move state, side effects, store reads, and queries up into the orchestrator or a custom hook, passing the required data and event callbacks down to the presenter as props.

---

## hook-no-jsx

Hooks in `*/hooks/**` or files named `use*.ts` / `use*.tsx` must contain logic only and no JSX elements or fragments.

- **Forbidden**: Returning or embedding `<View>`, `<Text>`, `<Component />`, or fragments `<>...</>`.
- **Allowed**: Returning state values, callbacks, mutation triggers, refs, and query results.
- **Fix**: Return pure data and handler functions from the hook; let presenters and orchestrators handle JSX rendering.

---

## one-component-per-file

Each component file in `src/**` must declare at most one React component.

- **Forbidden**: Defining multiple components (e.g. `MainComponent` and helper subcomponents `SubHeader`, `CardRow`) inside the same file.
- **Allowed**: Helper functions that return primitive values, data calculations, style factories (`createStyles`).
- **Fix**: Extract each additional React component into its own dedicated file.

---

## component-role-directory

In `src/features/**`, every React component must reside within a designated role directory.

- **Allowed paths** (one layout for every feature, see [structure.md](structure.md#placement)):
  - `features/<feature>/<subject>/components/orchestrators/<File>.tsx`
  - `features/<feature>/<subject>/components/presenters/<File>.tsx`
  - `features/<feature>/context/<File>.tsx` (React Context Providers)
- **Forbidden**: any other place, such as a role folder without `components/` (`features/<feature>/<subject>/presenters/`), a role folder without a subject folder (`features/<feature>/components/presenters/`), a doubled `components/` (`features/<feature>/components/<subject>/components/presenters/`), a nested role folder, or an arbitrary folder (`features/<feature>/<subject>/components/`, `features/<feature>/feedback/`). A feature with a single subject still has its subject folder.
- **Not concerned**: files without JSX, tests (`*.test.*`), files outside `src/features/`.
- **Fix**: Move the component into its subject's `components/orchestrators/` or `components/presenters/` folder, or convert non-rendering helper components into hooks.

---

## orchestrator-no-fetch

Orchestrators in `*/orchestrators/**` must not perform direct network calls.

- **Forbidden**: Calling `fetch(...)`, `apiRequest(...)`, `axios(...)`, or importing the raw `apiRequest` client.
- **Allowed**: Delegating all data fetching and mutations to TanStack Query hooks (`use*Query`, `use*Mutation`) or feature service hooks.
- **Fix**: Extract API calls into feature services and wrap them in TanStack Query hooks.
