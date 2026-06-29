// The fal models Ghost Palette compares. `adapter` is the fal model endpoint id.

export type Provider = "fal";

export type ModelDefinition = {
  id: string;
  name: string;
  provider: Provider;
  description: string;
  adapter: string;
  creditCost: number;
  artClass: string;
  /** Internal models (dev-only or non-commercially-licensed) are usable only in
   *  local development — hidden from the picker and rejected by the generate API
   *  in production. Gated via the built-in NODE_ENV, so there is no flag to set. */
  internal?: boolean;
};

export const MODELS: ModelDefinition[] = [
  {
    id: "flux2-pro",
    name: "FLUX.2 [pro]",
    provider: "fal",
    description: "Black Forest Labs flagship — studio-grade detail and prompt fidelity.",
    adapter: "fal-ai/flux-2-pro",
    creditCost: 2,
    artClass: "art-flux2-pro",
  },
  // INTERNAL: FLUX.2 [dev] has a non-commercial license, so it's marked internal —
  // available in local development only, never surfaced to public/production users.
  {
    id: "flux2-dev",
    name: "FLUX.2 [dev]",
    provider: "fal",
    description: "Fast, open FLUX.2 — strong general composition for quick iteration.",
    adapter: "fal-ai/flux-2",
    creditCost: 1,
    artClass: "art-flux2-dev",
    internal: true,
  },
  {
    id: "sd35-large",
    name: "SD 3.5 Large",
    provider: "fal",
    description: "Stability's open baseline — a broad, illustrative style range.",
    adapter: "fal-ai/stable-diffusion-v35-large",
    creditCost: 4,
    artClass: "art-sd35",
  },
  {
    id: "recraft-v3",
    name: "Recraft V3",
    provider: "fal",
    description: "Design-oriented model — clean graphic and product looks.",
    adapter: "fal-ai/recraft-v3",
    creditCost: 2,
    artClass: "art-recraft",
  },
  {
    id: "seedream-4",
    name: "Seedream 4",
    provider: "fal",
    description: "ByteDance's latest — top-ranked photoreal detail and prompt adherence.",
    adapter: "fal-ai/bytedance/seedream/v4/text-to-image",
    creditCost: 3,
    artClass: "art-seedream",
  },
  {
    id: "qwen-image",
    name: "Qwen Image",
    provider: "fal",
    description: "Alibaba Qwen — standout complex text rendering and layout control.",
    adapter: "fal-ai/qwen-image",
    creditCost: 2,
    artClass: "art-qwen",
  },
  {
    id: "ideogram-v3",
    name: "Ideogram V3",
    provider: "fal",
    description: "Best-in-class typography — near-perfect spelling, logos, and posters.",
    adapter: "fal-ai/ideogram/v3",
    creditCost: 4,
    artClass: "art-ideogram",
  },
];

export const DEFAULT_SELECTION = ["flux2-pro", "flux2-dev"];

// Internal models (just-released or non-commercially-licensed) are available only
// outside production. Keyed off the built-in NODE_ENV — local `pnpm dev` runs as
// "development"; Vercel preview + production builds are "production" — so there is
// no environment variable to create or set.
const INTERNAL_MODELS_ALLOWED = process.env.NODE_ENV !== "production";

/** Models selectable in the current environment: every public model, plus internal
 *  models only in local development. */
export function availableModels(): ModelDefinition[] {
  return MODELS.filter((model) => !model.internal || INTERNAL_MODELS_ALLOWED);
}

/** Server gate: whether a model id may be generated in the current environment. */
export function isModelAvailable(modelId: string): boolean {
  const model = MODELS.find((m) => m.id === modelId);
  return model !== undefined && (!model.internal || INTERNAL_MODELS_ALLOWED);
}

export function getModel(modelId: string): ModelDefinition {
  return (
    MODELS.find((model) => model.id === modelId) ?? {
      id: modelId,
      name: "Unknown model",
      provider: "fal",
      description: "This model is no longer available.",
      adapter: "",
      creditCost: 0,
      artClass: "art-sd35",
    }
  );
}
