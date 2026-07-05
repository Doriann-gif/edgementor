-- ============================================
-- 1. CREATE MISSING TABLE: mentor_payment_config
--    All Stripe edge functions (create-checkout, create-connect-account,
--    connect-balance, process-withdrawal) reference this table, but it was
--    never created — mentor payouts were silently broken and checkout
--    payments never split to mentors' Connect accounts.
-- ============================================
CREATE TABLE IF NOT EXISTS public.mentor_payment_config (
  mentor_id uuid PRIMARY KEY REFERENCES public.mentors(id) ON DELETE CASCADE,
  stripe_connect_account_id text,
  payouts_enabled boolean NOT NULL DEFAULT false,
  auto_payout boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS enabled with NO policies: only the service role (edge functions) can
-- read or write. Stripe account IDs never reach the client.
ALTER TABLE public.mentor_payment_config ENABLE ROW LEVEL SECURITY;

-- Keep updated_at fresh on changes
CREATE OR REPLACE FUNCTION public.touch_mentor_payment_config()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_mentor_payment_config ON public.mentor_payment_config;
CREATE TRIGGER trg_touch_mentor_payment_config
BEFORE UPDATE ON public.mentor_payment_config
FOR EACH ROW
EXECUTE FUNCTION public.touch_mentor_payment_config();

-- ============================================
-- 2. LOCK DOWN lookup_user_id_by_email
--    Previously any authenticated user could resolve any email address to a
--    user id (enumeration oracle). Only admins need it (application approval).
-- ============================================
CREATE OR REPLACE FUNCTION public.lookup_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.has_role(auth.uid(), 'admin')
      THEN (SELECT id FROM auth.users WHERE email = _email LIMIT 1)
    ELSE NULL
  END;
$$;

REVOKE EXECUTE ON FUNCTION public.lookup_user_id_by_email(text) FROM anon;

-- ============================================
-- 3. RESTORE REALTIME FOR MESSAGES
--    The messages table was dropped from the realtime publication in an
--    earlier security pass, which silently broke live message updates in
--    both dashboards. Realtime postgres_changes enforces RLS for
--    authenticated users, so re-adding it does not leak messages.
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============================================
-- 4. PROTECT rating & students FROM SELF-INFLATION
--    Mentors can update their own row; the protection trigger blocked
--    status/tier/user_id but left rating and students editable — a mentor
--    could give themselves a fake 5.0 rating and thousands of students.
--    Only admins (and the service role) may change these.
-- ============================================
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
  -- Updates issued from within other triggers (e.g. the rating/students
  -- aggregation triggers) are trusted internal writes.
  IF pg_trigger_depth() > 1 THEN
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
  IF NEW.rating IS DISTINCT FROM OLD.rating THEN
    RAISE EXCEPTION 'You cannot modify the rating field';
  END IF;
  IF NEW.students IS DISTINCT FROM OLD.students THEN
    RAISE EXCEPTION 'You cannot modify the students field';
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================
-- 5. INDEXES for the hottest lookups (subscription checks run on every
--    content-access request)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON public.subscriptions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_mentor_status
  ON public.subscriptions (mentor_id, status);
