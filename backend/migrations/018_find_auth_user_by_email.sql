-- =====================================================
-- 018: find an auth user by email (#194)
-- =====================================================

-- auth.admin.listUsers() returns one page (50 users by default): the password
-- reset and the sign-up duplicate check missed every account past it. Look the
-- account up in auth.users directly, ignoring case. PostgREST does not expose
-- the auth schema, hence a SECURITY DEFINER function, callable only with the
-- service key.

CREATE OR REPLACE FUNCTION public.find_auth_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id
  FROM auth.users
  WHERE lower(email) = lower(p_email)
  ORDER BY created_at
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.find_auth_user_id_by_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_auth_user_id_by_email(text) TO service_role;
