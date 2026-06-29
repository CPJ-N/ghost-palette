import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { apiLogger, durationMs } from "@/lib/api-log";
import {
  ensureProfile,
  isDuplicateGrant,
  setCredits,
  setSubscription,
} from "@/lib/credits";
import { FREE_MONTHLY_CREDITS, packByLookupKey } from "@/lib/stripe/catalog";
import { stripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

type EventLogger = ReturnType<typeof apiLogger>;

/**
 * Reset a subscriber's balance to its allotment, idempotently. The
 * (reason='subscription', ref) unique index turns a re-delivered event into a
 * no-op so a user who already spent this period isn't topped back up.
 */
async function resetSubscriptionCreditsOnce(
  logger: EventLogger,
  userId: string,
  target: number,
  ref: string,
) {
  try {
    await setCredits(userId, target, "subscription", ref, /* advanceRefresh */ true);
  } catch (err) {
    if (isDuplicateGrant(err)) {
      logger.info("subscription.reset.duplicate_skipped", { userId, ref, target });
      return;
    }
    throw err;
  }
}

/** Plan + monthly allotment for a subscription, from the live price's lookup_key. */
function resolvePack(sub: Stripe.Subscription) {
  const lookupKey = sub.items.data[0]?.price?.lookup_key ?? undefined;
  const pack = lookupKey ? packByLookupKey(lookupKey) : undefined;
  const plan = pack?.plan ?? sub.metadata?.plan ?? "basic";
  const monthlyCredits = pack?.credits ?? Number(sub.metadata?.credits ?? 0);
  return { lookupKey, plan, monthlyCredits };
}

/** Billing-period start/end as ISO strings, across Stripe API-version shapes. */
function periodFromSub(sub: Stripe.Subscription): {
  start: string | null;
  end: string | null;
} {
  const anySub = sub as unknown as {
    current_period_start?: number | null;
    current_period_end?: number | null;
    items?: {
      data?: Array<{ current_period_start?: number; current_period_end?: number }>;
    };
  };
  const item = anySub.items?.data?.[0];
  const startUnix = item?.current_period_start ?? anySub.current_period_start ?? null;
  const endUnix = item?.current_period_end ?? anySub.current_period_end ?? null;
  return {
    start: startUnix ? new Date(startUnix * 1000).toISOString() : null,
    end: endUnix ? new Date(endUnix * 1000).toISOString() : null,
  };
}

/** Read the subscription id off an invoice across Stripe API-version shapes. */
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | undefined {
  const inv = invoice as unknown as {
    subscription?: string | { id?: string } | null;
    parent?: { subscription_details?: { subscription?: string | { id?: string } } };
  };
  const direct =
    typeof inv.subscription === "string" ? inv.subscription : inv.subscription?.id;
  if (direct) return direct;
  const nested = inv.parent?.subscription_details?.subscription;
  return typeof nested === "string" ? nested : nested?.id;
}

// Public endpoint (excluded from Clerk protection in proxy.ts). Verifies the
// Stripe signature, then maintains plan / allotment / period dates in Supabase.
// The monthly credit RESET is driven by the cron (refresh_due_credits); this
// webhook does the initial grant and keeps plan + allotment + dates current.
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
      // Initial purchase: link customer + subscription, set plan/allotment/dates,
      // and grant the first period's credits.
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.metadata?.userId ?? s.client_reference_id ?? undefined;
        if (!userId) {
          eventLog.warn("checkout.completed.missing_user", { sessionId: s.id });
          break;
        }
        const customerId =
          typeof s.customer === "string" ? s.customer : (s.customer?.id ?? null);
        const subId =
          typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
        const pack = s.metadata?.lookupKey
          ? packByLookupKey(s.metadata.lookupKey)
          : undefined;
        const plan = pack?.plan ?? s.metadata?.plan ?? "basic";
        const monthlyCredits = pack?.credits ?? Number(s.metadata?.credits ?? 0);

        const period = subId
          ? periodFromSub(await stripe().subscriptions.retrieve(subId))
          : { start: null, end: null };

        eventLog.info("checkout.completed", { userId, plan, monthlyCredits, subId });
        await ensureProfile(userId, s.customer_details?.email ?? null);
        await setSubscription(userId, {
          plan,
          monthlyCredits,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subId ?? null,
          currentPeriodStart: period.start,
          currentPeriodEnd: period.end,
        });
        if (monthlyCredits > 0 && subId) {
          await resetSubscriptionCreditsOnce(eventLog, userId, monthlyCredits, subId);
        }
        break;
      }

      // Plan change (billing portal / API): sync plan, allotment, and dates. The
      // new allotment takes effect at the next monthly reset; no immediate grant.
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) {
          eventLog.warn("subscription.updated.missing_user", { subscriptionId: sub.id });
          break;
        }
        const { plan, monthlyCredits, lookupKey } = resolvePack(sub);
        const period = periodFromSub(sub);
        eventLog.info("subscription.updated", {
          userId,
          plan,
          monthlyCredits,
          lookupKey,
          status: sub.status,
        });
        await setSubscription(userId, {
          plan,
          monthlyCredits,
          stripeSubscriptionId: sub.id,
          currentPeriodStart: period.start,
          currentPeriodEnd: period.end,
        });
        break;
      }

      // Cancellation: back to Free; the next cron reset restores the 50/mo allotment.
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) {
          eventLog.warn("subscription.deleted.missing_user", { subscriptionId: sub.id });
          break;
        }
        eventLog.info("subscription.deleted", { userId, subscriptionId: sub.id });
        await setSubscription(userId, {
          plan: "free",
          monthlyCredits: FREE_MONTHLY_CREDITS,
          stripeSubscriptionId: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
        });
        break;
      }

      // Renewal payment: refresh the displayed period dates + allotment. Credits
      // themselves are reset by the monthly cron, so no grant happens here.
      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason !== "subscription_cycle") {
          eventLog.debug("invoice.skipped", {
            billingReason: invoice.billing_reason ?? null,
          });
          break;
        }
        const subId = invoiceSubscriptionId(invoice);
        if (!subId) {
          eventLog.warn("invoice.no_subscription", { invoiceId: invoice.id ?? null });
          break;
        }
        const sub = await stripe().subscriptions.retrieve(subId);
        const userId = sub.metadata?.userId;
        if (!userId) {
          eventLog.warn("invoice.renewal.missing_user", { subscriptionId: subId });
          break;
        }
        const { plan, monthlyCredits } = resolvePack(sub);
        const period = periodFromSub(sub);
        eventLog.info("invoice.renewal", { userId, plan, monthlyCredits, subId });
        await setSubscription(userId, {
          plan,
          monthlyCredits,
          currentPeriodStart: period.start,
          currentPeriodEnd: period.end,
        });
        break;
      }

      // Failed renewal: Stripe dunning retries; we keep the plan until it cancels.
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        eventLog.warn("invoice.payment_failed", {
          invoiceId: invoice.id ?? null,
          subscriptionId: invoiceSubscriptionId(invoice) ?? null,
        });
        // TODO(dunning): notify the user and/or restrict access on terminal failure.
        break;
      }

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
