-- Migration: Rename spotify_uri to track_uri
-- Description: Makes the column name generic to support any music service (SoundCloud, Spotify, etc.)
-- Date: 2025-12-13

-- Rename the column
ALTER TABLE tracks
  RENAME COLUMN spotify_uri TO track_uri;

-- Update the unique constraint name for clarity
ALTER TABLE tracks
  RENAME CONSTRAINT tracks_spotify_uri_key TO tracks_track_uri_key;

-- Note: The column now stores universal track identifiers from any music service
-- Examples:
--   - SoundCloud: https://soundcloud.com/artist/track-name
--   - Spotify: spotify:track:abc123
--   - YouTube Music: https://music.youtube.com/watch?v=xyz
