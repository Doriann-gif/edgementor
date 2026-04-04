
-- Force drop all mentor-content related storage policies by exact name
DO $$
BEGIN
  -- Try dropping with exact names
  EXECUTE 'DROP POLICY IF EXISTS "Subscribed users can read mentor content files" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Mentors can upload content files" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Mentors can update content files" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Mentors can delete content files" ON storage.objects';
END$$;

-- Recreate with FIXED path checks using `name` (the storage object path)
CREATE POLICY "mentor_content_select_v2"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'mentor-content'
  AND (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      JOIN public.mentors m ON m.id = s.mentor_id
      WHERE s.user_id = auth.uid()
        AND s.status = 'active'
        AND (storage.foldername(name))[1] = m.id::text
    )
    OR EXISTS (
      SELECT 1 FROM public.mentors m
      WHERE m.user_id = auth.uid()
        AND (storage.foldername(name))[1] = m.id::text
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "mentor_content_insert_v2"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'mentor-content'
  AND EXISTS (
    SELECT 1 FROM public.mentors m
    WHERE m.user_id = auth.uid()
      AND (storage.foldername(name))[1] = m.id::text
  )
);

CREATE POLICY "mentor_content_update_v2"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'mentor-content'
  AND EXISTS (
    SELECT 1 FROM public.mentors m
    WHERE m.user_id = auth.uid()
      AND (storage.foldername(name))[1] = m.id::text
  )
);

CREATE POLICY "mentor_content_delete_v2"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'mentor-content'
  AND EXISTS (
    SELECT 1 FROM public.mentors m
    WHERE m.user_id = auth.uid()
      AND (storage.foldername(name))[1] = m.id::text
  )
);
