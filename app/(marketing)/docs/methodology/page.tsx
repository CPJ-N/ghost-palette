import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { getBenchmarkGlossary } from "@/lib/benchmarks";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evaluation Methodology — Ghost Palette Docs",
  description:
    "How Ghost Palette runs fair image model comparisons — Composer, Arena, and Refine workflows aligned with industry benchmark practices.",
};

const FAIR_RUN_RULES = [
  {
    title: "Same prompt",
    body: "Every model in a run receives identical prompt text — no per-model prompt engineering.",
  },
  {
    title: "Fixed seed (optional)",
    body: "Use a shared seed when models support it to isolate model differences from randomness.",
  },
  {
    title: "Consistent resolution",
    body: "Generate at the same aspect ratio and resolution where the API allows, matching industry normalization (typically 1024×1024).",
  },
  {
    title: "Model defaults",
    body: "Use each provider's documented defaults for steps, guidance, and safety — no hidden tuning per model.",
  },
];

const WORKFLOWS = [
  {
    title: "Composer",
    metric: "Bulk comparison",
    body: "Run one prompt across every selected model in parallel. Best for surveying outputs and spotting style differences quickly.",
  },
  {
    title: "Arena",
    metric: "Human preference",
    body: "Head-to-head judging on the same prompt. Mirrors Arena.ai and Artificial Analysis — the signal users actually trust for quality.",
  },
  {
    title: "Refine",
    metric: "Task-specific fit",
    body: "Provide a reference direction and compare how each model interprets the same refinement instruction.",
  },
  {
    title: "Library",
    metric: "Reproducibility",
    body: "Save runs with prompt, model, and outputs so decisions are documented and repeatable.",
  },
];

export default function MethodologyDocsPage() {
  const externalSources = getBenchmarkGlossary().filter((s) =>
    ["artificial-analysis", "imagebench", "imagenhub"].includes(s.id),
  );

  return (
    <article className="gp-docs-page">
      <header className="gp-docs-page__hero">
        <p className="gp-kicker">Methodology</p>
        <h1>How Ghost Palette evaluates models</h1>
        <p className="gp-docs-page__lede">
          Fair comparison rules and workflow design aligned with how industry
          benchmarks normalize runs — so your personal evals are as rigorous as
          public leaderboards.
        </p>
      </header>

      <section className="gp-docs-section" aria-labelledby="fair-run-title">
        <h2 id="fair-run-title">Fair-run rules</h2>
        <p className="gp-docs-section__lede">
          Ghost Palette follows the same normalization principles used by{" "}
          <a
            href="https://artificialanalysis.ai/image/methodology"
            target="_blank"
            rel="noopener noreferrer"
            className="gp-docs-inline-link"
          >
            Artificial Analysis
          </a>{" "}
          and research benchmarks like ImagenHub.
        </p>
        <ul className="gp-docs-list">
          {FAIR_RUN_RULES.map((rule) => (
            <li key={rule.title}>
              <strong>{rule.title}</strong>
              <span>{rule.body}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="gp-docs-section" aria-labelledby="workflows-title">
        <h2 id="workflows-title">Workflow mapping</h2>
        <p className="gp-docs-section__lede">
          Each Ghost Palette workflow targets a different evaluation dimension.
        </p>
        <div className="gp-docs-workflows">
          {WORKFLOWS.map((wf) => (
            <article key={wf.title} className="gp-docs-workflows__card">
              <div className="gp-docs-workflows__head">
                <h3>{wf.title}</h3>
                <span>{wf.metric}</span>
              </div>
              <p>{wf.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="gp-docs-section" aria-labelledby="external-title">
        <h2 id="external-title">External benchmark methodology</h2>
        <p className="gp-docs-section__lede">
          For public leaderboard scores, refer to each source&apos;s published
          methodology.
        </p>
        <ul className="gp-docs-extlinks">
          {externalSources.map((source) => (
            <li key={source.id}>
              <a
                href={source.methodologyUrl ?? source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="gp-docs-link"
              >
                {source.name}
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="gp-docs-cta">
        <h2>Put methodology into practice</h2>
        <p>Start with a fair comparison run across all five Ghost Palette models.</p>
        <div className="gp-docs-cta__actions">
          <Link className="gp-button gp-button--primary" href="/composer">
            Open Composer
          </Link>
          <Link className="gp-button gp-button--ghost" href="/docs/benchmarks">
            View benchmarks
          </Link>
        </div>
      </section>
    </article>
  );
}
