-- Migration: Remove Spotify Integration
-- Description: Removes all Spotify-related columns, indexes, and functions from the database
-- Date: 2025-12-13

-- Drop the Spotify connection clearing function
DROP FUNCTION IF EXISTS clear_spotify_connection(UUID);

-- Drop indexes related to Spotify
DROP INDEX IF EXISTS idx_user_profiles_spotify_tokens;
DROP INDEX IF EXISTS idx_user_profiles_spotify_expiry;
DROP INDEX IF EXISTS idx_user_profiles_spotify;

-- Drop Spotify-related columns from user_profiles table
ALTER TABLE user_profiles
  DROP COLUMN IF EXISTS spotify_connected,
  DROP COLUMN IF EXISTS spotify_user_id,
  DROP COLUMN IF EXISTS spotify_access_token,
  DROP COLUMN IF EXISTS spotify_refresh_token,
  DROP COLUMN IF EXISTS spotify_token_expires_at,
  DROP COLUMN IF EXISTS spotify_scopes;

-- Note: Execute this migration manually in Supabase Dashboard → SQL Editor
-- After execution, all Spotify data and schema will be permanently removed
