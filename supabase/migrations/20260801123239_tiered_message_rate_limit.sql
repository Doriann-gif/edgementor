-- Tiered messaging rate limit: keep chat flowing within existing conversations
-- while still tightly capping cold outreach (the real spam vector).
--
-- The old rule blocked a sender at 60 messages/hour regardless of recipient,
-- which throttled a legit back-and-forth chat (~1 msg/min) the same as someone
-- blasting many mentors. This splits the limit by intent:
--   * Replies within an EXISTING thread (any prior message either direction)
--     get a generous firehose cap so real chat never throttles — and a mentor
--     replying to their students is never blocked.
--   * STARTING brand-new conversations stays tightly limited (the cold-outreach
--     spam path).
-- Only replaces messages_rate_limit(); the existing trigger binding is kept.
create or replace function public.messages_rate_limit()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  is_ongoing boolean;
  recent int;
  new_convos int;
begin
  select exists (
    select 1 from public.messages m
    where (m.sender_user_id = new.sender_user_id and m.recipient_id = new.recipient_id)
       or (m.sender_user_id = new.recipient_id and m.recipient_id = new.sender_user_id)
  ) into is_ongoing;

  if is_ongoing then
    -- Active conversation: high firehose backstop so real chat never throttles.
    select count(*) into recent
    from public.messages
    where sender_user_id = new.sender_user_id
      and created_at > now() - interval '1 hour';
    if recent >= 300 then
      raise exception 'You are sending messages too quickly. Please wait a few minutes and try again.';
    end if;
  else
    -- Cold outreach: cap how many brand-new conversations are started per hour.
    -- A past message counts as "new" when no earlier message exists between the
    -- pair; this insert would be the 31st new thread -> block.
    select count(*) into new_convos
    from public.messages m
    where m.sender_user_id = new.sender_user_id
      and m.created_at > now() - interval '1 hour'
      and not exists (
        select 1 from public.messages p
        where ((p.sender_user_id = m.sender_user_id and p.recipient_id = m.recipient_id)
            or (p.sender_user_id = m.recipient_id and p.recipient_id = m.sender_user_id))
          and p.created_at < m.created_at
      );
    if new_convos >= 30 then
      raise exception 'You have started too many new conversations this hour. Please try again later.';
    end if;
  end if;

  return new;
end;
$$;
