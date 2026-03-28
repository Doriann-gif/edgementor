
-- Table for exclusive mentor content (links, videos, discord, calls, etc.)
CREATE TABLE public.mentor_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  content_type text NOT NULL DEFAULT 'link',
  content_url text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentor_content ENABLE ROW LEVEL SECURITY;

-- Subscribed users can read their mentor's content
CREATE POLICY "Subscribed users can read mentor content"
ON public.mentor_content
FOR SELECT
TO authenticated
USING (
  mentor_id IN (
    SELECT s.mentor_id FROM public.subscriptions s
    WHERE s.user_id = auth.uid() AND s.status = 'active'
  )
);

-- Mentors can manage their own content
CREATE POLICY "Mentors can manage own content"
ON public.mentor_content
FOR ALL
TO authenticated
USING (
  mentor_id IN (
    SELECT m.id FROM public.mentors m WHERE m.user_id = auth.uid()
  )
)
WITH CHECK (
  mentor_id IN (
    SELECT m.id FROM public.mentors m WHERE m.user_id = auth.uid()
  )
);

-- Admins can manage all content
CREATE POLICY "Admins can manage all content"
ON public.mentor_content
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
