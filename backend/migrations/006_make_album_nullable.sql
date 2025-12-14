-- Migration: Make album field nullable
-- Description: SoundCloud and other music services don't always have album information
-- Date: 2025-12-14

-- Remove NOT NULL constraint and length check from album column
ALTER TABLE tracks
  ALTER COLUMN album DROP NOT NULL;

-- Drop the old check constraint (includes min length requirement)
ALTER TABLE tracks
  DROP CONSTRAINT IF EXISTS tracks_album_check;

-- Add new check constraint with only max length (when album is provided)
ALTER TABLE tracks
  ADD CONSTRAINT tracks_album_check CHECK (
    album IS NULL OR (char_length(album) > 0 AND char_length(album) <= 200)
  );

-- Note: Album field is now optional
-- - For Spotify tracks: album name from API
-- - For SoundCloud tracks: NULL (no album concept)
-- - For other services: depends on service capabilities
