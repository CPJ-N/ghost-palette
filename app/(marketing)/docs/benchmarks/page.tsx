import Link from "next/link";

import { IndustryBenchmarkTable } from "@/components/industry-benchmark-table";
import { BenchmarkGlossary } from "@/components/benchmark-glossary";
import { DATA_AS_OF, INDUSTRY_MODELS } from "@/lib/benchmarks";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Industry Image Model Benchmarks — Ghost Palette Docs",
  description:
    "Curated external rankings: Arena Elo, published ImageBench pass rates, GenEval, speed, and price from public sources.",
};

export default function BenchmarksDocsPage() {
  return (
    <article className="gp-docs-page">
      <header className="gp-docs-page__hero">
        <p className="gp-kicker">Industry reference</p>
        <h1>External image model benchmarks</h1>
        <p className="gp-docs-page__lede">
          Curated cross-metric rankings from published third-party leaderboards
          — human preference, automated suites, speed, and cost. Use this to
          orient; use Ghost Palette&apos;s live scores to verify on our stack.
        </p>
      </header>

      <aside className="gp-docs-disclaimer" role="note">
        <p>
          <strong>External data only — not Ghost Palette scores.</strong> As of{" "}
          {DATA_AS_OF}. For pass rates reproduced and graded on GP, see the{" "}
          <Link href="/leaderboard" className="gp-docs-inline-link">
            live leaderboard
          </Link>
          ; to run the suite yourself, open the{" "}
          <Link href="/benchmark" className="gp-docs-inline-link">
            suite runner
          </Link>
          .
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
        <h2 id="leaderboard-title">Industry comparison table</h2>
        <p className="gp-docs-section__lede">
          {INDUSTRY_MODELS.length} models across metrics where public data
          exists. Rows marked in Ghost Palette are available in the app today.
        </p>
        <IndustryBenchmarkTable />
      </section>

      <section className="gp-docs-cta">
        <h2>Reproduce ImageBench on Ghost Palette</h2>
        <p>
          Industry tables use published scores. See the full ImageBench V1
          reference — methodology, routing, and official leaderboard — on the{" "}
          <Link href="/docs/imagebench" className="gp-docs-inline-link">
            ImageBench docs
          </Link>
          , or run the same suite here to compare on our stack.
        </p>
        <div className="gp-docs-cta__actions">
          <Link className="gp-button gp-button--primary" href="/docs/imagebench">
            ImageBench reference
          </Link>
          <Link className="gp-button gp-button--ghost" href="/leaderboard">
            Live leaderboard
          </Link>
          <Link className="gp-button gp-button--ghost" href="/benchmark">
            Run suite
          </Link>
        </div>
      </section>
    </article>
  );
}
