

UPDATE public.user_profiles AS p
SET has_password = false
FROM auth.users AS u
WHERE u.id = p.id
  AND p.has_password = true
  AND u.raw_user_meta_data ? 'oauth_provider'
  AND u.created_at < '2026-10-09 22:39:21+00';
