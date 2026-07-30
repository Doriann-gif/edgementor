-- "Chat with mentor": let any signed-in user start a conversation with an
-- approved mentor, and let mentors reply to anyone who has messaged them.
-- Direct student->mentor inserts stay gated to subscribers (RLS below); the
-- open path goes through this SECURITY DEFINER RPC so the mentor's user_id is
-- never exposed to the client and the "approved mentor" check is enforced
-- server-side. Existing insert triggers still fire (sender_name spoof-guard,
-- 60/hour rate limit, length checks, recipient email notification).

create or replace function public.message_mentor(_mentor_id uuid, _subject text, _body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _recipient uuid;
  _subj text := coalesce(nullif(btrim(_subject), ''), 'New message');
  _bod  text := btrim(coalesce(_body, ''));
  _msg_id uuid;
begin
  if _uid is null then
    raise exception 'You must be signed in to send a message.';
  end if;

  select user_id into _recipient
  from public.mentors
  where id = _mentor_id and status = 'approved' and user_id is not null;

  if _recipient is null then
    raise exception 'This mentor is not available to receive messages.';
  end if;

  if _recipient = _uid then
    raise exception 'You cannot message yourself.';
  end if;

  if char_length(_bod) < 1 then
    raise exception 'Message cannot be empty.';
  end if;
  if char_length(_bod) > 5000 then
    raise exception 'Message is too long (max 5000 characters).';
  end if;
  _subj := left(_subj, 200);

  -- sender_name is overwritten by trg_set_message_sender_name from the
  -- sender's profile; the placeholder just satisfies NOT NULL.
  insert into public.messages (recipient_id, sender_user_id, sender_name, subject, body)
  values (_recipient, _uid, 'User', _subj, _bod)
  returning id into _msg_id;

  return _msg_id;
end;
$$;

revoke execute on function public.message_mentor(uuid, text, text) from public, anon;
grant execute on function public.message_mentor(uuid, text, text) to authenticated;

-- Mentors can now reply to ANYONE who has messaged them (open inbound), in
-- addition to their active subscribers.
drop policy if exists "Mentors can send messages to students" on public.messages;
create policy "Mentors can send messages to students"
on public.messages for insert to authenticated
with check (
  sender_mentor_id in (select id from public.mentors where user_id = auth.uid())
  and (
    recipient_id in (
      select s.user_id from public.subscriptions s
      where s.mentor_id = messages.sender_mentor_id and s.status = 'active'
    )
    or exists (
      select 1 from public.messages inbound
      where inbound.recipient_id = auth.uid()
        and inbound.sender_user_id = messages.recipient_id
    )
  )
);
