---
title: 'Loguer plateforme, appareil et version des events socket (backend)'
type: 'feature'
ticket: '5'
created: '2026-10-08'
status: 'built'
baseline_revision: '36db81cfa6ad9c6e774027847bbe47db1144ca54'
route: 'oneshot'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context:
  - '{project-root}/doc/TESTING.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Subject IV.6 asks every action to be logged with the client's platform, device and app version. HTTP requests do it (`action-logger.middleware.ts` reads `X-Platform`, `X-Device-Model`, `X-App-Version`), but socket events only log `socketId` and whatever each handler passes, although the handshake already stores the device and version in `socket.data` (2.1).

**Approach:** One per-socket middleware (`socket.use`) logs every incoming event with `userId`, `platform`, `device` (model), `deviceId` and `appVersion` read from `socket.data`, using the same field names as the HTTP logger; it lives in `socket-logger.middleware.ts`, so events added by other epics are logged without extra code. Event arguments are never logged.

</frozen-after-approval>

## Implementation Notes

Oneshot: about 60 lines. `socketLogger.incoming(socket, eventName)` in `backend/src/shared/middleware/socket-logger.middleware.ts`, registered with `socket.use(([event], next) => { ...; next(); })` in the connection handler of `backend/src/realtime/index.ts` before the feature handlers. Field names match `action-logger.middleware.ts` (`platform`, `device`, `appVersion`) plus `userId` and `deviceId`. Unit test with the logger mocked; one integration assertion that a real event reaches the middleware with the handshake fields.

Done: `incomingLog` + `SocketClientContext` (structural type, so `shared/` does not import `realtime/`) in `socket-logger.middleware.ts`; `socket.use` in `realtime/index.ts` connection handler; unit test `socket-logger.middleware.test.ts`; int case in `socket-auth.int.test.ts` (invalid `listening:subscribe`, waits for `listening:error`, asserts the log line).

## Review Triage Log

Pass 1 (quick): medium 1, low 3, false 0.

- medium, patched: the client-sent event name went unvalidated into the log message (any length, newlines; `logger.ts` appends to `logs/app.log`). `incomingLog` now takes `unknown` and logs `<invalid-event-name>` unless it matches `^[\w:.-]{1,64}$` (Zod); unit tests for too long, multi-line, non-string.
- low, patched: `logger.info` spy not restored when the int test fails; now `try/finally`.
- low, patched: int test comment claimed it proved ordering; reworded.
- low, patched: nothing checked that event arguments are never logged; the int test asserts the payload is absent from every logged call.

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test` -- expected: all green
- `make test-int` (or the int suite with `GOOGLE_CLIENT_ID= FACEBOOK_APP_ID=` after `make test-db-up`) -- expected: green
