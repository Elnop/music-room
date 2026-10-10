---
title: "Retirer l'accès direct aux tables avec la clé anon"
type: 'bugfix'
ticket: ''
created: '2026-10-10'
status: 'built'
baseline_revision: '2c1f210603fda190bfdd37d8a1891e9cd7aada69'
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

**Problem:** GitHub #201, security (found while writing the threat model, #67). The anon key ships in the app and PostgREST gives `anon`/`authenticated` direct privileges on the public tables: `user_profiles` is readable by anyone (`USING (true)`) including `password_reset_code` and `verification_code` (account takeover without the victim's mailbox); a user can update its own `email_verified`; `follows` INSERT does not check `can_control_music`; `tracks` has no RLS; `follows` / `music_preferences` ignore privacy. No legitimate client uses this path (mobile uses Supabase only for auth; the backend uses the service key).

**Approach:** Migration `017_revoke_direct_table_access.sql`: revoke every privilege of `anon` and `authenticated` on tables and sequences of `public`, EXECUTE on its functions (also from PUBLIC; trigger firing is unaffected), and the same as default privileges for future objects. Integration test with the anon key and a signed-in user's token proving each hole is closed and the service key still works. The migration must then be applied by hand to the hosted project.

</frozen-after-approval>

## Implementation Notes

Oneshot. Without the migration 9 of the 10 new tests fail (the service-key check passes either way); with it all 155 integration tests pass, including the playlist RPCs called with the service key. File named `017_*` (the make target produced a timestamp name; renamed to the repo's NNN convention).

## Verification

**Commands:**
- `cd backend && sh scripts/test-db.sh up && npm run test:int && npm run lint && npm run type-check` -- expected: green

## Review Triage Log

Pass 1 (quick): high 1 · medium 2 · low 1 · false 1.

| # | Finding | Verdict | Route | Evidence / action |
|---|---------|---------|-------|-------------------|
| 1 | "Anonymous" tests ran as the signed-in user: sign-in on the shared `supabaseAnon` client | high | patch | supabase-js keeps the session on the client. Sign-in moved to `createSignInClient()`; without the migration 9/10 tests now fail as `anon`. |
| 2 | Per-schema `REVOKE EXECUTE ... FROM public` default has no effect (global default) | medium | patch | Added the global `ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC`. |
| 3 | Default privileges only cover the role running the file | low | patch | Comment states it; `FOR ROLE supabase_admin` is not usable from the dashboard as postgres. |
| 4 | No test for function EXECUTE (`get_next_playlist_position`) | false | — | The function no longer exists in the current schema; the remaining public functions open to PUBLIC are trigger functions, not callable through `/rpc`; playlist RPCs were already revoked by 016. |
| 5 | follows test targets a random UUID | medium | patch | Real target user + assert no row was created. |
