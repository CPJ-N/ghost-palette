import Link from "next/link";
import { Trophy } from "lucide-react";

import type { LiveLeaderboardRow } from "@/lib/benchmark-store";
import { MIN_LIVE_LEADERBOARD_GRADES } from "@/lib/benchmark-store";
import { MODELS } from "@/lib/models";

const RANK_BADGES = ["1", "2", "3"];

type LiveLeaderboardBoardProps = {
  rows: LiveLeaderboardRow[];
  modelLabel?: (modelId: string) => string;
};

function defaultModelLabel(modelId: string) {
  return MODELS.find((m) => m.id === modelId)?.name ?? modelId;
}

export function LiveLeaderboardBoard({
  rows,
  modelLabel = defaultModelLabel,
}: LiveLeaderboardBoardProps) {
  const gpModelIds = new Set(MODELS.map((m) => m.id));
  const totalGraded = rows.reduce((sum, row) => sum + row.total, 0);
  const topModel = rows[0];

  if (rows.length === 0) {
    return (
      <div className="gp-eval__empty">
        <Trophy size={30} aria-hidden="true" />
        <h2>No ranked models yet</h2>
        <p>
          Models appear after at least {MIN_LIVE_LEADERBOARD_GRADES} unique
          ImageBench challenges are graded. Run the suite to contribute scores.
        </p>
        <Link className="gp-button gp-button--primary" href="/benchmark">
          Run the suite
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="gp-eval__stats" role="list">
        <div className="gp-eval__stat" role="listitem">
          <span className="gp-eval__stat-value">{rows.length}</span>
          <span className="gp-eval__stat-label">Models ranked</span>
        </div>
        <div className="gp-eval__stat" role="listitem">
          <span className="gp-eval__stat-value">
            {totalGraded.toLocaleString("en-US")}
          </span>
          <span className="gp-eval__stat-label">Unique challenges graded</span>
        </div>
        <div className="gp-eval__stat" role="listitem">
          <span className="gp-eval__stat-value">
            {topModel.passRate.toFixed(1)}%
          </span>
          <span className="gp-eval__stat-label">
            Top — {modelLabel(topModel.modelId)}
          </span>
        </div>
      </div>

      <p className="gp-eval__method">
        Pass rate = latest VLM grade per challenge on Ghost Palette (not
        published ImageBench scores). Minimum {MIN_LIVE_LEADERBOARD_GRADES}{" "}
        unique challenges to rank.
      </p>

      <div className="gp-eval__board">
        {rows.map((row, index) => {
          const rank = index + 1;
          return (
            <article
              key={row.modelId}
              className={`gp-eval__row ${rank <= 3 ? "is-podium" : ""} ${
                gpModelIds.has(row.modelId) ? "is-gp" : ""
              }`}
            >
              <span className="gp-eval__rank" data-rank={rank}>
                {RANK_BADGES[index] ?? rank}
              </span>
              <div className="gp-eval__model">
                <strong>{modelLabel(row.modelId)}</strong>
                <span>
                  {row.passCount} pass · {row.failCount} fail · {row.total}{" "}
                  challenges
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
          );
        })}
      </div>
    </>
  );
}
