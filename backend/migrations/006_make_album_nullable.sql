
ALTER TABLE tracks
  ALTER COLUMN album DROP NOT NULL;

ALTER TABLE tracks
  DROP CONSTRAINT IF EXISTS tracks_album_check;

ALTER TABLE tracks
  ADD CONSTRAINT tracks_album_check CHECK (
    album IS NULL OR (char_length(album) > 0 AND char_length(album) <= 200)
  );

