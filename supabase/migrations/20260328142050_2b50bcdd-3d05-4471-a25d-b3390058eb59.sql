
-- Create mentor-content storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('mentor-content', 'mentor-content', true)
ON CONFLICT (id) DO NOTHING;

-- Mentors can upload files to their own folder
CREATE POLICY "Mentors can upload content files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mentor-content'
  AND (storage.foldername(name))[1] IN (
    SELECT m.id::text FROM mentors m WHERE m.user_id = auth.uid()
  )
);

-- Mentors can update their own files
CREATE POLICY "Mentors can update content files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'mentor-content'
  AND (storage.foldername(name))[1] IN (
    SELECT m.id::text FROM mentors m WHERE m.user_id = auth.uid()
  )
);

-- Mentors can delete their own files
CREATE POLICY "Mentors can delete content files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'mentor-content'
  AND (storage.foldername(name))[1] IN (
    SELECT m.id::text FROM mentors m WHERE m.user_id = auth.uid()
  )
);

-- Public read access for content files
CREATE POLICY "Public can view mentor content files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'mentor-content');
