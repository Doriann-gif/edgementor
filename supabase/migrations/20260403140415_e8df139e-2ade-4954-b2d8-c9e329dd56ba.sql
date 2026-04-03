
-- Add sender_user_id column to messages
ALTER TABLE public.messages ADD COLUMN sender_user_id uuid;

-- Students can send messages to mentors they're subscribed to
CREATE POLICY "Students can send messages to subscribed mentors"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_user_id = auth.uid()
  AND recipient_id IN (
    SELECT m.user_id FROM mentors m
    JOIN subscriptions s ON s.mentor_id = m.id
    WHERE s.user_id = auth.uid() AND s.status = 'active' AND m.user_id IS NOT NULL
  )
);

-- Users can read messages they sent
CREATE POLICY "Users can read sent messages"
ON public.messages
FOR SELECT
TO authenticated
USING (sender_user_id = auth.uid());
