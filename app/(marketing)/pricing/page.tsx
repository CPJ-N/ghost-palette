"use client";

import { useAuth } from "@clerk/nextjs";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { MarketingNav } from "@/components/marketing-nav";
import { SiteFooter } from "@/components/site-footer";
import type { BillingInterval, PaidPlan } from "@/lib/stripe/catalog";

const BASIC_OPTIONS = [
  { credits: 1000, price: 20 },
  { credits: 2000, price: 40 },
];

const PRO_OPTIONS = [
  { credits: 5000, price: 100 },
  { credits: 10000, price: 200 },
];

const fmt = (n: number) => n.toLocaleString("en-US");

function lookupKey(
  plan: PaidPlan,
  credits: number,
  interval: BillingInterval,
): string {
  const suffix = interval === "year" ? "annual" : "monthly";
  return `gp_${plan}_${credits}_${suffix}`;
}

export default function PricingPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [basic, setBasic] = useState(0);
  const basicTier = BASIC_OPTIONS[basic];
  const [pro, setPro] = useState(0);
  const proTier = PRO_OPTIONS[pro];
  const [annual, setAnnual] = useState(false);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const per = annual ? "/yr" : "/mo";
  const billed = annual ? "Billed annually" : "Billed monthly";
  const amount = (monthly: number) => (annual ? monthly * 10 : monthly);
  const interval: BillingInterval = annual ? "year" : "month";

  async function startCheckout(plan: PaidPlan, credits: number) {
    const key = lookupKey(plan, credits, interval);
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent("/pricing")}`);
      return;
    }

    setBusyPlan(key);
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
      setBusyPlan(null);
    }
  }

  return (
    <main className="gp-shell">
      <MarketingNav />

      <section className="gp-pricing" aria-labelledby="pricing-title">
        <div className="gp-pricing__head">
          <h1 id="pricing-title">Credit-based pricing</h1>
          <p>
            Every plan includes Create, Compare, and Refine. Credits are spent
            per generation, so pick the volume you need and scale anytime.
          </p>
          {error ? <p className="gp-pricing__error">{error}</p> : null}
          <div className="gp-billtoggle" role="group" aria-label="Billing period">
            <button
              type="button"
              className={`gp-billtoggle__opt ${annual ? "" : "is-active"}`}
              onClick={() => setAnnual(false)}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`gp-billtoggle__opt ${annual ? "is-active" : ""}`}
              onClick={() => setAnnual(true)}
            >
              Annual <span className="gp-billtoggle__save">2 months free</span>
            </button>
          </div>
        </div>

        <div className="gp-pricing__grid">
          <article className="gp-plan">
            <div className="gp-plan__head">
              <h2>Free</h2>
              <p className="gp-plan__price">
                $0<span>/mo</span>
              </p>
            </div>
            <ul className="gp-plan__features">
              <li>
                <Check size={16} aria-hidden="true" /> 50 credits / month
              </li>
              <li>
                <Check size={16} aria-hidden="true" /> Create studio
              </li>
              <li>
                <Check size={16} aria-hidden="true" /> All five models
              </li>
            </ul>
            <Link className="gp-button gp-button--ghost gp-plan__cta" href="/studio">
              Get started
            </Link>
          </article>

          <article className="gp-plan">
            <div className="gp-plan__head">
              <h2>Basic</h2>
              <p className="gp-plan__price">
                ${amount(basicTier.price)}
                <span>{per}</span>
              </p>
              <p className="gp-plan__billed">{billed}</p>
            </div>
            <label className="gp-plan__select">
              <select
                value={basic}
                onChange={(event) => setBasic(Number(event.target.value))}
                aria-label="Credits per month"
              >
                {BASIC_OPTIONS.map((option, index) => (
                  <option key={option.credits} value={index}>
                    {fmt(option.credits)} credits per month
                  </option>
                ))}
              </select>
            </label>
            <p className="gp-plan__inherit">Everything in Free, plus</p>
            <ul className="gp-plan__features">
              <li>
                <Check size={16} aria-hidden="true" /> Refinement workspace
              </li>
              <li>
                <Check size={16} aria-hidden="true" /> Saved Gallery
              </li>
              <li>
                <Check size={16} aria-hidden="true" /> Priority generation queue
              </li>
            </ul>
            <button
              className="gp-button gp-button--ghost gp-plan__cta"
              type="button"
              disabled={busyPlan === lookupKey("basic", basicTier.credits, interval)}
              onClick={() => startCheckout("basic", basicTier.credits)}
            >
              {busyPlan === lookupKey("basic", basicTier.credits, interval) ? (
                <Loader2 className="gp-spin" size={16} aria-hidden="true" />
              ) : null}
              Select plan
            </button>
          </article>

          <article className="gp-plan gp-plan--featured">
            <span className="gp-plan__badge">Recommended</span>
            <div className="gp-plan__head">
              <h2>Pro</h2>
              <p className="gp-plan__price">
                ${amount(proTier.price)}
                <span>{per}</span>
              </p>
              <p className="gp-plan__billed">{billed}</p>
            </div>
            <label className="gp-plan__select">
              <select
                value={pro}
                onChange={(event) => setPro(Number(event.target.value))}
                aria-label="Credits per month"
              >
                {PRO_OPTIONS.map((option, index) => (
                  <option key={option.credits} value={index}>
                    {fmt(option.credits)} credits per month
                  </option>
                ))}
              </select>
            </label>
            <p className="gp-plan__inherit">Everything in Basic, plus</p>
            <ul className="gp-plan__features">
              <li>
                <Check size={16} aria-hidden="true" /> Multi-model comparison runs
              </li>
              <li>
                <Check size={16} aria-hidden="true" /> Faster generation
              </li>
              <li>
                <Check size={16} aria-hidden="true" /> Early-access models
              </li>
              <li>
                <Check size={16} aria-hidden="true" /> Team seats
              </li>
            </ul>
            <button
              className="gp-button gp-button--primary gp-plan__cta"
              type="button"
              disabled={busyPlan === lookupKey("pro", proTier.credits, interval)}
              onClick={() => startCheckout("pro", proTier.credits)}
            >
              {busyPlan === lookupKey("pro", proTier.credits, interval) ? (
                <Loader2 className="gp-spin" size={16} aria-hidden="true" />
              ) : null}
              Select plan
            </button>
          </article>

          <article className="gp-plan">
            <div className="gp-plan__head">
              <h2>Enterprise</h2>
              <p className="gp-plan__price gp-plan__price--text">Custom</p>
            </div>
            <p className="gp-plan__inherit">Everything in Pro, plus</p>
            <ul className="gp-plan__features">
              <li>
                <Check size={16} aria-hidden="true" /> Custom credit volume
              </li>
              <li>
                <Check size={16} aria-hidden="true" /> SSO &amp; roles
              </li>
              <li>
                <Check size={16} aria-hidden="true" /> Dedicated support
              </li>
            </ul>
            <a
              className="gp-button gp-button--ghost gp-plan__cta"
              href="mailto:hello@ghostpalette.app"
            >
              Contact sales
            </a>
          </article>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
