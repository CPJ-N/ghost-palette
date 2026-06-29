import "server-only";

import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabase/server";
import { FREE_MONTHLY_CREDITS } from "@/lib/stripe/catalog";

const log = createLogger("credits");

export type CreditSummary = {
  balance: number;
  plan: string;
  monthlyCredits: number;
  currentPeriodEnd: string | null;
  nextRefreshAt: string | null;
};

export type SubscriptionUpdate = {
  plan?: string;
  monthlyCredits?: number;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
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

export type ClerkProfileFields = {
  email?: string | null;
  emailVerified?: boolean;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  imageUrl?: string | null;
};

/**
 * Create or update a profile from Clerk webhook data (user.created / user.updated).
 * On create we also grant the starter credits (idempotent).
 */
export async function upsertClerkProfile(
  userId: string,
  fields: ClerkProfileFields,
  opts: { grantStarter?: boolean } = {},
) {
  const sb = supabaseAdmin();
  const row = {
    user_id: userId,
    updated_at: new Date().toISOString(),
    ...(fields.email !== undefined ? { email: fields.email } : {}),
    ...(fields.emailVerified !== undefined
      ? { email_verified: fields.emailVerified }
      : {}),
    ...(fields.firstName !== undefined ? { first_name: fields.firstName } : {}),
    ...(fields.lastName !== undefined ? { last_name: fields.lastName } : {}),
    ...(fields.username !== undefined ? { username: fields.username } : {}),
    ...(fields.imageUrl !== undefined ? { image_url: fields.imageUrl } : {}),
  };

  const { error } = await sb.from("profiles").upsert(row, { onConflict: "user_id" });
  if (error) {
    log.error("profile.clerk_upsert_failed", error, { userId });
    throw error;
  }

  if (opts.grantStarter) {
    await grantStarterCredits(userId);
  }

  log.info("profile.clerk_synced", { userId, grantStarter: Boolean(opts.grantStarter) });
}

/** Delete a profile (cascades to its runs/results/ledger) — Clerk user.deleted. */
export async function deleteProfile(userId: string) {
  const sb = supabaseAdmin();
  const { error } = await sb.from("profiles").delete().eq("user_id", userId);
  if (error) {
    log.error("profile.delete_failed", error, { userId });
    throw error;
  }
  log.info("profile.deleted", { userId });
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

/** Update subscription/plan bookkeeping on a profile (never touches the balance). */
export async function setSubscription(userId: string, fields: SubscriptionUpdate) {
  const sb = supabaseAdmin();
  const update = {
    updated_at: new Date().toISOString(),
    ...(fields.plan !== undefined ? { plan: fields.plan } : {}),
    ...(fields.monthlyCredits !== undefined
      ? { monthly_credits: fields.monthlyCredits }
      : {}),
    ...(fields.stripeCustomerId !== undefined
      ? { stripe_customer_id: fields.stripeCustomerId }
      : {}),
    ...(fields.stripeSubscriptionId !== undefined
      ? { stripe_subscription_id: fields.stripeSubscriptionId }
      : {}),
    ...(fields.currentPeriodStart !== undefined
      ? { current_period_start: fields.currentPeriodStart }
      : {}),
    ...(fields.currentPeriodEnd !== undefined
      ? { current_period_end: fields.currentPeriodEnd }
      : {}),
  };

  const { error } = await sb.from("profiles").update(update).eq("user_id", userId);
  if (error) {
    log.error("subscription.update_failed", error, { userId, plan: fields.plan });
    throw error;
  }
  log.info("subscription.bookkeeping_updated", { userId, plan: fields.plan });
}

/**
 * Idempotent reset: SET the balance to a target (used by Stripe checkout/renewal
 * and the monthly cron). Optionally advance the monthly refresh anchor. Throws on
 * a duplicate (reason, ref) — callers swallow it via isDuplicateGrant.
 */
export async function setCredits(
  userId: string,
  target: number,
  reason: string,
  ref?: string | null,
  advanceRefresh = false,
): Promise<number> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.rpc("set_credits", {
    p_user_id: userId,
    p_target: target,
    p_reason: reason,
    p_ref: ref ?? undefined,
    p_advance_refresh: advanceRefresh,
  });

  if (error) {
    log.error("credits.set_failed", error, { userId, reason, target, ref });
    throw error;
  }

  const balance = data ?? target;
  log.info("credits.set", { userId, target, reason, ref: ref ?? null, balance });
  return balance;
}

/** Reset every due profile to its monthly allotment (the cron engine). Returns count. */
export async function refreshDueCredits(): Promise<number> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.rpc("refresh_due_credits");
  if (error) {
    log.error("credits.refresh_due_failed", error);
    throw error;
  }
  return data ?? 0;
}

/** Read the linked Stripe customer id for a user, if any. */
export async function getStripeCustomerId(userId: string): Promise<string | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    log.error("credits.read_customer_failed", error, { userId });
    throw error;
  }

  return data?.stripe_customer_id ?? null;
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
    .select("credit_balance, plan, monthly_credits, current_period_end, next_refresh_at")
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
    monthlyCredits: data.monthly_credits,
    currentPeriodEnd: data.current_period_end,
    nextRefreshAt: data.next_refresh_at,
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
    p_ref: ref ?? undefined,
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

/** Unique-violation (23505): a credit grant with this (reason, ref) already exists. */
export function isDuplicateGrant(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return (
    e?.code === "23505" ||
    (e?.message ?? "").toLowerCase().includes("duplicate key value")
  );
}

function isDuplicateStarterGrant(error: { code?: string; message?: string }) {
  return (
    error.code === "23505" ||
    (error.message ?? "").toLowerCase().includes("credit_tx_starter_unique_idx")
  );
}
