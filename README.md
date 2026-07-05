# EdgeMentor

Marketplace connecting trading students with vetted trading mentors (futures, forex, crypto, options). Students subscribe monthly or buy one-time lifetime access; mentors publish exclusive content and get paid out via Stripe Connect (80/20 split in the mentor's favor).

## Stack

- **Frontend**: Vite + React + TypeScript + Tailwind + shadcn/ui, deployed on Netlify (https://edgementor.netlify.app)
- **Backend**: Supabase — Postgres with RLS, storage buckets, Deno edge functions
- **Payments**: Stripe Checkout + Stripe Connect custom accounts
- **Auth**: Supabase email/password + native Google OAuth (enable the Google provider in Supabase → Authentication → Providers)

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

With the Supabase CLI (uses `SUPABASE_ACCESS_TOKEN` or `npx supabase login`):

```sh
npx supabase link --project-ref <project-ref>
npx supabase db push                  # apply migrations/
npx supabase functions deploy         # deploy all edge functions
npx supabase secrets set STRIPE_SECRET_KEY=sk_... STRIPE_WEBHOOK_SECRET=whsec_...
```

Frontend deploys automatically: push to `main` → Netlify build (`.env` provides `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`).
