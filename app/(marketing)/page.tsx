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
    tag: "Create",
    title: "Generate with the right model",
    body: "Start with a normal prompt, choose a model, or compare several when the brief needs a stronger answer.",
  },
  {
    tag: "Compare",
    title: "Model-aware decisions",
    body: "Inspect outputs side by side, pick the winner, and use benchmark signals when speed, cost, or fidelity matters.",
  },
  {
    tag: "Refine",
    title: "Edit from a reference",
    body: "Upload a direction, generate a refinement, and keep the outputs that move the image closer to finished.",
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
        links={[
          { href: "/docs", label: "Docs" },
          { href: "/pricing", label: "Pricing" },
        ]}
      />

      <section className="gp-hero-band" aria-labelledby="hero-title">
        <div className="gp-hero-band__grid" aria-hidden="true" />

        <div className="gp-hero">
          <div className="gp-hero__copy">
            <p className="gp-kicker">The model-smart image studio</p>
            <h1 id="hero-title">Create images with the model that gets it right.</h1>
            <p className="gp-hero__lede">
              Generate finished images, compare leading models when it matters,
              and keep the outputs worth shipping.
            </p>

            <nav className="gp-hero-rail" aria-label="Evaluation">
              <Link href="/leaderboard">Model scores</Link>
              <span aria-hidden="true">·</span>
              <Link href="/benchmark">Benchmarks</Link>
              <span aria-hidden="true">·</span>
              <Link href="/docs/benchmarks">Model data</Link>
            </nav>

            <div className="gp-hero__actions">
              <Link className="gp-button gp-button--primary" href="/arena">
                Open Studio
              </Link>
              <Link className="gp-button gp-button--ghost" href="/pricing">
                See pricing
              </Link>
            </div>
          </div>

          <div className="gp-hero__stage" aria-label="Ghost Palette product preview">
            <div className="gp-hero-stage">
              <header className="gp-hero-stage__bar">
                <span className="gp-hero-stage__label">Studio preview</span>
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
            <strong>Create first</strong>
            <span>Write a prompt and generate with the model that fits the job.</span>
          </li>
          <li>
            <span className="gp-step__n">02</span>
            <strong>Compare when needed</strong>
            <span>Run the same brief across models to see composition, detail, and text handling.</span>
          </li>
          <li>
            <span className="gp-step__n">03</span>
            <strong>Save the winner</strong>
            <span>Keep finished outputs, reference edits, and model picks in your Library.</span>
          </li>
        </ol>
      </section>

      <section className="gp-features" id="features" aria-labelledby="features-title">
        <div className="gp-features__head">
          <h2 id="features-title">A studio that understands models</h2>
          <p>Create, compare, and refine from one model roster.</p>
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
        <h2 id="cta-title">Start with the image. Let the model choice get smarter.</h2>
        <Link className="gp-button gp-button--primary" href="/arena">
          Open Studio
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
