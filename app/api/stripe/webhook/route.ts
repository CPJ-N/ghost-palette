import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { apiLogger, durationMs } from "@/lib/api-log";
import { ensureProfile, grantCredits, setPlan } from "@/lib/credits";
import { stripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

// Public endpoint (excluded from Clerk protection in proxy.ts). Verifies the
// Stripe signature, then grants credits / updates the plan in Supabase.
export async function POST(request: Request) {
  const started = Date.now();
  const log = apiLogger({ scope: "api.stripe.webhook", request });
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    log.warn("webhook.misconfigured", {
      hasSignature: Boolean(signature),
      hasSecret: Boolean(secret),
    });
    return NextResponse.json(
      { error: "Missing stripe-signature header or STRIPE_WEBHOOK_SECRET" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(body, signature, secret);
  } catch (err) {
    log.warn("webhook.invalid_signature", {
      ...(err instanceof Error ? { errorMessage: err.message } : {}),
    });
    return NextResponse.json(
      { error: `Invalid signature: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  const eventLog = log.child({ eventId: event.id, eventType: event.type });
  eventLog.info("webhook.received");

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
          const plan = s.metadata?.plan ?? "basic";

          eventLog.info("checkout.completed", {
            userId,
            plan,
            credits,
            customerId,
            sessionId: s.id,
          });

          await ensureProfile(userId, s.customer_details?.email ?? null);
          await setPlan(userId, plan, customerId);
          if (credits > 0) {
            await grantCredits(userId, credits, "subscription", ref);
          }
        } else {
          eventLog.warn("checkout.completed.missing_user", { sessionId: s.id });
        }
        break;
      }

      // Cancellation: drop back to the free plan.
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (userId) {
          eventLog.info("subscription.deleted", { userId, subscriptionId: sub.id });
          await setPlan(userId, "free");
        } else {
          eventLog.warn("subscription.deleted.missing_user", { subscriptionId: sub.id });
        }
        break;
      }

      // TODO: handle `invoice.paid` (billing_reason === "subscription_cycle")
      // to grant credits on each monthly renewal once we confirm the
      // invoice→subscription shape for the pinned API version.
      default:
        eventLog.debug("webhook.unhandled", { eventType: event.type });
        break;
    }
  } catch (err) {
    eventLog.error("webhook.handler_failed", err, { latencyMs: durationMs(started) });
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  eventLog.info("webhook.processed", { latencyMs: durationMs(started) });
  return NextResponse.json({ received: true });
}
