# Architecture rules

Read before adding an import that crosses folders, a feature, or a module in `shared/`. Every rule here is checked by `npm run check`; the error message links to its section. Rules are append-only: see [guardrails.md](guardrails.md#append-only-rules).

## layers

Dependencies point one way. Enforced by dependency-cruiser (`.dependency-cruiser.cjs` in each project).

- Backend: `routes -> controller -> services -> shared`. `src/shared/` never imports `src/features/` or `src/realtime/` (rule `shared-not-to-features`). Inside a feature, `services/` never imports a `*.controller.ts` or `*.routes.ts` file (rule `services-not-to-controller`).
- Mobile, target layout (#377): `src/shared/` never imports `src/features/` or `src/navigation/` (rule `shared-not-to-features`), and `src/features/` never imports `src/navigation/` (rule `features-not-to-navigation`). These rules match nothing until those folders exist.

Fix: move the code the lower layer needs down into it (usually `shared/`), or pass it in as a parameter.

## no-cross-feature-imports

A file in `src/features/<a>/` never imports from `src/features/<b>/` (dependency-cruiser rule `no-cross-feature-imports`). What two features share moves up into `src/shared/`.

## no-circular

No import cycle, between files or folders (dependency-cruiser rule `no-circular`). Break a cycle by moving the shared piece into a third module both sides import, or by passing a callback instead of importing back.

## no-parent-imports

An import that leaves the current folder goes through the `@/` alias (`@/features/...`, `@/shared/...`), never `../` (ESLint `no-restricted-imports`). Imports inside the current folder (`./x`) stay relative. In the backend, keep the `.js` extension.

## no-legacy-aliases

Mobile only: `@/` is the only alias. The older aliases (`@api`, `@components`, `@contexts`, `@screens`, `@services`, `@store`, `@hooks`, `@utils`, `@themes`, `@constants`) are banned in new code (ESLint `no-restricted-imports`); write `@/components/...` instead of `@components/...`. They stay in `babel.config.js` and `tsconfig.json` until the last file using them migrates.
