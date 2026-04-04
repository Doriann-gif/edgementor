
-- Drop the v2 policies
DROP POLICY IF EXISTS "mentor_content_select_v2" ON storage.objects;
DROP POLICY IF EXISTS "mentor_content_insert_v2" ON storage.objects;
DROP POLICY IF EXISTS "mentor_content_update_v2" ON storage.objects;
DROP POLICY IF EXISTS "mentor_content_delete_v2" ON storage.objects;

-- Recreate with explicitly qualified objects.name to avoid ambiguity with mentors.name
CREATE POLICY "mc_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'mentor-content'
  AND (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      JOIN public.mentors m ON m.id = s.mentor_id
      WHERE s.user_id = auth.uid()
        AND s.status = 'active'
        AND (storage.foldername(objects.name))[1] = m.id::text
    )
    OR EXISTS (
      SELECT 1 FROM public.mentors m
      WHERE m.user_id = auth.uid()
        AND (storage.foldername(objects.name))[1] = m.id::text
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "mc_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'mentor-content'
  AND EXISTS (
    SELECT 1 FROM public.mentors m
    WHERE m.user_id = auth.uid()
      AND (storage.foldername(objects.name))[1] = m.id::text
  )
);

CREATE POLICY "mc_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'mentor-content'
  AND EXISTS (
    SELECT 1 FROM public.mentors m
    WHERE m.user_id = auth.uid()
      AND (storage.foldername(objects.name))[1] = m.id::text
  )
);

CREATE POLICY "mc_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'mentor-content'
  AND EXISTS (
    SELECT 1 FROM public.mentors m
    WHERE m.user_id = auth.uid()
      AND (storage.foldername(objects.name))[1] = m.id::text
  )
);
