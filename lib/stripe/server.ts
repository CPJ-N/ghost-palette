import "server-only";

import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Server-only Stripe client (secret key). We don't pin `apiVersion` — the
 * installed SDK pins a recent version itself, which avoids drift between the
 * type definitions and the wire format. A restricted key (`rk_…`) is the
 * recommended upgrade over the `sk_…` secret key for production.
 */
export function stripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set in .env.local");
  }
  cached = new Stripe(key, { typescript: true });
  return cached;
}
