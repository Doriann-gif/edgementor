# EdgeMentor

Marketplace connecting trading students with vetted trading mentors (futures, forex, crypto, options). Students subscribe monthly or buy one-time lifetime access; mentors publish exclusive content and get paid out via Stripe Connect (80/20 split in the mentor's favor).

## Stack

- **Frontend**: Vite + React + TypeScript + Tailwind + shadcn/ui (Lovable-generated), deployed on Netlify
- **Backend**: Supabase (Lovable Cloud) — Postgres with RLS, storage buckets, Deno edge functions
- **Payments**: Stripe Checkout + Stripe Connect custom accounts

## Development

```sh
npm install
npm run dev        # dev server (port 8080, override with PORT)
npm test           # vitest
npm run build      # production build
```

`.env` holds only the Supabase URL and the **publishable (anon) key** — safe to commit; RLS is the security boundary.

## Payment architecture

- `create-checkout` builds a Stripe Checkout session server-side (price + promo validated against the DB, never trusted from the client). Metadata (`user_id`, `mentor_id`, `promo_code`) is attached to the session **and** the underlying subscription/payment intent.
- Access is activated only by verified paths:
  - `verify-payment` — called from `/payment-success`, verifies the session is paid and belongs to the caller
  - `stripe-webhook` — `checkout.session.completed`, subscription cancellations, refunds
- `check-subscription` — monthly access requires an active Stripe subscription; one-time purchases are lifetime and tracked in the DB.
- The `subscriptions` table is service-role-only for writes; clients can only read their own rows.

## Required Stripe/Supabase configuration

1. **Secrets** (Supabase edge function env): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
2. **Webhook endpoint** (Stripe dashboard → Developers → Webhooks):
   - URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`, `charge.refunded`
3. **Stripe Connect** must be enabled on the platform account (custom accounts).

## Deploying backend changes

Migrations in `supabase/migrations/` and functions in `supabase/functions/` must be applied to the Lovable Cloud Supabase project (via Lovable's GitHub sync, or `npx supabase db push` / `npx supabase functions deploy` with a project access token).
