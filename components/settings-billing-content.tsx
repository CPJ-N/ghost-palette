"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useCredits } from "@/hooks/use-credits";
import type { BillingInterval, PaidPlan } from "@/lib/stripe/catalog";

const BASIC_OPTIONS = [
  { credits: 1000, price: 20 },
  { credits: 2000, price: 40 },
];

const PRO_OPTIONS = [
  { credits: 5000, price: 100 },
  { credits: 10000, price: 200 },
];

function lookupKey(
  plan: PaidPlan,
  credits: number,
  interval: BillingInterval,
): string {
  const suffix = interval === "year" ? "annual" : "monthly";
  return `gp_${plan}_${credits}_${suffix}`;
}

export function SettingsBillingContent() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";
  const [annual, setAnnual] = useState(false);
  const [basic, setBasic] = useState(0);
  const [pro, setPro] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { credits, isLoadingCredits } = useCredits();
  const interval: BillingInterval = annual ? "year" : "month";
  const plan = credits?.plan ?? "free";
  const isPaid = plan === "basic" || plan === "pro";

  async function startCheckout(plan: PaidPlan, credits: number) {
    const key = lookupKey(plan, credits, interval);
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent("/settings/billing")}`);
      return;
    }

    posthog.capture("checkout_started", {
      plan,
      credits,
      interval,
      lookup_key: key,
    });
    setBusy(key);
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lookupKey: key }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Checkout failed");
      }
      window.location.href = data.url;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Checkout failed",
      );
      setBusy(null);
    }
  }

  async function openPortal() {
    setBusy("portal");
    setError(null);
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Could not open billing portal");
      }
      window.location.href = data.url;
    } catch (portalError) {
      setError(
        portalError instanceof Error
          ? portalError.message
          : "Could not open billing portal",
      );
      setBusy(null);
    }
  }

  return (
    <section className="gp-settings-panel">
      <h2>Billing</h2>
      {checkoutSuccess ? (
        <p className="gp-settings-success">
          Checkout complete. Credits will appear once Stripe confirms your
          subscription.
        </p>
      ) : null}
      {error ? <p className="gp-settings-error">{error}</p> : null}
      <p className="gp-settings-copy">
        Subscriptions grant monthly credits. Annual billing includes two months
        free.
      </p>
      <p className="gp-settings-copy">
        Current balance:{" "}
        {isLoadingCredits && !credits
          ? "checking..."
          : credits
            ? `${credits.balance.toLocaleString()} credits`
            : "unavailable"}
      </p>
      <p className="gp-settings-copy">
        Current plan:{" "}
        <strong>
          {plan === "free" ? "Free" : plan === "basic" ? "Basic" : "Pro"}
        </strong>
      </p>
      {isPaid ? (
        <div className="gp-settings-manage">
          {credits?.currentPeriodEnd ? (
            <p className="gp-settings-copy">
              Renews on{" "}
              {new Date(credits.currentPeriodEnd).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              .
            </p>
          ) : null}
          <p className="gp-settings-copy">
            Change your plan, update payment, or cancel anytime in the billing
            portal.
          </p>
          <Button onClick={openPortal} disabled={busy === "portal"}>
            {busy === "portal" ? "Opening…" : "Manage subscription"}
          </Button>
        </div>
      ) : (
        <>
      <div className="gp-billtoggle gp-billtoggle--compact" role="group">
        <button
          type="button"
          className={`gp-billtoggle__opt ${annual ? "" : "is-active"}`}
          onClick={() => { setAnnual(false); posthog.capture("billing_interval_toggled", { interval: "month" }); }}
        >
          Monthly
        </button>
        <button
          type="button"
          className={`gp-billtoggle__opt ${annual ? "is-active" : ""}`}
          onClick={() => { setAnnual(true); posthog.capture("billing_interval_toggled", { interval: "year" }); }}
        >
          Annual
        </button>
      </div>
      <div className="gp-settings-billing">
        <article className="gp-settings-plan">
          <h3>Basic</h3>
          <select
            value={basic}
            onChange={(event) => setBasic(Number(event.target.value))}
            aria-label="Basic credits per month"
          >
            {BASIC_OPTIONS.map((option, index) => (
              <option key={option.credits} value={index}>
                {option.credits.toLocaleString()} credits / mo
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            disabled={busy === lookupKey("basic", BASIC_OPTIONS[basic].credits, interval)}
            onClick={() => startCheckout("basic", BASIC_OPTIONS[basic].credits)}
          >
            Upgrade to Basic
          </Button>
        </article>
        <article className="gp-settings-plan">
          <h3>Pro</h3>
          <select
            value={pro}
            onChange={(event) => setPro(Number(event.target.value))}
            aria-label="Pro credits per month"
          >
            {PRO_OPTIONS.map((option, index) => (
              <option key={option.credits} value={index}>
                {option.credits.toLocaleString()} credits / mo
              </option>
            ))}
          </select>
          <Button
            disabled={busy === lookupKey("pro", PRO_OPTIONS[pro].credits, interval)}
            onClick={() => startCheckout("pro", PRO_OPTIONS[pro].credits)}
          >
            Upgrade to Pro
          </Button>
        </article>
      </div>
        </>
      )}
      <div className="gp-settings-actions">
        <Button asChild variant="outline">
          <Link href="/pricing">Full pricing details</Link>
        </Button>
      </div>
    </section>
  );
}
