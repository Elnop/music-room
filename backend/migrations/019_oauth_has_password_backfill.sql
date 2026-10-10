-- =====================================================
-- 019: has_password false for Google/Facebook sign-ups (#196)
-- =====================================================

-- 007 added has_password with DEFAULT TRUE and UserService.createOAuthUser did
-- not set it until #189: every Google or Facebook sign-up got true without a
-- password, so the linked providers list shows one and LAST_PROVIDER lets the
-- user unlink their only real sign-in method.
--
-- auth.identities and auth.users.encrypted_password cannot tell these accounts
-- apart: auth.admin.createUser gives every account an 'email' identity and, when
-- no password is passed, a random password hash. The marker is the
-- oauth_provider key createOAuthUser puts in user_metadata (register never
-- does). An account linked to Google after an email sign-up has no such key and
-- keeps true. No condition on google_id/facebook_id: a sign-up that already
-- unlinked its provider has neither and is fixed too.
--
-- Only accounts created before #189 reached develop (merge 40554b3, the first
-- code to insert false; develop runs against the hosted project). A later
-- sign-up showing true set a real password through a reset and is left alone.
-- An older sign-up that did the same cannot be told apart and goes to false: it
-- can still sign in with its password, the app only hides it, and another reset
-- sets true again. Safe to run more than once.

UPDATE public.user_profiles AS p
SET has_password = false
FROM auth.users AS u
WHERE u.id = p.id
  AND p.has_password = true
  AND u.raw_user_meta_data ? 'oauth_provider'
  AND u.created_at < '2026-10-09 22:39:21+00';
