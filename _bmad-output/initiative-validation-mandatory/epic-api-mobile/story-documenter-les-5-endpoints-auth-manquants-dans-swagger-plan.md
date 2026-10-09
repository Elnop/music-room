---
title: 'Documenter les 5 endpoints auth manquants dans Swagger'
type: 'chore'
ticket: '1'
created: '2026-10-09'
status: 'built'
baseline_revision: '748aa816f0c364e552a6ec0ed8bad13308012a1e'
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

**Problem:** GitHub #94 (story 6.1, CAP-7). Five auth routes mounted in `backend/src/features/auth/auth.routes.ts` have no entry in `auth.openapi.ts`, so Swagger UI does not show them: `POST /api/auth/verify-email`, `POST /api/auth/resend-verification`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `GET /api/auth/reset-password/can-resend`. Also, `POST /api/auth/refresh` is behind `loginRateLimiter` but its entry does not document the 429 (comment on #94).

**Approach:** Document the five endpoints in `auth.openapi.ts` from the real code: request body (or query) from the Zod schemas in `auth.validators.ts`, success payload from `auth.controller.ts`, and every error the route can answer (validation 400, the services' `AppError` codes, the route's rate limiter 429 and 503). Add the 429 `RateLimitError` to `/api/auth/refresh`. Documentation only.

</frozen-after-approval>

## Boundaries & Constraints

**Always:** Same style as the existing auth entries: tag `Authentication`, `SuccessResponse`-style envelope with `data`, shared `#/components/responses/*` (`ValidationError`, `RateLimitError`, `RateLimitUnavailable`, `NotFoundError`) where they fit, reusable request/response schemas added to the file's `components.schemas` export, an `example` per body. No security on these five routes (none uses `authMiddleware`). Error descriptions name the `code` values so the client can switch on them.

**Never:** No change to routes, controllers, services or validators (the missing Zod schema for the `can-resend` query is reported, not fixed here). No change to other features' docs.

## Code Map

- `backend/src/features/auth/auth.routes.ts:115-155` -- the five routes and their limiters: `verify-email` → `loginRateLimiter`; `resend-verification` → `registerRateLimiter`; `forgot-password`, `reset-password`, `reset-password/can-resend` → `globalAuthRateLimiter`. `:47` `/refresh` → `loginRateLimiter`.
- `backend/src/features/auth/auth.validators.ts:45-75` -- `verifyEmailSchema { userId (uuid), code (6 digits) }`, `resendVerificationSchema { userId, email }`, `forgotPasswordSchema { email }`, `resetPasswordSchema { email, code (6 digits), newPassword (8–100, upper, lower, digit) }`.
- `backend/src/features/auth/auth.controller.ts:378-640` -- payloads: `verify-email` → `{ user, session, message }` (same `user`/`session` shape as login's `AuthResponse`) and 404 `USER_NOT_FOUND` / `AUTH_USER_NOT_FOUND`, 500 `SESSION_GENERATION_FAILED` / `INVALID_SESSION_RESPONSE` / `SESSION_CREATION_FAILED`; `resend-verification` → `{ message }`, 429 `RESEND_COOLDOWN` (message carries the remaining seconds); `forgot-password` → `{ message }` (same answer whether the email exists or not); `reset-password` → `{ message }`; `can-resend` → `{ canResend, remainingSeconds }` from `?email=`, 400 `EMAIL_REQUIRED` when missing.
- `backend/src/features/auth/services/email-verification.service.ts` -- `verifyCode`: 400 `NO_CODE_FOUND`, `CODE_EXPIRED`, `INVALID_CODE`; 404 `USER_NOT_FOUND`; 429 `RESEND_LIMIT_EXCEEDED`; 500 `CODE_STORE_ERROR`, `VERIFICATION_ERROR`. Read the file to attach each code to its route.
- `backend/src/features/auth/services/password-reset.service.ts` -- 400 `OAUTH_ONLY_ACCOUNT`, `INVALID_RESET_CODE`, `RESET_CODE_EXPIRED`; 500 `PASSWORD_RESET_STORE_ERROR`, `USER_FETCH_ERROR`, `PROFILE_FETCH_ERROR`, `PASSWORD_UPDATE_ERROR`. Read it to know which reach `forgot-password` (it may swallow unknown emails) and which reach `reset-password`.
- `backend/src/features/auth/auth.openapi.ts` -- existing entries (`/api/auth/login` for 429 + 503 refs, `/api/auth/refresh:139` to patch), `components.schemas` and the `AuthResponse` schema to reuse.
- `backend/src/shared/config/swagger.schemas.ts` -- shared responses (`ValidationError`, `RateLimitError`, `RateLimitUnavailable`, `NotFoundError`, `UnauthorizedError`).

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/features/auth/auth.openapi.ts` -- add the five path entries and their schemas; add `'429': { $ref: '#/components/responses/RateLimitError' }` to `/api/auth/refresh`.

**Acceptance Criteria:**
- Given Swagger UI (http://localhost:3000/api-docs), when the Authentication tag is opened, then the five endpoints appear with their input, success output and errors.
- Given the generated spec, when every `$ref` is resolved, then none is dangling.

## Verification

**Commands:**
- `cd backend && npm run lint && npm run type-check && npm test` -- expected: clean and green
- `cd backend && node --input-type=module -e "..."` or a short script that builds the spec (as `swagger.ts` does) and checks the five paths exist and every `$ref` resolves -- expected: no dangling ref

**Manual checks (if no CLI):**
- Swagger UI lists the five endpoints under Authentication.

## Review Triage Log

Pass 1 (quick): 8 findings · 6 patched in the docs · 2 deferred (pre-existing).

| # | Finding | Verdict | Route | Evidence / action |
|---|---------|---------|-------|-------------------|
| 1 | Mail failures documented as 500 | medium | patch | `error-handler.ts:66-77` answers 400 with the nodemailer `code`. Documented under 400. |
| 2 | `OAUTH_ONLY_ACCOUNT` documented but unreachable | low | patch + ticket | Check always false after `z.email`. Removed from docs; code bug #189. |
| 3 | `can-resend` promises a cooldown never recorded | medium | patch + ticket | `recordResendAttempt` has no caller. Docs describe current behavior; code bug commented on #187. |
| 4 | verify-email rate-limit text wrong | low | patch | `loginRateLimiter` counts failures only, key `login:unknown:<ip>` shared with /refresh, other message. |
| 5 | resend-verification rate-limit bucket shared with register | low | patch | `registerRateLimiter` key `register:<ip>`; message fixed. |
| 6 | Docs present verify-email's no-code branch as intended | high | patch | Security hole; sentence removed, fix tracked in #188. |
| 7 | resend-verification accepts any email for any userId | high | defer | Pre-existing security bug, #188 (fix and doc update there). |
| 8 | Shared `ErrorResponse`/`ValidationError` shape ≠ real error body | low | defer | Pre-existing in `swagger.schemas.ts`; commented on #95. |
