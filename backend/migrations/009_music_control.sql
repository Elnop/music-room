-- Zumik - Music Control Delegation
-- This migration adds the can_control_music column to the follows table
-- to enable music control delegation between friends

-- =====================================================
-- Add can_control_music column to follows table
-- =====================================================

ALTER TABLE public.follows 
ADD COLUMN IF NOT EXISTS can_control_music BOOLEAN DEFAULT FALSE;

-- Index for efficient lookups of who can control whose music
CREATE INDEX IF NOT EXISTS idx_follows_music_control 
ON public.follows(following_id) 
WHERE can_control_music = true;

-- =====================================================
-- Documentation
-- =====================================================

COMMENT ON COLUMN public.follows.can_control_music IS 
  'If true, the follower (follower_id) can control the music of following_id. 
   Example: In follows(B, A) with can_control_music=true, A authorizes B to control their music.';

