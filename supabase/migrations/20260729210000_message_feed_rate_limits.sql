-- Spam guards for the two remaining authenticated write paths. RLS already
-- restricts WHO can post; nothing limited HOW FAST. A subscribed user could
-- flood a mentor's inbox or the public feed in a loop. Mirrors the existing
-- intro_requests_rate_limit pattern (locked-down SECURITY DEFINER trigger).

create or replace function public.messages_rate_limit()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  recent int;
begin
  select count(*) into recent
  from public.messages
  where sender_user_id = new.sender_user_id
    and created_at > now() - interval '1 hour';
  if recent >= 60 then
    raise exception 'You are sending messages too quickly. Please wait a few minutes and try again.';
  end if;
  return new;
end;
$$;

revoke execute on function public.messages_rate_limit() from public, anon, authenticated;

drop trigger if exists trg_messages_rate_limit on public.messages;
create trigger trg_messages_rate_limit
  before insert on public.messages
  for each row execute function public.messages_rate_limit();

create or replace function public.feed_posts_rate_limit()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  recent int;
begin
  select count(*) into recent
  from public.feed_posts
  where user_id = new.user_id
    and created_at > now() - interval '1 hour';
  if recent >= 20 then
    raise exception 'You are posting too quickly. Please wait a few minutes and try again.';
  end if;
  return new;
end;
$$;

revoke execute on function public.feed_posts_rate_limit() from public, anon, authenticated;

drop trigger if exists trg_feed_posts_rate_limit on public.feed_posts;
create trigger trg_feed_posts_rate_limit
  before insert on public.feed_posts
  for each row execute function public.feed_posts_rate_limit();

-- Bound free-text so a single row can't carry a megabyte of payload.
alter table public.messages
  add constraint messages_body_len check (char_length(body) between 1 and 5000) not valid;
alter table public.messages
  add constraint messages_subject_len check (char_length(subject) between 1 and 200) not valid;
