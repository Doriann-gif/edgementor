
-- Discount codes table (covers both promo and referral codes)
CREATE TABLE public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'promo',
  discount_percent integer NOT NULL DEFAULT 10,
  max_uses integer,
  current_uses integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_by uuid NOT NULL,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Code redemptions tracking
CREATE TABLE public.code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid REFERENCES public.discount_codes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_redemptions ENABLE ROW LEVEL SECURITY;

-- Discount codes policies
CREATE POLICY "Admins can manage all codes" ON public.discount_codes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Mentors can manage own codes" ON public.discount_codes FOR ALL TO authenticated
  USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()))
  WITH CHECK (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can read active codes" ON public.discount_codes FOR SELECT TO authenticated
  USING (active = true);

-- Code redemptions policies
CREATE POLICY "Users can redeem codes" ON public.code_redemptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own redemptions" ON public.code_redemptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all redemptions" ON public.code_redemptions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add notification_preferences to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_notifications boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_emails boolean NOT NULL DEFAULT false;
