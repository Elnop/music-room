-- =====================================================
-- 031: playlist_covers_bucket
-- Public Storage bucket for custom playlist covers, a Premium feature
-- (bonus V.3, #483). Only the backend writes to it, with the service role
-- key (PUT/DELETE /api/playlists/:id/cover), so no storage.objects policy is
-- added: clients read a file by its public URL and cannot write. Objects are
-- `<playlistId>/<uuid>.<ext>`, at most 2 MB, JPEG, PNG or WebP; the URL is
-- stored in playlists.cover_url.
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('playlist-covers', 'playlist-covers', true, 2097152, '{image/jpeg,image/png,image/webp}')
ON CONFLICT (id) DO NOTHING;
