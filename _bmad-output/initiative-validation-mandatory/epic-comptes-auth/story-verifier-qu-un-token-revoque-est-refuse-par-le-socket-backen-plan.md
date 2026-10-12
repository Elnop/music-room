---
title: "Vérifier qu'un token révoqué est refusé par le socket (backend)"
type: 'chore'
ticket: '3'
created: '2026-10-09'
status: 'built'
baseline_revision: 'd7622ed4e1fb78de13a41687d62991074c1f7c83'
route: 'oneshot'
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

**Problem:** GitHub #71 (story 3.3, CAP-9). Logout revokes the access token through the Redis denylist checked in `SessionService.verifyToken` (story 3.1), and `logout.int.test.ts` proves it for HTTP, but nothing proves the Socket.io handshake (story 2.1, `realtime/socket-auth.ts`) refuses a token issued before logout.

**Approach:** Add an integration test to `backend/src/realtime/socket-auth.int.test.ts`, against the local Supabase stack and Redis: a fresh user's token connects, the session is logged out (`SessionService.logout`), then a new handshake with the same token is refused with `connect_error` `INVALID_TOKEN` (the handshake's authentication error for any failed verification). No production code change.

</frozen-after-approval>

## Implementation Notes

Oneshot: one test, about 20 lines, no production change.

## Verification

**Commands:**
- `cd backend && npx vitest run --config vitest.int.config.ts src/realtime/socket-auth.int.test.ts` -- expected: green, new test included
- `cd backend && npm run lint && npm run type-check` -- expected: clean

## Review Triage Log

Pass 1 (quick): medium 1.

- medium · patch — the test did not prove the denylist refused the token: `SessionService.logout` also ends the Supabase session, `getUser` then fails too, and the handshake maps every failure to `INVALID_TOKEN`. Confirmed by disabling the `isRevoked` check: the handshake was still refused (Supabase `INVALID_TOKEN`). Patched: a spy on `SessionService.prototype.verifyToken` asserts the refusal is `TOKEN_REVOKED`; with the check disabled the test now fails.
