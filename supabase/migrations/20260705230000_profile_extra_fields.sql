-- Extra user profile fields surfaced in Account Settings → Profile.
-- All optional; existing rows default to null/empty.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS trading_interests text[] NOT NULL DEFAULT '{}';
