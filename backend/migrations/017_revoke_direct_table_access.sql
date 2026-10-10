-- =====================================================
-- 017: no direct database access with the anon key (#201)
-- =====================================================

-- The anon key ships in the mobile app, and PostgREST exposes the public
-- schema to the `anon` and `authenticated` roles. No client uses that path:
-- the app calls the backend, which uses the service key (service_role,
-- untouched here), and only uses Supabase directly for auth. The grants and
-- policies left from earlier migrations let anyone read user_profiles'
-- reset and verification codes (account takeover), set their own
-- email_verified, grant themselves can_control_music, and write tracks
-- (no RLS). Remove every direct privilege instead of patching policies.

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
-- Trigger functions still fire: EXECUTE is only checked on direct calls.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated, public;

-- Same for objects created later. Default privileges only apply to objects
-- created by the role running this file (postgres, from the dashboard SQL
-- editor or scripts/test-db.sh): a migration run as another role, or a table
-- created from the dashboard UI (supabase_admin), must still revoke its own.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;
-- EXECUTE for PUBLIC is a global default that a per-schema rule cannot remove.
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
