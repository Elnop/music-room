---
title: 'API des licences par appareil'
type: 'feature'
ticket: '4'
created: '2026-10-09'
status: 'built'
baseline_revision: '90a098a9285c69e59f2adb35132aa67a901b9252'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 4.4 (#81). The per-device license contract (4.2, four operations in `music-control.openapi.ts`) has no implementation, so a user cannot grant or revoke a friend's control of one device, nor see which devices of a friend they control; 4.6 (my devices screen) and 4.7 (mobile targeting) are blocked on it.

**Approach:** Implement the four operations exactly as documented: routes, Zod-validated path params, controller, and services over `devices` (rows written by 4.3) and `device_control_licenses` (015). Only the owner grants or revokes, only on their own device, only to a mutual friend.

## Boundaries & Constraints

**Always:** Responses match the 4.2 schemas (`Device`, `DeviceLicense`, `DeviceWithLicenses`, `ControllableDevice`) and status/error codes. camelCase out, snake_case in the database. Owner identity only from `authMiddleware` (`req.user.id`). Mutual friendship checked on every grant and every controllable-devices read (015 FK only requires grantee → owner follow). Path params through Zod (`deviceId` 1–128 chars, `userId` uuid) → 400 `VALIDATION_ERROR`. Response types mirrored in `mobile/src/types/`.

**Never:** No change to `/permissions` and `/can-control` or to `follows.can_control_music` writes. No license check on `control:action` (4.5), no socket event on license change, no mobile screen or API client (4.6, 4.7). No migration. No change to the documented contract unless the code cannot meet it; then stop and say so.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| My devices | `GET /devices`, owner with 2 devices, one licensed to bob | 200 `{ devices }`, both devices, `licenses` lists bob with profile and `grantedAt` | 401 without token |
| Grant | `POST /devices/{d}/licenses/{bob}`, own device, mutual friend | 200 `{ deviceId, license }`; row in `device_control_licenses` | none |
| Grant again | same call twice | 200, same `grantedAt`, still one row | none |
| Grant to self | userId = owner | 400 `CANNOT_LICENSE_SELF` | no row |
| Grant on another user's device | deviceId belongs to someone else (or unknown) | 404 `DEVICE_NOT_FOUND` | no row |
| Grant to non-friend | one-way follow or none | 400 `NOT_FRIENDS` | no row |
| Revoke | `DELETE` same path, license exists | 200, row gone | none |
| Revoke without license | valid userId, no license (also self, non-friend) | 200 | none |
| Revoke on another user's device | not my device | 404 `DEVICE_NOT_FOUND` | license of the real owner untouched |
| Controllable, licensed | `GET /users/{alice}/devices` as bob, mutual friends, one license | 200 `{ allDevices: false, devices: [that device, access 'license'] }` | none |
| Controllable, all devices | alice's `can_control_music` for bob is true | 200 `{ allDevices: true }`, every alice device, `access 'all-devices'` | none |
| Controllable, not friends | not mutual (stale switch or license may remain) | 200 `{ allDevices: false, devices: [] }` | no existence leak |
| Malformed params | userId not a uuid, deviceId > 128 chars | 400 `VALIDATION_ERROR` | none |

</frozen-after-approval>

## Code Map

- `backend/src/features/music-control/music-control.openapi.ts` -- the contract (lines ~225–546): paths `/devices`, `/devices/{deviceId}/licenses/{userId}` (POST, DELETE), `/users/{userId}/devices`; schemas `Device`, `DeviceLicense` (`user: { id, username, displayName, avatarUrl }`, `grantedAt`), `DeviceWithLicenses`, `ControllableDevice`. Revoke 200 data is `{ message }`. Read it, do not edit it.
- `backend/src/features/music-control/music-control.routes.ts` -- add the four routes; `router.use(authMiddleware)` already covers them.
- `backend/src/features/music-control/music-control.controller.ts` -- existing handler style (`ApiResponse` envelope, `meta.timestamp`, `next(error)`). New handlers parse params with a Zod schema; do not reuse `isValidUuid`/`INVALID_USER_ID` (contract says `VALIDATION_ERROR`; `ZodError` → 400 `VALIDATION_ERROR` in `shared/middleware/error-handler.ts:33`).
- `backend/src/features/music-control/music-control.validators.ts` (new) -- `deviceLicenseParamsSchema` (`deviceId` 1–128, `userId` uuid), `userDevicesParamsSchema` (`userId` uuid).
- `backend/src/features/music-control/services/device.service.ts` -- 4.3's `recordConnection`; add the device listing here (owner's devices with licenses).
- `backend/src/features/music-control/services/device-license.service.ts` (new) -- grant, revoke, controllable devices. Keep each service under ~150 lines.
- `backend/src/features/music-control/music-control.types.ts` -- add backend response types (camelCase).
- `backend/src/features/friends/services/friends.service.ts` -- `getFollowStatus(a, b).isFriend` = mutual follow; reuse, as `music-control.service.ts` grantControl does with code `NOT_FRIENDS`.
- `backend/src/shared/types/supabase.generated.ts` -- `devices`, `device_control_licenses`, `user_profiles` (`username`, `display_name`, `avatar_url`), `follows.can_control_music`. Do not edit.
- `backend/src/realtime/socket-auth.int.test.ts` / `src/features/profile/services/privacy.int.test.ts` -- int-test pattern: `supabaseAdmin.auth.admin.createUser` + `user_profiles` insert, delete users in `afterAll` (cascades). No supertest in the repo: int tests call services directly.
- `mobile/src/types/device.types.ts` -- holds an old unrelated `Device`; add the new types beside it under non-clashing names (e.g. `UserDevice`), leave the old one.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/features/music-control/music-control.validators.ts` -- the two param schemas.
- [x] `backend/src/features/music-control/music-control.types.ts` -- response types for the four operations.
- [x] `backend/src/features/music-control/services/device.service.ts` -- `listMyDevices(ownerId)`: devices with their licenses and grantee profiles.
- [x] `backend/src/features/music-control/services/device-license.service.ts` -- `grant`, `revoke`, `listControllable` per the matrix; checks in order: self → `CANNOT_LICENSE_SELF`, device not owned → `DEVICE_NOT_FOUND`, not mutual → `NOT_FRIENDS`; grant idempotent (keeps the first `created_at`).
- [x] `backend/src/features/music-control/music-control.controller.ts` + `music-control.routes.ts` -- four handlers and routes, response shapes per the contract.
- [x] `backend/src/features/music-control/services/device-license.int.test.ts` -- every matrix row except 401 and malformed params, against the local stack.
- [x] `backend/src/features/music-control/music-control.validators.test.ts` -- unit: malformed `userId`, `deviceId` empty and > 128 chars rejected; valid accepted.
- [x] `mobile/src/types/device.types.ts` -- mirror the response types.

**Acceptance Criteria:**
- Given the backend running, when the four operations are called from Swagger UI with a valid token, then their responses match the documented schemas.
- Given an owner, a mutual friend and a third user, when the integration suite runs, then grant and revoke by the owner succeed and a grant on another user's device or to a non-friend is refused (story Verify).

## Design Notes

Not-friends on the controllable read answers the empty shape before any device query, so a non-friend learns nothing. A license whose grantee is no longer a mutual friend (owner unfollowed) is not listed by `listControllable`; `listMyDevices` still shows it to the owner so they can revoke it.

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test` -- expected: pass.
- `cd backend && npm run test:int` (stack from `scripts/test-db.sh up` is already running; leave it running) -- expected: pass, new license tests included.
- `cd mobile && npm run type-check && npm run lint` -- expected: pass, no new warning.

