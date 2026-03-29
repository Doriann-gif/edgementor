
ALTER TABLE public.mentor_applications ADD COLUMN user_id uuid DEFAULT NULL;

CREATE OR REPLACE FUNCTION public.lookup_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE email = _email LIMIT 1;
$$;
