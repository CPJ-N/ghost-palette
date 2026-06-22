// Regenerate data/imagebench/challenges.json from the upstream CSV.
//
//   node scripts/sync-imagebench-challenges.mjs
//   node scripts/sync-imagebench-challenges.mjs --from data/imagebench/challenges.csv
//
// Default source: GitHub raw CSV from dh7/image-bench-ai.

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DEFAULT_URL =
  "https://raw.githubusercontent.com/dh7/image-bench-ai/main/imagebench-v1/challenges.csv";
const OUT_JSON = join("data", "imagebench", "challenges.json");

function parseCsv(text) {
  const rows = [];
  let i = 0;
  let field = "";
  let row = [];
  let inQuotes = false;

  function pushField() {
    row.push(field);
    field = "";
  }

  function pushRow() {
    if (row.length === 1 && row[0] === "") {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  }

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      pushField();
      i += 1;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      pushField();
      pushRow();
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  pushField();
  if (row.length) pushRow();
  return rows;
}

function csvToChallenges(text) {
  const table = parseCsv(text.trim());
  const [header, ...body] = table;
  const idx = Object.fromEntries(header.map((h, n) => [h.trim(), n]));

  return body.map((cells, n) => ({
    id: `ib-${String(n + 1).padStart(3, "0")}`,
    promptVariant: cells[idx.prompt_variant]?.trim() ?? "",
    category: cells[idx.category]?.trim() ?? "",
    subcategory: cells[idx.subcategory]?.trim() ?? "",
    difficulty: cells[idx.difficulty]?.trim() ?? "",
    evaluationCriteria: cells[idx.evaluation_criteria]?.trim() ?? "",
    originalPrompt: cells[idx.original_prompt]?.trim() ?? "",
    visionQuestion: cells[idx.vision_question]?.trim() ?? "",
    vlm: cells[idx.vlm]?.trim() ?? "",
  }));
}

async function loadCsv(fromArg) {
  if (fromArg) {
    return readFile(fromArg, "utf8");
  }
  const res = await fetch(DEFAULT_URL);
  if (!res.ok) {
    throw new Error(`Fetch failed (${res.status}): ${DEFAULT_URL}`);
  }
  return res.text();
}

const fromIdx = process.argv.indexOf("--from");
const fromPath = fromIdx >= 0 ? process.argv[fromIdx + 1] : null;

const csv = await loadCsv(fromPath);
const challenges = csvToChallenges(csv);

if (challenges.length !== 192) {
  console.warn(`Expected 192 challenges, got ${challenges.length}`);
}

await writeFile(OUT_JSON, `${JSON.stringify(challenges)}\n`);
console.log(`Wrote ${challenges.length} challenges → ${OUT_JSON}`);
