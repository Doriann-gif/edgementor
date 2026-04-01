
ALTER TABLE public.mentors
ADD COLUMN stripe_connect_account_id text DEFAULT NULL,
ADD COLUMN payouts_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN auto_payout boolean NOT NULL DEFAULT false;
