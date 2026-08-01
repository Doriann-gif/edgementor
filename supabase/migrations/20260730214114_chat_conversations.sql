-- Chat section: conversation-oriented views over the existing `messages` table.
--
-- `messages` is a flat inbox (recipient/sender/subject/body). A chat UI needs it
-- grouped by counterpart, plus the counterpart's display name and avatar — and
-- `profiles` is deliberately NOT publicly readable (own profile, admins, and a
-- mentor's own subscribers only). So these run SECURITY DEFINER and expose just
-- the counterpart fields a chat needs, rather than opening up `profiles`.

-- Helps the conversation queries, which filter on sender_user_id as well as the
-- already-indexed recipient_id.
create index if not exists messages_sender_user_created_idx
  on public.messages (sender_user_id, created_at desc);

-- One row per person you've exchanged messages with, newest activity first.
-- Rows with a null sender (system/admin broadcasts) have no counterpart to reply
-- to, so they stay in the legacy inbox and are left out of chat.
create or replace function public.get_conversations()
returns table (
  counterpart_id uuid,
  counterpart_name text,
  counterpart_avatar text,
  last_body text,
  last_at timestamptz,
  last_from_me boolean,
  unread_count integer
)
language sql
security definer
set search_path = public
stable
as $$
  with mine as (
    select
      case when m.sender_user_id = auth.uid() then m.recipient_id else m.sender_user_id end as other,
      m.body,
      m.created_at,
      m.is_read,
      (m.sender_user_id = auth.uid()) as from_me
    from public.messages m
    where auth.uid() is not null
      and m.sender_user_id is not null
      and (m.recipient_id = auth.uid() or m.sender_user_id = auth.uid())
  ),
  filtered as (
    select * from mine where other is not null and other <> auth.uid()
  ),
  ranked as (
    select f.*, row_number() over (partition by f.other order by f.created_at desc) as rn
    from filtered f
  )
  select
    r.other,
    coalesce(p.display_name, 'User'),
    p.avatar_url,
    r.body,
    r.created_at,
    r.from_me,
    (
      select count(*)::int from filtered u
      where u.other = r.other and u.from_me = false and u.is_read = false
    )
  from ranked r
  left join public.profiles p on p.id = r.other
  where r.rn = 1
  order by r.created_at desc;
$$;

-- Full thread with one person, oldest first (natural chat order).
create or replace function public.get_conversation(_with uuid, _limit integer default 200)
returns table (
  id uuid,
  body text,
  subject text,
  created_at timestamptz,
  from_me boolean,
  is_read boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select m.id, m.body, m.subject, m.created_at,
         (m.sender_user_id = auth.uid()) as from_me,
         m.is_read
  from public.messages m
  where auth.uid() is not null
    and (
      (m.sender_user_id = auth.uid() and m.recipient_id = _with)
      or (m.sender_user_id = _with and m.recipient_id = auth.uid())
    )
  order by m.created_at asc
  limit greatest(1, least(coalesce(_limit, 200), 500));
$$;

-- Reply within a conversation. Permission mirrors the rest of the app: you may
-- write to someone you already have a thread with, to any approved mentor, to
-- your own active subscribers if you're a mentor, or anyone if you're an admin.
-- Insert triggers still fire (sender_name spoof guard, 60/hour rate limit,
-- length checks, recipient email notification).
create or replace function public.send_chat_message(_to uuid, _body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _bod text := btrim(coalesce(_body, ''));
  _id uuid;
  _allowed boolean := false;
begin
  if _uid is null then
    raise exception 'You must be signed in to send a message.';
  end if;
  if _to is null or _to = _uid then
    raise exception 'Pick someone to message.';
  end if;
  if char_length(_bod) < 1 then
    raise exception 'Message cannot be empty.';
  end if;
  if char_length(_bod) > 5000 then
    raise exception 'Message is too long (max 5000 characters).';
  end if;

  select exists (
    select 1 from public.messages m
    where (m.sender_user_id = _to and m.recipient_id = _uid)
       or (m.sender_user_id = _uid and m.recipient_id = _to)
  ) into _allowed;

  if not _allowed then
    select exists (
      select 1 from public.mentors mm
      where mm.user_id = _to and mm.status = 'approved'
    ) into _allowed;
  end if;

  if not _allowed then
    select exists (
      select 1 from public.subscriptions s
      join public.mentors mm on mm.id = s.mentor_id
      where mm.user_id = _uid and s.user_id = _to and s.status = 'active'
    ) into _allowed;
  end if;

  if not _allowed then
    select public.has_role(_uid, 'admin') into _allowed;
  end if;

  if not _allowed then
    raise exception 'You can''t message this person yet.';
  end if;

  -- sender_name is overwritten by trg_set_message_sender_name; the subject
  -- column is NOT NULL but carries no meaning in a chat thread.
  insert into public.messages (recipient_id, sender_user_id, sender_name, subject, body)
  values (_to, _uid, 'User', 'Chat message', _bod)
  returning id into _id;

  return _id;
end;
$$;

-- Mark everything that person sent you as read (opening the thread).
create or replace function public.mark_conversation_read(_with uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  _n integer;
begin
  if auth.uid() is null then
    return 0;
  end if;
  update public.messages
    set is_read = true
  where recipient_id = auth.uid()
    and sender_user_id = _with
    and is_read = false;
  get diagnostics _n = row_count;
  return _n;
end;
$$;

revoke execute on function public.get_conversations() from public, anon;
revoke execute on function public.get_conversation(uuid, integer) from public, anon;
revoke execute on function public.send_chat_message(uuid, text) from public, anon;
revoke execute on function public.mark_conversation_read(uuid) from public, anon;

grant execute on function public.get_conversations() to authenticated;
grant execute on function public.get_conversation(uuid, integer) to authenticated;
grant execute on function public.send_chat_message(uuid, text) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
