---
title: 'Socket.io : origines prises dans ALLOWED_ORIGINS'
type: 'bugfix'
ticket: ''
created: '2026-10-09'
status: 'built'
baseline_revision: '30a849f783f6d91b9ffac17e50bff4866bfacee7'
route: 'oneshot'
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

**Problem:** GitHub #137. `realtime/index.ts` configures Socket.io CORS with `process.env.SOCKET_IO_CORS_ORIGIN || '*'` and `credentials: true`: by default every origin is accepted. AGENTS.md wants CORS origins from `ALLOWED_ORIGINS` (validated in `env.ts`), never widened in code. The HTTP API already does it; the socket does not. Socket.io's `cors` option only governs the polling transport's CORS headers: a browser WebSocket from any origin connects regardless.

**Approach:** One origin rule shared by Express and Socket.io (no `Origin` header → allowed, for the mobile app; `ALLOWED_ORIGINS` list or `*`; the existing development exceptions for ngrok and `exp://`). Socket.io uses it both for its `cors.origin` and in `allowRequest`, so a disallowed `Origin` is refused on every transport. `SOCKET_IO_CORS_ORIGIN` goes away.

</frozen-after-approval>

## Implementation Notes

Oneshot: about 80 lines — the rule moved from `server.ts` into a shared helper, wired in two places, plus an integration test with real sockets.

- `backend/src/shared/config/cors.config.ts` (new): `isOriginAllowed(origin)`, the rule moved from `server.ts` (no Origin → allowed; `ALLOWED_ORIGINS` or `*`; tunnel URL; development ngrok / `exp://`).
- `server.ts`: Express `cors` calls it. `realtime/index.ts`: Socket.io `cors.origin` and `allowRequest` call it; `SOCKET_IO_CORS_ORIGIN` removed (it appeared nowhere else).
- `realtime/socket-origin.int.test.ts`: websocket and polling refused from `http://evil.example`, accepted from an allowed origin, accepted without Origin. The test fixes `ALLOWED_ORIGINS` and `NODE_ENV` with `vi.hoisted` before `env.ts` loads, because the local `backend/.env` sets both.
- After review: `isSameOrigin` for the socket (Android app's own-address `Origin`).

## Review Triage Log

Quick review, pass 1: 1 high, 0 medium, 2 low (2 patched, 1 rejected), 0 false.

- high, patch: React Native's Android WebSocket always sends `Origin` built from the socket URL (`WebSocketModule.kt:122`, `getDefaultOrigin`), i.e. the backend's own address, which is not in `ALLOWED_ORIGINS`; `allowRequest` refused the native app on LAN and emulator (engine.io-client does not fall back to polling without `tryAllTransports`). `allowRequest` now also accepts a same-origin request (`isSameOrigin`: `Origin` host:port equals the `Host` header): not cross-origin, so the allowed list is not widened. Test added with `Origin` = the server URL.
- low, patch: the test comment claimed a local `.env` could not change the outcome, but `delete process.env.TUNNEL_URL` is undone by dotenv. Removed the delete; comment says what is fixed and why a tunnel URL cannot match.
- low, rejected: the refusal tests accept any `connect_error`, not specifically the origin refusal. The accept cases use the same token and transports, so another cause would fail them too; asserting engine.io's error text adds coupling for no user-facing gain.
