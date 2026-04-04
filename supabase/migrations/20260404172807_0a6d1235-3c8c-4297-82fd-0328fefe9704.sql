
-- 1. Drop the view first so we can modify columns
DROP VIEW IF EXISTS public.mentors_public;

-- 2. Drop sensitive columns
ALTER TABLE public.mentors DROP COLUMN IF EXISTS stripe_connect_account_id;
ALTER TABLE public.mentors DROP COLUMN IF EXISTS payouts_enabled;
ALTER TABLE public.mentors DROP COLUMN IF EXISTS auto_payout;

-- 3. Recreate the view with correct column order (no sensitive columns)
CREATE VIEW public.mentors_public
WITH (security_invoker = true)
AS SELECT
  id, name, avatar, bio, full_bio, experience, instruments, concepts,
  session, monthly_price, rating, students, highlights, status,
  created_at, available, tier, payment_type, banner_color, country, social_link
FROM public.mentors
WHERE status = 'approved';

-- 4. Update trigger function (remove references to dropped columns)
CREATE OR REPLACE FUNCTION public.protect_mentor_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'You cannot modify the status field';
  END IF;
  IF NEW.tier IS DISTINCT FROM OLD.tier THEN
    RAISE EXCEPTION 'You cannot modify the tier field';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'You cannot modify the user_id field';
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Restrict discount codes: remove policy that lets users list ALL active codes
DROP POLICY IF EXISTS "Users can validate a specific active code" ON public.discount_codes;
