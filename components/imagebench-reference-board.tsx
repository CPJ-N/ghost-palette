import { ArrowUpRight } from "lucide-react";

import {
  getImageBenchLeaderboard,
  getImageBenchLeaderboardMeta,
  IMAGEBENCH_ATTRIBUTION,
} from "@/lib/imagebench";

const RANK_BADGES = ["1", "2", "3"];

/** Published ImageBench V1 pass rates copied from imagebench.ai. */
export function ImageBenchReferenceBoard() {
  const rows = getImageBenchLeaderboard();
  const meta = getImageBenchLeaderboardMeta();
  const top = rows[0];

  return (
    <>
      <div className="gp-eval__stats" role="list">
        <div className="gp-eval__stat" role="listitem">
          <span className="gp-eval__stat-value">{meta.modelCount}</span>
          <span className="gp-eval__stat-label">Models evaluated</span>
        </div>
        <div className="gp-eval__stat" role="listitem">
          <span className="gp-eval__stat-value">{meta.challengeCount}</span>
          <span className="gp-eval__stat-label">Fixed prompts</span>
        </div>
        <div className="gp-eval__stat" role="listitem">
          <span className="gp-eval__stat-value">
            {top ? `${top.passRate.toFixed(1)}%` : "—"}
          </span>
          <span className="gp-eval__stat-label">
            Top — {top?.name ?? "—"}
          </span>
        </div>
      </div>

      <p className="gp-eval__method">
        Published pass rates from{" "}
        <a
          href={IMAGEBENCH_ATTRIBUTION.url}
          target="_blank"
          rel="noopener noreferrer"
          className="gp-docs-inline-link"
        >
          ImageBench.ai
        </a>{" "}
        as of {meta.syncedAt}. Every output is inspectable on their site — click
        a model to browse all 192 images.
      </p>

      <div className="gp-eval__board">
        {rows.map((row) => (
          <article
            key={row.slug}
            className={`gp-eval__row ${row.rank <= 3 ? "is-podium" : ""}`}
          >
            <span className="gp-eval__rank" data-rank={row.rank}>
              {RANK_BADGES[row.rank - 1] ?? row.rank}
            </span>
            <div className="gp-eval__model">
              <a
                href={`${IMAGEBENCH_ATTRIBUTION.url}imagebench-v1/${row.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="gp-docs-inline-link"
              >
                {row.name}
                <ArrowUpRight size={12} aria-hidden="true" />
              </a>
              <span>
                {row.passCount ?? "—"} pass · {row.failCount ?? "—"} fail
                {row.medianLatencySec != null
                  ? ` · ${row.medianLatencySec.toFixed(1)}s median`
                  : ""}
              </span>
            </div>
            <div className="gp-eval__meter" aria-hidden="true">
              <span
                className="gp-eval__meter-fill"
                style={{ width: `${row.passRate}%` }}
              />
            </div>
            <span className="gp-eval__pct">{row.passRate.toFixed(1)}%</span>
          </article>
        ))}
      </div>
    </>
  );
}
