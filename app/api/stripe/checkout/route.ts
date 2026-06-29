import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { apiLogger, durationMs, logUnauthorized, logValidationError } from "@/lib/api-log";
import { ensureProfile, getStripeCustomerId } from "@/lib/credits";
import { packByLookupKey } from "@/lib/stripe/catalog";
import { stripe } from "@/lib/stripe/server";

// Starts a subscription Checkout Session for a credit pack. Gated by Clerk;
// the session carries `userId` so the webhook can grant credits on completion.
export async function POST(request: Request) {
  const started = Date.now();
  const { userId } = await auth();
  const log = apiLogger({ scope: "api.stripe.checkout", userId, request });

  if (!userId) {
    logUnauthorized(log);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { lookupKey?: string };
  const pack = body.lookupKey ? packByLookupKey(body.lookupKey) : undefined;
  if (!pack) {
    logValidationError(log, "unknown_plan", { lookupKey: body.lookupKey });
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  log.info("checkout.start", {
    lookupKey: pack.lookupKey,
    plan: pack.plan,
    credits: pack.credits,
  });

  // Resolve the price by lookup_key so we never hardcode test/live price IDs.
  const prices = await stripe().prices.list({
    lookup_keys: [pack.lookupKey],
    active: true,
    limit: 1,
  });
  const price = prices.data[0];
  if (!price) {
    log.error("checkout.price_missing", undefined, { lookupKey: pack.lookupKey });
    return NextResponse.json({ error: "Price not configured in Stripe" }, { status: 500 });
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? undefined;
  await ensureProfile(userId, email);

  // Reuse the stored Stripe customer so repeat/upgrade checkouts don't mint a
  // duplicate customer; fall back to email for a user's first subscription.
  const existingCustomer = await getStripeCustomerId(userId).catch(() => null);

  // Guard against a second concurrent subscription: an existing subscriber must
  // change plans via the billing portal, not a fresh Checkout (which would
  // double-bill). Cancelled/incomplete subs don't block a new signup.
  if (existingCustomer) {
    const subs = await stripe().subscriptions.list({
      customer: existingCustomer,
      status: "all",
      limit: 10,
    });
    const hasLiveSub = subs.data.some((s) =>
      ["active", "trialing", "past_due", "unpaid"].includes(s.status),
    );
    if (hasLiveSub) {
      log.info("checkout.blocked_existing_subscription", {
        lookupKey: pack.lookupKey,
      });
      return NextResponse.json(
        {
          error:
            "You already have an active subscription. Change or cancel it from the billing portal.",
          code: "subscription_exists",
        },
        { status: 409 },
      );
    }
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  // No `payment_method_types` — dynamic payment methods (Stripe best practice).
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: price.id, quantity: 1 }],
    client_reference_id: userId,
    // NOTE: Stripe Tax (automatic_tax) is intentionally NOT enabled yet — turn it
    // on in the Dashboard (activate Tax + set an origin address) first, then
    // re-add `automatic_tax: { enabled: true }` + `billing_address_collection`.
    ...(existingCustomer
      ? { customer: existingCustomer }
      : { customer_email: email }),
    metadata: {
      userId,
      plan: pack.plan,
      credits: String(pack.credits),
      lookupKey: pack.lookupKey,
    },
    subscription_data: {
      metadata: { userId, plan: pack.plan, credits: String(pack.credits) },
    },
    success_url: `${origin}/settings/billing?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
  });

  log.info("checkout.session_created", {
    sessionId: session.id,
    lookupKey: pack.lookupKey,
    latencyMs: durationMs(started),
  });

  return NextResponse.json({ url: session.url });
}
