// Generate the landing-page sample images via fal.ai.
//
//   node --env-file=.env.local scripts/generate-samples.mjs
//
// Reads FAL_KEY from .env.local. Saves images to public/samples/ and writes
// public/samples/manifest.json. Idempotent: existing files are skipped, so
// re-runs do NOT re-charge. Failed (4xx) calls are not billed by fal.

import { mkdir, writeFile, access, readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  console.error("Missing FAL_KEY. Run: node --env-file=.env.local scripts/generate-samples.mjs");
  process.exit(1);
}

const OUT_DIR = "public/samples";
const MANIFEST = join(OUT_DIR, "manifest.json");

// Five genuinely different fal models → the comparison.
const MODELS = [
  { slug: "flux2-pro", endpoint: "fal-ai/flux-2-pro" },
  { slug: "flux2-dev", endpoint: "fal-ai/flux-2" },
  { slug: "flux1-dev", endpoint: "fal-ai/flux/dev" },
  { slug: "sd35-large", endpoint: "fal-ai/stable-diffusion-v35-large" },
  { slug: "recraft-v3", endpoint: "fal-ai/recraft-v3" },
];

const PROMPTS = {
  showcase:
    "A weathered brass compass resting on a linen map beside a fountain pen, soft directional window light, fine detail, photographic still life",
  example:
    "A single ripe persimmon on a raw concrete plinth, raking studio light, shallow depth of field, photographic still life",
};

// showcase: all 5 models · example: first 4 models (hero reuses showcase).
const JOBS = [
  ...MODELS.map((m) => ({ set: "showcase", model: m })),
  ...MODELS.slice(0, 4).map((m) => ({ set: "example", model: m })),
];

const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

async function generate(endpoint, prompt) {
  const res = await fetch(`https://fal.run/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, image_size: "square_hd", num_images: 1 }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 280)}`);
  }
  const data = await res.json();
  const url = data.images?.[0]?.url;
  if (!url) throw new Error(`no image url: ${JSON.stringify(data).slice(0, 200)}`);
  const ext = (extname(new URL(url).pathname) || ".jpg").toLowerCase();
  const img = await fetch(url);
  const buf = Buffer.from(await img.arrayBuffer());
  return { buf, ext };
}

await mkdir(OUT_DIR, { recursive: true });
const manifest = (await exists(MANIFEST))
  ? JSON.parse(await readFile(MANIFEST, "utf8"))
  : {};

let generated = 0;
let skipped = 0;
let failed = 0;

for (const { set, model } of JOBS) {
  const key = `${set}-${model.slug}`;
  if (manifest[key] && (await exists(join("public", manifest[key].replace(/^\//, "").replace(/^public\//, ""))))) {
    console.log(`skip   ${key}`);
    skipped++;
    continue;
  }
  process.stdout.write(`gen    ${key.padEnd(20)} (${model.endpoint}) … `);
  try {
    const { buf, ext } = await generate(model.endpoint, PROMPTS[set]);
    const file = join(OUT_DIR, `${key}${ext}`);
    await writeFile(file, buf);
    manifest[key] = `/samples/${key}${ext}`;
    console.log(`saved ${(buf.length / 1024).toFixed(0)} KB → ${manifest[key]}`);
    generated++;
  } catch (err) {
    console.log(`FAIL: ${err.message}`);
    failed++;
  }
}

await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `\nDone. generated=${generated} skipped=${skipped} failed=${failed}. Manifest: ${MANIFEST}`,
);
if (failed) process.exitCode = 1;
