
-- 1. Create a public view for mentors that hides sensitive columns
CREATE OR REPLACE VIEW public.mentors_public
WITH (security_invoker = on) AS
SELECT 
  id, name, avatar, bio, full_bio, experience, session, concepts, instruments,
  highlights, rating, students, monthly_price, tier, country, social_link,
  banner_color, available, payment_type, status, created_at
FROM public.mentors;

-- 2. Make mentor-content bucket private
UPDATE storage.buckets SET public = false WHERE id = 'mentor-content';

-- 3. Drop existing overly permissive storage policies on mentor-content if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view mentor content" ON storage.objects;

-- 4. Create proper storage policies for mentor-content
CREATE POLICY "Subscribed users can read mentor content files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'mentor-content' 
  AND (
    -- Check if user has active subscription to the mentor whose folder this is
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      JOIN public.mentors m ON m.id = s.mentor_id
      WHERE s.user_id = auth.uid() 
        AND s.status = 'active'
        AND (storage.foldername(name))[1] = m.id::text
    )
    -- Or user is the mentor themselves
    OR EXISTS (
      SELECT 1 FROM public.mentors m
      WHERE m.user_id = auth.uid()
        AND (storage.foldername(name))[1] = m.id::text
    )
    -- Or user is admin
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Mentors can upload own content files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'mentor-content'
  AND EXISTS (
    SELECT 1 FROM public.mentors m
    WHERE m.user_id = auth.uid()
      AND (storage.foldername(name))[1] = m.id::text
  )
);

CREATE POLICY "Mentors can update own content files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'mentor-content'
  AND EXISTS (
    SELECT 1 FROM public.mentors m
    WHERE m.user_id = auth.uid()
      AND (storage.foldername(name))[1] = m.id::text
  )
);

CREATE POLICY "Mentors can delete own content files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'mentor-content'
  AND EXISTS (
    SELECT 1 FROM public.mentors m
    WHERE m.user_id = auth.uid()
      AND (storage.foldername(name))[1] = m.id::text
  )
);

-- 5. Add explicit policies on user_roles to prevent privilege escalation
CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Tighten mentor_applications INSERT - drop the overly permissive public policy
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.mentor_applications;

CREATE POLICY "Authenticated users can submit applications"
ON public.mentor_applications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 7. Allow applicants to read their own applications
CREATE POLICY "Users can read own applications"
ON public.mentor_applications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 8. Remove messages from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.messages;
