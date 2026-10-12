---
title: 'Match dev ngrok origins on the parsed host name'
type: 'bugfix'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: '7e9d894876b0b5015d5f8167a68df218e3e202e3'
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

**Problem:** In `NODE_ENV=development`, `isOriginAllowed` accepts any origin where `origin.includes('ngrok')`, e.g. `https://ngrok.attacker.example`, over HTTP and Socket.io; the dev backend always runs in development (GitHub #209).

**Approach:** Check the parsed host name (`new URL(origin).hostname`) against the real ngrok domains instead of the raw string.

</frozen-after-approval>

## Implementation Notes

Oneshot:
- `backend/src/shared/config/cors.config.ts`: `isNgrokOrigin`: https only, host name ending in `.ngrok-free.app`, `.ngrok-free.dev`, `.ngrok.app`, `.ngrok.dev` or `.ngrok.io` (subdomain required); unparsable origin refused. `exp://` unchanged.
- `backend/src/shared/config/cors.config.test.ts` (env hoisted to development): real tunnels on all five domains, `exp://` and `ALLOWED_ORIGINS` allowed; look-alikes, bare domain, http and junk refused (fails on the old code); outside development, ngrok and `exp://` refused.
- `doc/THREAT_MODEL.md` (M9, L11) and `doc/SECURITY.md` updated: L11 reduced, not fixed (see triage).

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint && npm test` -- expected: green

## Review Triage Log

Quick review, 2 findings: 1 medium, 1 low.

- medium, docs patched: any free ngrok account gets a subdomain, so an attacker's tunnel still passes the dev origin check, and the docs called L11 fixed. Proposed dropping the ngrok auto-allow (the project's tunnel is already allowed exactly through `TUNNEL_URL`); the user chose to keep the domain check. L11 is now "reduced" with the remaining risk stated as accepted in THREAT_MODEL.md, SECURITY.md and the code comment.
- low, patched: tests now cover `ngrok.dev` and the `development` gate (ngrok and `exp://` refused in production).
