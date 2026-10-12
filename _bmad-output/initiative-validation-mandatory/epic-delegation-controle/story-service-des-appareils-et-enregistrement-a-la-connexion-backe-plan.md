---
title: 'Service des appareils et enregistrement à la connexion'
type: 'feature'
ticket: '3'
created: '2026-10-09'
status: 'built'
baseline_revision: '153794b83d0d99b6cc3e0b9e6b5292644b3b45e5'
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

**Problem:** Story 4.3 (#80). Migration 015 created `devices`, but nothing writes to it: a user's devices are never persisted, so 4.4 (list and license API), 4.5 (license check on control) and 4.6 (my devices screen) have no rows to work on, and a license cannot reference a device (FK to `devices`).

**Approach:** A device service in music-control upserts the handshake device into `devices` (one row per `(user_id, device_id)`, `last_seen_at` refreshed). The socket handshake middleware calls it after the token is verified, before the connection is accepted.

**Decision (2026-10-09):** if the upsert fails, the handshake is refused with a new code `DEVICE_REGISTRATION_FAILED`, so every connected device is in `devices`. A middleware refusal is not retried by Socket.io, so the mobile client retries this code itself.

## Boundaries & Constraints

**Always:** Identity from the verified token (`user.id`), device fields from the parsed handshake (`deviceId`, `deviceName`, `platform`, `model`). `created_at` is set once, never overwritten. Supabase access through `supabaseAdmin`. Logs through `logger`/`socketLogger`, never the device token.

**Never:** No REST endpoint, no listing, no license logic (4.4, 4.5). No change to the handshake fields or the three existing error codes; the only contract addition is `DEVICE_REGISTRATION_FAILED`. No change to the in-memory `socketToDevice`/`deviceToSocket` maps in `realtime/index.ts`. No migration.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First connection | valid handshake, unknown `(user, deviceId)` | one `devices` row with the handshake name, platform, model; `last_seen_at` ≈ now | none |
| Reconnection | same user and deviceId, other name/model | still one row; `last_seen_at` later, name/platform/model updated, `created_at` unchanged | none |
| Same deviceId, other account | bob connects with alice's deviceId | two rows, one per user | none |
| Refused handshake | NO_TOKEN / INVALID_HANDSHAKE / INVALID_TOKEN | no row written | existing refusal |
| Database error on upsert | Supabase returns an error | connection refused, `connect_error` message `DEVICE_REGISTRATION_FAILED` | server logs the error; mobile retries `socket.connect()` after 5 s, at most 3 times per connection, counter reset on `connect` |

</frozen-after-approval>

## Code Map

- `backend/src/realtime/socket-auth.ts` -- `authenticateSocket`: after `verifyToken` succeeds and before `socket.data`/`next()`, await the device upsert. Update the contract comment ("On success … the device is recorded in `devices`"). Do not touch `handshakeAuthSchema` or the refusal codes.
- `backend/src/features/music-control/services/device.service.ts` (new; first file of `services/`) -- `DeviceService.recordConnection(userId: string, device: DeviceInfo): Promise<void>`: `supabaseAdmin.from('devices').upsert({ user_id, device_id, device_name, platform, model, last_seen_at: new Date().toISOString() }, { onConflict: 'user_id,device_id' })`. Leaving `created_at` out of the payload keeps it on conflict.
- `mobile/src/store/socketStore.ts` -- refusal codes are constants at the top; `connect_error` handler calls `handleRefusal` for known codes and only logs others (a middleware refusal leaves `socket.active` false, so nothing retries). Add `DEVICE_REGISTRATION_FAILED` with a bounded delayed retry; keep the `get().socket !== socket` guard before reconnecting. Tests in `mobile/src/store/socketStore.test.ts` (`socket.trigger('connect_error', …)`, fake socket).
- `backend/src/features/music-control/music-control.types.ts` -- reuse `DeviceInfo`; no change.
- `backend/src/shared/types/supabase.generated.ts` -- `devices` Insert type already present; do not edit.
- `backend/src/realtime/socket-auth.int.test.ts` -- real server + local Supabase (`scripts/test-db.sh`, which applies 015). Reuse `createUser`, `deviceFields`, `connect`, `connected`, `refused`. Users are deleted in `afterAll`; `devices` cascades from `user_profiles`.
- `backend/src/features/auth/services/token-revocation.service.test.ts` -- pattern for unit tests: `vi.hoisted` + `vi.mock` of the config module.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/features/music-control/services/device.service.ts` -- create `DeviceService.recordConnection` (upsert above; on Supabase error log it and throw) -- the service 4.4 extends.
- [x] `backend/src/realtime/socket-auth.ts` -- call `recordConnection(user.id, device)` after token verification; on failure `refuse(..., 'DEVICE_REGISTRATION_FAILED')` (add it to `SocketAuthErrorCode` and the contract comment) -- registration at the authenticated handshake.
- [x] `mobile/src/store/socketStore.ts` + `socketStore.test.ts` -- handle `DEVICE_REGISTRATION_FAILED` per the matrix; tests: retries after the delay, stops after 3, counter reset after a successful connect.
- [x] `backend/src/features/music-control/services/device.service.test.ts` -- unit: upsert payload and `onConflict`, no `created_at` in the payload; throws on Supabase error.
- [x] `backend/src/realtime/socket-auth.int.test.ts` -- integration: the first three matrix rows (query `devices` with `supabaseAdmin`), plus a refused INVALID_TOKEN handshake writes no row.

**Acceptance Criteria:**
- Given a user connecting twice from the same deviceId, when `devices` is queried, then it holds exactly one row for that pair with a `last_seen_at` later than after the first connection (story Verify).
- Given the existing handshake tests, when the integration suite runs, then they still pass unchanged.

## Design Notes

Upsert in the middleware rather than in `registerDevice` (connection handler): the row exists before the client sees `connect`, so tests and 4.5 can rely on it without waiting, and refused handshakes never reach it. The deviceId is client-supplied, so one user can create rows with arbitrary ids; this is bounded by the 128-char check and only ever affects their own rows.

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint` -- expected: pass.
- `cd backend && npm test` -- expected: pass, new unit tests included.
- `cd mobile && npm run type-check && npm run lint && npm test` -- expected: pass.
- `cd backend && npm run test:int` (with `scripts/test-db.sh up`) -- expected: pass, new device cases included.

## Implementation Notes

- `DeviceService.recordConnection` throws `AppError(500, ..., 'DEVICE_REGISTRATION_FAILED')` after logging the Supabase error (message and code only).
- Mobile: `DEVICE_RETRY_DELAY_MS` (5000) and `DEVICE_RETRY_MAX` (3) are exported from `socketStore.ts` for the tests. Once the retries are spent, the code falls through to the existing "Handshake refused, staying disconnected" path (`stop()`). The delayed reconnect is skipped if the store's socket changed or is already connected.
- The database-error row of the matrix is covered by unit tests only (service throws; mobile retry); no integration test forces a Supabase failure.

## Plan Change Log

## Review Triage Log

Quick review, pass 1: 0 high, 1 medium, 2 low (2 patched, 1 rejected), 0 false.

- medium, patch: `backend/README.md` (handshake section) still listed three refusal codes and did not mention the device being recorded; the human-facing copy of the contract diverged from `socket-auth.ts`. README updated with `DEVICE_REGISTRATION_FAILED`, the recording in `devices`, and deviceId 1–128 chars.
- low, patch: the first device integration test cited clock skew between process and database, but `last_seen_at` comes from `new Date()` in the same Node process (server started in-process); the `before - 5000` margin weakened the check. Comment removed, assertion `>= before`.
- low, rejected: `socket-auth.ts` bare `catch` would refuse without logging the cause if `upsert` itself threw. supabase-js returns transport and Postgres failures in `{ error }` (logged by the service), so a throw needs a programming error that every handshake test would already surface; the fix adds a branch.
