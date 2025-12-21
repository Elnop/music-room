-- Music Room - Edit Mode for Playlists
-- This migration adds edit_mode column to support the subject requirements:
-- By default, everyone can edit the playlist (open mode)
-- With restricted mode, only collaborators can edit
-- Date: 2025-12-21

-- =====================================================
-- Add edit_mode column to playlists
-- =====================================================
ALTER TABLE public.playlists 
ADD COLUMN IF NOT EXISTS edit_mode TEXT NOT NULL DEFAULT 'open' 
CHECK (edit_mode IN ('open', 'restricted'));

-- =====================================================
-- Update RLS policies for edit permissions
-- =====================================================

-- Drop existing track insert policy (we need to update it)
DROP POLICY IF EXISTS "playlist_tracks_insert_policy" ON public.playlist_tracks;

-- New insert policy that respects edit_mode
-- In 'open' mode: anyone who can view can also edit
-- In 'restricted' mode: only owner or collaborators can edit
CREATE POLICY "playlist_tracks_insert_policy"
  ON public.playlist_tracks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_tracks.playlist_id
        AND (
          -- Owner can always edit
          playlists.owner_id = auth.uid()
          -- Collaborators can always edit
          OR auth.uid() = ANY(playlists.collaborator_ids)
          -- In open mode, anyone who can view can edit
          OR (
            playlists.edit_mode = 'open'
            AND (
              playlists.visibility = 'public'
              OR auth.uid() = ANY(playlists.viewer_ids)
            )
          )
        )
    )
  );

-- Drop existing track delete policy
DROP POLICY IF EXISTS "playlist_tracks_delete_policy" ON public.playlist_tracks;

-- New delete policy with same logic as insert
CREATE POLICY "playlist_tracks_delete_policy"
  ON public.playlist_tracks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_tracks.playlist_id
        AND (
          playlists.owner_id = auth.uid()
          OR auth.uid() = ANY(playlists.collaborator_ids)
          OR (
            playlists.edit_mode = 'open'
            AND (
              playlists.visibility = 'public'
              OR auth.uid() = ANY(playlists.viewer_ids)
            )
          )
        )
    )
  );

-- =====================================================
-- Index for edit_mode queries
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_playlists_edit_mode ON public.playlists(edit_mode);

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON COLUMN public.playlists.edit_mode IS 'Edit permission mode: open (anyone can edit) or restricted (only collaborators)';

