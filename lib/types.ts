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
  /** Transient fal CDN URL (expires). */
  url?: string;
  /** Durable copy in Blob (set on favorite / eval). */
  blobUrl?: string;
  width?: number;
  height?: number;
  error?: string;
};

export type RunMode = "composer" | "arena" | "eval";

export type HistoryRun = {
  id: string;
  prompt: string;
  createdAt: string;
  modelIds: string[];
  results: GenerationResult[];
};

/** A run persisted locally until Supabase storage ships. */
export type SavedRun = HistoryRun & {
  mode: RunMode;
  savedAt: string;
  winnerId?: string;
};
