-- Zumik - Playlist Persistence
-- This migration creates playlists, tracks, and playlist_tracks tables
-- Date: 2025-12-07

-- =====================================================
-- Enable UUID extension
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Tracks Table
-- =====================================================
-- Centralized track metadata (deduplicated by Spotify URI)
CREATE TABLE IF NOT EXISTS public.tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spotify_uri TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  artist TEXT NOT NULL CHECK (char_length(artist) >= 1 AND char_length(artist) <= 200),
  album TEXT NOT NULL CHECK (char_length(album) >= 1 AND char_length(album) <= 200),
  album_art TEXT,
  duration_ms INTEGER NOT NULL CHECK (duration_ms > 0),
  preview_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for tracks
CREATE UNIQUE INDEX IF NOT EXISTS idx_tracks_spotify_uri ON public.tracks(spotify_uri);
CREATE INDEX IF NOT EXISTS idx_tracks_title ON public.tracks(title);
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON public.tracks(artist);

-- =====================================================
-- Playlists Table
-- =====================================================
-- Playlist metadata and ownership
CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  cover_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  collaborator_ids UUID[] DEFAULT '{}',
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for playlists
CREATE INDEX IF NOT EXISTS idx_playlists_owner ON public.playlists(owner_id);
CREATE INDEX IF NOT EXISTS idx_playlists_visibility ON public.playlists(visibility);
CREATE INDEX IF NOT EXISTS idx_playlists_created ON public.playlists(created_at DESC);

-- =====================================================
-- Playlist Tracks Junction Table
-- =====================================================
-- Many-to-many relationship with ordering
CREATE TABLE IF NOT EXISTS public.playlist_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0),
  added_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_playlist_position UNIQUE (playlist_id, position),
  CONSTRAINT unique_playlist_track UNIQUE (playlist_id, track_id)
);

-- Indexes for playlist_tracks
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON public.playlist_tracks(playlist_id, position);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track ON public.playlist_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_added_by ON public.playlist_tracks(added_by);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Playlists RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "playlists_select_policy"
  ON public.playlists FOR SELECT
  USING (visibility = 'public' OR owner_id = auth.uid() OR auth.uid() = ANY(collaborator_ids));

CREATE POLICY "playlists_insert_policy"
  ON public.playlists FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "playlists_update_policy"
  ON public.playlists FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "playlists_delete_policy"
  ON public.playlists FOR DELETE
  USING (auth.uid() = owner_id);

-- Playlist Tracks RLS
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "playlist_tracks_select_policy"
  ON public.playlist_tracks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_tracks.playlist_id
        AND (playlists.visibility = 'public' OR playlists.owner_id = auth.uid() OR auth.uid() = ANY(playlists.collaborator_ids))
    )
  );

CREATE POLICY "playlist_tracks_insert_policy"
  ON public.playlist_tracks FOR INSERT
  WITH CHECK (
    added_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_tracks.playlist_id
        AND (playlists.owner_id = auth.uid() OR auth.uid() = ANY(playlists.collaborator_ids))
    )
  );

CREATE POLICY "playlist_tracks_delete_policy"
  ON public.playlist_tracks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_tracks.playlist_id
        AND (playlists.owner_id = auth.uid() OR auth.uid() = ANY(playlists.collaborator_ids))
    )
  );

-- =====================================================
-- Helper Functions
-- =====================================================

-- Get next available position for playlist
CREATE OR REPLACE FUNCTION public.get_next_playlist_position(p_playlist_id UUID)
RETURNS INTEGER AS $$
DECLARE
  max_pos INTEGER;
BEGIN
  SELECT COALESCE(MAX(position), -1) INTO max_pos
  FROM public.playlist_tracks
  WHERE playlist_id = p_playlist_id;
  RETURN max_pos + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers for auto-update timestamps
-- =====================================================

CREATE TRIGGER set_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_tracks_updated_at
  BEFORE UPDATE ON public.tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE public.playlists IS 'User-created playlists with ownership and collaboration';
COMMENT ON TABLE public.tracks IS 'Centralized track metadata deduplicated by Spotify URI';
COMMENT ON TABLE public.playlist_tracks IS 'Junction table for playlist-track relationship with ordering';

COMMENT ON COLUMN public.playlists.collaborator_ids IS 'Array of user IDs who can edit this playlist';
COMMENT ON COLUMN public.playlists.visibility IS 'Playlist visibility: public or private';
COMMENT ON COLUMN public.tracks.spotify_uri IS 'Unique Spotify URI (e.g., spotify:track:xxx)';
COMMENT ON COLUMN public.playlist_tracks.position IS 'Track position in playlist (0-based index)';
COMMENT ON COLUMN public.playlist_tracks.added_by IS 'User who added this track to the playlist';
