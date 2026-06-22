"use client";

import { useMemo, useState } from "react";

import {
  DATA_AS_OF,
  getLeaderboardRows,
  getSourceById,
  type SortKey,
} from "@/lib/benchmarks";

const SORT_OPTIONS: { key: SortKey; label: string; asc?: boolean }[] = [
  { key: "arenaElo", label: "Arena Elo" },
  { key: "imageBenchPassRate", label: "ImageBench pass %" },
  { key: "genevalOverall", label: "GenEval" },
  { key: "medianGenTimeSec", label: "Gen time", asc: true },
  { key: "pricePer1kImagesUsd", label: "Price / 1k", asc: true },
  { key: "name", label: "Name", asc: true },
];

function formatCell(
  value: number | undefined,
  format: "elo" | "percent" | "geneval" | "seconds" | "price",
): string {
  if (value === undefined) return "—";
  switch (format) {
    case "elo":
      return Math.round(value).toLocaleString("en-US");
    case "percent":
      return `${value.toFixed(1)}%`;
    case "geneval":
      return `${(value * 100).toFixed(0)}%`;
    case "seconds":
      return `${value.toFixed(1)}s`;
    case "price":
      return value === 0 ? "Free" : `$${value.toLocaleString("en-US")}`;
  }
}

export function BenchmarkLeaderboard() {
  const [gpOnly, setGpOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("arenaElo");

  const sortOption = SORT_OPTIONS.find((o) => o.key === sortBy) ?? SORT_OPTIONS[0];

  const rows = useMemo(
    () =>
      getLeaderboardRows({
        gpOnly,
        sortBy,
        sortAsc: sortOption.asc ?? false,
      }),
    [gpOnly, sortBy, sortOption.asc],
  );

  return (
    <div className="gp-docs-leaderboard">
      <div className="gp-docs-leaderboard__toolbar">
        <label className="gp-docs-toggle">
          <input
            type="checkbox"
            checked={gpOnly}
            onChange={(e) => setGpOnly(e.target.checked)}
          />
          <span>Ghost Palette models only</span>
        </label>
        <label className="gp-docs-sort">
          <span>Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="gp-docs-table-wrap">
        <table className="gp-docs-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Model</th>
              <th scope="col">Provider</th>
              <th scope="col">Arena Elo</th>
              <th scope="col">ImageBench</th>
              <th scope="col">GenEval</th>
              <th scope="col">Gen time</th>
              <th scope="col">$/1k imgs</th>
              <th scope="col">Open</th>
              <th scope="col">In GP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={row.inGhostPalette ? "gp-docs-row--gp" : undefined}
              >
                <td className="gp-docs-table__rank">{row.rank}</td>
                <td className="gp-docs-table__model">{row.name}</td>
                <td>{row.provider}</td>
                <td className="gp-docs-table__mono">
                  {formatCell(row.arenaElo?.value, "elo")}
                </td>
                <td className="gp-docs-table__mono">
                  {formatCell(row.imageBenchPassRate?.value, "percent")}
                </td>
                <td className="gp-docs-table__mono">
                  {formatCell(row.genevalOverall?.value, "geneval")}
                </td>
                <td className="gp-docs-table__mono">
                  {formatCell(row.medianGenTimeSec?.value, "seconds")}
                </td>
                <td className="gp-docs-table__mono">
                  {formatCell(row.pricePer1kImagesUsd?.value, "price")}
                </td>
                <td>{row.openWeights ? "Yes" : "No"}</td>
                <td>{row.inGhostPalette ? "Yes" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="gp-docs-table__note">
        Data curated from public leaderboards as of {DATA_AS_OF}. Arena Elo from{" "}
        {getSourceById("artificial-analysis")?.name}, pass rates from{" "}
        {getSourceById("imagebench")?.name}, GenEval from published papers.
        Ghost Palette does not run these benchmarks.
      </p>
    </div>
  );
}
