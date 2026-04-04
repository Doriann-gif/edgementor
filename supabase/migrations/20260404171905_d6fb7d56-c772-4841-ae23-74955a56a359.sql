
-- Prevent non-admin mentors from modifying protected columns
CREATE OR REPLACE FUNCTION public.protect_mentor_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service role (edge functions) and admins to modify anything
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Block changes to protected columns for non-admin users
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'You cannot modify the status field';
  END IF;

  IF NEW.tier IS DISTINCT FROM OLD.tier THEN
    RAISE EXCEPTION 'You cannot modify the tier field';
  END IF;

  IF NEW.payouts_enabled IS DISTINCT FROM OLD.payouts_enabled THEN
    RAISE EXCEPTION 'You cannot modify the payouts_enabled field';
  END IF;

  IF NEW.auto_payout IS DISTINCT FROM OLD.auto_payout THEN
    RAISE EXCEPTION 'You cannot modify the auto_payout field';
  END IF;

  IF NEW.stripe_connect_account_id IS DISTINCT FROM OLD.stripe_connect_account_id THEN
    RAISE EXCEPTION 'You cannot modify the stripe_connect_account_id field';
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'You cannot modify the user_id field';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_mentor_columns_trigger
BEFORE UPDATE ON public.mentors
FOR EACH ROW
EXECUTE FUNCTION public.protect_mentor_columns();
