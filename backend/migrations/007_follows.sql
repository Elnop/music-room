-- Zumik - Follows System
-- This migration creates the follows table for the friend/follow system

-- =====================================================
-- Follows Table
-- =====================================================
-- Stores follow relationships between users
-- A "friend" relationship exists when both users follow each other (mutual follow)

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  -- Prevent self-follow
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Index for efficient "who follows me" queries
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- Index for efficient "who do I follow" queries
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view follow relationships
CREATE POLICY "follows_select_policy"
  ON public.follows
  FOR SELECT
  USING (true);

-- Policy: Users can only insert follows where they are the follower
CREATE POLICY "follows_insert_policy"
  ON public.follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Policy: Users can only delete their own follows
CREATE POLICY "follows_delete_policy"
  ON public.follows
  FOR DELETE
  USING (auth.uid() = follower_id);

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE public.follows IS 'Follow relationships between users. Mutual follows = friends.';
COMMENT ON COLUMN public.follows.follower_id IS 'The user who is following';
COMMENT ON COLUMN public.follows.following_id IS 'The user being followed';

