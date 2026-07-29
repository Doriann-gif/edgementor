-- Review integrity. The INSERT policy only checked that the reviewer had an
-- active subscription to the mentor — it never tied the row to the caller,
-- bounded the rating, or stopped repeats. That let a single subscriber post
-- unlimited reviews, attribute them to another user_id, or send rating = 999
-- straight to the REST API and skew the public average via sync_mentor_rating.

-- 1. Bound the values.
alter table public.mentor_reviews
  add constraint mentor_reviews_rating_range check (rating >= 1 and rating <= 5) not valid;
alter table public.mentor_reviews
  add constraint mentor_reviews_text_len check (char_length(review_text) between 1 and 2000) not valid;
alter table public.mentor_reviews
  add constraint mentor_reviews_name_len check (char_length(reviewer_name) between 1 and 100) not valid;

-- 2. A review must belong to a real user; one per mentor per user.
alter table public.mentor_reviews alter column user_id set not null;
create unique index if not exists mentor_reviews_one_per_user
  on public.mentor_reviews (mentor_id, user_id);
create index if not exists mentor_reviews_created_idx
  on public.mentor_reviews (mentor_id, created_at desc);

-- 3. Rebuild the INSERT policy so the row is pinned to the caller.
drop policy if exists "Subscribed users can submit reviews" on public.mentor_reviews;
create policy "Subscribed users can submit reviews"
  on public.mentor_reviews for insert
  with check (
    user_id = auth.uid()
    and mentor_id in (
      select s.mentor_id from public.subscriptions s
      where s.user_id = auth.uid() and s.status = 'active'
    )
  );

-- 4. Let people correct or withdraw their own review (previously impossible),
--    and let admins remove abusive ones.
create policy "Users can update own review"
  on public.mentor_reviews for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own review"
  on public.mentor_reviews for delete
  using (user_id = auth.uid());

create policy "Admins can delete any review"
  on public.mentor_reviews for delete
  using (has_role(auth.uid(), 'admin'::app_role));
