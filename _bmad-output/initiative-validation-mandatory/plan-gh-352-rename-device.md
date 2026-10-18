---
title: 'Renommer un appareil dans « Mes appareils » (#352)'
type: 'feature'
ticket: 'https://github.com/Elnop/music-room/issues/352'
created: '2026-10-17'
status: 'built'
baseline_revision: '495dda7bd2a45390ed32a1d337e91c18e14079d2'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #352. « Mes appareils » shows the name the system gives (`Device.deviceName`, often technical, e.g. « sdk_gphone64_x86_64 ») and offers no way to change it. There is no rename endpoint, and `DeviceService.recordConnection` rewrites `device_name` on every connection (upsert on `user_id,device_id`), which would overwrite a chosen name.

**Approach:**
- **Storage:** a nullable `custom_name` column on `devices` (new migration) holds the name the owner picks. `recordConnection` keeps refreshing `device_name` (the system name) and never touches `custom_name`.
- **Display:** everywhere a device name is served, the API returns `custom_name ?? device_name` in the existing `deviceName` field, so the device picker, delegation and friends' views need no change. That covers device lists and the socket's device data used for listening status and remote labels.
- **Endpoint:** `PATCH /api/music-control/devices/:deviceId` with `{ name }` renames one of my devices. The name is trimmed, 1–40 characters, or `null` to go back to the system name. A live socket of that device takes the new name at once.
- **App:** each device in « Mes appareils » gets a rename action opening a small form (field prefilled, Enregistrer / Annuler, « Nom d'origine » to reset).

## Boundaries & Constraints

**Always:**
- Only the owner renames their own device: another user's or an unknown `deviceId` → 404.
- Zod validation, no `any`.
- OpenAPI entry and tests for the endpoint.
- Migration created with `cd backend && make migrate-create name=...`, then types regenerated with `make generate-types`: never hand-edit `supabase.generated.ts`. The hosted project gets the migration by hand; the PR says so.
- Rate-limit like the other music-control write routes, if they are.
- French UI text, formal register.

**Never:**
- Renaming another user's device.
- Changing how devices register, beyond leaving `custom_name` alone.
- Changing the response shape: `deviceName` keeps its meaning of « name to show ».

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Rename | `{ name: '  Salon ' }` on my device | 200, device `deviceName` « Salon »; lists and sockets show it | No error expected |
| Reset | `{ name: null }` | 200, back to the system name | No error expected |
| Invalid | `''`, spaces only, 41 chars, missing `name` | 400 `VALIDATION_ERROR` | French message in the app |
| Not mine | Another user's `deviceId` or unknown | 404 | French toast |
| Reconnect | Renamed device connects again | Name kept; `device_name` refreshed underneath | No error expected |

</frozen-after-approval>

## Code Map

- `backend/migrations/` -- last is `025_queue_transfer.sql`. New `026_device_custom_name.sql`: `alter table devices add column custom_name text` with a length check (1–40). Apply locally with `make supabase-up`, then run `make generate-types`.
- `backend/src/features/music-control/services/device.service.ts` -- `recordConnection` (l.26) upserts `device_name`, unchanged. Add `renameDevice(ownerId, deviceId, name | null)`: update `custom_name` where `user_id = ownerId` and `device_id = deviceId`; 404 `DEVICE_NOT_FOUND` when no row. Keep the service under ~150 lines (helpers go to `utils/`).
- `backend/src/features/music-control/utils/device.helpers.ts` -- `DEVICE_COLUMNS` (l.8) and `toDevice` (l.17): select `custom_name` and map `deviceName: row.custom_name ?? row.device_name`.
- `backend/src/realtime/socket-auth.ts` -- l.132–137: the handshake `deviceName` is the system name. After `recordConnection`, use the stored `custom_name` when set for `socket.data.device.deviceName`. `backend/src/realtime/index.ts` l.172/509 read `socket.data.device.deviceName`, and `deviceToSocket` maps a device to its socket. On rename, update that socket's `data.device.deviceName`.
- `backend/src/features/music-control/music-control.{validators,controller,routes,openapi}.ts`:
  - validator `renameDeviceSchema`: `name: z.string().trim().min(1).max(40).nullable()`;
  - route `router.patch('/devices/:deviceId', …)`;
  - controller;
  - OpenAPI path with 200/400/404.
- Backend tests: unit and integration for rename, reset, validation, not-mine 404, the name surviving `recordConnection`, and the socket name.
- `mobile/src/services/musicControlApi.ts` -- add `renameDevice(deviceId, name | null)` through `apiRequest`.
- `mobile/src/screens/profile/MyDevicesScreen.tsx` -- each device card (title l.~242). Add a rename button (`create-outline`, label « Renommer l'appareil ») opening a modal with an `Input`. On success, reload the list and toast « Appareil renommé ». Errors go through `apiErrorMessage`. Add `DEVICE_NOT_FOUND` to `CODE_MESSAGES` if missing. Tests in `MyDevicesScreen.test.tsx`.

## Tasks & Acceptance

**Execution:**
- [x] Migration, generated types.
- [x] Service, helpers, socket auth, live socket update.
- [x] Validator, controller, route, OpenAPI.
- [x] Backend tests.
- [x] Mobile API, MyDevices rename UI, tests.

**Acceptance Criteria:**
- Given a renamed device, when a friend opens the device picker or my profile's devices, then they see the new name.

## Verification

**Commands:**
- `cd backend && npm test && npm run type-check && npm run lint` -- expected: pass; the integration tests for the new route pass against the local stack.
- `cd mobile && npm test && npm run type-check && npm run lint` -- expected: pass.

**Manual checks (if no CLI):**
- Swagger UI: `PATCH /api/music-control/devices/{deviceId}` documented and callable. On device at the `main` acceptance pass: rename, reconnect, a friend sees the name.

## Implementation Notes

- `recordConnection` now upserts then `.select('custom_name').single()` and returns the name to show; `socket-auth.ts` stores it in `socket.data.device.deviceName`. The upsert payload still never carries `custom_name`.
- `DeviceService.renameDevice` is an `update ... eq(user_id) eq(device_id) select maybeSingle`: no row means 404 `DEVICE_NOT_FOUND` (unknown or someone else's). Response: `{ device: Device }` (mirrored as `RenameDeviceResponse` in `mobile/src/types/device.types.ts`).
- Live socket: the controller calls `realtime.setDeviceName(ownerId, deviceId, name)` (new method in `realtime/index.ts`), which updates the device's socket data and its stored listening status. Done in the controller, not the service, because `device.service.ts` is imported by `socket-auth.ts` and would close an import cycle with `realtime/index.ts`. No event is broadcast; friends see the name on the next `listening:update` or list fetch.
- No rate limit: the other music-control write routes have none.
- Mobile: the form is `components/music-control/RenameDeviceModal.tsx`; client-side check (« Saisissez un nom », max 40 via `maxLength`). The API does not expose whether a name is custom, so « Nom d'origine » is always offered.
- Hosted Supabase: apply `backend/migrations/026_device_custom_name.sql` by hand in the dashboard (say so in the PR).

## Plan Change Log

## Review Triage Log

Quick review, pass 1: 2 findings, both low. 1 patched, 1 rejected. Then full verification green (backend 393 unit tests, type-check, lint; mobile 832 tests, type-check, lint).

- low, patched: `setDeviceName` updated the stored listening status without broadcasting it, so friends already watching kept the old name until the next `listening:update`. It now calls `broadcastUserListeningStatus`; integration test added.
- low, rejected: a rename landing between `recordConnection` (handshake) and `registerDevice` (connection) misses that socket until it reconnects. One DB round trip wide; closing it would add a re-read on every connection.
