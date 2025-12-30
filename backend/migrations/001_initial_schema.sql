-- Zumik - Initial Database Schema
-- This migration creates the user_profiles table and sets up Row Level Security (RLS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- User Profiles Table
-- =====================================================
-- This table extends Supabase Auth users with additional profile information
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  display_name TEXT CHECK (char_length(display_name) <= 50),
  avatar_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 500),
  spotify_connected BOOLEAN DEFAULT FALSE,
  spotify_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);

-- Index for Spotify user lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_spotify ON public.user_profiles(spotify_user_id) WHERE spotify_user_id IS NOT NULL;

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view user profiles (public read)
CREATE POLICY "user_profiles_select_policy"
  ON public.user_profiles
  FOR SELECT
  USING (true);

-- Policy: Users can insert their own profile (on signup)
CREATE POLICY "user_profiles_insert_policy"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update only their own profile
CREATE POLICY "user_profiles_update_policy"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can delete only their own profile
CREATE POLICY "user_profiles_delete_policy"
  ON public.user_profiles
  FOR DELETE
  USING (auth.uid() = id);

-- =====================================================
-- Automatic updated_at timestamp
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on user_profiles
CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE public.user_profiles IS 'Extended user profile information linked to Supabase Auth users';
COMMENT ON COLUMN public.user_profiles.username IS 'Unique username (3-20 characters)';
COMMENT ON COLUMN public.user_profiles.display_name IS 'Display name shown in the app';
COMMENT ON COLUMN public.user_profiles.avatar_url IS 'URL to user avatar image';
COMMENT ON COLUMN public.user_profiles.spotify_connected IS 'Whether user has connected their Spotify account';
COMMENT ON COLUMN public.user_profiles.spotify_user_id IS 'Spotify user ID for connected accounts';
