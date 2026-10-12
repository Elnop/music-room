-- Migration: playlist viewer_ids
--
-- playlists.viewer_ids was added to the hosted database by hand and never
-- committed, while 010_edit_mode.sql and the backend already rely on it.
-- This file restores it so the migrations build the schema from scratch
-- (local Supabase stack for integration tests, see doc/TESTING.md).
-- It is numbered 008 to run before 010; on the hosted database it is a no-op.

ALTER TABLE public.playlists
ADD COLUMN IF NOT EXISTS viewer_ids UUID[] DEFAULT '{}';

COMMENT ON COLUMN public.playlists.viewer_ids IS 'Array of user IDs invited to view this private playlist';
