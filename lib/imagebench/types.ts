export type ImageBenchChallenge = {
  id: string;
  promptVariant: string;
  category: string;
  subcategory: string;
  difficulty: string;
  evaluationCriteria: string;
  originalPrompt: string;
  visionQuestion: string;
  vlm: string;
};

export type ImageBenchCategory =
  | "Text Rendering"
  | "Spatial Reasoning"
  | "Human Realism"
  | "Professional Studio"
  | "Graphical design"
  | "Truthfulness";

export const IMAGEBENCH_SUITE_VERSION = "imagebench-v1";

export const IMAGEBENCH_ATTRIBUTION = {
  name: "ImageBench V1",
  url: "https://imagebench.ai/",
  repo: "https://github.com/dh7/image-bench-ai",
};
