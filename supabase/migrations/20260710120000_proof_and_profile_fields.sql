-- ============================================
-- PROOF OF PROFITABILITY + PROFILE DEPTH FIELDS
-- Mentors provide a verifiable track-record link; only the platform
-- (admin/service role) may stamp proof_verified_at, which is what the
-- "Verified Track Record" badge keys off. All fields nullable — the UI
-- degrades gracefully when they are empty.
-- ============================================
ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS proof_track_record_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS proof_verified_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS response_time text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ideal_for text DEFAULT NULL;

COMMENT ON COLUMN public.mentors.proof_track_record_url IS
  'Mentor-provided link to a verifiable track record (Myfxbook, broker statement, prop-firm payout page)';
COMMENT ON COLUMN public.mentors.proof_verified_at IS
  'Admin-only attestation timestamp: set when EdgeMentor has reviewed the track record. Drives the Verified Track Record badge.';

-- proof_verified_at is the platform's attestation — a mentor must not be able
-- to self-verify. Extends the existing column-protection trigger function.
CREATE OR REPLACE FUNCTION public.protect_mentor_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  -- Updates issued from within other triggers (e.g. the rating/students
  -- aggregation triggers) are trusted internal writes.
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;
  IF has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'You cannot modify the status field';
  END IF;
  IF NEW.tier IS DISTINCT FROM OLD.tier THEN
    RAISE EXCEPTION 'You cannot modify the tier field';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'You cannot modify the user_id field';
  END IF;
  IF NEW.rating IS DISTINCT FROM OLD.rating THEN
    RAISE EXCEPTION 'You cannot modify the rating field';
  END IF;
  IF NEW.students IS DISTINCT FROM OLD.students THEN
    RAISE EXCEPTION 'You cannot modify the students field';
  END IF;
  IF NEW.proof_verified_at IS DISTINCT FROM OLD.proof_verified_at THEN
    RAISE EXCEPTION 'You cannot modify the proof_verified_at field';
  END IF;
  RETURN NEW;
END;
$$;
