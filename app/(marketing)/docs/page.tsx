import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs — Ghost Palette",
  description:
    "Documentation for Ghost Palette — live ImageBench scores, industry benchmarks, and evaluation methodology.",
};

const SECTIONS = [
  {
    title: "Live leaderboard",
    href: "/leaderboard",
    body: "GP-reproduced ImageBench V1 pass rates — latest grade per challenge from community suite runs.",
    external: false,
  },
  {
    title: "Run suite",
    href: "/benchmark",
    body: "Execute the fixed 192-prompt ImageBench suite, VLM-grade pass/fail, and contribute to the live board.",
    external: false,
  },
  {
    title: "Industry benchmarks",
    href: "/docs/benchmarks",
    body: "Curated external rankings — Arena Elo, published ImageBench, GenEval, speed, and price.",
    external: false,
  },
  {
    title: "ImageBench V1",
    href: "/docs/imagebench",
    body: "Published ImageBench methodology, 192-prompt suite structure, and official leaderboard.",
    external: false,
  },
  {
    title: "Methodology",
    href: "/docs/methodology",
    body: "Fair comparison rules for Arena and Refine workflows.",
    external: false,
  },
];

export default function DocsIndexPage() {
  return (
    <article className="gp-docs-page">
      <header className="gp-docs-page__hero">
        <p className="gp-kicker">Documentation</p>
        <h1>Image model evaluation</h1>
        <p className="gp-docs-page__lede">
          Ghost Palette measures models two ways: live ImageBench scores produced
          on our stack, and curated industry reference data from public
          leaderboards. These docs explain both — plus how to compare models on
          your own prompts in the app.
        </p>
      </header>

      <section className="gp-docs-hub" aria-label="Documentation sections">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href} className="gp-docs-hub__card">
            <h2>{section.title}</h2>
            <p>{section.body}</p>
            <span className="gp-docs-hub__cta">
              {section.href.startsWith("/docs") ? "Read more" : "Open"}
              <ArrowUpRight size={16} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </section>

      <section className="gp-docs-cta">
        <h2>Compare on your prompts</h2>
        <p>
          Benchmarks answer fixed suites. Arena answers your brief — same
          prompt across every model in one comparison grid.
        </p>
        <Link className="gp-button gp-button--primary" href="/arena">
          Open Arena
        </Link>
      </section>
    </article>
  );
}
