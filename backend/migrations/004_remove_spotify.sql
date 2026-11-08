
DROP FUNCTION IF EXISTS clear_spotify_connection(UUID);

DROP INDEX IF EXISTS idx_user_profiles_spotify_tokens;
DROP INDEX IF EXISTS idx_user_profiles_spotify_expiry;
DROP INDEX IF EXISTS idx_user_profiles_spotify;

ALTER TABLE user_profiles
  DROP COLUMN IF EXISTS spotify_connected,
  DROP COLUMN IF EXISTS spotify_user_id,
  DROP COLUMN IF EXISTS spotify_access_token,
  DROP COLUMN IF EXISTS spotify_refresh_token,
  DROP COLUMN IF EXISTS spotify_token_expires_at,
  DROP COLUMN IF EXISTS spotify_scopes;

