// Snapshot ImageBench V1 published leaderboard from imagebench.ai.
//
//   node scripts/sync-imagebench-leaderboard.mjs
//
// Parses the SSR HTML table on /imagebench-v1 — no public JSON API exists.

import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const SOURCE_URL = "https://imagebench.ai/imagebench-v1";
const OUT_JSON = join("data", "imagebench", "leaderboard-v1.json");

function parseLeaderboard(html) {
  const rows = [];

  for (const part of html.split("<tr")) {
    const slugMatch = part.match(/\/imagebench-v1\/([a-z0-9\-\.]+)"/);
    if (!slugMatch || slugMatch[1].includes("page-")) continue;

    const slug = slugMatch[1];
    const nameMatch = part.match(/>([a-z]+\/[a-z0-9\-\./]+)</);
    const pctMatch =
      part.match(/>([0-9]+\.[0-9])<!-- -->%<\/span>/) ??
      part.match(/([0-9]+\.[0-9])%/);
    const pfMatch = part.match(
      /text-green-500">(\d+)<\/span><span[^>]*>\/<\/span><span class="text-red-400">(\d+)<\/span>/,
    );
    const latMatch = part.match(/text-muted-foreground">([0-9]+\.[0-9])s<\/td>/);
    const rankMatch = part.match(
      /tabular-nums">(\d+)<\/td><td class="py-4 pr-4"><a/,
    );

    if (!pctMatch) continue;

    rows.push({
      rank: rankMatch ? Number(rankMatch[1]) : rows.length + 1,
      slug,
      name: nameMatch?.[1] ?? slug,
      passRate: Number(pctMatch[1]),
      passCount: pfMatch ? Number(pfMatch[1]) : null,
      failCount: pfMatch ? Number(pfMatch[2]) : null,
      medianLatencySec: latMatch ? Number(latMatch[1]) : null,
    });
  }

  rows.sort((a, b) => a.rank - b.rank);
  return rows;
}

const res = await fetch(SOURCE_URL);
if (!res.ok) {
  throw new Error(`Fetch failed (${res.status}): ${SOURCE_URL}`);
}

const html = await res.text();
const models = parseLeaderboard(html);

if (models.length < 20) {
  throw new Error(`Expected ~22 models, parsed ${models.length}`);
}

const payload = {
  source: SOURCE_URL,
  suiteVersion: "imagebench-v1",
  syncedAt: new Date().toISOString().slice(0, 10),
  modelCount: models.length,
  challengeCount: 192,
  models,
};

await writeFile(OUT_JSON, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${models.length} models → ${OUT_JSON}`);
