-- Migration 007: Multi-Provider OAuth Support (SAFE VERSION)
-- Refactor authentication schema to support multiple OAuth providers per user
-- This version checks for existing columns before adding them

-- =============================================================================
-- Step 1: Add new provider columns (IF NOT EXISTS)
-- =============================================================================

DO $$
BEGIN
    -- Add google_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'google_id'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN google_id TEXT;
    END IF;

    -- Add facebook_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'facebook_id'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN facebook_id TEXT;
    END IF;

    -- Add has_password if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'has_password'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN has_password BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- =============================================================================
-- Step 2: Migrate existing data (ONLY if old columns exist)
-- =============================================================================

DO $$
BEGIN
    -- Check if old oauth_provider column still exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'oauth_provider'
    ) THEN
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
    END IF;
END $$;

-- =============================================================================
-- Step 3: Create unique constraints (IF NOT EXISTS)
-- =============================================================================

DO $$
BEGIN
    -- Create unique index for google_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_user_google_id'
    ) THEN
        CREATE UNIQUE INDEX idx_user_google_id
          ON user_profiles(google_id)
          WHERE google_id IS NOT NULL;
    END IF;

    -- Create unique index for facebook_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_user_facebook_id'
    ) THEN
        CREATE UNIQUE INDEX idx_user_facebook_id
          ON user_profiles(facebook_id)
          WHERE facebook_id IS NOT NULL;
    END IF;
END $$;

-- =============================================================================
-- Step 4: Remove old oauth columns (ONLY if they exist)
-- =============================================================================

DO $$
BEGIN
    -- Drop old indexes if they exist
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_oauth_google_id'
    ) THEN
        DROP INDEX idx_oauth_google_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_oauth_provider'
    ) THEN
        DROP INDEX idx_oauth_provider;
    END IF;

    -- Drop old columns if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'oauth_provider'
    ) THEN
        ALTER TABLE user_profiles DROP COLUMN oauth_provider;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'oauth_provider_id'
    ) THEN
        ALTER TABLE user_profiles DROP COLUMN oauth_provider_id;
    END IF;
END $$;

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
SELECT COUNT(*) as orphaned_users
FROM user_profiles
WHERE google_id IS NULL
  AND facebook_id IS NULL
  AND has_password = FALSE;

-- Expected result: orphaned_users = 0
