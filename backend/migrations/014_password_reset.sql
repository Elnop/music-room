
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS password_reset_code TEXT,
ADD COLUMN IF NOT EXISTS password_reset_code_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_user_profiles_password_reset_code
ON public.user_profiles(password_reset_code)
WHERE password_reset_code IS NOT NULL;

COMMENT ON COLUMN public.user_profiles.password_reset_code IS
'6-digit code for password reset, expires after 15 minutes';

COMMENT ON COLUMN public.user_profiles.password_reset_code_expires_at IS
'Expiration timestamp for password reset code (15 minutes from generation)';
