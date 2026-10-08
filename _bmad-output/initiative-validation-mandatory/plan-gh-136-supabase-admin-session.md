---
title: 'Supabase admin client keeps the service role after a user sign-in'
type: 'bugfix'
ticket: ''
created: '2026-10-08'
status: 'built'
baseline_revision: 'e79188968a8266c006988fb4f15d563c4d4f1f0b'
route: 'oneshot'
route_source: 'auto'
risk: 'high'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub issue #136. The server signs users in (`signInWithPassword`, `verifyOtp`, `refreshSession`) on the shared `supabaseAdmin` client. supabase-js keeps the resulting session in memory even with `persistSession: false` and sends that user's JWT instead of the service key, so every later PostgREST query of the server runs as the last signed-in user, under RLS.

**Approach:** Run each sign-in on a throwaway client created for the call (anon key, no persisted session, no auto-refresh), never on `supabaseAdmin`. Remove the `signOut` workaround from `provider-link.int.test.ts` and add an integration test proving an admin write on another user still succeeds after a password login, an OAuth (magic-link `verifyOtp`) login and a refresh.

</frozen-after-approval>

## Implementation Notes

Oneshot: four call sites switch to a factory in `backend/src/shared/config/supabase.ts`, plus one integration test; well under 100 lines. Risk is high because a wrong fix silently changes which role every server query runs as (authorization of all writes).

`createSignInClient()` in `backend/src/shared/config/supabase.ts` builds a fresh anon-key client per call; `auth.service.ts` (signInWithPassword), `services/user.service.ts` and `auth.controller.ts` (verifyOtp), `services/session.service.ts` (refreshSession) use it. Anon key, not service key: these GoTrue endpoints do not need the service role, so the throwaway client carries no privilege. `getUser(token)` stays on `supabase`: it only reads, it does not store a session. New `services/admin-session.int.test.ts` fails on the baseline (both tests) and passes with the fix; the `signOut` workaround in `provider-link.int.test.ts` is gone. Not covered by a test: the email-verification `verifyOtp` in the controller (same factory).

## Review Triage Log

Quick review: 0 high, 0 medium, 3 low.

- low, patch: `auth.service.ts` sign-in call broke Prettier (printWidth 100). Fixed with `prettier --write`; lint, type-check and integration tests green again.
- low, rejected: `createUser` fixture duplicated from `provider-link.int.test.ts`. Sharing it means a new test helper module; only two files hold it, a `user_profiles` schema change touching both is rare.
- low, rejected: `socket-auth.int.test.ts` signs in on the shared `supabaseAnon`. Pre-existing, test-only; no production code uses `supabaseAnon`, so no server query runs under that session.
