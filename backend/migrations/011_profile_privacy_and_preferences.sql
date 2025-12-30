-- Zumik - Profile Privacy and Music Preferences
-- This migration adds privacy settings and music genre preferences

-- =====================================================
-- Visibility Level Enum
-- =====================================================
DO $$ BEGIN
    CREATE TYPE visibility_level AS ENUM ('public', 'friends_only', 'private');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- Profile Privacy Table
-- =====================================================
-- Controls visibility of each profile field
CREATE TABLE IF NOT EXISTS public.profile_privacy (
  user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  email_visibility visibility_level DEFAULT 'private',
  bio_visibility visibility_level DEFAULT 'public',
  avatar_visibility visibility_level DEFAULT 'public',
  music_preferences_visibility visibility_level DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profile_privacy
ALTER TABLE public.profile_privacy ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own privacy settings
CREATE POLICY "profile_privacy_select_own"
  ON public.profile_privacy
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own privacy settings
CREATE POLICY "profile_privacy_insert_own"
  ON public.profile_privacy
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own privacy settings
CREATE POLICY "profile_privacy_update_own"
  ON public.profile_privacy
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Music Preferences Table
-- =====================================================
-- Stores user's selected music genres (max 5)
CREATE TABLE IF NOT EXISTS public.music_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  genres TEXT[] DEFAULT '{}' CHECK (array_length(genres, 1) IS NULL OR array_length(genres, 1) <= 5),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on music_preferences
ALTER TABLE public.music_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view music preferences (subject to privacy settings)
CREATE POLICY "music_preferences_select_all"
  ON public.music_preferences
  FOR SELECT
  USING (true);

-- Policy: Users can insert their own music preferences
CREATE POLICY "music_preferences_insert_own"
  ON public.music_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own music preferences
CREATE POLICY "music_preferences_update_own"
  ON public.music_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Extended Profile Fields
-- =====================================================
-- Add new columns to user_profiles if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_profiles' 
                   AND column_name = 'favorite_artist') THEN
        ALTER TABLE public.user_profiles ADD COLUMN favorite_artist TEXT;
    END IF;
END $$;

-- =====================================================
-- Triggers for updated_at
-- =====================================================

-- Trigger for profile_privacy updated_at
CREATE TRIGGER set_profile_privacy_updated_at
  BEFORE UPDATE ON public.profile_privacy
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for music_preferences updated_at
CREATE TRIGGER set_music_preferences_updated_at
  BEFORE UPDATE ON public.music_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- Function to create default privacy settings on profile creation
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_default_privacy_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profile_privacy (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.music_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create privacy settings when a profile is created
DROP TRIGGER IF EXISTS create_privacy_on_profile ON public.user_profiles;
CREATE TRIGGER create_privacy_on_profile
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_privacy_settings();

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE public.profile_privacy IS 'Privacy settings controlling visibility of user profile fields';
COMMENT ON COLUMN public.profile_privacy.email_visibility IS 'Who can see the user email (default: private)';
COMMENT ON COLUMN public.profile_privacy.bio_visibility IS 'Who can see the user bio (default: public)';
COMMENT ON COLUMN public.profile_privacy.avatar_visibility IS 'Who can see the profile picture (default: public)';
COMMENT ON COLUMN public.profile_privacy.music_preferences_visibility IS 'Who can see music preferences (default: public)';

COMMENT ON TABLE public.music_preferences IS 'User music genre preferences (max 5 genres)';
COMMENT ON COLUMN public.music_preferences.genres IS 'Array of selected music genres (max 5)';

COMMENT ON COLUMN public.user_profiles.favorite_artist IS 'User favorite artist';

