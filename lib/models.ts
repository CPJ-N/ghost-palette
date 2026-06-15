// The fal models Ghost Palette compares. `adapter` is the fal model endpoint id.

export type Provider = "fal";

export type ModelDefinition = {
  id: string;
  name: string;
  provider: Provider;
  description: string;
  adapter: string;
  artClass: string;
};

export const MODELS: ModelDefinition[] = [
  {
    id: "flux2-pro",
    name: "FLUX.2 [pro]",
    provider: "fal",
    description: "Black Forest Labs flagship — studio-grade detail and prompt fidelity.",
    adapter: "fal-ai/flux-2-pro",
    artClass: "art-flux2-pro",
  },
  {
    id: "flux2-dev",
    name: "FLUX.2 [dev]",
    provider: "fal",
    description: "Fast, open FLUX.2 — strong general composition for quick iteration.",
    adapter: "fal-ai/flux-2",
    artClass: "art-flux2-dev",
  },
  {
    id: "flux1-dev",
    name: "FLUX.1 [dev]",
    provider: "fal",
    description: "Previous-gen FLUX — a softer, more painterly interpretation.",
    adapter: "fal-ai/flux/dev",
    artClass: "art-flux1-dev",
  },
  {
    id: "sd35-large",
    name: "SD 3.5 Large",
    provider: "fal",
    description: "Stability's open baseline — a broad, illustrative style range.",
    adapter: "fal-ai/stable-diffusion-v35-large",
    artClass: "art-sd35",
  },
  {
    id: "recraft-v3",
    name: "Recraft V3",
    provider: "fal",
    description: "Design-oriented model — clean graphic and product looks.",
    adapter: "fal-ai/recraft-v3",
    artClass: "art-recraft",
  },
];

export const DEFAULT_SELECTION = ["flux2-pro", "flux2-dev", "flux1-dev"];

export function getModel(modelId: string): ModelDefinition {
  return MODELS.find((model) => model.id === modelId) ?? MODELS[0];
}
