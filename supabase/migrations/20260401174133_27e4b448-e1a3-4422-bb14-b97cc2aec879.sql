ALTER TABLE public.mentor_applications
ADD COLUMN payment_type text NOT NULL DEFAULT 'monthly'
CHECK (payment_type IN ('monthly', 'one_time'));

ALTER TABLE public.mentors
ADD COLUMN payment_type text NOT NULL DEFAULT 'monthly'
CHECK (payment_type IN ('monthly', 'one_time'));