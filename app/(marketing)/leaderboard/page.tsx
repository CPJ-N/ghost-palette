import Link from "next/link";

import { MarketingNav } from "@/components/marketing-nav";
import { SiteFooter } from "@/components/site-footer";
import { getPublicLeaderboard, getRecentSuiteRuns } from "@/lib/benchmark-store";
import { IMAGEBENCH_ATTRIBUTION } from "@/lib/imagebench";
import { MODELS } from "@/lib/models";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Benchmark Leaderboard — Ghost Palette",
  description:
    "Public ImageBench V1 pass rates by model — VLM-graded results from the Ghost Palette community.",
};

function modelLabel(modelId: string) {
  return MODELS.find((m) => m.id === modelId)?.name ?? modelId;
}

export default async function LeaderboardPage() {
  const [leaderboard, recentRuns] = await Promise.all([
    getPublicLeaderboard(),
    getRecentSuiteRuns(10),
  ]);

  const gpModelIds = new Set(MODELS.map((m) => m.id));

  return (
    <main className="gp-shell">
      <MarketingNav />

      <section className="gp-leaderboard">
        <header className="gp-leaderboard__head">
          <p className="gp-kicker">Public leaderboard</p>
          <h1>ImageBench V1 pass rates</h1>
          <p>
            Aggregated VLM pass/fail grades from suite runs on Ghost Palette.
            Prompts from{" "}
            <a
              href={IMAGEBENCH_ATTRIBUTION.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="gp-docs-inline-link"
            >
              {IMAGEBENCH_ATTRIBUTION.name}
            </a>
            .
          </p>
        </header>

        {leaderboard.length === 0 ? (
          <aside className="gp-docs-disclaimer" role="note">
            <p>
              No graded results yet.{" "}
              <Link href="/benchmark">Run the benchmark suite</Link> to populate
              the leaderboard. Ensure{" "}
              <code>supabase/schema-benchmark.sql</code> is applied.
            </p>
          </aside>
        ) : (
          <div className="gp-docs-table-wrap">
            <table className="gp-docs-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Model</th>
                  <th scope="col">Pass rate</th>
                  <th scope="col">Pass / Fail</th>
                  <th scope="col">Graded</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, index) => (
                  <tr
                    key={row.modelId}
                    className={gpModelIds.has(row.modelId) ? "gp-docs-row--gp" : undefined}
                  >
                    <td className="gp-docs-table__rank">{index + 1}</td>
                    <td className="gp-docs-table__model">{modelLabel(row.modelId)}</td>
                    <td className="gp-docs-table__mono">{row.passRate.toFixed(1)}%</td>
                    <td className="gp-docs-table__mono">
                      {row.passCount} / {row.failCount}
                    </td>
                    <td className="gp-docs-table__mono">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {recentRuns.length > 0 ? (
          <section className="gp-docs-section" aria-labelledby="recent-runs">
            <h2 id="recent-runs">Recent suite runs</h2>
            <ul className="gp-leaderboard-runs">
              {recentRuns.map((run) => (
                <li key={run.id}>
                  <strong>{modelLabel(run.modelId)}</strong>
                  <span>
                    {run.passCount}/{run.passCount + run.failCount} pass
                    {run.categoryFilter ? ` · ${run.categoryFilter}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>

      <SiteFooter />
    </main>
  );
}
