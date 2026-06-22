import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs — Ghost Palette",
  description:
    "Documentation for Ghost Palette — image model evaluation, benchmarks, and comparison methodology.",
};

const SECTIONS = [
  {
    title: "Benchmarks",
    href: "/docs/benchmarks",
    body: "Industry leaderboards, benchmark glossary, and cross-metric model comparison from public sources.",
  },
  {
    title: "Methodology",
    href: "/docs/methodology",
    body: "How Ghost Palette runs fair comparisons across Composer, Arena, and Refine.",
  },
];

export default function DocsIndexPage() {
  return (
    <article className="gp-docs-page">
      <header className="gp-docs-page__hero">
        <p className="gp-kicker">Documentation</p>
        <h1>Evaluate image models with confidence</h1>
        <p className="gp-docs-page__lede">
          Ghost Palette is a personal evaluation workspace — compare models side
          by side, judge winners in Arena, and refine against a reference. These
          docs explain how we measure models and how industry benchmarks work.
        </p>
      </header>

      <section className="gp-docs-hub" aria-label="Documentation sections">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href} className="gp-docs-hub__card">
            <h2>{section.title}</h2>
            <p>{section.body}</p>
            <span className="gp-docs-hub__cta">
              Read more
              <ArrowUpRight size={16} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </section>

      <section className="gp-docs-cta">
        <h2>Run your own comparison</h2>
        <p>
          Benchmarks tell you what the industry thinks. Composer shows you what
          matters for your prompt.
        </p>
        <Link className="gp-button gp-button--primary" href="/composer">
          Open Composer
        </Link>
      </section>
    </article>
  );
}
