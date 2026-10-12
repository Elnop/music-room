---
title: 'Authentifier la connexion Socket.io par JWT (backend)'
type: 'feature'
ticket: '1'
created: '2026-10-07'
status: 'built'
baseline_revision: '9a227a36e8ab6fa2329563f574d6b818058c53cc'
route: 'full'
route_source: 'auto'
risk: 'high'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/doc/TESTING.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Any Socket.io client can claim any identity: `auth:register` trusts the `userId` the client sends, so anyone can act on the socket as someone else (CAP-1, subject IV.6).

**Approach:** Authenticate at the handshake. A `io.use` middleware reads `socket.handshake.auth` (`token`, `deviceId`, `deviceName`, `platform`, `model`, `appVersion`), validates it with Zod, and verifies the token with `SessionService.verifyToken` (which will also carry the revocation of #69). It puts `{ userId, email, device: { deviceId, deviceName, platform, model }, appVersion }` in `socket.data` and refuses the connection otherwise. The connection handler registers the device and joins `user:<id>` from `socket.data`; the `auth:register` event is removed.

## Boundaries & Constraints

**Always:** the identity comes only from the verified token; the contract (fields, refusal codes) is documented next to the middleware and in `backend/README.md`; Zod validates the handshake; no `any`.

**Never:** no change to `playlist:join` authorization (#64), to the socket logger's fields (#66), to `canControl` (#82), or to mobile (#63); no re-check of the token after the connection is established.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid | valid token + all device fields | connected; `socket.data.userId` = token's user; socket in `user:<id>`; device registered for control | — |
| No token | `auth` empty or without `token` | refused | `connect_error`, message `NO_TOKEN` |
| Bad handshake | token present, a device field missing or not a string | refused | `connect_error`, message `INVALID_HANDSHAKE` |
| Invalid/expired token | `verifyToken` throws | refused | `connect_error`, message `INVALID_TOKEN` |
| Forged id | valid token for A, `auth.userId` = B | identity is A | — |
| Legacy event | client emits `auth:register` | ignored: no listener, nothing registered | — |
| Device spoof | `listening:update` with a `device` whose deviceId differs from the handshake | status stored and broadcast with the handshake device (`socket.data`); payload `device` ignored | — |

**Decision (2026-10-07):** the current app does not send the token, so #62 alone cuts realtime in the app. #63 (mobile handshake) is done right after on a branch stacked on this one, and both PRs merge together.

**Decisions (2026-10-07, review of the plan against earlier decisions):**
- The handshake carries six required fields: the ticket's five plus `model` (DeviceInfo and the IV.6 "device" log need it).
- `listening:update` takes the device from `socket.data`, never from its payload; the payload `device` is still accepted (the current app sends it) but ignored, and #63 stops sending it.
- Socket CORS (`SOCKET_IO_CORS_ORIGIN`, default `*`, vs `ALLOWED_ORIGINS` in AGENTS.md) stays out of #62; separate ticket.

</frozen-after-approval>

## Code Map

- `backend/src/realtime/index.ts` -- `initialize` creates the server; `listening:update` (l.188-245) builds the status from `data.device`: switch to `socket.data.device` and drop `device` from `isValidListeningUpdatePayload`'s required checks; `registerAuthHandlers` (`auth:register`, l.143-159) fills `socketToDevice`/`deviceToSocket` and joins `user:<id>`: move that into the connection handler from `socket.data`, then delete the handler, `AuthRegisterPayload` and the README mention. `listening:update`, `listening:subscribe` and `control:action` read `socketToDevice`: keep them working unchanged.
- `backend/src/features/auth/services/session.service.ts` -- `SessionService.verifyToken(token)` → `{ id, email, role }`, throws `AppError(401, ..., 'INVALID_TOKEN')`.
- `backend/src/features/music-control/music-control.types.ts` -- `DeviceInfo { deviceId, deviceName, platform, model }`.
- `backend/src/shared/middleware/socket-logger.middleware.ts` -- `socketLogger.auth(...)` to log accepted and refused handshakes (no token in logs).
- `mobile/src/services/deviceService.ts`, `mobile/src/hooks/useMusicControl.ts:76` -- current client sends `auth:register` with `DeviceInfo`; #63 moves it to the handshake. Not touched here.
- `backend/README.md` § "Temps réel (Socket.io)" -- event list to update.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/realtime/socket-auth.ts` -- new: Zod `handshakeAuthSchema`, `SocketData` type, `authenticateSocket(socket, next)` middleware (refusal: `next(new Error(code))` with `NO_TOKEN` | `INVALID_HANDSHAKE` | `INVALID_TOKEN`); doc comment states the contract -- one place for the contract that #63 and #66 read
- [x] `backend/src/realtime/index.ts` -- type the server with `SocketData`, `this.io.use(authenticateSocket)`, register device + join `user:<id>` on connection from `socket.data`, delete `auth:register` -- identity from the token only
- [x] `backend/package.json` + lockfile -- `socket.io-client` devDependency (same major as server) -- TESTING.md: socket tests connect with `socket.io-client`
- [x] `backend/src/realtime/socket-auth.int.test.ts` -- integration test (doc/TESTING.md puts socket authentication there): `realtime.initialize` on an HTTP server on port 0, real users and tokens from the local Supabase stack (sign in with `supabaseAnon`, never `supabaseAdmin`: see #136), `socket.io-client`; one test per matrix row, an expired token can be a syntactically valid JWT with a past `exp` or a garbage string
- [x] `backend/README.md` -- handshake contract and event list without `auth:register`

**Acceptance Criteria:**
- Given the server, when a client connects with a valid token and device fields, then a `control:action` from a friend reaches that device (device registered from the handshake).

## Design Notes

`model` is added to the ticket's five fields because `DeviceInfo` (listening statuses, control targeting) needs it and the app already has it. Refusal codes go in the `Error` message because that is what the client's `connect_error` exposes.

## Verification

`backend/node_modules` in this checkout is root-owned and empty. Run from a copy: `rsync -a --exclude node_modules backend/ /tmp/claude-1000/-home-elthinkbuntu-Documents-music-room/ab33d70a-3a13-4ee6-8938-dc4d0a060d15/scratchpad/backend/` then `npm ci` there; install the new devDependency there and copy `package.json` and `package-lock.json` back.

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test` -- expected: green
- `scripts/test-db.sh up && npm run test:int` (in the copy), then `scripts/test-db.sh down` -- expected: green

## Review Triage Log

Quick review, pass 1: 2 medium, 2 low, 2 rejected.
- medium, patch — `handleDisconnect` of a device's old socket deleted the registration of its new socket (reconnect after a network switch → DEVICE_OFFLINE). The handshake is now the only registration path. Cleanup only when `deviceToSocket` still points to that socket; int test added.
- medium, defer — handshakes with garbage tokens are not rate-limited and each one calls Supabase Auth. The same holds for every protected HTTP route (`authMiddleware` → `getUser`, no global limiter in `server.ts`), so this change opens no new class → deferred-work.md.
- low, patch — `void authenticateSocket(...)` swallowed a rejection outside the try/catch, so the handshake hung; now caught → `INVALID_TOKEN`.
- low, patch — the legacy `auth:register` test raced across two sockets; the intruder now completes a round-trip before the controller emits.
- low, rejected — the expired-token case is refused because of the signature, not `exp`; the plan allows it, and a signed expired JWT would need the stack's JWT secret in the test.
- rejected (defer: agent-context) — `@/realtime/...` imports are outside the AGENTS.md list (`@/features`, `@/shared`). They follow the existing pattern (`server.ts`, `music-control.service.ts`); fixing it means editing AGENTS.md → deferred-work.md.
