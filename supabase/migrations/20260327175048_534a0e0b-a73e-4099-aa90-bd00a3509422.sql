
-- Mentors table
CREATE TABLE public.mentors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  bio TEXT NOT NULL,
  full_bio TEXT NOT NULL DEFAULT '',
  experience TEXT NOT NULL,
  instruments TEXT[] NOT NULL DEFAULT '{}',
  concepts TEXT[] NOT NULL DEFAULT '{}',
  session TEXT NOT NULL,
  monthly_price INTEGER NOT NULL,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  students INTEGER NOT NULL DEFAULT 0,
  highlights TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews table
CREATE TABLE public.mentor_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  review_date TEXT NOT NULL,
  review_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Applications table
CREATE TABLE public.mentor_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  experience TEXT NOT NULL,
  instruments TEXT[] NOT NULL DEFAULT '{}',
  concepts TEXT[] NOT NULL DEFAULT '{}',
  session TEXT NOT NULL,
  monthly_price INTEGER NOT NULL,
  bio TEXT NOT NULL,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_applications ENABLE ROW LEVEL SECURITY;

-- Mentors: anyone can read approved mentors
CREATE POLICY "Anyone can read approved mentors"
  ON public.mentors FOR SELECT
  USING (status = 'approved');

-- Reviews: anyone can read
CREATE POLICY "Anyone can read reviews"
  ON public.mentor_reviews FOR SELECT
  USING (true);

-- Applications: anyone can insert (public form)
CREATE POLICY "Anyone can submit applications"
  ON public.mentor_applications FOR INSERT
  WITH CHECK (true);