**Manual checks:**
- Swagger UI (http://localhost:3000/api-docs): the four operations answer with the documented shapes.

## Implementation Notes

- Shared queries live in `music-control/utils/device.helpers.ts` (`findOwnedDevice`, `listOwnerDevices`, `fetchLicenseUsers`, `toDevice`, `failQuery`) so both services stay near 150 lines.
- Grant is idempotent through `upsert(..., { ignoreDuplicates: true })` then a re-read of the row, so `grantedAt` is the first `created_at`.
- `listControllable` returns the empty shape for viewer = owner too (not a mutual friend of oneself).
- Devices are ordered by `last_seen_at` desc, licenses by `created_at` asc (the contract sets no order).
- Swagger UI with a real token was not exercised: only the 401 without token was checked against the running backend.

## Plan Change Log

## Review Triage Log

Quick review, pass 1: 0 high, 2 medium, 2 low (1 patched, 1 verified by hand, 2 rejected), 0 false.

- medium, patch: the Design Notes rule (owner still sees a license whose grantee is no longer a mutual friend) had no test. The "empty shape when not mutual friends" int test now asserts `listMyDevices(alice)` lists carol's stale license.
- medium, verified: AC 1 (responses match the documented schemas over HTTP) was not exercised; int tests call services. Checked by hand with a throwaway script mounting `music-control.routes` + `errorHandler` against the local stack: 401 without token, grant 200 `{ deviceId, license }`, my devices 200 with licenses, controllable 200 `access: 'license'`, 400 `CANNOT_LICENSE_SELF`, 404 `DEVICE_NOT_FOUND`, 400 `VALIDATION_ERROR` naming `userId` / `deviceId`, revoke 200 `{ message }`, then controllable 200 empty. No code change.
- low, rejected: grant can answer 500 instead of 400 `NOT_FRIENDS` if the grantee unfollows between the friendship check and the upsert (FK 23503). Needs an unfollow within milliseconds of a grant; the fix adds an error-code branch.
- low, rejected: int tests depend on running in order (grant → idempotent → list → revoke). Same pattern as `socket-auth.int.test.ts`; Vitest runs a file in order; restructuring adds setup per test for no user-facing gain.
