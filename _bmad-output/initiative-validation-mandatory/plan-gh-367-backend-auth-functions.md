---
title: 'Backend : feature auth en fonctions et layout uniforme (#367)'
type: 'refactor'
ticket: 'https://github.com/Elnop/music-room/issues/367'
created: '2026-10-22'
status: 'built'
baseline_revision: '2f3fc46a5063e241daacd8d1f62e462294f898c7'
route: 'full'
route_source: 'auto'
risk: 'high'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md', '{project-root}/docs/superpowers/specs/2026-10-21-clean-codebase-refactor-design.md', '{project-root}/.agents/rules/architecture.md', '{project-root}/.agents/rules/structure.md', '{project-root}/.agents/rules/logging.md', '{project-root}/.agents/rules/guardrails.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #367, epic #362. The auth feature mixes classes instantiated once (`new AuthService()` at module level, `new EmailVerificationService()` inside handlers), static-method classes and plain functions. Its controller is 683 lines of `try/catch` boilerplate, and `user.service.ts` (332) and `auth.service.ts` (298, at the feature root) are past the ~150-line limit. It is the first backend feature to migrate, so it also sets the pattern the other six follow.

**Approach:**
- **Services** become modules of exported functions under `services/`; call sites use a namespace import (`import * as sessionService from '…/session.service.js'`). `auth.service.ts` moves into `services/`.
- **Controllers** become exported handler functions with no `try/catch`: Express 5 forwards rejected promises, and a Zod `parse` throwing a `ZodError` lands in the shared error handler. Routes pass the handlers directly.
- **Size:** every file stays under 150 lines.
- **Types:** request input types come from `z.infer` on the validators.
- **Pattern for the next stories:** written down in `.agents/rules/structure.md`.

## Boundaries & Constraints

**Always:**
- Same endpoints, middleware order, status codes, error `code`s, messages and response bodies as on `develop`.
- `npm run check` green; remove the auth entries from the exception lists that this migration fixes, and never add any.
- Tests follow the code. Mocks of classes become mocks of modules, and tests of deleted code go. Coverage of `features/auth` must not drop: compare `vitest run --coverage` for that folder before and after.
- The integration tests (`npm run test:int`, local stack via `sh scripts/test-db.sh up`) pass.
- Never log request bodies or tokens. `auth.controller.ts:34` logs `req.body` (passwords) at debug level; drop it.

**Never:**
- Touch the anti-abuse code: `middleware/rate-limit.middleware.ts`, `middleware/account-lockout.middleware.ts`, `services/password-reset-cooldown.service.ts`, `utils/token-verify-limiter.ts`, `utils/redis-rate-limit-store.ts` and `shared/services/brute-force.service.ts` / `rate-limiter.service.ts`. #374 merges them. Callers keep using their current API.
- Change other features beyond updating their imports of auth symbols (e.g. `authMiddleware`, user lookups).

</frozen-after-approval>

## Code Map

- `src/features/auth/auth.controller.ts` (683) -- `class AuthController` with 15 `try/catch` handlers, built at module level with `const authService = new AuthService()`. It creates `EmailVerificationService`, `PasswordResetService` and `PasswordResetCooldownService` inside handlers (l.389, 493, 594, 629, 667). Split it by subject into `controllers/` or several `auth-*.controller.ts` files (session: register/login/refresh/logout/me; oauth and providers; email verification; password reset). Each handler parses with its validator and calls the service. No `try/catch` unless a handler must translate a specific error.
- `src/features/auth/auth.routes.ts` (155) -- `new AuthController()` and arrow wrappers per route, with `@route` JSDoc blocks that the OpenAPI doc makes redundant. Pass the handlers directly, keep the middleware order, and drop the redundant JSDoc.
- `src/features/auth/auth.service.ts` (298, feature root) -- `class AuthService` (register, login, verifyToken, refreshToken, logout, getUserProfile, loginWithGoogle/Facebook, linked providers, link/unlink). Move it into `services/` as functions, split under 150 lines (e.g. `login.service.ts`, `oauth-login.service.ts`, `providers.service.ts`) next to the existing ones.
- `src/features/auth/auth.middleware.ts` (118) -- `const authService = new AuthService()`, used for `verifyToken`. Switch it to the function. The `authMiddleware` export name and behaviour stay (other features import it).
- `src/features/auth/services/*.service.ts` --
  - instance classes: `UserService` (332, split it), `RegistrationService`, `SessionService`, `EmailVerificationService`, `PasswordResetService`, `TokenRevocationService` (with the `tokenRevocationService` instance export);
  - static-method classes: `OAuthService` (its `OAuth2Client` becomes a module constant), `ProviderService`, `ProviderLinkService`.

  Convert them all to functions. `username.service.ts` is already functional.
