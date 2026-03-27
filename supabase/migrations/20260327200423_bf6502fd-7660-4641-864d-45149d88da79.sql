
CREATE TABLE public.feed_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feed posts" ON public.feed_posts
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can create posts" ON public.feed_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.feed_posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any post" ON public.feed_posts
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read all posts" ON public.feed_posts
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
