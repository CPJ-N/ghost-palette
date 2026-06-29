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
  // DEV/TESTING ONLY: FLUX.2 [dev] has a non-commercial license. Keep it while
  // building the app, but REMOVE before production / general launch.
  {
    id: "flux2-dev",
    name: "FLUX.2 [dev]",
    provider: "fal",
    description: "Fast, open FLUX.2 — strong general composition for quick iteration.",
    adapter: "fal-ai/flux-2",
    creditCost: 1,
    artClass: "art-flux2-dev",
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
    artClass: "art-flux2-pro",
  },
  {
    id: "qwen-image",
    name: "Qwen Image",
    provider: "fal",
    description: "Alibaba Qwen — standout complex text rendering and layout control.",
    adapter: "fal-ai/qwen-image",
    creditCost: 2,
    artClass: "art-flux1-dev",
  },
  {
    id: "ideogram-v3",
    name: "Ideogram V3",
    provider: "fal",
    description: "Best-in-class typography — near-perfect spelling, logos, and posters.",
    adapter: "fal-ai/ideogram/v3",
    creditCost: 4,
    artClass: "art-recraft",
  },
];

export const DEFAULT_SELECTION = ["flux2-pro", "flux2-dev"];

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
