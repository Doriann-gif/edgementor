-- Supabase/GoTrue stores auth.users.email lowercased, but the mentor
-- application form captures the email as the applicant typed it. An exact
-- match meant an approved mentor whose typed email differed in case (e.g.
-- "John@X.com" vs stored "john@x.com") never got linked to their user_id and
-- was locked out of the mentor dashboard. Compare case-insensitively.
CREATE OR REPLACE FUNCTION public.lookup_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.has_role(auth.uid(), 'admin')
      THEN (SELECT id FROM auth.users WHERE lower(email) = lower(trim(_email)) LIMIT 1)
    ELSE NULL
  END;
$$;

REVOKE EXECUTE ON FUNCTION public.lookup_user_id_by_email(text) FROM anon;
