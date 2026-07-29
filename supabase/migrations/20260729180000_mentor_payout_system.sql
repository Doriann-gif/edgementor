-- Mentor payout system: methods, earnings ledger, payout requests.
-- Moves mentors off Stripe-Connect-only payouts to a rail-agnostic model:
-- students pay 100% to the platform (Stripe), and each mentor's 80% share is
-- tracked in an internal ledger they withdraw to crypto / bank / PayPal.

-- 1. Where each mentor wants to receive money.
create table if not exists public.mentor_payout_methods (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  method text not null check (method in ('crypto', 'bank', 'paypal')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mentor_id)
);
alter table public.mentor_payout_methods enable row level security;

create policy "Mentors manage own payout method"
  on public.mentor_payout_methods for all
  using (mentor_id in (select id from public.mentors where user_id = auth.uid()))
  with check (mentor_id in (select id from public.mentors where user_id = auth.uid()));

create policy "Admins read payout methods"
  on public.mentor_payout_methods for select
  using (has_role(auth.uid(), 'admin'::app_role));

-- 2. Double-entry-style ledger. Balance = sum(amount): earnings positive,
--    payouts negative. Only service_role (webhook / edge functions) writes it,
--    so there is no user INSERT/UPDATE policy; reads are owner/admin scoped.
create table if not exists public.mentor_ledger (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  entry_type text not null check (entry_type in ('earning', 'payout', 'adjustment')),
  amount numeric(12,2) not null,
  currency text not null default 'usd',
  source text,
  stripe_ref text,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  payout_request_id uuid,
  note text,
  created_at timestamptz not null default now()
);
alter table public.mentor_ledger enable row level security;

-- Idempotency guard: never credit the same Stripe event twice on webhook retries.
create unique index if not exists mentor_ledger_dedupe
  on public.mentor_ledger (mentor_id, entry_type, stripe_ref)
  where stripe_ref is not null;
create index if not exists mentor_ledger_mentor_idx on public.mentor_ledger (mentor_id);

create policy "Mentors read own ledger"
  on public.mentor_ledger for select
  using (mentor_id in (select id from public.mentors where user_id = auth.uid()));

create policy "Admins read all ledger"
  on public.mentor_ledger for select
  using (has_role(auth.uid(), 'admin'::app_role));

-- 3. Withdrawal requests the admin fulfils manually (MVP). Created only by the
--    process-withdrawal edge function after balance validation, so no user
--    INSERT policy; admins update status to mark them paid/rejected.
create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'usd',
  method text not null,
  method_details jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'paid', 'rejected')),
  admin_note text,
  tx_reference text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid
);
alter table public.payout_requests enable row level security;

create index if not exists payout_requests_status_idx on public.payout_requests (status, requested_at);

create policy "Mentors read own payout requests"
  on public.payout_requests for select
  using (mentor_id in (select id from public.mentors where user_id = auth.uid()));

create policy "Admins read all payout requests"
  on public.payout_requests for select
  using (has_role(auth.uid(), 'admin'::app_role));

create policy "Admins update payout requests"
  on public.payout_requests for update
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));
