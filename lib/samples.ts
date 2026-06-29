// Static sample images (generated once via scripts/generate-samples.mjs) used as
// landing proof and as in-app example/empty states.
import sampleManifest from "../public/samples/manifest.json";

export const SHOWCASE_PROMPT =
  "A weathered brass compass resting on a linen map beside a fountain pen, soft directional window light.";
export const EXAMPLE_PROMPT =
  "A single ripe persimmon on a raw concrete plinth, raking studio light, shallow depth of field.";

const SAMPLES = sampleManifest as Record<string, string>;

export function sampleSrc(set: "showcase" | "example", modelId: string) {
  return SAMPLES[`${set}-${modelId}`];
}
