import "server-only";

import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabase/server";
import { FREE_MONTHLY_CREDITS } from "@/lib/stripe/catalog";

const log = createLogger("credits");

export type CreditSummary = {
  balance: number;
  plan: string;
};

export class InsufficientCreditsError extends Error {
  readonly required: number;
  readonly balance: number;

  constructor(required: number, balance: number) {
    super("Not enough credits");
    this.name = "InsufficientCreditsError";
    this.required = required;
    this.balance = balance;
  }
}

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

  await grantStarterCredits(userId);

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

export async function getCreditSummary(userId: string): Promise<CreditSummary> {
  const profile = await readCreditSummary(userId);
  if (!profile) {
    throw new Error("Profile not found");
  }
  return profile;
}

/** Append-only credit grant (+). */
export async function grantCredits(
  userId: string,
  amount: number,
  reason: string,
  ref?: string | null,
): Promise<number> {
  if (amount <= 0) {
    throw new Error("grantCredits requires a positive amount");
  }
  return adjustCredits(userId, amount, reason, ref);
}

/** Spend credits atomically and fail if the account would go negative. */
export async function spendCredits(
  userId: string,
  amount: number,
  reason: string,
  ref?: string | null,
): Promise<number> {
  if (amount <= 0) {
    throw new Error("spendCredits requires a positive amount");
  }
  return adjustCredits(userId, -amount, reason, ref);
}

async function grantStarterCredits(userId: string) {
  const sb = supabaseAdmin();

  const { data, error } = await sb
    .from("credit_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("reason", "signup")
    .eq("ref", "starter")
    .limit(1)
    .maybeSingle();

  if (error) {
    log.error("credits.starter_read_failed", error, { userId });
    throw error;
  }

  if (data) return;

  await grantCredits(userId, FREE_MONTHLY_CREDITS, "signup", "starter").catch(
    (error) => {
      if (isDuplicateStarterGrant(error)) return;
      throw error;
    },
  );
}

async function readCreditSummary(userId: string): Promise<CreditSummary | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("profiles")
    .select("credit_balance, plan")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    log.error("credits.read_balance_failed", error, { userId });
    throw error;
  }

  if (!data) return null;
  return {
    balance: data.credit_balance,
    plan: data.plan,
  };
}

async function adjustCredits(
  userId: string,
  amount: number,
  reason: string,
  ref?: string | null,
): Promise<number> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.rpc("adjust_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_ref: ref ?? null,
  });

  if (error) {
    if (isInsufficientCredits(error)) {
      const profile = await readCreditSummary(userId).catch(() => null);
      throw new InsufficientCreditsError(Math.abs(amount), profile?.balance ?? 0);
    }

    log.error("credits.adjust_failed", error, { userId, reason, amount, ref });
    throw error;
  }

  const balanceAfter = data ?? 0;
  log.info("credits.adjusted", {
    userId,
    amount,
    reason,
    ref: ref ?? null,
    balanceAfter,
  });

  return balanceAfter;
}

function isInsufficientCredits(error: { message?: string }) {
  return (error.message ?? "").toLowerCase().includes("insufficient_credits");
}

function isDuplicateStarterGrant(error: { code?: string; message?: string }) {
  return (
    error.code === "23505" ||
    (error.message ?? "").toLowerCase().includes("credit_tx_starter_unique_idx")
  );
}
