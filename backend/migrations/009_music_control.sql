

ALTER TABLE public.follows 
ADD COLUMN IF NOT EXISTS can_control_music BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_follows_music_control 
ON public.follows(following_id) 
WHERE can_control_music = true;


COMMENT ON COLUMN public.follows.can_control_music IS 
  'If true, the follower (follower_id) can control the music of following_id. 
   Example: In follows(B, A) with can_control_music=true, A authorizes B to control their music.';

