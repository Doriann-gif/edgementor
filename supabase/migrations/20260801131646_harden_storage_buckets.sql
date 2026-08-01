-- Harden storage buckets against upload abuse.
-- Neither bucket had a size or MIME limit, so any authenticated user could
-- upload arbitrarily large files (storage-cost DOS) and, on the PUBLIC avatars
-- bucket, host arbitrary file types (e.g. an SVG/HTML) on a public URL under
-- our storage domain. Cap size on both; restrict the public avatars bucket to
-- real image types (blocks SVG/HTML/script uploads).
update storage.buckets
set file_size_limit = 5242880,  -- 5 MB
    allowed_mime_types = array['image/png','image/jpeg','image/jpg','image/webp','image/gif']
where id = 'avatars';

update storage.buckets
set file_size_limit = 26214400  -- 25 MB (private bucket; varied content types)
where id = 'mentor-content';
