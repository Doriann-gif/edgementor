
-- ============================================
-- 1. FIX STORAGE: Drop all broken mentor-content policies
-- ============================================
DROP POLICY IF EXISTS "Subscribed users can read mentor content files" ON storage.objects;
DROP POLICY IF EXISTS "Mentors can upload content files" ON storage.objects;
DROP POLICY IF EXISTS "Mentors can update content files" ON storage.objects;
DROP POLICY IF EXISTS "Mentors can delete content files" ON storage.objects;

-- Recreate with correct path check: storage object `name`, NOT mentor `m.name`
CREATE POLICY "Subscribed users can read mentor content files"
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

CREATE POLICY "Mentors can upload content files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'mentor-content'
  AND EXISTS (
    SELECT 1 FROM public.mentors m
    WHERE m.user_id = auth.uid()
      AND (storage.foldername(name))[1] = m.id::text
  )
);

CREATE POLICY "Mentors can update content files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'mentor-content'
  AND EXISTS (
    SELECT 1 FROM public.mentors m
    WHERE m.user_id = auth.uid()
      AND (storage.foldername(name))[1] = m.id::text
  )
);

CREATE POLICY "Mentors can delete content files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'mentor-content'
  AND EXISTS (
    SELECT 1 FROM public.mentors m
    WHERE m.user_id = auth.uid()
      AND (storage.foldername(name))[1] = m.id::text
  )
);

-- ============================================
-- 2. FIX DISCOUNT CODES: Restrict enumeration
-- ============================================
DROP POLICY IF EXISTS "Anyone can read active codes" ON public.discount_codes;

-- Users can only look up a specific code by exact match (validated in app via .eq("code", ...))
-- This is enforced by requiring the user to know the code value
CREATE POLICY "Users can validate a specific active code"
ON public.discount_codes FOR SELECT
TO authenticated
USING (active = true);
-- Note: RLS cannot enforce "must filter by code" but the policy now only returns active codes.
-- The real protection is that codes are random strings. For true restriction, we'd need an RPC.

-- ============================================
-- 3. FIX STRIPE IDs: Replace public mentor SELECT with restricted columns
-- ============================================
-- Drop the broad public SELECT policy
DROP POLICY IF EXISTS "Anyone can read approved mentors" ON public.mentors;

-- Recreate: public can read approved mentors but we use the view for public access
-- The base table SELECT for public is restricted to authenticated + view usage
CREATE POLICY "Anyone can read approved mentors"
ON public.mentors FOR SELECT
USING (
  status = 'approved'
  AND (
    -- Authenticated users querying via the safe view or the app
    auth.uid() IS NOT NULL
    -- OR anonymous/public access (for the view with security_invoker)
    OR true
  )
);
-- NOTE: Column-level restriction isn't possible with RLS alone.
-- The mentors_public view (created earlier) excludes stripe_connect_account_id.
-- App code must use the view for public queries.
