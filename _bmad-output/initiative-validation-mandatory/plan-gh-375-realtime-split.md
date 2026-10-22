---
title: 'Backend : realtime découpé par domaine et racine de composition hors de shared (#375)'
type: 'refactor'
ticket: 'https://github.com/Elnop/music-room/issues/375'
created: '2026-10-22'
status: 'built'
baseline_revision: '85b3fb637d48eca89b2cf7defdecf22709fd8197'
route: 'full'
route_source: 'auto'
risk: 'high'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md', '{project-root}/docs/superpowers/specs/2026-10-21-clean-codebase-refactor-design.md', '{project-root}/.agents/rules/structure.md', '{project-root}/.agents/rules/architecture.md', '{project-root}/.agents/rules/logging.md', '{project-root}/.agents/rules/guardrails.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #375, epic #362. `backend/src/realtime/index.ts` (763 lines) holds the whole Socket.io server in one `RealtimeService` class: connection and auth wiring, the device registry, the playlist, listening and control handlers, and the `notify*` emitters that the features call. It is also an `index.ts`, which the rules forbid (it sits in the ESLint suppressions). Separately, `shared/config/routes.ts` and `shared/config/swagger.config.ts` aggregate every feature. `shared/` therefore imports `features/`, and those dependency-cruiser exceptions can never shrink (comments on #375 from #364 and #373).

**Approach:**
- Split `realtime/` into function modules: module-level server state, a bootstrap that wires connection and auth, one handler file per domain (playlist, listening, control, devices), and an emitters module that features import for `notify*` / `sendDeviceCommand` / `revalidate*` and the read helpers. `index.ts` disappears.
- Move the composition root (routes registry and OpenAPI document assembly) out of `shared/` into `src/app/`, which may import features. `shared/` keeps only what features themselves import (envelope, param helpers, shared error responses).

## Boundaries & Constraints

**Always:**
- Socket.io event names, payloads, rooms, acknowledgements, error codes, per-event rate limits and auth behaviour are byte-for-byte the same as on `develop`. The realtime integration tests (`*.int.test.ts` under `realtime/` and the features) pass with unchanged assertions; only imports and the way they reach internals may change.
- The HTTP API and `/api-docs` output are unchanged; `openapi-coverage.test.ts` passes.
- Style per `.agents/rules/structure.md#backend-feature`: functions, namespace imports, files ≤ 150 lines, no `index.ts`.
- `npm run check` is green. Remove the `realtime/index.ts` ESLint suppression and the `shared → features` dependency-cruiser entries this fixes, and add none. Add a dependency-cruiser rule: `src/app/` may import features and shared; nothing imports `src/app/` except `server.ts`.
- Update `AGENTS.md` (the Socket.io line and the routes and OpenAPI lines), `.agents/rules/architecture.md` (the `app` layer), `backend/README.md` and `mobile` docs that name `realtime/index.ts`.

**Never:**
- Change the mobile side (`mobile/src/store/socketStore.ts`, hooks); event names stay.
- Change what a handler does, the order of its checks, or the queueing per socket (`createSocketQueue`).

</frozen-after-approval>

## Code Map

- `realtime/index.ts` (763 lines) -- `class RealtimeService` with the `realtime` singleton export at l.763. Its members:
  - `initialize(httpServer)`: l.69–160, connection, auth, disconnect and error handling.
  - `registerDevice`: l.161.
  - `createSocketQueue`: l.181.
  - Playlist handlers: l.195–255 (`playlist:join` / `playlist:leave`, `joinPlaylistRoom`).
  - Listening handlers: `subscribeToListening` at l.256, plus `listening:update`, `listening:subscribe` and `listening:unsubscribe` in `registerMusicControlHandlers` at l.321.
  - `control:action`: l.374–451.
  - `broadcastUserListeningStatus`: l.452.
  - `handleDisconnect`: l.522.
  - Public emitters and queries: `notifyPlaylistUpdate`, `notifyPlaylistDetails`, `notifyPlaylistDeleted`, `notifyQueueUpdate`, `sendDeviceCommand`, `revalidatePlaylistRoom`, `revalidateListeningAccess`, `getIO`, `getUserListeningStatus`, `setDeviceName` and `isDeviceOnline` (l.559–760).

  Suggested target:
  - `realtime/state.ts`: `io`, the device and listening maps, and their getters.
  - `realtime/socket-server.ts`: `initialize`, wiring auth, the device registry and every handler.
  - `realtime/handlers/{playlist,listening,control}.handler.ts`.
  - `realtime/devices.ts`: registry, `isDeviceOnline` and `setDeviceName`.
  - `realtime/emitters.ts`: the `notify*` functions, `sendDeviceCommand` and `revalidate*`.
  - `realtime/socket-queue.ts`.

  Split differently if that reads better; every file must stay under 150 lines.
