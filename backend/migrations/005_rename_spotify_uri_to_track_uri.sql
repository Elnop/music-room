
ALTER TABLE tracks
  RENAME COLUMN spotify_uri TO track_uri;

ALTER TABLE tracks
  RENAME CONSTRAINT tracks_spotify_uri_key TO tracks_track_uri_key;

