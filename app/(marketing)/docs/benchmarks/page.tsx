import Link from "next/link";

import { BenchmarkGlossary } from "@/components/benchmark-glossary";
import { BenchmarkLeaderboard } from "@/components/benchmark-leaderboard";
import { DATA_AS_OF, INDUSTRY_MODELS } from "@/lib/benchmarks";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Model Benchmarks 2026 — Ghost Palette Docs",
  description:
    "Compare top AI image generation models across Arena Elo, ImageBench pass rates, GenEval, speed, and price. Industry leaderboard with Ghost Palette models highlighted.",
};

export default function BenchmarksDocsPage() {
  return (
    <article className="gp-docs-page">
      <header className="gp-docs-page__hero">
        <p className="gp-kicker">Benchmarks</p>
        <h1>Image model benchmarks</h1>
        <p className="gp-docs-page__lede">
          A curated view of how leading text-to-image models perform across
          human preference, automated task benchmarks, speed, and cost. Scores
          are aggregated from published third-party leaderboards — Ghost Palette
          does not run these benchmarks itself.
        </p>
      </header>

      <aside className="gp-docs-disclaimer" role="note">
        <p>
          <strong>Data as of {DATA_AS_OF}.</strong> Rankings change as new models
          ship and community votes accumulate. Use this page for orientation;
          run your own comparisons in Composer for your specific use case.
        </p>
      </aside>

      <section className="gp-docs-section" aria-labelledby="glossary-title">
        <h2 id="glossary-title">Benchmark glossary</h2>
        <p className="gp-docs-section__lede">
          Six widely used evaluation frameworks — what each measures and when to
          trust it.
        </p>
        <BenchmarkGlossary />
      </section>

      <section className="gp-docs-section" aria-labelledby="leaderboard-title">
        <h2 id="leaderboard-title">Industry leaderboard</h2>
        <p className="gp-docs-section__lede">
          {INDUSTRY_MODELS.length} models compared across metrics where public data exists. Rows
          marked in Ghost Palette are available in the app today.
        </p>
        <BenchmarkLeaderboard />
      </section>

      <section className="gp-docs-cta">
        <h2>See how models handle your prompts</h2>
        <p>
          Public benchmarks use fixed prompt suites. Your work needs your own
          evaluation run.
        </p>
        <Link className="gp-button gp-button--primary" href="/composer">
          Open Composer
        </Link>
      </section>
    </article>
  );
}
