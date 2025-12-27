-- Music Room - Replace location with avatar visibility
-- Location was not required by the subject, but avatar visibility is

-- =====================================================
-- Update profile_privacy table
-- =====================================================

-- Add avatar_visibility column
ALTER TABLE public.profile_privacy 
ADD COLUMN IF NOT EXISTS avatar_visibility visibility_level DEFAULT 'public';

-- Drop location_visibility column if it exists
ALTER TABLE public.profile_privacy 
DROP COLUMN IF EXISTS location_visibility;

-- =====================================================
-- Update user_profiles table
-- =====================================================

-- Drop location column if it exists (not required by subject)
ALTER TABLE public.user_profiles 
DROP COLUMN IF EXISTS location;

-- =====================================================
-- Update comments
-- =====================================================
COMMENT ON COLUMN public.profile_privacy.avatar_visibility IS 'Who can see the profile picture (default: public)';

