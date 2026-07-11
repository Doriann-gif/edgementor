-- Admins can see the user -> Stripe customer mapping so the billing view can
-- deep-link to the exact customer in the Stripe dashboard (refund helper).
CREATE POLICY "Admins can read payment config"
  ON public.user_payment_config FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
