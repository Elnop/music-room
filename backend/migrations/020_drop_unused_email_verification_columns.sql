

ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS email_verification_token;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS email_verification_expires_at;
