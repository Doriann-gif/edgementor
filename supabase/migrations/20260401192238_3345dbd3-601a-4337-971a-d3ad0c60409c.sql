CREATE POLICY "Admins can update all subscriptions" ON public.subscriptions FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete subscriptions" ON public.subscriptions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));