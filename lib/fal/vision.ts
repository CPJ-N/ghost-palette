import "server-only";

import { fal } from "@fal-ai/client";

import "@/lib/fal/client";
import { createLogger } from "@/lib/logger";

const log = createLogger("fal.vision");

/** Map ImageBench VLM routing labels to OpenRouter vision models on fal. */
const VLM_MODEL_MAP: Record<string, string> = {
  "qwen3-vl": "google/gemini-2.5-flash",
  "qwen35-122b": "google/gemini-2.5-flash",
  "gemma4-26b": "google/gemini-2.5-flash",
  "qwen36-27b": "google/gemini-2.5-flash",
};

const DEFAULT_VISION_MODEL = "google/gemini-2.5-flash";

const GRADE_SYSTEM =
  "You are an image evaluation judge. Answer with exactly one word: PASS or FAIL. No explanation.";

type VisionResponse = { output?: string };

export function parsePassFail(raw: string): boolean | null {
  const upper = raw.trim().toUpperCase();
  if (upper.includes("PASS") && !upper.includes("FAIL")) return true;
  if (upper.includes("FAIL")) return false;
  return null;
}

export async function gradeImageWithVlm(args: {
  imageUrl: string;
  visionQuestion: string;
  vlm?: string;
}): Promise<{ passed: boolean | null; raw: string }> {
  const started = Date.now();
  const model = VLM_MODEL_MAP[args.vlm ?? ""] ?? DEFAULT_VISION_MODEL;
  const runLog = log.child({ model, vlmRoute: args.vlm ?? null });

  runLog.debug("vlm.request");

  try {
    const result = await fal.subscribe("openrouter/router/vision", {
      input: {
        image_urls: [args.imageUrl],
        prompt: args.visionQuestion,
        system_prompt: GRADE_SYSTEM,
        model,
        temperature: 0,
        reasoning: false,
      },
      logs: false,
    });

    const data = result.data as VisionResponse;
    const raw = (data.output ?? "").trim();
    const passed = parsePassFail(raw);

    runLog.debug("vlm.success", {
      passed,
      latencyMs: Date.now() - started,
      outputLength: raw.length,
    });

    if (passed === null) {
      runLog.warn("vlm.ambiguous_output", { outputPreview: raw.slice(0, 40) });
    }

    return { passed, raw };
  } catch (error) {
    runLog.error("vlm.failed", error, { latencyMs: Date.now() - started });
    throw error;
  }
}
