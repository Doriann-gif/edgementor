-- ============================================
-- 1. INTRO REQUESTS — replaces the mailto placeholder on mentor profiles.
--    Anyone (signed in or not) can request a free intro; admins see all,
--    mentors see their own.
-- ============================================
CREATE TABLE public.intro_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id uuid NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  requester_name text NOT NULL CHECK (length(requester_name) BETWEEN 1 AND 100),
  requester_email text NOT NULL CHECK (requester_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' AND length(requester_email) <= 320),
  message text CHECK (length(message) <= 1000),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','done','dismissed')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.intro_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request an intro"
  ON public.intro_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage intro requests"
  ON public.intro_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Mentors can read own intro requests"
  ON public.intro_requests FOR SELECT
  USING (mentor_id IN (SELECT m.id FROM public.mentors m WHERE m.user_id = auth.uid()));

CREATE POLICY "Mentors can update own intro requests"
  ON public.intro_requests FOR UPDATE
  USING (mentor_id IN (SELECT m.id FROM public.mentors m WHERE m.user_id = auth.uid()))
  WITH CHECK (mentor_id IN (SELECT m.id FROM public.mentors m WHERE m.user_id = auth.uid()));

CREATE INDEX idx_intro_requests_mentor ON public.intro_requests (mentor_id, status);

-- ============================================
-- 2. ADMINS CAN READ THE EMAIL LIST (collected on /learn)
-- ============================================
CREATE POLICY "Admins can read subscribers"
  ON public.email_subscribers FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 3. DEFENSE IN DEPTH — content access also honors expires_at when set.
--    Production rows currently have expires_at NULL (status transitions via
--    webhook are the source of truth), so this changes nothing today; it
--    protects against future flows that set an expiry.
-- ============================================
DROP POLICY "Subscribed users can read mentor content" ON public.mentor_content;
CREATE POLICY "Subscribed users can read mentor content"
  ON public.mentor_content FOR SELECT
  USING (mentor_id IN (
    SELECT s.mentor_id FROM public.subscriptions s
    WHERE s.user_id = auth.uid()
      AND s.status = 'active'
      AND (s.expires_at IS NULL OR s.expires_at > now())
  ));
