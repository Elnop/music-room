---
title: "Contrat d'API de liaison de compte social"
type: 'feature'
ticket: '4'
created: '2026-10-07'
status: 'built'
baseline_revision: '79ba7d8ac32c55bcdba6fa30953a20ca93a0f724'
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

**Problem:** A signed-in user cannot link a Google or Facebook account to their existing account (CAP-6). Story 3.5 (#73, backend) must implement the link endpoint and story 3.6 (#74, mobile) must call it, so both need an agreed contract first.

**Approach:** Document `POST /api/auth/providers/{provider}/link` in `backend/src/features/auth/auth.openapi.ts`. It is protected by bearer auth. The path `provider` is `google` or `facebook`, and the body is the provider token: the same shape as the existing login requests, `{ idToken }` (`GoogleLoginRequest`) for Google and `{ accessToken }` (`FacebookLoginRequest`) for Facebook. On success it returns 200 with the linked providers, in the same shape as `GET /api/auth/providers`; that shape becomes a shared `LinkedProvider` schema used by both endpoints. Errors: 400 for a validation error or an invalid provider token (`INVALID_PROVIDER_TOKEN`, so the mobile client does not mistake it for an expired session and refresh), 401 only for the session (shared `UnauthorizedError`), 409 `PROVIDER_ALREADY_LINKED` when that social account is already linked to another user, and 409 `PROVIDER_ALREADY_SET` when the current user already has an account of that provider linked, the same one or another (decided 2026-10-07: relinking is not idempotent). Only the documentation is written; the route and service belong to #73.

</frozen-after-approval>

## Implementation Notes

Oneshot: the contract is a single addition in `auth.openapi.ts` plus extracting the provider item schema, about 80 lines. Body schemas reuse `GoogleLoginRequest` and `FacebookLoginRequest` so the mobile app sends the same token it already gets for sign-in. The rate limit is left to #73 and not documented here.

## Verification

**Commands:**
- `cd backend && npm run type-check && npm run lint` -- expected: no errors
- `cd backend && npm test` -- expected: green

**Manual checks (if no CLI):**
- Swagger UI (http://localhost:3000/api-docs) shows `POST /api/auth/providers/{provider}/link` with its request, response and error schemas.

## Review Triage Log

Quick review, 1 pass: 1 medium, 2 low, 1 intent gap, 2 false.
- medium, patched after a human decision — invalid provider token returned 401 `INVALID_TOKEN`, which `mobile/src/services/api.ts:154` treats as an expired session (refresh then `SESSION_EXPIRED`). Now 400 `INVALID_PROVIDER_TOKEN`.
- low, patched — `oneOf` over two schemas without `additionalProperties: false` rejected a body carrying both fields; now `anyOf`, and the description says the path `provider` decides the required field.
- low, patched — the custom 401 dropped the missing-bearer codes; now the shared `UnauthorizedError`.
- intent gap, decided by the human — relinking the same account to the same user returns 409 `PROVIDER_ALREADY_SET` (not idempotent).
- false — `LinkedProvider.required` changes GET /providers: the service always fills all three fields (`provider.service.ts:37-54`), as the reviewer noted.
- false — "verification not run": type-check, lint, tests and a $ref resolution check passed on a scratch copy (the repo's `backend/node_modules` is root-owned and empty).
