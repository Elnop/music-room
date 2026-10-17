-- =====================================================
-- 027: avatars_bucket
-- Public Storage bucket for profile photos (#351). Only the backend writes to
-- it, with the service role key (PUT/DELETE /api/profile/avatar), so no
-- storage.objects policy is added: clients can read a file by its public URL
-- and cannot write. Objects are `<userId>/<uuid>.<ext>`, at most 2 MB, JPEG,
-- PNG or WebP. Who sees a user's avatar URL is still decided by
-- profile_privacy.avatar_visibility.
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, '{image/jpeg,image/png,image/webp}')
ON CONFLICT (id) DO NOTHING;
