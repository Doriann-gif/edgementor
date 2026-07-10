-- Email capture for the free /learn library (lead magnet).
-- Anyone may subscribe; nobody can read the list through the client —
-- it is only accessible via the service role / SQL (TODO: surface in the
-- admin dashboard or sync to an email provider like Resend/Mailchimp).
CREATE TABLE public.email_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE CHECK (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' AND length(email) <= 320),
  source text NOT NULL DEFAULT 'learn',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON public.email_subscribers FOR INSERT
  WITH CHECK (true);
