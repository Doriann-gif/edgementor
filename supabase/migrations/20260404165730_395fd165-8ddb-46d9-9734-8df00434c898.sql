
-- Remove orphaned applications with no user
DELETE FROM public.mentor_applications WHERE user_id IS NULL;

-- Now safely enforce NOT NULL
ALTER TABLE public.mentor_applications ALTER COLUMN user_id SET NOT NULL;
