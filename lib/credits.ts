import "server-only";

import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabase/server";

const log = createLogger("credits");

/** Insert a profile row if one doesn't exist yet (never clobbers existing data). */
export async function ensureProfile(userId: string, email?: string | null) {
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("profiles")
    .upsert(
      { user_id: userId, ...(email ? { email } : {}) },
      { onConflict: "user_id", ignoreDuplicates: true },
    );

  if (error) {
    log.error("profile.ensure_failed", error, { userId });
    throw error;
  }

  log.debug("profile.ensured", { userId, hasEmail: Boolean(email) });
}

/** Set the plan (and optionally link the Stripe customer) on a profile. */
export async function setPlan(
  userId: string,
  plan: string,
  stripeCustomerId?: string | null,
) {
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("profiles")
    .update({
      plan,
      ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    log.error("plan.update_failed", error, { userId, plan });
    throw error;
  }

  log.info("plan.updated", {
    userId,
    plan,
    hasStripeCustomer: Boolean(stripeCustomerId),
  });
}

/**
 * Append-only credit grant (+) or spend (−). Reads the current balance, writes
 * a ledger row with `balance_after`, and updates the cached balance.
 *
 * NOTE: this read-modify-write is not atomic across concurrent calls. It's fine
 * for webhook volume; promote to a Postgres `grant_credits()` function before
 * per-generation spend becomes hot.
 */
export async function grantCredits(
  userId: string,
  amount: number,
  reason: string,
  ref?: string | null,
): Promise<number> {
  const sb = supabaseAdmin();
  const { data: profile, error: readError } = await sb
    .from("profiles")
    .select("credit_balance")
    .eq("user_id", userId)
    .single();

  if (readError) {
    log.error("credits.read_balance_failed", readError, { userId, reason });
    throw readError;
  }

  const balanceAfter = (profile?.credit_balance ?? 0) + amount;

  const { error: updateError } = await sb
    .from("profiles")
    .update({ credit_balance: balanceAfter, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (updateError) {
    log.error("credits.update_balance_failed", updateError, { userId, reason, amount });
    throw updateError;
  }

  const { error: insertError } = await sb.from("credit_transactions").insert({
    user_id: userId,
    amount,
    reason,
    ref: ref ?? null,
    balance_after: balanceAfter,
  });

  if (insertError) {
    log.error("credits.ledger_insert_failed", insertError, { userId, reason, amount });
    throw insertError;
  }

  log.info("credits.granted", {
    userId,
    amount,
    reason,
    ref: ref ?? null,
    balanceAfter,
  });

  return balanceAfter;
}
