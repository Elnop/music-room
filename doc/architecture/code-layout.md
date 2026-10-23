# Code layout

How the code of `backend/` and `mobile/` is organized, and why. This layout comes from the global refactoring epic (#362), modelled on [bedrock](https://github.com/JCluzet/bedrock) (principles) and [VibeAppTemplate](https://github.com/JCluzet/VibeAppTemplate) (its React Native version). It is enforced by `npm run check`: each rule has a section in `.agents/rules/`, linked from its error message.

## Principles shared by both projects

- **One direction of dependencies**, checked by dependency-cruiser, without cycles ([architecture.md](../../.agents/rules/architecture.md#layers)).
- **No import from one feature into another**: what several features share moves up into `shared/` ([no-cross-feature-imports](../../.agents/rules/architecture.md#no-cross-feature-imports)).
- **`@/` for every import that leaves the current folder**, never `../`.
- **No `index.ts` barrel** under `src/`: import the file that holds the code ([no-index-files](../../.agents/rules/structure.md#no-index-files)).
- **150 lines at most per hand-written source file** (tests, generated types, migrations and config excluded): split by use case rather than grow a file.
- **Structured logs** through one logger per project, never `console.*` ([logging.md](../../.agents/rules/logging.md)).
- **One error format**: an error carries an HTTP status, a displayable message, a technical explanation and, when possible, a hint. The backend answers with it and the app reads it in `ApiError`.
- **Tests sit next to the file they test.**
- **Append-only rules**: a rule is never disabled or weakened to let code through, and exception lists only shrink ([guardrails.md](../../.agents/rules/guardrails.md)).

## Backend

```
backend/src/
├── server.ts
├── app/                      composition root: routes.ts (route mounting), openapi.ts; only server.ts imports it
├── realtime/
│   ├── socket-server.ts      server creation, auth, handler wiring
│   ├── handlers/             one file per domain: playlist, listening, control
│   └── emitters/             notify* / sendDeviceCommand, imported by the features
├── features/<name>/
│   ├── <name>.routes.ts      Express router; passes the handlers directly
│   ├── <name>.openapi.ts     OpenAPI registration from the Zod schemas
│   ├── <name>.controller.ts  exported handlers, no try/catch
│   ├── <name>.validators.ts  Zod schemas; request input types are inferred from them
│   ├── <name>.types.ts       response and domain types only
│   ├── services/             all the logic, as modules of exported functions
│   ├── permissions/          authorization checks
│   └── utils/                helpers
└── shared/                   config, middleware, logger, errors, security; never imports a feature
```

- Layers: `routes → controller → services → shared`. `shared/` never imports a feature; `app/` is the only place that knows every feature.
- Services are **modules of functions**, imported as namespaces (`import * as sessionService from '@/features/auth/services/session.service.js'`), never classes instantiated once. Tests mock the module.
- Imports use `@/features/...`, `@/shared/...` or `@/realtime/...`, always with the `.js` extension.
- All anti-abuse code (rate limits, lockout, IP reputation, token and socket limits) is one module, `shared/security/`, which reaches Redis only through `counter.ts`.
- `src/features/auth/` is the reference implementation. Full rule: [backend-feature](../../.agents/rules/structure.md#backend-feature).

## Mobile

```
mobile/src/
├── navigation/               React Navigation; a screen only imports an orchestrator
├── providers/                AppProviders: QueryClient, theme, gestures, safe area…
├── features/<feature>/
│   ├── hooks/ services/ stores/ utils/ types.ts validators.ts …   shared by the feature's subjects
│   ├── context/                                                   React providers
│   └── <subject>/
│       ├── components/orchestrators/   wire hooks and stores, pick the presenter
│       ├── components/presenters/      props in, JSX out; no state, effect or store
│       ├── hooks/                      logic and state; never JSX
│       └── utils/                      optional: the subject's own helpers, no JSX
└── shared/
    ├── components/ui/          primitives: Pressable, Button, Input, Card, Skeleton…
    ├── components/<subject>/   blocks shared by features (feedback, form, lists, media…)
    ├── services/               API client (api.ts), backend URL, storage
    ├── query/                  QueryClient, key factory, cache profiles, socket cache
    ├── stores/                 cross-cutting Zustand stores (socketStore)
    └── hooks/ · utils/ · constants/ · theme/
```

- Features: auth, playlists, player, queue (with Connect and playback transfer), friends, profile, music-control, search. A subject folder always exists, even for a single-subject feature.
- **Component roles** are enforced by an in-house ESLint plugin, without exception: screens import only orchestrators, presenters are pure, hooks contain no JSX, one component per file, components live in their role folder ([components.md](../../.agents/rules/components.md)).
- **Server data lives in TanStack Query**; Zustand only keeps client state (session, player, preferences, UI). A Socket.io event updates the cache (`setQueryData`) or invalidates it through the key factory ([state.md](../../.agents/rules/state.md)).
- A feature's stores stay in the feature (a deliberate difference from VibeAppTemplate, which puts every store in `shared/stores/`), because `queueStore` or `connectStore` hold business logic.
- **Primitives and theme**: every touchable is a `Pressable` or `Button` from `shared/components/ui/` (required `accessibilityLabel`), and every colour comes from the theme tokens ([ui-primitives, theme-tokens](../../.agents/rules/structure.md#ui-primitives)).
- Full placement rule: [placement](../../.agents/rules/structure.md#placement).

## Why

The goals of #362 were: no dead code, one way to do each thing, less and more readable code, and guardrails that stop drift afterwards. The choices behind it (TanStack Query, StyleSheet with tokens, React Navigation, OpenAPI from Zod, function modules, `npm run check`) are justified in [decisions.md](../decisions.md#2-engineering-choices-of-the-refactoring-epic-362).
