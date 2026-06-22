import type { ImageBenchCategory } from "./types";

/** Copied from the public ImageBench V1 README and methodology page. */
export const IMAGEBENCH_DESIGN_GOALS = [
  "Broad capability coverage across six categories and multiple difficulty tiers.",
  "Three prompt variants per test to reduce lucky or unlucky single-sample variance.",
  "VLM-graded PASS/FAIL decisions using concrete, test-specific evaluation criteria.",
  "Reproducibility through fixed prompt definitions and deterministic routing policy.",
] as const;

export const IMAGEBENCH_PIPELINE = [
  "Generate 192 images for the target model from the fixed V1 prompt suite.",
  "Ask vision judges a concrete binary question per image and parse a PASS/FAIL verdict.",
  "Apply category-level preferred/fallback routing to produce one blended verdict per image.",
  "Aggregate overall, category, subcategory, and difficulty pass rates for publication.",
] as const;

export const IMAGEBENCH_VLM_ROUTING: {
  category: ImageBenchCategory;
  preferredVlm: string;
}[] = [
  { category: "Text Rendering", preferredVlm: "qwen3-vl" },
  { category: "Spatial Reasoning", preferredVlm: "qwen35-122b" },
  { category: "Human realism", preferredVlm: "qwen3-vl" },
  { category: "Professional Studio", preferredVlm: "gemma4-26b" },
  { category: "Graphical design", preferredVlm: "qwen3-vl" },
  { category: "Truthfulness", preferredVlm: "qwen36-27b" },
];

export const IMAGEBENCH_SCORING_FORMULA =
  "score = PASS count / total evaluated images";
