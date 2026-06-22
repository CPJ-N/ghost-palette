"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { MarketingNav } from "@/components/marketing-nav";
import { SampleMasonry } from "@/components/sample-masonry";
import { SiteFooter } from "@/components/site-footer";
import { MODELS } from "@/lib/models";
import { sampleSrc, SHOWCASE_PROMPT } from "@/lib/samples";

const FEATURES = [
  {
    tag: "Composer",
    title: "Bulk generation",
    body: "One prompt across every model and seed you pick — a full comparison grid in a single run.",
  },
  {
    tag: "Arena",
    title: "Head-to-head",
    body: "Pit models against each other on the same prompt, blind or named, and pick the winner.",
  },
  {
    tag: "Refine",
    title: "Editing and refinement",
    body: "Use a reference direction, ask every model for the same refinement, and evaluate which one gets closest.",
  },
];

export default function MarketingPage() {
  return (
    <main className="gp-shell">
      <MarketingNav
        homeAnchors={[
          { href: "#how", label: "How it works" },
          { href: "#features", label: "Features" },
        ]}
      />

      <section className="gp-hero-band" aria-labelledby="hero-title">
        <div className="gp-hero-band__grid" aria-hidden="true" />

        <div className="gp-hero">
          <div className="gp-hero__copy">
            <p className="gp-kicker">The image-model workspace</p>
            <h1 id="hero-title">Find the model that gets it right.</h1>
            <p className="gp-hero__lede">
              Run one prompt through every leading image model, inspect the outputs
              side by side, and keep the one worth shipping.
            </p>

            <nav className="gp-hero-rail" aria-label="Product workflows">
              <Link href="/composer">Composer</Link>
              <span aria-hidden="true">·</span>
              <Link href="/arena">Arena</Link>
              <span aria-hidden="true">·</span>
              <Link href="/evals">Refine</Link>
            </nav>

            <div className="gp-hero__actions">
              <Link className="gp-button gp-button--primary" href="/composer">
                Open the app
              </Link>
              <Link className="gp-button gp-button--ghost" href="/pricing">
                See pricing
              </Link>
            </div>
          </div>

          <div className="gp-hero__stage" aria-label="Ghost Palette product preview">
            <div className="gp-hero-stage">
              <header className="gp-hero-stage__bar">
                <span className="gp-hero-stage__label">Composer preview</span>
                <span className="gp-hero-stage__status">
                  {MODELS.length} models · one prompt
                </span>
              </header>

              <blockquote className="gp-hero-stage__prompt">
                <p>{SHOWCASE_PROMPT}</p>
              </blockquote>

              <div className="gp-hero-stage__bento">
                {MODELS.slice(0, 4).map((model) => {
                  const src = sampleSrc("showcase", model.id);
                  return (
                    <figure className="gp-hero-stage__tile" key={model.id}>
                      <div className={`gp-art ${model.artClass}`}>
                        {src ? (
                          <img
                            className="gp-art__img is-live"
                            src={src}
                            alt={`${model.name} output for the showcase prompt`}
                            loading="eager"
                          />
                        ) : null}
                      </div>
                      <figcaption>{model.name}</figcaption>
                    </figure>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="gp-how" id="how" aria-label="How Ghost Palette works">
        <ol className="gp-steps">
          <li>
            <span className="gp-step__n">01</span>
            <strong>Prompt once</strong>
            <span>Write one brief and keep it identical across every model.</span>
          </li>
          <li>
            <span className="gp-step__n">02</span>
            <strong>Compare side by side</strong>
            <span>See composition, detail, and text handling in a single grid.</span>
          </li>
          <li>
            <span className="gp-step__n">03</span>
            <strong>Keep the winner</strong>
            <span>Favorite the best output, or score it against a reference.</span>
          </li>
        </ol>
      </section>

      <section className="gp-features" id="features" aria-labelledby="features-title">
        <div className="gp-features__head">
          <h2 id="features-title">Three ways to compare</h2>
          <p>Composer, Arena, and Refine — one model roster, three workflows.</p>
        </div>
        <div className="gp-features__grid">
          {FEATURES.map((feature) => (
            <article className="gp-feature-card" key={feature.tag}>
              <span className="gp-tag">{feature.tag}</span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <SampleMasonry />

      <section className="gp-cta" aria-labelledby="cta-title">
        <h2 id="cta-title">Stop guessing which model to use.</h2>
        <Link className="gp-button gp-button--primary" href="/composer">
          Open the app
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
