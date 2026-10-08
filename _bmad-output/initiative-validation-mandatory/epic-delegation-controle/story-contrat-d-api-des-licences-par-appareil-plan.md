---
title: "Contrat d'API des licences par appareil"
type: 'feature'
ticket: '2'
created: '2026-10-08'
status: 'built'
baseline_revision: 'bb694227501922d2d52e22ae43433160733b7970'
route: 'full'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 4.2 (#79). Stories 4.4 (API), 4.6 (my devices screen) and 4.7 (mobile targeting) need one agreed contract for per-device licenses before they are built. Today `music-control.openapi.ts` only describes the per-friend "all my devices" switch.

**Approach:** Add four endpoints and their schemas to `music-control.openapi.ts` only (no route, controller or service: 4.4 implements them).

## Boundaries & Constraints

**Always:** Same style as the existing music-control entries: `SuccessResponse` + `data` envelope, shared `#/components/responses/*`, `bearerAuth`, tag `Music Control`. Field names in camelCase. `deviceId` is the app's id (1–128 chars, `devices.device_id` in 015). Errors carry a `code` the client can switch on.

**Never:** No change to the existing `/permissions` and `/can-control` entries (the "all my devices" switch stays as is). No implementation, Zod or mobile type in this story. No Music Track Vote.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| My devices | `GET /api/music-control/devices` | 200, my devices, each with the friends licensed on it | 401 without token |
| Grant | `POST /api/music-control/devices/{deviceId}/licenses/{userId}`, mutual friend | 200 with the license; granting again is 200 (idempotent) | 400 `NOT_FRIENDS`; 400 `CANNOT_LICENSE_SELF`; 404 `DEVICE_NOT_FOUND` (not my device) |
| Revoke | `DELETE` same path | 200, idempotent when no license exists | 404 `DEVICE_NOT_FOUND` |
| Friend's devices I control | `GET /api/music-control/users/{userId}/devices` | 200 `{ allDevices, devices[] }`; `allDevices` true = shortcut on, every device listed; else only licensed ones; each device says `access: 'all-devices' \| 'license'` | 200 with empty list when not friends or nothing granted (no leak of devices) |

</frozen-after-approval>

## Code Map

- `backend/src/features/music-control/music-control.openapi.ts` -- add paths to `musicControlPaths`, schemas to `musicControlSchemas`; already spread in `shared/config/swagger.config.ts:74`.
- `backend/src/shared/config/swagger.schemas.ts` -- reuse `SuccessResponse`, `ErrorResponse`, responses `ValidationError`, `UnauthorizedError`, `NotFoundError`. Do not edit.
- `backend/migrations/015_devices.sql` (PR #154) -- source of the fields: `device_id`, `device_name`, `platform`, `model`, `last_seen_at`; licenses `(owner_id, device_id, grantee_id, created_at)`.
- `backend/src/features/music-control/music-control.service.ts` -- existing codes `NOT_FRIENDS` (mutual-friend check via `FriendsService.getFollowStatus`); reuse that code name.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/features/music-control/music-control.openapi.ts` -- add schemas `Device`, `DeviceWithLicenses` (Device + `licenses: DeviceLicense[]`), `DeviceLicense` (`user` summary like `MusicControlPermission.user`, `grantedAt`), `ControllableDevice` (Device + `access`); add the four operations of the matrix with path params (`deviceId` string 1–128, `userId` uuid) and documented error codes -- the contract 4.4, 4.6 and 4.7 build on.

**Acceptance Criteria:**
- Given the backend running, when opening http://localhost:3000/api-docs, then the four operations appear under Music Control with their request params, response schemas and error codes.
- Given the generated spec, when every `$ref` is resolved, then none is dangling.

## Design Notes

POST/DELETE on the same path mirrors the existing `/permissions/{userId}` grant/revoke. `deviceId` sits in the path: it is the app's uuid, so no encoding issue in practice. "Friend's devices I control" answers 200 with an empty list rather than 403/404, so a non-friend cannot probe whether a user exists or how many devices they have.

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint` -- expected: pass.
- `cd backend && npx tsx -e "<import swaggerSpec, walk all \$ref, check the 4 operations>"` -- expected: 4 operations found, 0 dangling refs.

**Manual checks (if no CLI):**
- Swagger UI shows the four operations with their schemas.

## Implementation Notes

Implemented by a subagent in `music-control.openapi.ts` only (317 lines added, existing entries untouched). The `deviceId` path param and the `DEVICE_NOT_FOUND` 404 are file-local constants rather than new shared components (registering components would mean editing `swagger.config.ts`). GET `/users/{userId}/devices` and DELETE also document 400 `ValidationError` for malformed path params, which 4.4's Zod validation will return. Matrix rows are contract, not behavior: each row's success shape and error codes are in the spec (checked by script: 4 operations found, 218 `$ref`, 0 dangling); behavior tests belong to 4.4.

## Review Triage Log

Quick review, pass 1: 0 high, 1 medium, 4 low (3 patched, 1 rejected).

- medium, patch: GET `/users/{userId}/devices` did not pin `allDevices` to false for non-friends; `follows.can_control_music` survives an owner-side unfollow, so a direct read would leak the old switch. Descriptions now state `allDevices: false`, `devices: []` when not mutual friends.
- low, patch: `DeviceLicense.user` had no `required`, so clients typed from the contract see `id`/`username` optional. Added `required: ['id', 'username', 'displayName', 'avatarUrl']`.
- low, patch: `DEVICE_NOT_FOUND` and POST 400 examples omitted `meta`, required by `ErrorResponse`. Added `meta.timestamp`.
- low, patch: DELETE did not say what self / non-friend revoke answers. Description now: 200 for any valid userId without a license; only `VALIDATION_ERROR` 400 and `DEVICE_NOT_FOUND` 404.
- low, rejected: POST 400 lists `VALIDATION_ERROR` in its description without an example. Cosmetic; the description already states the code.

After patches: type-check, lint, Prettier pass; spec check 4 operations, 218 `$ref`, 0 dangling.
