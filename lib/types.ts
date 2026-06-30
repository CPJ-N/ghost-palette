// Shared domain types for generations, runs, and comparisons.

export type GenerationStatus = "queued" | "generating" | "complete" | "error";

export type GenerationResult = {
  id: string;
  runId: string;
  modelId: string;
  prompt: string;
  createdAt: string;
  status: GenerationStatus;
  favorite: boolean;
  seed: number;
  /** Transient fal CDN URL (expires); re-signed Storage URL once persisted. */
  url?: string;
  /** False when the generation succeeded but the durable save failed. */
  persisted?: boolean;
  width?: number;
  height?: number;
  error?: string;
};

export type RunMode = "composer" | "arena" | "eval";

export const RUN_MODES: readonly RunMode[] = ["composer", "arena", "eval"];

export type HistoryRun = {
  id: string;
  prompt: string;
  createdAt: string;
  modelIds: string[];
  results: GenerationResult[];
};

export type SavedRun = HistoryRun & {
  mode: RunMode;
  savedAt: string;
  winnerId?: string;
};
