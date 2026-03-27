
-- Link mentors to auth users
ALTER TABLE public.mentors ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.mentors ADD COLUMN available BOOLEAN NOT NULL DEFAULT true;

-- Mentors can read and update their own profile
CREATE POLICY "Mentors can read own profile"
  ON public.mentors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Mentors can update own profile"
  ON public.mentors FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Mentors can see subscriptions to them
CREATE POLICY "Mentors can read their subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (
    mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid())
  );

-- Mentors can send messages to their students
CREATE POLICY "Mentors can send messages to students"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid())
  );

-- Mentors can read profiles of their students (for display names)
CREATE POLICY "Mentors can read student profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT s.user_id FROM public.subscriptions s
      JOIN public.mentors m ON m.id = s.mentor_id
      WHERE m.user_id = auth.uid()
    )
  );
