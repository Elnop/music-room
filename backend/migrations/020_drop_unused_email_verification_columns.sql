-- =====================================================
-- 020: drop user_profiles columns no migration creates (#254)
-- =====================================================

-- The hosted database has user_profiles.email_verification_token and
-- email_verification_expires_at, added by hand: no migration creates them and
-- no code reads them (email codes live in user_profiles.verification_code and
-- verification_code_expires_at, 013). The migrations are the source of truth, so
-- drop them; IF EXISTS keeps this a no-op on databases built from the
-- migrations (local stacks, CI).

ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS email_verification_token;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS email_verification_expires_at;
