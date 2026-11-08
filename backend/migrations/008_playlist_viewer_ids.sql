
ALTER TABLE public.playlists
ADD COLUMN IF NOT EXISTS viewer_ids UUID[] DEFAULT '{}';

COMMENT ON COLUMN public.playlists.viewer_ids IS 'Array of user IDs invited to view this private playlist';
