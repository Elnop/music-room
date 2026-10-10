---
title: 'Configurable trust proxy for the client IP (HTTP and Socket.io)'
type: 'bugfix'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: '39a09c3816215ec1757147e0a5c092b9545053ae'
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

**Problem:** No `trust proxy` is set and the Socket.io handshake reads `socket.handshake.address`, so behind a tunnel or reverse proxy every client has the same IP and the per-IP limiters (auth #120, token verification #160 on every protected route and the socket) count everyone together (GitHub #173).

**Approach:** A `TRUST_PROXY` env setting, off by default so a forged `X-Forwarded-For` is ignored, applied to Express's `trust proxy`; the handshake IP is derived with the same rules. Documented in `backend/README.md` and `.env.example`.

</frozen-after-approval>

## Implementation Notes

Oneshot:
- `backend/src/shared/config/trust-proxy-setting.ts` (no env import): `parseTrustProxy` (case-insensitive) ('' / 'false' → false, 'true', a hop count, else Express's comma list) and `compileTrust`; `env.ts` validates `TRUST_PROXY` with them. `trust-proxy.ts`: `configureTrustProxy(app)` (used in `server.ts`), `clientIp(req)` with `proxy-addr` and the same compiled trust function, so HTTP and the socket agree.
- `proxy-addr` (already in the tree through Express, same 2.0.8) and `@types/proxy-addr` added as direct dependencies with `npm install`; lockfile committed.
- `socket-auth.ts`: `verifyTokenLimited` gets `clientIp(socket.request)` (the handshake's IncomingMessage).
- `env.ts`: `TRUST_PROXY` string, default '', refused at startup with the formatted env error when it does not compile.
- Every other IP read already uses `req.ip` (limiters, lockout, controller), so the Express setting covers them.
- Tests: `trust-proxy.int.test.ts` (TRUST_PROXY=loopback: separate HTTP and socket counters per X-Forwarded-For; the socket case fails with the old `handshake.address`), a no-config case in `token-verify-limiter.int.test.ts` (client X-Forwarded-For ignored, HTTP and socket), `trust-proxy.test.ts` for the parser.
- `doc/THREAT_MODEL.md`: L4 marked fixed.

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test` -- expected: green
- `cd backend && npm run test:int` -- expected: green

## Review Triage Log

Quick review, 2 findings: 1 medium, 1 low.

- medium, patched: a bad `TRUST_PROXY` (`FALSE`, `-1`, a typo) made `proxyaddr.compile` throw at import, a raw stack trace at startup. Parse is now case-insensitive, and `env.ts` refuses a value that does not compile with the usual formatted error (checked with `TRUST_PROXY=bogus`). Pure helpers moved to `trust-proxy-setting.ts` to avoid an env import cycle; unit tests cover valid and invalid values.
- low, patched: the no-config limiter test depended on `backend/.env` not setting `TRUST_PROXY`; the hoisted block now pins it to ''.
