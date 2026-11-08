
ALTER TABLE public.playlists 
ADD COLUMN IF NOT EXISTS edit_mode TEXT NOT NULL DEFAULT 'open' 
CHECK (edit_mode IN ('open', 'restricted'));


DROP POLICY IF EXISTS "playlist_tracks_insert_policy" ON public.playlist_tracks;

CREATE POLICY "playlist_tracks_insert_policy"
  ON public.playlist_tracks FOR INSERT
  WITH CHECK (
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

DROP POLICY IF EXISTS "playlist_tracks_delete_policy" ON public.playlist_tracks;

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

CREATE INDEX IF NOT EXISTS idx_playlists_edit_mode ON public.playlists(edit_mode);

COMMENT ON COLUMN public.playlists.edit_mode IS 'Edit permission mode: open (anyone can edit) or restricted (only collaborators)';