- Existing `realtime/event-rate-limit.ts`, `music-control-access.ts`, `playlist-room.ts` and `socket-auth.ts` stay where they are, and may move into `handlers/` or `realtime/` subfolders if that helps. #374 moved the event limiter to `shared/security/socket-event-limit.ts` (`createSocketEventLimiter()`).
- Importers of `@/realtime/index.js`:
  - `server.ts`;
  - `music-control-devices.controller.ts` and `control-switch.service.ts`;
  - the playlist `collaborator`, `playlist-track`, `playlist-update` and `viewer` services;
  - the queue `permissions`, `queue.service`, `queue-sync.service` and `queue-transfer.service`, and `queue-play-command.ts`;
  - the tests.

  Switch them to the emitters module with a namespace import, e.g. `import * as realtime from '@/realtime/emitters.js'`, so call sites keep `realtime.notifyX(...)`.
- Types: `music-control.types.ts` keeps the realtime payload types left there by #371. Move them into `realtime/` if they are only used by realtime and its emitters, and update the importers.
- `shared/config/routes.ts` -- the `routes` registry. Move it to `src/app/routes.ts`. `openapi-coverage.test.ts` imports it and moves too.
- `shared/config/swagger.config.ts` -- builds the registry from every feature's `register*Openapi`. Move it to `src/app/openapi.ts`. Keep `swagger.schemas.ts` and `swagger.errors.ts` in `shared/config/` (features import them). `server.ts` imports from `src/app/`.
- `.dependency-cruiser.cjs` and its baseline -- add the `app` rule and regenerate the baseline (entries go away). `eslint-suppressions.json` -- prune it.

## Tasks & Acceptance

**Execution:**
- [x] Split `realtime/` into function modules; delete `index.ts` -- domain files.
- [x] Update importers to the emitters module -- no behaviour change.
- [x] Move `routes.ts` and `swagger.config.ts` to `src/app/`; add the depcruise rule -- composition root out of `shared/`.
- [x] Move or adapt the tests; prune the exceptions; update the docs listed above.

**Acceptance Criteria:**
- Given `backend/src/realtime/`, then there is no `index.ts`, no class, and no file over 150 lines.
- Given the realtime and feature integration tests, when they run, then they pass with unchanged assertions.
- Given `grep -rn "features/" backend/src/shared --include='*.ts' | grep import | grep -v test`, then nothing is found.
- Given `npm run check`, then it is green with the `realtime/index.ts` suppression and the `shared → features` depcruise entries gone.

## Implementation Notes

- `realtime/`: `state.ts` (io, device and listening maps), `socket-server.ts` (initialize), `socket-queue.ts`, `devices.ts` (register, disconnect), `listening-status.ts` (statuses, broadcast, throttle), `handlers/{playlist,listening,control}.handler.ts`, and three emitter modules instead of one (`emitters/{playlist,queue,control}.emitters.ts`) to stay under 150 lines; each feature file imports the one it needs as `import * as realtime from ...`, so call sites are unchanged.
- `LatestThrottle` class became `createLatestThrottle()` (no class left in `realtime/`); `socket-auth.ts` trimmed from 153 to 148 lines (comment reflow, one object literal on one line).
- `ListeningStatus`, `UserListeningStatus`, `ControlActionPayload`, `ControlRevokedPayload` moved to `realtime/listening.types.ts` (only realtime used them). `DeviceInfo` and the `DeviceCommand` family stay in music-control (features use them).
- Unused `getUserListeningStatus` public method is now the internal read helper used by subscribe and broadcast.
- Tests that `vi.spyOn`'d the singleton now `vi.mock` the emitter module (partial, `importOriginal`) and use `vi.mocked(...)`; assertions untouched.
- `shared/config/trust-proxy.int.test.ts` moved to `src/app/` (it composes the auth middleware and the socket server), which removes its two `shared-not-to-features` entries.
- Depcruise rule `app-only-from-server`. Baseline 56 -> 39 entries (all `shared-not-to-features` gone); ESLint suppressions empty; jscpd ignore of `realtime/index.ts` removed.
- Log difference: the `not_initialized` warning of `notifyPlaylistUpdate` now also carries `tracksVersion` (shared helper); socket events unchanged.

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd backend && npm run check` -- expected: all OK.
- `cd backend && sh scripts/test-db.sh up && npm run test:int; sh scripts/test-db.sh down` -- expected: all pass.
- `curl -s localhost:3000/api-docs.json` on `develop` and on the branch (or a script that imports the spec) -- expected: identical.

### Pass 1 (quick) — high 0 / medium 0 / low 1 / false 0 / maybe-false 0

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| The epic spec's backend layout still shows `realtime/index.ts` and no `src/app/` | low | patch | `structure.md#placement` defers to the spec, so an agent could recreate `index.ts`. I patched the spec's layout block myself. |
