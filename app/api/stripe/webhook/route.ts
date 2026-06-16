import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { ensureProfile, grantCredits, setPlan } from "@/lib/credits";
import { stripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

// Public endpoint (excluded from Clerk protection in proxy.ts). Verifies the
// Stripe signature, then grants credits / updates the plan in Supabase.
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json(
      { error: "Missing stripe-signature header or STRIPE_WEBHOOK_SECRET" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(body, signature, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      // Initial purchase: link the customer, set the plan, grant the credits.
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.metadata?.userId ?? s.client_reference_id ?? undefined;
        if (userId) {
          const customerId =
            typeof s.customer === "string" ? s.customer : (s.customer?.id ?? null);
          const ref =
            typeof s.subscription === "string"
              ? s.subscription
              : (s.subscription?.id ?? s.id);
          const credits = Number(s.metadata?.credits ?? 0);

          await ensureProfile(userId, s.customer_details?.email ?? null);
          await setPlan(userId, s.metadata?.plan ?? "basic", customerId);
          if (credits > 0) {
            await grantCredits(userId, credits, "subscription", ref);
          }
        }
        break;
      }

      // Cancellation: drop back to the free plan.
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (userId) {
          await setPlan(userId, "free");
        }
        break;
      }

      // TODO: handle `invoice.paid` (billing_reason === "subscription_cycle")
      // to grant credits on each monthly renewal once we confirm the
      // invoice→subscription shape for the pinned API version.
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler error", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
