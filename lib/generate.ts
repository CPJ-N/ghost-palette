// Client helper: generate one image via the secure /api/generate route.

import type { RunMode } from "@/lib/types";

export type GeneratedImage = {
  url: string;
  width?: number;
  height?: number;
  seed?: number;
  creditsCharged?: number;
  creditsBalance?: number;
  persisted?: boolean;
};

export async function generateOne(
  modelId: string,
  prompt: string,
  options?: {
    seed?: number;
    imageUrl?: string;
    runId?: string;
    resultId?: string;
    mode?: RunMode;
  },
): Promise<GeneratedImage> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      modelId,
      prompt,
      seed: options?.seed,
      imageUrl: options?.imageUrl,
      runId: options?.runId,
      resultId: options?.resultId,
      mode: options?.mode,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed (${response.status})`);
  }
  return data as GeneratedImage;
}
