import type { BenchmarkSource } from "./types";

export const BENCHMARK_SOURCES: BenchmarkSource[] = [
  {
    id: "artificial-analysis",
    name: "Artificial Analysis Image Arena",
    description:
      "Blind pairwise human votes aggregated with Bradley-Terry maximum likelihood estimation. The most widely cited overall quality signal for text-to-image models.",
    url: "https://artificialanalysis.ai/image/leaderboard/text-to-image",
    methodologyUrl: "https://artificialanalysis.ai/image/methodology",
    primaryMetric: "Arena Elo",
    bestFor: "Overall human preference and cross-model ranking",
  },
  {
    id: "imagebench",
    name: "ImageBench.ai",
    description:
      "64 tests × 3 prompt variants (192 images), graded pass/fail by category-routed VLM judges. Fixed challenge CSV, deterministic routing, and every output published — the benchmark you can reproduce and inspect.",
    url: "https://imagebench.ai/",
    methodologyUrl: "https://github.com/dh7/image-bench-ai",
    primaryMetric: "Pass rate",
    bestFor:
      "Task-specific diagnostics — text rendering, spatial reasoning, human realism, studio control, design layout, truthfulness",
  },
  {
    id: "geneval",
    name: "GenEval",
    description:
      "Object-detection-based compositional accuracy on structured prompts. Measures whether generated images contain the right objects, counts, colors, and positions.",
    url: "https://arxiv.org/abs/2310.11505",
    primaryMetric: "Overall accuracy",
    bestFor: "Prompt adherence, object counts, and spatial layout",
  },
  {
    id: "arena-ai",
    name: "Arena.ai",
    description:
      "Community-driven blind comparisons for text-to-image and image editing. Bradley-Terry ratings reflect real-world taste rather than narrow automated scores.",
    url: "https://arena.ai/",
    methodologyUrl: "https://arena.ai/blog/chatbot-arena-update/",
    primaryMetric: "Arena Elo",
    bestFor: "Community preference across generation and editing tasks",
  },
  {
    id: "t2i-compbench",
    name: "T2I-CompBench++",
    description:
      "Fine-grained compositional evaluation across attribute binding, spatial relations, numeracy, and complex prompts using specialized automated metrics.",
    url: "https://arxiv.org/html/2307.06350",
    primaryMetric: "Category scores",
    bestFor: "Compositional prompt stress-testing",
  },
  {
    id: "imagenhub",
    name: "ImagenHub / GenAI-Arena",
    description:
      "Standardized inference pipelines and human evaluation guidelines across seven conditional image generation tasks. Research-grade reproducibility.",
    url: "https://github.com/TIGER-AI-Lab/ImagenHub",
    methodologyUrl:
      "https://imagenhub.readthedocs.io/en/latest/Guidelines/humaneval.html",
    primaryMetric: "Human consistency scores",
    bestFor: "Research reproducibility and multi-task evaluation",
  },
];
