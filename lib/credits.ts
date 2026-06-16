import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

/** Insert a profile row if one doesn't exist yet (never clobbers existing data). */
export async function ensureProfile(userId: string, email?: string | null) {
  const sb = supabaseAdmin();
  await sb
    .from("profiles")
    .upsert(
      { user_id: userId, ...(email ? { email } : {}) },
      { onConflict: "user_id", ignoreDuplicates: true }
    );
}

/** Set the plan (and optionally link the Stripe customer) on a profile. */
export async function setPlan(
  userId: string,
  plan: string,
  stripeCustomerId?: string | null
) {
  const sb = supabaseAdmin();
  await sb
    .from("profiles")
    .update({
      plan,
      ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
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
  ref?: string | null
): Promise<number> {
  const sb = supabaseAdmin();
  const { data: profile } = await sb
    .from("profiles")
    .select("credit_balance")
    .eq("user_id", userId)
    .single();

  const balanceAfter = (profile?.credit_balance ?? 0) + amount;

  await sb
    .from("profiles")
    .update({ credit_balance: balanceAfter, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  await sb.from("credit_transactions").insert({
    user_id: userId,
    amount,
    reason,
    ref: ref ?? null,
    balance_after: balanceAfter,
  });

  return balanceAfter;
}
