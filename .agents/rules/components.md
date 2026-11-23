# Component rules

Read before authoring or editing React components, orchestrators, presenters, hooks, or screens in `mobile/`. Every rule here is checked by `npm run check`: dependency-cruiser (`npm run deps`, preset `@brutalway/dependency-cruiser-config`) for the roles and what they import, and oxlint for the hooks. Rules are append-only: see [guardrails.md](guardrails.md#append-only-rules).

The component architecture:
- **Screens / Navigation** (`src/app/`): define navigation stacks and routes; screens only mount orchestrators.
- **Orchestrators**, named `XContainer` (or `XLayout`, `XPage`): connect hooks and stores, manage high-level presentation decisions, and select presenters.
- **Presenters**, every other component: props in, JSX out; they reach no store and no query, through no chain of imports.
- **Hooks** (`features/<feature>/<subject>/hooks/`): contain component logic, state, and mutations; zero JSX.

---

## app-composes-orchestrators

`src/app/` composes the features through their orchestrators (dependency-cruiser `app-composes-orchestrators`): a file of `src/app/**` imports from `src/features/**` only components named `XContainer`, `XLayout`, `XPage` or `XProvider`.

- **Forbidden**: Importing a presenter into a navigation stack or screen file (`import { FooView } from '@/features/.../presenters/FooView'`).
- **Allowed**: Importing orchestrators (`import { FooContainer } from '@/features/.../FooContainer'`), hooks, types and other `.ts` files of a feature.
- **Fix**: Mount an orchestrator that coordinates the feature's presenters and hooks. A screen made only of presenters is an `XPage` or an `XLayout` of its feature.

---

## hook-no-jsx

A hook lives in its own `useX.ts` file and contains logic only, no JSX element or fragment (oxlint `hook-files` and `hook-naming`, brutalway preset).

- **Forbidden**: Returning or embedding `<View>`, `<Text>`, `<Component />`, or fragments `<>...</>`.
- **Allowed**: Returning state values, callbacks, mutation triggers, refs, and query results.
- **Fix**: Return pure data and handler functions from the hook; let presenters and orchestrators handle JSX rendering.

---

## orchestrators-use-hooks

An orchestrator (a file named `XContainer`, `XLayout` or `XPage`) imports no `xClient.ts` (dependency-cruiser `orchestrators-use-hooks`). An `xClient.ts` is a client of an external API, the only place `fetch` may run ([no-fetch-outside-api-client](guardrails.md#no-fetch-outside-api-client)).

- **Forbidden**: Importing `apiClient.ts`, or any other `xClient.ts`, into an orchestrator.
- **Allowed**: Delegating all data fetching and mutations to TanStack Query hooks (`use*Query`, `use*Mutation`) or feature service hooks.
- **Fix**: Move the call into a `useX` hook and call the hook from the orchestrator.

---

## roles-by-name

The role of a component is read from its name, as in [brutalway](https://brutalway.elnop.dev/) (epic #616, #622), and checked by dependency-cruiser ([mobile-layers](architecture.md#mobile-layers)):

- an orchestrator is named `XContainer`, `XLayout` or `XPage` (`LoginContainer`, `MiniPlayerContainer`); a component that only lays out its children without reading state is a presenter and does not take these suffixes (`AuthFormFrame`, `ProfileScreenFrame`);
- `presenters-are-pure`: a presenter reaches no `xStore.ts`, no `xClient.ts`, no zustand and no TanStack Query through any chain of imports, so a presenter that imports a hook which writes a store is refused too. Pass the state and the callbacks from the orchestrator above; a hook of local state (`useState`, `useMeasuredPress`) stays allowed;
- `presenters-render-presenters`: a presenter imports no orchestrator; render the orchestrator from the orchestrator above, or pass it as a prop.

Example: `TrackActionsButton` measures where it is with `useMeasuredPress` and passes the anchor to its `onPress`; the hook that opens the menu records it in `menuAnchorStore`.

The folder-based rules `presenter-pure` and `component-role-directory` were replaced by these rules (#622). The `orchestrators/` and `presenters/` folders stay where they are until each feature moves to the brutalway layout; check-tree then sorts components by kind once a folder holds two of them.

