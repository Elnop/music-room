---
title: 'Route every mobile API module through apiRequest'
type: 'bugfix'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: '16374bdfd1be64da3a8f3562be41e4b09e11e94f'
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

**Problem:** `friendsApi`, `profileApi` and `privacyApi` carry their own copy of `apiRequest` and `musicControlApi` calls `fetch` inline, so their requests miss `X-Platform`, `X-Device-Model` and `X-App-Version` (subject IV.6, AGENTS.md) and the token refresh on 401 (GitHub #174).

**Approach:** The four modules call the exported `apiRequest` from `mobile/src/services/api.ts`; their functions keep the same signatures, and screens read `ApiError` from `services/api.ts`.

</frozen-after-approval>

## Implementation Notes

Oneshot:
- `services/api.ts`: new exported `authRequest(endpoint, accessToken, options)`, `apiRequest` with `Authorization: Bearer <accessToken>`, used by the three modules whose functions take the token as a parameter. As with `authApi`'s explicit headers, the registered session's token overrides it when there is one.
- `friendsApi`, `profileApi`, `privacyApi`: local `ApiResponse`, `ApiError` and `apiRequest` removed.
- `musicControlApi`: `getMyPermissions`, `grantControl`, `revokeControl`, `canControl` use `apiRequest` with the file's existing `authHeaders()`; `canControl` still answers false on any error. Request errors are now `ApiError` (an `Error` subclass); a missing token still throws a plain `Error` from `getAuthToken`, as before.
- `EditProfileScreen`, `MusicPreferencesScreen`, `PrivacySettingsScreen` import `ApiError` from `@/services/api`.
- Test `src/services/api-clients.test.ts`: one call per module, checks the three client headers and the token; with a registered session, the session token is sent and a 401 refreshes it and retries.
- `grep -rn "fetch(" mobile/src` outside tests: only `services/api.ts`.

## Verification

**Commands:**
- `cd mobile && npm run type-check && npm run lint && npm test` -- expected: green (lint: the 12 warnings already on develop, none in changed files)

## Review Triage Log

Quick review, 5 findings: 2 medium, 1 low rejected, 1 low, 1 false.

- medium, patched: the 401 refresh path was untested (no session registered). Added a session test: 401, refresh, retry with the new token.
- medium, patched with the above: the test only checked the explicit token, which a registered session overrides; the new test checks the session token is sent.
- low, rejected: retry with the explicit token when a session exists but `getAccessToken()` is null. Pre-existing `apiRequest` behavior that `authApi`'s explicit headers already share; narrow (logout race), and the old copies failed instead of retrying.
- low, patched in the plan: `getAuthToken` still throws a plain `Error` when there is no token; plan wording corrected, callers only show a generic message.
- false: `ticket: ''` is the template's value outside the ticket tree.
