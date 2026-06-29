import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { apiLogger, durationMs, logUnauthorized } from "@/lib/api-log";
import { getStripeCustomerId } from "@/lib/credits";
import { stripe } from "@/lib/stripe/server";

// Opens a Stripe Billing Portal session so a subscriber can change plan, update
// their payment method, or cancel — Stripe handles proration and emits
// customer.subscription.updated / .deleted, which the webhook syncs back.
export async function POST(request: Request) {
  const started = Date.now();
  const { userId } = await auth();
  const log = apiLogger({ scope: "api.stripe.portal", userId, request });

  if (!userId) {
    logUnauthorized(log);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customerId = await getStripeCustomerId(userId);
  if (!customerId) {
    log.info("portal.no_customer");
    return NextResponse.json(
      { error: "No subscription to manage yet" },
      { status: 400 },
    );
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  try {
    const session = await stripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/settings/billing`,
    });

    log.info("portal.session_created", {
      customerId,
      latencyMs: durationMs(started),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Most common cause: the Customer Portal isn't activated in the Stripe
    // dashboard (test mode → Settings → Billing → Customer portal).
    log.error("portal.create_failed", err, { customerId });
    return NextResponse.json(
      { error: "Could not open the billing portal" },
      { status: 502 },
    );
  }
}
