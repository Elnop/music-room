# Architecture rules

Read before adding an import that crosses folders, a feature, or a module in `shared/`. Every rule here is checked by `npm run check`; the error message links to its section. Rules are append-only: see [guardrails.md](guardrails.md#append-only-rules).

## layers

Dependencies point one way. Enforced by dependency-cruiser (`.dependency-cruiser.cjs` in each project).

- Backend: `routes -> controller -> services -> shared`. `src/shared/` never imports `src/features/` or `src/realtime/` (rule `shared-not-to-features`). `src/app/` is the composition root (the routes registry `app/routes.ts` and the OpenAPI document `app/openapi.ts`): it may import features and shared, and only `src/server.ts` imports it (rule `app-only-from-server`). Inside a feature, `services/` never imports a `*.controller.ts` or `*.routes.ts` file (rule `services-not-to-controller`).
- Mobile: `app -> features -> shared`, the layers of [brutalway](https://brutalway.elnop.dev/), checked by the `layers` preset of `@brutalway/dependency-cruiser-config` (epic #616). `src/app/` composes the features (navigators, stacks, screens that join several features) and imports only `src/features/`; what it needs from `src/shared/` (theme, breakpoints, socket, startup) goes through the `features/shell` feature. `src/shared/` never imports `src/app/` (local rule `shared-not-to-app`), nor does a feature (`features-not-to-app`). Type-only imports (`import type`) do not count (`tsPreCompilationDeps: false`). The rules of the preset are listed in [mobile-layers](#mobile-layers); it has no exception list, so every violation fails `npm run check`.

Fix: move the code the lower layer needs down into it (usually `shared/`), or pass it in as a parameter.

## no-cross-feature-imports

Backend: a file in `src/features/<a>/` never imports from `src/features/<b>/` (dependency-cruiser rule `no-cross-feature-imports`). What two features share moves up into `src/shared/`. The mobile has the same rule under the name `no-cross-feature` ([mobile-layers](#mobile-layers)).

## no-circular

No import cycle, between files or folders (dependency-cruiser rule `no-circular`). Break a cycle by moving the shared piece into a third module both sides import, or by passing a callback instead of importing back.

## no-parent-imports

An import that leaves the current folder goes through the `@/` alias (`@/features/...`, `@/shared/...`), never `../` (backend: ESLint `no-restricted-imports`; mobile: oxlint `no-restricted-imports` from the brutalway preset, which also refuses `./x`). In the backend, imports inside the current folder (`./x`) stay relative and keep the `.js` extension.

## no-legacy-aliases

Mobile only: `@/` (to `src/`) and `@test-utils/` (to `test-utils/`, the helpers tests share) are the only aliases, in `tsconfig.json` and `babel.config.js` (`module-resolver`, which jest uses too). Production code never imports `test-utils/` (dependency-cruiser `no-prod-to-tests`). The older aliases (`@api`, `@components`, `@contexts`, `@screens`, `@services`, `@store`, `@hooks`, `@utils`, `@themes`, `@constants`) were removed by #377: they resolve to nothing, so type-check and dependency-cruiser (`no-unresolvable`) refuse them. Write `@/shared/...`, not `@utils/...`.

## mobile-layers

The rules of `@brutalway/dependency-cruiser-config/layers` on the mobile (`npm run check:deps`). Each message says what to change; the README of the package has the details.

| Rule | Rejects | Fix |
| --- | --- | --- |
| `no-cross-feature` | a feature importing another feature | move what they share into a shared feature of `src/shared/`, or pass it from `app/` as a prop |
| `shared-not-to-features` | a shared feature of `src/shared/` importing `app/` or `features/` | move the code down into the shared feature, or up into the feature |
| `no-cross-shared` | a shared feature of `src/shared/` importing another shared feature | merge the two shared features, or move the code that links them into a feature |
| `app-only-to-features` | `src/app/` importing `src/shared/` | wrap what `app/` needs in a feature (`features/shell`) |
| `features-not-to-app` | a feature importing `src/app/` | `app/` composes the features, never the other way |
| `no-cross-sub-feature` | a sub-feature (`features/<y>/` inside a feature or a shared feature) importing a sibling or the root of its parent | move what they share into a shared feature of the parent `shared/` |
| `no-cross-sub-shared` | a shared feature of the `shared/` of a feature importing another shared feature, a sub-feature or the root of its parent | merge the shared features, or move the code into the root or a sub-feature |
| `feature-nesting-too-deep` | a feature or a shared feature nested more than 10 levels deep | move the deepest sub-features up |
| `presenters-are-pure` | a presenter (a component not named `XContainer`, `XLayout`, `XPage`, `XContent`, `XConfig` or `XProvider`) reaching a store, an `xClient.ts`, zustand or TanStack Query through any chain of imports | read the state in the orchestrator above and pass it through props |
| `presenters-render-presenters` | a presenter importing an `XContainer`, `XLayout` or `XPage` | render the orchestrator from the orchestrator above, or rename a presenter that only lays out its children (`AuthFormLayout`) |
| `stores-hold-no-server-data` | an `xStore.ts` importing an `xClient.ts`, an `xKeys.ts`, a hook or TanStack Query | server data goes through a query hook, a store keeps UI state |
| `stores-in-their-folder` | an `xStore.ts` outside the root or the `stores/` folder of its level | move it there |
| `analytics-in-client` | an analytics SDK imported outside an `analyticsClient.ts` | call the client |
| `no-prod-to-tests` | production code importing a test file, `test-utils/` or `e2e/` | keep test helpers for tests |
| `not-to-dev-dep` | code under `src/` importing a devDependency | move the package to `dependencies`, or the code out of `src/` |
| `no-unresolvable` | an import that resolves to no file | fix the path or the alias |
| `no-circular` | an import cycle | see [no-circular](#no-circular) |

