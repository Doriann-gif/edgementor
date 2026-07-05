-- ============================================
-- 1. STRIPE CUSTOMER MAPPING
--    Looking customers up by email creates duplicates with concurrent
--    checkouts and breaks if the user changes their email. Store the
--    canonical customer id per user. Service-role only (RLS, no policies) —
--    a user must never be able to point their account at someone else's
--    Stripe customer.
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_payment_config (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_payment_config ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.touch_user_payment_config()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_user_payment_config ON public.user_payment_config;
CREATE TRIGGER trg_touch_user_payment_config
BEFORE UPDATE ON public.user_payment_config
FOR EACH ROW
EXECUTE FUNCTION public.touch_user_payment_config();

-- ============================================
-- 2. RESTRICT MENTOR MESSAGING TO THEIR OWN STUDENTS
--    The previous policy let a mentor message ANY user id (spam vector).
-- ============================================
DROP POLICY IF EXISTS "Mentors can send messages to students" ON public.messages;

CREATE POLICY "Mentors can send messages to students"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid())
  AND recipient_id IN (
    SELECT s.user_id FROM public.subscriptions s
    WHERE s.mentor_id = messages.sender_mentor_id
      AND s.status = 'active'
  )
);

-- ============================================
-- 3. HONEST RATING & STUDENT COUNTS
--    mentors.rating and mentors.students were static hand-set numbers.
--    Derive them from real data: rating = average of reviews, students =
--    count of active subscriptions. Kept in sync by triggers (the
--    protect_mentor_columns trigger allows nested trigger writes).
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_mentor_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _mentor_id uuid;
BEGIN
  _mentor_id := COALESCE(NEW.mentor_id, OLD.mentor_id);
  UPDATE public.mentors m
  SET rating = COALESCE((
    SELECT ROUND(AVG(r.rating)::numeric, 1)
    FROM public.mentor_reviews r
    WHERE r.mentor_id = _mentor_id
  ), 0)
  WHERE m.id = _mentor_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_mentor_rating ON public.mentor_reviews;
CREATE TRIGGER trg_sync_mentor_rating
AFTER INSERT OR UPDATE OR DELETE ON public.mentor_reviews
FOR EACH ROW
EXECUTE FUNCTION public.sync_mentor_rating();

CREATE OR REPLACE FUNCTION public.sync_mentor_students()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _mentor_id uuid;
BEGIN
  _mentor_id := COALESCE(NEW.mentor_id, OLD.mentor_id);
  UPDATE public.mentors m
  SET students = COALESCE((
    SELECT COUNT(*)
    FROM public.subscriptions s
    WHERE s.mentor_id = _mentor_id AND s.status = 'active'
  ), 0)
  WHERE m.id = _mentor_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_mentor_students ON public.subscriptions;
CREATE TRIGGER trg_sync_mentor_students
AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.sync_mentor_students();

-- One-time backfill so existing mentors show real numbers.
-- (Protection trigger is disabled for the backfill: migrations don't run
-- with an authenticated uid, so it would otherwise reject the update.)
ALTER TABLE public.mentors DISABLE TRIGGER protect_mentor_columns_trigger;

UPDATE public.mentors m
SET
  rating = COALESCE((
    SELECT ROUND(AVG(r.rating)::numeric, 1)
    FROM public.mentor_reviews r
    WHERE r.mentor_id = m.id
  ), 0),
  students = COALESCE((
    SELECT COUNT(*)
    FROM public.subscriptions s
    WHERE s.mentor_id = m.id AND s.status = 'active'
  ), 0);

ALTER TABLE public.mentors ENABLE TRIGGER protect_mentor_columns_trigger;
