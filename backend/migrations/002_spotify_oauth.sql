-- Music Room - Spotify OAuth Integration
-- This migration adds Spotify token storage to user_profiles table

-- =====================================================
-- Add Spotify Token Columns
-- =====================================================
-- Extending user_profiles table with Spotify OAuth tokens
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS spotify_access_token TEXT,
  ADD COLUMN IF NOT EXISTS spotify_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS spotify_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS spotify_scopes TEXT[];

-- =====================================================
-- Indexes
-- =====================================================
-- Index for finding users with valid Spotify tokens
CREATE INDEX IF NOT EXISTS idx_user_profiles_spotify_tokens
  ON public.user_profiles(id)
  WHERE spotify_access_token IS NOT NULL;

-- Index for token expiration checks
CREATE INDEX IF NOT EXISTS idx_user_profiles_spotify_expiry
  ON public.user_profiles(spotify_token_expires_at)
  WHERE spotify_token_expires_at IS NOT NULL;

-- =====================================================
-- Security Function: Clear Spotify Tokens
-- =====================================================
-- Function to securely clear Spotify connection data
CREATE OR REPLACE FUNCTION public.clear_spotify_connection(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
  SET
    spotify_connected = FALSE,
    spotify_user_id = NULL,
    spotify_access_token = NULL,
    spotify_refresh_token = NULL,
    spotify_token_expires_at = NULL,
    spotify_scopes = NULL,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON COLUMN public.user_profiles.spotify_access_token IS 'Spotify OAuth access token (encrypted at rest)';
COMMENT ON COLUMN public.user_profiles.spotify_refresh_token IS 'Spotify OAuth refresh token (encrypted at rest)';
COMMENT ON COLUMN public.user_profiles.spotify_token_expires_at IS 'Spotify access token expiration timestamp';
COMMENT ON COLUMN public.user_profiles.spotify_scopes IS 'Array of Spotify OAuth scopes granted';
COMMENT ON FUNCTION public.clear_spotify_connection IS 'Securely disconnects Spotify account and clears all tokens';
