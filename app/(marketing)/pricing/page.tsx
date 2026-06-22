"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { SiteFooter } from "@/components/site-footer";

const BASIC_OPTIONS = [
  { credits: 1000, price: 20 },
  { credits: 2000, price: 40 },
];

const PRO_OPTIONS = [
  { credits: 5000, price: 100 },
  { credits: 10000, price: 200 },
];

const fmt = (n: number) => n.toLocaleString("en-US");

export default function PricingPage() {
  const [basic, setBasic] = useState(0);
  const basicTier = BASIC_OPTIONS[basic];
  const [pro, setPro] = useState(0);
  const proTier = PRO_OPTIONS[pro];
  const [annual, setAnnual] = useState(false);
  const per = annual ? "/yr" : "/mo";
  const billed = annual ? "Billed annually" : "Billed monthly";
  const amount = (monthly: number) => (annual ? monthly * 10 : monthly);

  return (
    <main className="gp-shell">
      <header className="gp-topnav" aria-label="Primary navigation">
        <Link href="/" className="gp-nav__brand">
          <span className="gp-mark" aria-hidden="true">
            GP
          </span>
          <span>Ghost Palette</span>
        </Link>
        <div className="gp-topnav__right">
          <Link className="gp-button gp-button--primary" href="/composer">
            Open the app
          </Link>
        </div>
      </header>

      <section className="gp-pricing" aria-labelledby="pricing-title">
        <div className="gp-pricing__head">
          <h1 id="pricing-title">Credit-based pricing</h1>
          <p>
            Every plan includes Composer, Arena, and Evals. Credits are spent per
            generation — pick the volume you need, scale anytime.
          </p>
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
          {/* Free */}
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
                <Check size={16} aria-hidden="true" /> Composer &amp; Arena
              </li>
              <li>
                <Check size={16} aria-hidden="true" /> All five models
              </li>
            </ul>
            <Link className="gp-button gp-button--ghost gp-plan__cta" href="/composer">
              Get started
            </Link>
          </article>

          {/* Basic */}
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
                <Check size={16} aria-hidden="true" /> Evals + similarity scoring
              </li>
              <li>
                <Check size={16} aria-hidden="true" /> Saved Library
              </li>
              <li>
                <Check size={16} aria-hidden="true" /> Priority generation queue
              </li>
            </ul>
            <Link className="gp-button gp-button--ghost gp-plan__cta" href="/composer">
              Select plan
            </Link>
          </article>

          {/* Pro — featured */}
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
                <Check size={16} aria-hidden="true" /> Bulk Composer batches
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
            <Link className="gp-button gp-button--primary gp-plan__cta" href="/composer">
              Select plan
            </Link>
          </article>

          {/* Enterprise */}
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
