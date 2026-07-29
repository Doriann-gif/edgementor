-- Hot-path indexes. Every one of these columns is filtered on a page-load
-- query but had no index, so each request was a sequential scan. Harmless at
-- 3 rows, quadratic pain at real signup volume.

-- AuthContext runs this on EVERY auth state change for EVERY user.
create index if not exists mentors_user_id_idx on public.mentors (user_id);
-- Marketplace + featured lists filter status='approved' and sort by rating.
create index if not exists mentors_status_rating_idx on public.mentors (status, rating desc);

-- NotificationBell polls unread on every page; mentor/student inboxes read by recipient.
create index if not exists messages_recipient_unread_idx on public.messages (recipient_id, is_read);
create index if not exists messages_recipient_created_idx on public.messages (recipient_id, created_at desc);
create index if not exists messages_sender_mentor_idx on public.messages (sender_mentor_id);

-- Content + media galleries load per mentor profile view.
create index if not exists mentor_content_mentor_idx on public.mentor_content (mentor_id, created_at desc);
create index if not exists mentor_showcase_mentor_idx on public.mentor_showcase_images (mentor_id);

-- Admin queues and user-facing history.
create index if not exists mentor_applications_status_idx on public.mentor_applications (status, created_at desc);
create index if not exists mentor_applications_user_idx on public.mentor_applications (user_id);
create index if not exists feed_posts_created_idx on public.feed_posts (created_at desc);
create index if not exists feed_posts_user_idx on public.feed_posts (user_id);
create index if not exists intro_requests_user_idx on public.intro_requests (user_id);
create index if not exists code_redemptions_user_idx on public.code_redemptions (user_id);
create index if not exists discount_codes_mentor_idx on public.discount_codes (mentor_id);
create index if not exists payout_requests_mentor_idx on public.payout_requests (mentor_id, requested_at desc);
create index if not exists mentor_ledger_created_idx on public.mentor_ledger (mentor_id, created_at desc);
