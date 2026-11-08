

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);


ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_select_policy"
  ON public.follows
  FOR SELECT
  USING (true);

CREATE POLICY "follows_insert_policy"
  ON public.follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete_policy"
  ON public.follows
  FOR DELETE
  USING (auth.uid() = follower_id);


COMMENT ON TABLE public.follows IS 'Follow relationships between users. Mutual follows = friends.';
COMMENT ON COLUMN public.follows.follower_id IS 'The user who is following';
COMMENT ON COLUMN public.follows.following_id IS 'The user being followed';

