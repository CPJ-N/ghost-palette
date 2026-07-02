import Link from "next/link";

import { ImageBenchReferenceBoard } from "@/components/imagebench-reference-board";
import {
  CATEGORY_INFO,
  IMAGEBENCH_ATTRIBUTION,
  IMAGEBENCH_DESIGN_GOALS,
  IMAGEBENCH_PIPELINE,
  IMAGEBENCH_SCORING_FORMULA,
  IMAGEBENCH_VLM_ROUTING,
} from "@/lib/imagebench";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ImageBench V1 Reference — Ghost Palette Docs",
  description:
    "ImageBench V1 methodology, 192-prompt suite structure, VLM routing, and published leaderboard copied from imagebench.ai.",
  alternates: { canonical: "/docs/imagebench" },
  openGraph: {
    url: "/docs/imagebench",
    title: "ImageBench V1 Reference — Ghost Palette Docs",
    description:
      "ImageBench V1 methodology, 192-prompt suite structure, VLM routing, and published leaderboard copied from imagebench.ai.",
  },
};

export default function ImageBenchDocsPage() {
  return (
    <article className="gp-docs-page">
      <header className="gp-docs-page__hero">
        <p className="gp-kicker">ImageBench V1</p>
        <h1>Published benchmark reference</h1>
        <p className="gp-docs-page__lede">
          Ghost Palette reproduces the fixed ImageBench V1 suite for live scoring.
          This page mirrors the public methodology and leaderboard from{" "}
          <a
            href={IMAGEBENCH_ATTRIBUTION.url}
            target="_blank"
            rel="noopener noreferrer"
            className="gp-docs-inline-link"
          >
            imagebench.ai
          </a>{" "}
          — 22 models, 192 prompts, six capability categories, every output
          published.
        </p>
      </header>

      <aside className="gp-docs-disclaimer" role="note">
        <p>
          <strong>External reference data.</strong> Challenge prompts come from the{" "}
          <a
            href={IMAGEBENCH_ATTRIBUTION.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="gp-docs-inline-link"
          >
            public CSV
          </a>
          . Pass rates below are ImageBench&apos;s published scores — not GP live
          runs. To grade on our stack, use the{" "}
          <Link href="/leaderboard" className="gp-docs-inline-link">
            live leaderboard
          </Link>{" "}
          and{" "}
          <Link href="/benchmark" className="gp-docs-inline-link">
            suite runner
          </Link>
          .
        </p>
      </aside>

      <section className="gp-docs-section" aria-labelledby="ib-structure">
        <h2 id="ib-structure">Benchmark structure</h2>
        <p className="gp-docs-section__lede">
          64 tests × 3 prompt variants = 192 images per model. Categories match
          the upstream CSV exactly.
        </p>
        <ul className="gp-docs-list">
          {(Object.keys(CATEGORY_INFO) as (keyof typeof CATEGORY_INFO)[]).map(
            (name) => (
              <li key={name}>
                <strong>{name}</strong>
                <span>
                  {CATEGORY_INFO[name].tests} tests —{" "}
                  {CATEGORY_INFO[name].description}
                </span>
              </li>
            ),
          )}
        </ul>
      </section>

      <section className="gp-docs-section" aria-labelledby="ib-goals">
        <h2 id="ib-goals">Design goals</h2>
        <ul className="gp-docs-list">
          {IMAGEBENCH_DESIGN_GOALS.map((goal) => (
            <li key={goal}>
              <span>{goal}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="gp-docs-section" aria-labelledby="ib-pipeline">
        <h2 id="ib-pipeline">Evaluation pipeline</h2>
        <ol className="gp-docs-list">
          {IMAGEBENCH_PIPELINE.map((step) => (
            <li key={step}>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="gp-docs-section" aria-labelledby="ib-routing">
        <h2 id="ib-routing">Multi-VLM routing</h2>
        <p className="gp-docs-section__lede">
          ImageBench assigns a preferred vision judge per category. Ghost Palette
          maps these routes to Gemini 2.5 Flash via fal OpenRouter for grading.
        </p>
        <div className="gp-docs-table-wrap">
          <table className="gp-docs-table">
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Preferred VLM</th>
              </tr>
            </thead>
            <tbody>
              {IMAGEBENCH_VLM_ROUTING.map((row) => (
                <tr key={row.category}>
                  <td>{row.category}</td>
                  <td>
                    <code>{row.preferredVlm}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="gp-docs-section" aria-labelledby="ib-scoring">
        <h2 id="ib-scoring">Scoring</h2>
        <p className="gp-docs-section__lede">
          Headline pass rate: <code>{IMAGEBENCH_SCORING_FORMULA}</code>. The same
          computation is reported per category, subcategory, and difficulty tier.
        </p>
      </section>

      <section className="gp-docs-section" aria-labelledby="ib-leaderboard">
        <h2 id="ib-leaderboard">Published V1 leaderboard</h2>
        <p className="gp-docs-section__lede">
          Copied from{" "}
          <a
            href={`${IMAGEBENCH_ATTRIBUTION.url}imagebench-v1`}
            target="_blank"
            rel="noopener noreferrer"
            className="gp-docs-inline-link"
          >
            imagebench.ai/imagebench-v1
          </a>
          . Re-sync with{" "}
          <code>node scripts/sync-imagebench-leaderboard.mjs</code>.
        </p>
        <ImageBenchReferenceBoard />
      </section>

      <section className="gp-docs-cta">
        <h2>Reproduce on Ghost Palette</h2>
        <p>
          Run the same 192-prompt suite through our generation adapters and VLM
          judge to compare against these published scores.
        </p>
        <div className="gp-docs-cta__actions">
          <Link className="gp-button gp-button--primary" href="/benchmark">
            Run suite
          </Link>
          <Link className="gp-button gp-button--ghost" href="/leaderboard">
            Live leaderboard
          </Link>
        </div>
      </section>
    </article>
  );
}
