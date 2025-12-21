-- Migration 007: Multi-Provider OAuth Support
-- Refactor authentication schema to support multiple OAuth providers per user

-- =============================================================================
-- Step 1: Add new provider columns
-- =============================================================================

ALTER TABLE user_profiles
  ADD COLUMN google_id TEXT,
  ADD COLUMN facebook_id TEXT,
  ADD COLUMN has_password BOOLEAN DEFAULT TRUE;

-- =============================================================================
-- Step 2: Migrate existing data
-- =============================================================================

-- Migrate users with oauth_provider='google'
UPDATE user_profiles
SET
  google_id = oauth_provider_id,
  has_password = FALSE
WHERE oauth_provider = 'google' AND oauth_provider_id IS NOT NULL;

-- Mark users with email/password authentication
UPDATE user_profiles
SET has_password = TRUE
WHERE oauth_provider = 'email' OR oauth_provider IS NULL;

-- =============================================================================
-- Step 3: Create unique constraints
-- =============================================================================

-- Each Google account can only be linked to one Music Room account
CREATE UNIQUE INDEX idx_user_google_id
  ON user_profiles(google_id)
  WHERE google_id IS NOT NULL;

-- Each Facebook account can only be linked to one Music Room account
CREATE UNIQUE INDEX idx_user_facebook_id
  ON user_profiles(facebook_id)
  WHERE facebook_id IS NOT NULL;

-- =============================================================================
-- Step 4: Remove old oauth columns
-- =============================================================================

DROP INDEX IF EXISTS idx_oauth_google_id;
DROP INDEX IF EXISTS idx_oauth_provider;

ALTER TABLE user_profiles
  DROP COLUMN oauth_provider,
  DROP COLUMN oauth_provider_id;

-- =============================================================================
-- Step 5: Add column comments
-- =============================================================================

COMMENT ON COLUMN user_profiles.google_id IS
  'Google user ID (sub claim from Google ID token). Null if not linked.';

COMMENT ON COLUMN user_profiles.facebook_id IS
  'Facebook user ID from Facebook Login. Null if not linked.';

COMMENT ON COLUMN user_profiles.has_password IS
  'Whether user has email/password authentication. Users can have password AND OAuth providers.';

-- =============================================================================
-- Validation Query (run after migration to verify success)
-- =============================================================================

-- This query should return 0 orphaned users
-- SELECT COUNT(*) as orphaned_users
-- FROM user_profiles
-- WHERE google_id IS NULL
--   AND facebook_id IS NULL
--   AND has_password = FALSE;
