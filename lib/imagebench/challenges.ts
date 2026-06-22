import challenges from "@/data/imagebench/challenges.json";

import type { ImageBenchCategory, ImageBenchChallenge } from "./types";

export const CHALLENGES = challenges as ImageBenchChallenge[];

export function getChallenge(id: string): ImageBenchChallenge | undefined {
  return CHALLENGES.find((c) => c.id === id);
}

export function getCategories(): string[] {
  return [...new Set(CHALLENGES.map((c) => c.category))].sort();
}

export function getChallengesByCategory(category: string): ImageBenchChallenge[] {
  return CHALLENGES.filter((c) => c.category === category);
}

export function filterChallenges(options: {
  category?: string;
  difficulty?: string;
  limit?: number;
}): ImageBenchChallenge[] {
  let list = CHALLENGES;
  if (options.category) {
    list = list.filter((c) => c.category === options.category);
  }
  if (options.difficulty) {
    list = list.filter((c) => c.difficulty === options.difficulty);
  }
  if (options.limit != null) {
    list = list.slice(0, options.limit);
  }
  return list;
}

export const CATEGORY_INFO: Record<
  ImageBenchCategory,
  { tests: number; description: string }
> = {
  "Text Rendering": {
    tests: 5,
    description: "Spelling, multi-line layout, typography style",
  },
  "Spatial Reasoning": {
    tests: 19,
    description: "Counting, relative position, scale, compositionality",
  },
  "Human Realism": {
    tests: 14,
    description: "Faces, expressions, hands, full-body coherence",
  },
  "Professional Studio": {
    tests: 9,
    description: "Camera and lighting control, color precision",
  },
  "Graphical design": {
    tests: 8,
    description: "Layout, style diversity, data visualization",
  },
  Truthfulness: {
    tests: 9,
    description: "Physics, reflections, world knowledge constraints",
  },
};
