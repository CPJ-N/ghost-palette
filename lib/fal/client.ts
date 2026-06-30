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
  /** Media kind — undefined/"image" uses the image pipeline; "video" uses text-to-video. */
  kind?: "image" | "video";
};

type FalImage = { url: string; width?: number; height?: number };
type FalImageResponse = { images?: FalImage[]; seed?: number };

type FalVideo = { url: string; width?: number; height?: number };
type FalVideoResponse = { video?: FalVideo; seed?: number };

export async function runModel({
  adapter,
  prompt,
  seed,
  imageUrl,
  falKey,
  kind,
}: RunModelArgs) {
  const started = Date.now();
  const isVideo = kind === "video";
  const runLog = log.child({
    adapter,
    kind: kind ?? "image",
    seed: seed ?? null,
    hasReferenceImage: Boolean(imageUrl),
    usingByoKey: Boolean(falKey),
  });

  runLog.debug("fal.request", { promptPreview: truncate(prompt, 80) });

  const client = falKey ? createFalClient({ credentials: falKey }) : fal;

  // Video endpoints take only { prompt } (+ optional seed); image endpoints take
  // image_size/num_images (+ optional reference image).
  const input: Record<string, unknown> = isVideo
    ? { prompt }
    : { prompt, image_size: "square_hd", num_images: 1 };
  if (seed != null) input.seed = seed;
  if (!isVideo && imageUrl) input.image_url = imageUrl;

  try {
    const result = await client.subscribe(adapter, { input, logs: false });

    if (isVideo) {
      const data = result.data as FalVideoResponse;
      const video = data.video;
      if (!video?.url) {
        throw new Error(`fal returned no video for ${adapter}`);
      }

      runLog.debug("fal.success", {
        latencyMs: Date.now() - started,
        width: video.width ?? null,
        height: video.height ?? null,
      });

      return {
        url: video.url,
        width: video.width,
        height: video.height,
        seed: data.seed ?? seed ?? null,
      };
    }

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
