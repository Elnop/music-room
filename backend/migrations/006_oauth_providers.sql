-- Migration 006: OAuth Provider Support
-- Adds support for Google OAuth authentication

-- Add OAuth provider columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN oauth_provider TEXT DEFAULT 'email'
  CHECK (oauth_provider IN ('email', 'google')),
ADD COLUMN oauth_provider_id TEXT,
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- Set defaults for existing users (already verified via email/password)
UPDATE user_profiles
SET oauth_provider = 'email',
    email_verified = TRUE
WHERE oauth_provider IS NULL;

-- Make oauth_provider NOT NULL after setting defaults
ALTER TABLE user_profiles
ALTER COLUMN oauth_provider SET NOT NULL;

-- Unique constraint: one Google account = one Zumik account
CREATE UNIQUE INDEX idx_oauth_google_id
  ON user_profiles(oauth_provider_id)
  WHERE oauth_provider = 'google' AND oauth_provider_id IS NOT NULL;

-- Index for provider lookups
CREATE INDEX idx_oauth_provider
  ON user_profiles(oauth_provider);

-- Column comments for documentation
COMMENT ON COLUMN user_profiles.oauth_provider IS
  'Authentication provider: email (password-based), google, or future providers (apple, facebook)';
COMMENT ON COLUMN user_profiles.oauth_provider_id IS
  'Provider-specific user ID (Google sub claim, Apple user ID, etc.)';
COMMENT ON COLUMN user_profiles.email_verified IS
  'Email verification status: auto-true for OAuth providers, manual verification for email/password';
