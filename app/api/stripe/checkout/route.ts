import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { ensureProfile } from "@/lib/credits";
import { packByLookupKey } from "@/lib/stripe/catalog";
import { stripe } from "@/lib/stripe/server";

// Starts a subscription Checkout Session for a credit pack. Gated by Clerk;
// the session carries `userId` so the webhook can grant credits on completion.
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { lookupKey?: string };
  const pack = body.lookupKey ? packByLookupKey(body.lookupKey) : undefined;
  if (!pack) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  // Resolve the price by lookup_key so we never hardcode test/live price IDs.
  const prices = await stripe().prices.list({
    lookup_keys: [pack.lookupKey],
    active: true,
    limit: 1,
  });
  const price = prices.data[0];
  if (!price) {
    return NextResponse.json({ error: "Price not configured in Stripe" }, { status: 500 });
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? undefined;
  await ensureProfile(userId, email);

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  // No `payment_method_types` — dynamic payment methods (Stripe best practice).
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: price.id, quantity: 1 }],
    client_reference_id: userId,
    customer_email: email,
    metadata: {
      userId,
      plan: pack.plan,
      credits: String(pack.credits),
      lookupKey: pack.lookupKey,
    },
    subscription_data: {
      metadata: { userId, plan: pack.plan, credits: String(pack.credits) },
    },
    success_url: `${origin}/settings?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
