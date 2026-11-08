

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'google_id'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN google_id TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'facebook_id'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN facebook_id TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'has_password'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN has_password BOOLEAN DEFAULT TRUE;
    END IF;
END $$;


DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'oauth_provider'
    ) THEN
        UPDATE user_profiles
        SET
          google_id = oauth_provider_id,
          has_password = FALSE
        WHERE oauth_provider = 'google' AND oauth_provider_id IS NOT NULL;

        UPDATE user_profiles
        SET has_password = TRUE
        WHERE oauth_provider = 'email' OR oauth_provider IS NULL;
    END IF;
END $$;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_user_google_id'
    ) THEN
        CREATE UNIQUE INDEX idx_user_google_id
          ON user_profiles(google_id)
          WHERE google_id IS NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_user_facebook_id'
    ) THEN
        CREATE UNIQUE INDEX idx_user_facebook_id
          ON user_profiles(facebook_id)
          WHERE facebook_id IS NOT NULL;
    END IF;
END $$;


DO $$
BEGIN
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


COMMENT ON COLUMN user_profiles.google_id IS
  'Google user ID (sub claim from Google ID token). Null if not linked.';

COMMENT ON COLUMN user_profiles.facebook_id IS
  'Facebook user ID from Facebook Login. Null if not linked.';

COMMENT ON COLUMN user_profiles.has_password IS
  'Whether user has email/password authentication. Users can have password AND OAuth providers.';


SELECT COUNT(*) as orphaned_users
FROM user_profiles
WHERE google_id IS NULL
  AND facebook_id IS NULL
  AND has_password = FALSE;

