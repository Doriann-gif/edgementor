-- Remove the messaging system (student↔mentor chat + mentor announcements/DMs)
-- and the free-intro-request lead flow entirely. Both features were dropped from
-- the product; this tears down their backend.
--
-- `messages` was the single backbone for ALL messaging; `intro_requests` held the
-- free-intro leads. Dropping the tables CASCADE also removes their triggers, RLS
-- policies, indexes and constraints. The RPC + trigger functions that backed them
-- are dropped explicitly afterward. `notify_dispatch` is intentionally kept — it's
-- shared with the subscription + mentor_approved + payout notifications.

-- 1. Tables (CASCADE clears their triggers / policies / indexes / constraints).
drop table if exists public.messages cascade;
drop table if exists public.intro_requests cascade;

-- 2. Client-facing chat RPCs — now orphaned.
drop function if exists public.message_mentor(uuid, text, text);
drop function if exists public.send_chat_message(uuid, text);
drop function if exists public.get_conversations();
drop function if exists public.get_conversation(uuid, integer);
drop function if exists public.mark_conversation_read(uuid);

-- 3. Trigger functions that backed the dropped tables' triggers.
drop function if exists public.on_message_notify();
drop function if exists public.messages_rate_limit();
drop function if exists public.set_message_sender_name();
drop function if exists public.on_intro_request_notify();
drop function if exists public.intro_requests_rate_limit();

-- 4. Per-type notification-preference columns only these features used.
--    (email_notifications, marketing_emails, notify_new_subscriber stay.)
alter table public.profiles drop column if exists notify_messages;
alter table public.profiles drop column if exists notify_intro_request;
