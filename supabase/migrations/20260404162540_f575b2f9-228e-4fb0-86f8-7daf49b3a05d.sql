
-- Remove the user-facing INSERT policy that allows payment bypass
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
