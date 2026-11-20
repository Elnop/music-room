# Component rules

Read before authoring or editing React components, orchestrators, presenters, hooks, or screens in `mobile/`. Every rule here is checked by `npm run check`: the ESLint plugin `components`, whose messages link to their section, and dependency-cruiser for the roles ([roles-by-name](#roles-by-name)). Rules are append-only: see [guardrails.md](guardrails.md#append-only-rules).

The component architecture:
- **Screens / Navigation** (`src/app/`): define navigation stacks and routes; screens only mount orchestrators.
- **Orchestrators**, named `XContainer` (or `XLayout`, `XPage`): connect hooks and stores, manage high-level presentation decisions, and select presenters.
- **Presenters**, every other component: props in, JSX out; they reach no store and no query, through no chain of imports.
- **Hooks** (`features/<feature>/<subject>/hooks/`): contain component logic, state, and mutations; zero JSX.

---

## screen-orchestrator-only

Screens and navigation stacks/navigators in `src/app/**` or screen component files (`*Screen.tsx`) must only import orchestrators from `src/features/**`.

- **Forbidden**: Importing presenters directly into a navigation stack or screen file (`import { FooView } from '@/features/.../presenters/FooView'`).
- **Allowed**: Importing orchestrators (`import { FooContainer } from '@/features/.../FooContainer'`, or any file of an `orchestrators/` folder), type definitions (`import type { ... }`), or shared navigation primitives.
- **Fix**: Mount an orchestrator that coordinates the feature's presenters and hooks.

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

## orchestrator-no-fetch

Orchestrators (`*/orchestrators/**`, or a file named `XContainer`, `XLayout`, `XPage`) must not perform direct network calls.

- **Forbidden**: Calling `fetch(...)`, `apiRequest(...)`, `axios(...)`, or importing the raw `apiRequest` client.
- **Allowed**: Delegating all data fetching and mutations to TanStack Query hooks (`use*Query`, `use*Mutation`) or feature service hooks.
- **Fix**: Extract API calls into feature services and wrap them in TanStack Query hooks.

---

## roles-by-name

The role of a component is read from its name, as in [brutalway](https://brutalway.elnop.dev/) (epic #616, #622), and checked by dependency-cruiser ([mobile-layers](architecture.md#mobile-layers)):

- an orchestrator is named `XContainer`, `XLayout` or `XPage` (`LoginContainer`, `MiniPlayerContainer`); a component that only lays out its children without reading state is a presenter and does not take these suffixes (`AuthFormFrame`, `ProfileScreenFrame`);
- `presenters-are-pure`: a presenter reaches no `xStore.ts`, no `xClient.ts`, no zustand and no TanStack Query through any chain of imports, so a presenter that imports a hook which writes a store is refused too. Pass the state and the callbacks from the orchestrator above; a hook of local state (`useState`, `useMeasuredPress`) stays allowed;
- `presenters-render-presenters`: a presenter imports no orchestrator; render the orchestrator from the orchestrator above, or pass it as a prop.

Example: `TrackActionsButton` measures where it is with `useMeasuredPress` and passes the anchor to its `onPress`; the hook that opens the menu records it in `menuAnchorStore`.

The folder-based ESLint rules `presenter-pure` and `component-role-directory` were replaced by these rules (#622). The `orchestrators/` and `presenters/` folders stay where they are until each feature moves to the brutalway layout; check-tree then sorts components by kind once a folder holds two of them.

