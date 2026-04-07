-- Helper function that looks up an auth user by email.
-- SECURITY DEFINER runs as the function owner (postgres), which can access auth.users.
-- This avoids loading all users in application code.

CREATE OR REPLACE FUNCTION public.get_auth_user_by_email(p_email text)
RETURNS TABLE (
  id                  uuid,
  email               text,
  email_confirmed_at  timestamptz,
  raw_user_meta_data  jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT id, email, email_confirmed_at, raw_user_meta_data
  FROM auth.users
  WHERE LOWER(email) = LOWER(p_email)
  LIMIT 1;
$$;

-- Restrict execution to the service role only (anon/authenticated cannot call this).
REVOKE EXECUTE ON FUNCTION public.get_auth_user_by_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_user_by_email(text) TO service_role;
