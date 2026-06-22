import "server-only";

import { createFalClient, fal } from "@fal-ai/client";

import { createLogger, truncate } from "@/lib/logger";

const log = createLogger("fal.generate");

// Default app credentials (server-only). Per-request BYO keys use a scoped client.
fal.config({ credentials: process.env.FAL_KEY });

type RunModelArgs = {
  /** fal model endpoint id, e.g. "fal-ai/flux-2-pro". */
  adapter: string;
  prompt: string;
  seed?: number;
  /** Optional reference image (image-to-image / eval). */
  imageUrl?: string;
  /** Bring-your-own fal key — used request-scoped, never mutates the global client. */
  falKey?: string;
};

type FalImage = { url: string; width?: number; height?: number };
type FalImageResponse = { images?: FalImage[]; seed?: number };

export async function runModel({
  adapter,
  prompt,
  seed,
  imageUrl,
  falKey,
}: RunModelArgs) {
  const started = Date.now();
  const runLog = log.child({
    adapter,
    seed: seed ?? null,
    hasReferenceImage: Boolean(imageUrl),
    usingByoKey: Boolean(falKey),
  });

  runLog.debug("fal.request", { promptPreview: truncate(prompt, 80) });

  const client = falKey ? createFalClient({ credentials: falKey }) : fal;

  const input: Record<string, unknown> = {
    prompt,
    image_size: "square_hd",
    num_images: 1,
  };
  if (seed != null) input.seed = seed;
  if (imageUrl) input.image_url = imageUrl;

  try {
    const result = await client.subscribe(adapter, { input, logs: false });
    const data = result.data as FalImageResponse;
    const image = data.images?.[0];
    if (!image?.url) {
      throw new Error(`fal returned no image for ${adapter}`);
    }

    runLog.debug("fal.success", {
      latencyMs: Date.now() - started,
      width: image.width ?? null,
      height: image.height ?? null,
    });

    return {
      url: image.url,
      width: image.width,
      height: image.height,
      seed: data.seed ?? seed ?? null,
    };
  } catch (error) {
    runLog.error("fal.failed", error, { latencyMs: Date.now() - started });
    throw error;
  }
}
