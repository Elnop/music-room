-- Migration 014: Password Reset Support
-- Adds columns for password reset code and expiration to user_profiles table

-- Add password reset columns to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS password_reset_code TEXT,
ADD COLUMN IF NOT EXISTS password_reset_code_expires_at TIMESTAMPTZ;

-- Create index for fast lookups during verification
CREATE INDEX IF NOT EXISTS idx_user_profiles_password_reset_code
ON public.user_profiles(password_reset_code)
WHERE password_reset_code IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.user_profiles.password_reset_code IS
'6-digit code for password reset, expires after 15 minutes';

COMMENT ON COLUMN public.user_profiles.password_reset_code_expires_at IS
'Expiration timestamp for password reset code (15 minutes from generation)';
