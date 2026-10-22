---
title: 'Backend : feature music-control en fonctions et layout uniforme (#371)'
type: 'refactor'
ticket: 'https://github.com/Elnop/music-room/issues/371'
created: '2026-10-22'
status: 'built'
baseline_revision: '8ab0dbc2a9c3fb1b657c4aad6de84bd91147d8d3'
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

**Problem:** GitHub #371, epic #362. The `music-control` backend feature still uses classes instantiated once, `try/catch` controllers and files over ~150 lines, unlike the pattern #367 set for auth.

**Approach:** Apply the "Backend feature" pattern of `.agents/rules/structure.md` (set by #367) to `music-control`:
- services are modules of exported functions under `services/`, imported by namespace;
- handlers are exported functions with no `try/catch`, and routes pass them directly;
- input types come from `z.infer`, and DTOs that duplicate the validators go;
- every file is under 150 lines;
- tests follow the code.

## Boundaries & Constraints

**Always:**
- Same endpoints, middleware order, status codes, error `code`s, messages, response bodies and Socket.io emissions as on `develop`.
- `npm run check` green; prune the exception entries this fixes (ESLint suppressions, depcruise baseline, jscpd `ignore`), and never add any.
- Coverage of `src/features/music-control` (by `vitest run --coverage`) is at least the baseline taken before the change. Unit and integration tests pass (`npm run test:int` on the local stack, `sh scripts/test-db.sh up`).
- Imports of this feature from other features or `realtime/` are updated, not wrapped.

**Never:**
- Touch the anti-abuse code (#374) or split `realtime/index.ts` (#375) beyond import updates.
- Change behaviour to simplify code.

</frozen-after-approval>

## Code Map

- `music-control.service.ts` (172, feature root) -- move it into `services/` and split it.
- `music-control.controller.ts` (258, 10 `try/catch`) -- split it (permissions, devices, licences).
- Classes: `MusicControlController`, `MusicControlService`, `DeviceService`, `ControlAccessService` (the queue feature and `realtime` import it), `ControllableDevicesService` and `DeviceLicenseService`.
- `music-control.types.ts` (156) -- drop the duplicated DTOs.
- `utils/device.helpers.ts` (96) is already functional.
- External importers: `grep -rn "features/music-control" backend/src --include='*.ts' | grep -v "src/features/music-control/"`.
- Reference implementation: `backend/src/features/auth/` after #367.

## Tasks & Acceptance

**Execution:**
- [x] Record `npx vitest run --coverage src/features/music-control` -- baseline.
- [x] Services, then controllers and routes, then types -- to the pattern -- uniform layout.
- [x] External importers and tests -- follow the code -- consistency.
- [x] Exception lists -- prune -- shrink-only.

**Acceptance Criteria:**
- Given `src/features/music-control`, when listing it, then no `class` is left (error classes excepted), no file is over 150 lines, and the logic lives in `services/`.
- Given the feature's endpoints, when the unit and integration tests run, then they pass with the same statuses, codes and bodies as `develop`.
- Given `npm run check` in `backend/`, then it is green with fewer exception entries than on `develop`.
- Given coverage of `src/features/music-control`, then it is at least the baseline.

## Implementation Notes

- Coverage baseline of `src/features/music-control/**` (vitest unit): stmts 13.94 %, branches 25.45 %, funcs 15 %, lines 13.79 %. After: 47.84 / 53.84 / 58.18 / 47.87 (new `music-control.controller.test.ts`, `services/control-switch.service.test.ts`, `services/control-permissions.service.test.ts`).
- `music-control.service.ts` split into `services/control-switch.service.ts` (grant/revoke the "all my devices" switch, unexpected errors still answered as 500 `GRANT_CONTROL_ERROR` / `REVOKE_CONTROL_ERROR`) and `services/control-permissions.service.ts` (`getGrantedPermissions`, `canControl`). The unused `hasGrantedControlToMe` is dropped.
- The controller splits into `music-control.controller.ts` (permissions), `music-control-devices.controller.ts` and `music-control-licenses.controller.ts`. The permission routes keep their own UUID v4 check and 400 `INVALID_USER_ID` (a Zod `z.uuid()` would answer `VALIDATION_ERROR` and accept other UUID versions).
- `music-control.types.ts`: the response DTOs (`Device`, `DeviceLicense`, `DeviceWithLicenses`, `ControllableDevice`, picker and grant responses) are `z.infer` of `music-control-responses.validators.ts`; `MyDevicesResponse`, `RenameDeviceResponse`, `RevokeDeviceLicenseResponse` and `DeviceAccess` had no remaining user and are gone. Realtime payload types stay (#375).
- `realtime/music-control-access.int.test.ts` spied `controlAccessService.getAccess` to prove no lookup runs on a bad payload; an ESM namespace cannot be spied, so it now wraps the real `canControlAnyDevice` (the entry point `listening:subscribe` calls) with `vi.mock` + `importOriginal`.
- Exceptions: jscpd `ignore` loses `music-control.controller.ts`; the depcruise baseline is regenerated (same 59 entries: the `friends.service` import moved with the code into `control-switch.service.ts`). The `FriendsService` instances stay until #372.

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd backend && npm run check` -- expected: all OK.
- `cd backend && sh scripts/test-db.sh up && npm run test:int; sh scripts/test-db.sh down` -- expected: all pass.
- `grep -rn "^export class\|^class " backend/src/features/music-control | grep -v test` -- expected: only error classes.

### Pass 1 (quick) — high 0 / medium 0 / low 2 / false 1 / maybe-false 0

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| `music-control-licenses.controller.ts` has no matching OpenAPI file | low | patch | Breaks the controller/openapi pairing rule. |
| The "before any lookup" realtime test wraps only `canControlAnyDevice` | low | patch | Wrap every access export so the guard covers any future lookup. |
| Integration tests not run | false | reject | The implementer ran 350/350 on the local stack; CI runs them too. |
