
-- Allow subscribed users to insert reviews
CREATE POLICY "Subscribed users can submit reviews"
ON public.mentor_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  mentor_id IN (
    SELECT s.mentor_id FROM subscriptions s
    WHERE s.user_id = auth.uid() AND s.status = 'active'
  )
);

-- Add unique constraint so one review per user per mentor
ALTER TABLE public.mentor_reviews
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_mentor_reviews_user_mentor
  ON public.mentor_reviews (user_id, mentor_id)
  WHERE user_id IS NOT NULL;
