import { ArrowUpRight } from "lucide-react";

import { getBenchmarkGlossary } from "@/lib/benchmarks";

export function BenchmarkGlossary() {
  const sources = getBenchmarkGlossary();

  return (
    <div className="gp-docs-glossary">
      {sources.map((source) => (
        <article key={source.id} className="gp-docs-glossary__card">
          <div className="gp-docs-glossary__head">
            <h3>{source.name}</h3>
            <span className="gp-docs-glossary__metric">{source.primaryMetric}</span>
          </div>
          <p>{source.description}</p>
          <p className="gp-docs-glossary__best">
            Best for: {source.bestFor}
          </p>
          <div className="gp-docs-glossary__links">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="gp-docs-link"
            >
              View benchmark
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            {source.methodologyUrl ? (
              <a
                href={source.methodologyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="gp-docs-link gp-docs-link--muted"
              >
                Methodology
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
