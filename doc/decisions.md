# Technical choices and architectural decisions

This document records and justifies the technology and architecture choices of the **Music Room** project (Zumik), against the requirements of the 42 subject (v5.3) and the engineering decisions of the global refactoring epic (#362, feeding issue #97).

Each decision is weighed against the alternatives considered, with the technical reasons they were rejected.

---

## 1. Core stack

### 1.1 Runtime and language: Node.js (v22 LTS), Express and TypeScript

- **Decision**: Node.js 22 LTS, the Express HTTP framework, TypeScript in strict mode (`noImplicitAny`, strict type checking).
- **Why**:
  - **Maturity and predictability**: Express has a mature, stable ecosystem without magic, well suited to a modular, layered architecture.
  - **One language**: TypeScript on both the backend and the mobile app gives one vocabulary, shared domain types, and contract regressions caught at compile time.
  - **Node 22**: native ES modules, an optimized V8 engine, and compatibility with every CI container.
- **Alternatives rejected**:
  - *NestJS*: accidental complexity (heavy inversion of control, decorators and metadata everywhere, an abstraction that hides HTTP and makes tests rigid).
  - *Fastify*: a less universal middleware ecosystem and friction with the Socket.io adapter and the standard security middlewares.
  - *Go or Python (FastAPI)*: a second stack next to the mobile app (React Native), so skills and guardrails could not be shared.

---

### 1.2 Database and identity: Supabase (PostgreSQL, Auth and Row Level Security)

- **Decision**: PostgreSQL managed by Supabase, versioned sequential SQL migrations (`backend/migrations/NNN_*.sql`), the official `@supabase/supabase-js` client used by the backend only (administration and session verification).
- **Why**:
  - **Relational model**: PostgreSQL guarantees the relational and transactional integrity (ACID) that playlists, track ordering, collaboration rights and friendships need.
  - **Solid authentication**: Supabase Auth handles password hashing, OAuth flows (Google, Facebook) and JWT tokens securely.
  - **Reproducible local and CI environment**: the whole Supabase stack runs locally in Docker (`scripts/test-db.sh`, `make supabase-up`), so integration tests are self-contained and need no Internet.
- **Alternatives rejected**:
  - *Self-hosted bare PostgreSQL*: the whole user, OAuth session and administration layer would have to be rebuilt by hand.
  - *Firebase / Google Cloud Firestore*: a NoSQL model unsuited to strict ordering, complex transactions and the subject's many-to-many relations (friendships, playlist rights), plus vendor lock-in.
  - *MongoDB*: no native referential integrity, and extra modelling cost for strongly relational data.

---

### 1.3 Distributed state, cache and anti-abuse: Redis

- **Decision**: Redis 7 through the `ioredis` client, dedicated to real-time state, rate limiting, JWT revocation and concurrent synchronization of the play queues.
- **Why**:
  - **Sub-millisecond in-memory operations**: anti-abuse counters and concurrency locks are handled instantly.
  - **Atomic operations**: Redis pipelines and scripts make window counters and state changes strictly atomic, without race conditions.
  - **No in-memory fallback**: when Redis is unavailable, the service fails in a controlled way instead of weakening security with a fallback local to a single container.
- **Alternatives rejected**:
  - *Memcached*: no rich data structures (hashes, sorted sets), no advanced atomic operations, coarse expiry.
  - *RabbitMQ / Apache Kafka*: built for large-scale streaming and persistent queues; out of proportion for short-lived counters and key-value session data.
  - *In-process Node.js memory*: ruled out: the backend could not scale out, and state would be lost (with security holes) whenever a container restarts.

---

### 1.4 Real time: Socket.io

- **Decision**: Socket.io (WebSocket with HTTP long-polling fallback), JWT authentication at the handshake, events split by domain (`listening`, `playlist`, `control`).
- **Why**:
  - **Built-in rooms**: broadcasts reach only the members of a collaborative playlist or the participants of a listening session.
  - **Mobile network resilience**: transparent reconnection, exponential backoff and event buffering during network changes (Wi-Fi ↔ 4G/5G).
  - **Acknowledgements**: immediate two-way confirmation of actions (e.g. playback control delegation, adding to the queue).
- **Alternatives rejected**:
  - *Raw WebSockets (`ws` library)*: rooms, heartbeat, reconnection, transport fallback and event serialization would all have to be rewritten.
  - *Server-Sent Events (SSE)*: one-way (server to client only); cannot carry the remote-control commands the phone sends to the server.
  - *Plain HTTP long-polling*: too much latency and header overhead per request for fine audio synchronization.

---

### 1.5 Mobile framework: Expo React Native (native Android build)

- **Decision**: Expo SDK 52 / React Native 0.76 compiled as a native Android build (`npx expo run:android`), never through Expo Go.
- **Why**:
  - **Full native access**: the native build includes the native modules the app needs (native Google Sign-In, Facebook SDK, artwork palette extraction with `react-native-image-colors`).
  - **Modern Expo tooling**: assets, configuration (`app.json`), config plugins (`plugins/`) and Android manifest generation handled in one place, without maintaining Gradle projects by hand.
- **Alternatives rejected**:
  - *Expo Go*: cannot run the app: the third-party authentication and image analysis libraries need custom native code that the prebuilt Expo Go client does not have.
  - *Bare React Native (without Expo)*: needless complexity in native dependency versions and manual build scripts, with no functional gain.
  - *Flutter (Dart)*: rejected to keep TypeScript across the whole codebase, sharing API response interfaces and engineering rules.
  - *Pure native (Kotlin/Swift)*: double the development and maintenance cost for a small team, with no added value for a music streaming and remote-control app.

---

### 1.6 Protocol: REST and JSON

- **Decision**: a RESTful architecture, JSON payloads, strict use of standard HTTP status codes (200, 201, 204, 400, 401, 403, 404, 409, 429, 500) and a single error envelope (`ApiError` / `AppError`).
- **Why**:
  - **Universal interoperability**: any HTTP client or inspection tool (Postman, curl, Swagger UI) talks to the API directly.
  - **Network control**: rate limiting and authentication middlewares apply naturally per method and URI.
- **Alternatives rejected**:
  - *GraphQL*: harder standard HTTP caching, no fine per-endpoint rate limiting, exposure to complex recursive queries (DoS), and field selection is useless at this project's data volume.
  - *gRPC / Protobuf*: binary payloads are hard to inspect by hand and fit poorly with Swagger UI, which the subject's demo and evaluation need.
  - *tRPC*: rejected to keep the backend an independent public API documented with OpenAPI, usable by any external client.

---

## 2. Engineering choices of the refactoring epic (#362)

### 2.1 Server data on mobile: TanStack Query (React Query)

- **Decision**: TanStack Query v5 for all data that comes from the network (queries, mutations, cache, deduplication, `isPending`/`isError` states). Zustand is limited to short-lived local client state (user session, UI settings, player state).
- **Why**:
  - **Server state kept apart from client state**: remote data is asynchronous, expires and is shared; mixing it into a global client store breeds invalidation bugs and stale state.
  - **Precise synchronization with Socket.io**: through `socketCache.ts`, real-time events update the cache surgically (`queryClient.setQueryData`) or invalidate queries atomically.
- **Alternatives rejected**:
  - *Zustand for everything*: loading states, retries, deduplication of concurrent requests and cache garbage collection would all have to be written by hand.
  - *Redux Toolkit (RTK Query)*: conceptually heavy, verbose boilerplate, rigid coupling to a global dispatcher.
  - *SWR*: its mutation and cache model is less powerful and less extensible than TanStack Query's (especially for the Socket.io integration).

---

### 2.2 Styling: StyleSheet and theme tokens

- **Decision**: React Native `StyleSheet.create` with strict tokens (`theme.colors.*`, `theme.typography.*`, `theme.spacing.*`) defined in `src/shared/theme/`, enforced by the ESLint rule `guardrails/theme-tokens`.
- **Why**:
  - **Several themes**: the app has 4 complete themes, switchable instantly without a restart.
  - **Native performance**: `StyleSheet` hands styles straight to the native side with no CSS computation at runtime.
  - **No magic values**: a blocking rule forbids raw hard-coded colors outside the theme definition files.
- **Alternatives rejected**:
  - *NativeWind (Tailwind CSS for React Native)*: does not handle switching complete themes on the fly without recompiling the utility classes.
  - *styled-components / Emotion*: high memory footprint and slower renders caused by injecting CSS-in-JS style trees at runtime.
  - *Free inline styles*: a source of visual inconsistencies and wasted renders (a new object allocated on every render).

---

### 2.3 Mobile navigation: React Navigation v7

- **Decision**: React Navigation with strict TypeScript typing (`RootStackParamList`, `NavigationProp`), stacks organized by feature, and screens bound only to orchestrators.
- **Why**:
  - **Precise lifecycle control**: fine control over transitions, animation state and navigation history on Android.
  - **Navigation decoupled from presentation**: a screen imports only an orchestrator component, so navigation stays a simple router with no business logic.
- **Alternatives rejected**:
  - *Expo Router*: imposes a file-based tree (`app/`) that conflicts with the feature-slice layout (`src/features/<feature>/<subject>`), and adds implicit behaviors that are hard to control in strict conditional authentication flows.

---

### 2.4 Backend OpenAPI documentation generated from Zod schemas

- **Decision**: one Zod schema per input, used for HTTP input validation and TypeScript type inference (`z.infer`), together with `@asteasolutions/zod-to-openapi` to generate the Swagger UI documentation (`/api-docs`).
- **Why**:
  - **Single source of truth**: the runtime validator (Zod), the compile-time TypeScript types and the published OpenAPI documentation cannot drift apart.
  - **Subject compliance**: subject v5.3 explicitly accepts generated OpenAPI documentation as long as it accurately describes methods, parameters and response codes.
- **Alternatives rejected**:
  - *Hand-written OpenAPI / Swagger (YAML/JSON)*: inevitably drifts from the implementation as the code evolves.
  - *tsoa or NestJS decorators*: impose object-oriented code with classes and experimental TypeScript decorators, against the rule of modules made of plain functions.

---

### 2.5 Backend internals: function modules

- **Decision**: no more singleton class instances; TypeScript modules exporting plain functions (`services/<name>.service.ts`), imported as namespaces (`import * as authService from ...`).
- **Why**:
  - **Readability and testability**: functions take their dependencies as parameters or call shared utilities, with no hidden internal state, which makes mocks in Vitest much simpler.
  - **Less code**: no constructor boilerplate and no needless dependency-injection containers.
- **Alternatives rejected**:
  - *Classes with dependency injection (Inversify / Nest style)*: more complex code with no tangible benefit for an application of this size.

---

### 2.6 Guardrails (`npm run check`)

- **Decision**: one `npm run check` command in each project (backend and mobile), run at pre-commit by Husky and in GitHub Actions CI, built on these parallel checkers:
  1. `type-check` (`tsc --noEmit`): strict type checking.
  2. `lint` (ESLint 9 flat config + the in-house `components` plugin): component roles, no `console.*`, no parent relative imports (`@/` required), one component per file.
  3. `check:dead-code` (`knip`): finds and removes dead code (orphan files, exports, types and dependencies).
  4. `check:deps` (`dependency-cruiser`): no cycles, logical layers respected, features kept apart.
  5. `check:duplication` (`jscpd`): strict duplication control (zero clones tolerated).
  6. `check:semgrep` and `check:ast-grep`: anti-pattern detection (e.g. no direct `fetch` call or AsyncStorage access outside the allowed modules).
  7. `check:secrets` (`gitleaks` through Docker): blocks any leaked token, API key or secret.
  8. `test` (Vitest on the backend, jest-expo on mobile): runs every unit and integration test suite.
  9. `check:exceptions`: checks that the exception lists never grow and trend towards zero.
- **Why**:
  - **Append-only policy**: no rule can be disabled or switched to "warning" to let code through.
  - **Autonomy for the team and for AI agents**: the guardrails give immediate, unambiguous feedback on any architectural regression.
- **Alternatives rejected**:
  - *Manual code review only*: fallible, slow, and unable to keep the criteria constant across dozens of successive PRs.
  - *Permanent suppressions (lax `eslint-disable`)*: slowly turns quality rules into wishful thinking.

---

## 3. Smaller decisions taken during development

One line each, with the issue that holds the discussion. Decisions that shape a feature are explained in its document under [features/](features/).

- **Scope of the subject** (2026-10-05): deliver Playlist Editor and Music Control Delegation, not Music Track Vote; bonuses are out of scope until the mandatory part is perfect. See [subject/coverage.md](subject/coverage.md).
- **Track concurrency** (2026-10-06, #86): fractional ranks, one Postgres function per operation under a playlist lock, `409` only when the same track moved. See [features/playlist-concurrency.md](features/playlist-concurrency.md).
- **Device licenses** (2026-10-05, #77): the "all my devices" switch is kept next to the per-device licenses. See [features/control-delegation.md](features/control-delegation.md).
- **Queue access for delegates** (2026-10-14, #294): control of one device is enough to manage the owner's queue; no second rights system. See [features/queue-and-connect.md](features/queue-and-connect.md).
- **Integration tests on a local Supabase stack** (2026-10-05, #48): not a bare Postgres, because supabase-js goes through PostgREST and Auth and the migrations use `auth.uid()` and `auth.users`.
- **Local Supabase stack by default in development** (#128): `SUPABASE_MODE=local`, a persistent `music-room-dev` stack, so no one needs the hosted project's keys to work.
- **Node 22** everywhere (`.nvmrc`, Dockerfiles, CI), changed together through a ticket (#48).
- **Rate limiters always on Redis, fail closed** (#120): a limiter never counts in memory, whatever the startup order.
- **Throwaway Supabase client for sign-ins** (#136): the shared admin client keeps its service role after a user signs in.
- **No Supabase in the app** (#376): every auth call goes through the backend, which logs it; the anon key gives no table access anyway (#201).
- **Password reset for Google/Facebook-only accounts is allowed** (2026-10-10, #189): it adds email and password sign-in to the account.
- **System media controls with `expo-media-control`** (2026-10-15, #309), chosen over expo-audio's own controls (needs a later SDK), react-native-track-player, react-native-audio-api and a homemade module: a thin library that only shows the controls and forwards their events.
- **Expired stream URLs are renewed by the player** (#313): the backend returns `expiresAt`; the app renews before play or seek, and once after a failure, at the same position. Stream URLs are never stored.
- **One language in the app: French** (#341), formal register; the repository (code, docs, commits) is in English.
- **Release APK built by GitHub Actions on every push to `main`** (#264), signed with the committed debug keystore and published as a GitHub Release.
