import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { LiveLeaderboardBoard } from "@/components/live-leaderboard-board";
import { MarketingNav } from "@/components/marketing-nav";
import { SiteFooter } from "@/components/site-footer";
import { getPublicLeaderboard, getRecentSuiteRuns } from "@/lib/benchmark-store";
import { IMAGEBENCH_ATTRIBUTION } from "@/lib/imagebench";
import { MODELS } from "@/lib/models";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Image Model Leaderboard — Ghost Palette",
  description:
    "GP-reproduced ImageBench V1 pass rates — latest VLM-graded result per challenge from suite runs on Ghost Palette.",
};

function modelLabel(modelId: string) {
  return MODELS.find((m) => m.id === modelId)?.name ?? modelId;
}

export default async function LeaderboardPage() {
  const [leaderboard, recentRuns] = await Promise.all([
    getPublicLeaderboard(),
    getRecentSuiteRuns(8),
  ]);

  return (
    <main className="gp-shell">
      <MarketingNav />

      <section className="gp-eval">
        <header className="gp-eval__head">
          <p className="gp-kicker">Live scores</p>
          <h1>Image model leaderboard</h1>
          <p>
            Pass rates from the{" "}
            <a
              href={IMAGEBENCH_ATTRIBUTION.url}
              target="_blank"
              rel="noopener noreferrer"
              className="gp-docs-inline-link"
            >
              {IMAGEBENCH_ATTRIBUTION.name}
            </a>{" "}
            suite — generated and VLM-graded on Ghost Palette. Reproduce any
            score in the{" "}
            <Link href="/benchmark" className="gp-docs-inline-link">
              suite runner
            </Link>
            .
          </p>
        </header>

        <LiveLeaderboardBoard rows={leaderboard} modelLabel={modelLabel} />

        {recentRuns.length > 0 ? (
          <section className="gp-eval__section" aria-labelledby="recent-runs">
            <h2 id="recent-runs">Recent suite runs</h2>
            <ul className="gp-eval__runs">
              {recentRuns.map((run) => {
                const total = run.passCount + run.failCount;
                const pct = total > 0 ? (run.passCount / total) * 100 : 0;
                return (
                  <li key={run.id}>
                    <strong>{modelLabel(run.modelId)}</strong>
                    <span>
                      {pct.toFixed(0)}% · {run.passCount}/{total} graded
                      {run.totalChallenges !== total
                        ? ` · ${run.totalChallenges} planned`
                        : ""}
                      {run.categoryFilter ? ` · ${run.categoryFilter}` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <aside className="gp-eval__note" role="note">
          <p>
            <strong>GP live scores, not industry rankings.</strong> These pass
            rates come from Ghost Palette runs using our fal adapters and VLM
            grading. For Arena Elo, published ImageBench numbers, GenEval, and
            price, see{" "}
            <Link href="/docs/benchmarks" className="gp-docs-inline-link">
              industry benchmarks
            </Link>
            .
          </p>
          <Link href="/docs/benchmarks" className="gp-docs-link">
            Industry benchmarks
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </aside>
      </section>

      <SiteFooter />
    </main>
  );
}
