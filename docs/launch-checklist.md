# Ghost Palette Launch Checklist

## Required Before Public Launch

- Apply `supabase/schema.sql` in the production Supabase project.
  - This includes `adjust_credits(...)`, which generation uses for atomic spend.
  - It also includes the unique starter-credit guard.
- Confirm these env vars are set in production:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `FAL_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- Create Stripe prices with the lookup keys in `lib/stripe/catalog.ts`.
- Configure the Stripe webhook endpoint for `/api/stripe/webhook`.
- Confirm Clerk production redirect URLs for sign-in, sign-up, and SSO callback.

## Launch Smoke Test

- Create a new user.
- Confirm the account receives 50 starter credits.
- Generate one image with FLUX.2 dev and confirm 1 credit is spent.
- Generate a three-model comparison and confirm the total credits are spent.
- Force or observe a provider failure and confirm credits refund.
- Buy a Basic pack through Stripe checkout.
- Confirm Stripe webhook grants the purchased credits.
- Run a Quick benchmark and confirm benchmark credits are spent.
- Save an output to Library and reload the app.

## Known Follow-Ups

- Add account credit ledger UI.
- Add production job for monthly free/paid credit refresh.
- Rename `/arena` to `/create` or `/studio` with redirects.
- Replace remaining raw `<img>` warnings with `next/image` where worthwhile.
- Run a signed-in browser QA pass on desktop and mobile before announcing.
