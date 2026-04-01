
-- Create table for mentor showcase images (displayed under What's Included)
CREATE TABLE public.mentor_showcase_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentor_showcase_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view images of approved mentors
CREATE POLICY "Anyone can read showcase images"
ON public.mentor_showcase_images
FOR SELECT
USING (mentor_id IN (SELECT id FROM public.mentors WHERE status = 'approved'));

-- Mentors can manage their own images
CREATE POLICY "Mentors can manage own showcase images"
ON public.mentor_showcase_images
FOR ALL
USING (mentor_id IN (SELECT m.id FROM public.mentors m WHERE m.user_id = auth.uid()))
WITH CHECK (mentor_id IN (SELECT m.id FROM public.mentors m WHERE m.user_id = auth.uid()));

-- Admins can manage all
CREATE POLICY "Admins can manage all showcase images"
ON public.mentor_showcase_images
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
