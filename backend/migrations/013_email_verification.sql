
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_code TEXT,
ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_user_profiles_verification_code
ON public.user_profiles(verification_code)
WHERE verification_code IS NOT NULL;

COMMENT ON COLUMN public.user_profiles.email_verified IS 'Whether user has verified their email address. OAuth accounts (Google/Facebook) are auto-verified.';
COMMENT ON COLUMN public.user_profiles.verification_code IS '6-digit numeric verification code sent to user email. Expires after 15 minutes.';
COMMENT ON COLUMN public.user_profiles.verification_code_expires_at IS 'Expiration timestamp for verification code (15 minutes from generation).';

UPDATE public.user_profiles
SET email_verified = TRUE
WHERE created_at < NOW() AND email_verified IS NULL;

DO $$
BEGIN
  RAISE NOTICE 'Migration 013 completed successfully: Email verification fields added to user_profiles';
END $$;