- `src/features/auth/auth.types.ts` (107), `auth.validators.ts` (80) -- remove the interfaces that duplicate a validator, and use `z.infer`.
- Imports of auth from outside the feature: `grep -rn "features/auth" src --include='*.ts' | grep -v "src/features/auth"`. Update them.
- Tests: `auth.controller.test.ts`, `auth.service.test.ts`, `auth.middleware.test.ts`, `auth-flow.int.test.ts` and the tests under `services/` and `utils/`. `vi.mock` of class modules becomes `vi.mock` of function modules.
- `.agents/rules/structure.md` -- add a "Backend feature" section stating the pattern: function modules, namespace imports, handlers without `try/catch`, routes passing handlers directly, files ≤ 150 lines, input types from `z.infer`. `AGENTS.md` "Backend feature layout" points to it.

## Tasks & Acceptance

**Execution:**
- [x] Record `vitest run --coverage` for `src/features/auth` -- baseline.
- [x] `src/features/auth/services/` -- every service as functions, `auth.service.ts` moved and split -- function modules.
- [x] `src/features/auth/` controllers and `auth.routes.ts` -- handlers without `try/catch`, routes passing them -- thin HTTP layer.
- [x] `auth.middleware.ts`, `auth.types.ts`, `auth.validators.ts`, external importers -- adapt -- consistency.
- [x] Tests -- move with the code -- coverage kept.
- [x] Exception lists -- prune what this fixes (`eslint --prune-suppressions`, the depcruise baseline, the jscpd `ignore`) -- shrink-only.
- [x] `.agents/rules/structure.md`, `AGENTS.md` -- the backend feature pattern -- the reference for #368–#373.

**Acceptance Criteria:**
- Given `src/features/auth`, when listing it, then no `class` is left except the error class `TokenVerifyLimitError` and the anti-abuse files #374 owns, no file is over 150 lines, and nothing stays at the feature root apart from `auth.{routes,validators,types,middleware}.ts`, `auth*.controller.ts`, `auth*.openapi.ts` and `auth*.validators.ts`.
- Given the auth endpoints, when the unit and integration tests run, then they pass, and every status, code and body matches `develop`.
- Given `npm run check` in `backend/`, then it is green with fewer exception entries than on `develop`.
- Given the coverage of `src/features/auth`, then it is at least the baseline.

## Implementation Notes

- Coverage of `src/features/auth` (unit, v8): baseline statements 27.02 / branches 23.15 / functions 40.93 / lines 25.50; after 35.82 / 32.29 / 44.02 / 34.91.
- Controllers split by subject like the OpenAPI files: `auth.controller.ts` (session), `auth-oauth`, `auth-email`, `auth-password`. Success bodies through `shared/utils/send-success.ts`; client IP through `utils/request-ip.ts`.
- `auth.service.ts` and `user.service.ts` became `login`, `oauth-login`, `oauth-user`, `oauth-signup`, `magic-link-session`; the verify-email session logic left the controller for `verify-email.service.ts`, the resend logic for `verification-resend.service.ts`. Magic link error codes stay per caller (OAuth vs verify-email).
- `consumeResend` stays in `email-verification.service.ts` so no new file imports `features/mail` (no new depcruise entry).
- Dropped: the debug log of `req.body` on register, and the `remainingAttempts`/`lockoutWarning` properties login set on the error (errorHandler never sent them).
- Exceptions: jscpd `ignore` -4 (auth controller, service, user.service, helpers), depcruise baseline 62 -> 61 (registration test mocks `mail.config` without importing it). ESLint suppressions had no auth entry.
- Tests: `vi.spyOn(SessionService.prototype)` in socket-auth.int became a spy on `supabaseAdmin.auth.getUser` (not called for a revoked token); `vi.spyOn(ProviderService, 'isProviderLinked')` became a partial `vi.mock` of provider.service.

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd backend && npm run check` -- expected: all OK.
- `cd backend && sh scripts/test-db.sh up && npm run test:int; sh scripts/test-db.sh down` -- expected: all pass.
- `cd backend && npx vitest run --coverage src/features/auth` -- expected: at least the baseline.
- `grep -rn "^export class\|^class " backend/src/features/auth | grep -v test` -- expected: only `TokenVerifyLimitError` and the #374 files.

### Pass 1 (quick) — high 0 / medium 1 / low 2 / false 0 / maybe-false 0

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| The socket revoked-token integration test no longer proves the handshake was refused by the denylist | medium | patch | `socket-auth.ts` maps every non-limiter failure to `INVALID_TOKEN`, so a Redis outage passes the same assertions. Restore the proof without the class spy. |
| Named imports of service functions in 5 new service files, against the namespace-import rule this story writes | low | patch | auth is the reference for #368–#373; mixed style would spread. |
| `doc/THREAT_MODEL.md:267` still cites `PasswordResetService.resetPassword` | low | patch | Missed rename. |
