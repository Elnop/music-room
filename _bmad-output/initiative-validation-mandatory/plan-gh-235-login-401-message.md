---
title: 'Wrong-password login shows the backend message, not "Session expired"'
type: 'bugfix'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: '45949cbf2f1b20066a4a2ce6bbb5b3097285ab0f'
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

**Problem:** `apiRequest` (`mobile/src/services/api.ts`) treated every 401 as an expired token: signed out, a wrong-password login triggered a failed refresh and showed "Session expired. Please login again." instead of "Invalid email or password" (GitHub #235).

**Approach:** Attempt the refresh only when the request carried an access token; otherwise hand the backend's 401 to `handleResponse` unchanged.

</frozen-after-approval>

## Implementation Notes

Oneshot (one condition):
- `api.ts`: `if (response.status === 401 && accessToken)`.
- `authStore.test.ts` "rejects and stores nothing when the password is wrong": now expects the backend message, one request only (no `/refresh`), and the error in the store. Fails without the fix; the existing refresh tests (401 with a token) still pass. Mobile suite 259/259, type-check, lint, prettier clean.

## Review Triage Log

Quick review, 1 finding: low, patched (wording).

- low, patched: the check uses the store's token, not the request's `Authorization` header; callers that pass their own header after the store was cleared now get the backend's 401 instead of `SESSION_EXPIRED`, but no refresh could have worked there (no refresh token) and nothing branches on that code. Comment reworded to "refresh only when a session exists". Reviewer confirmed no real expired-session path skips the refresh.
