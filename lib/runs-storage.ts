import type { GenerationResult, RunMode, SavedRun } from "@/lib/types";

const STORAGE_KEY = "gp-saved-runs";
const CHANGE_EVENT = "gp-saved-runs-change";
const MAX_RUNS = 40;

function readRaw(): SavedRun[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as SavedRun[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(runs: SavedRun[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(runs.slice(0, MAX_RUNS)));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeSavedRuns(onStoreChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function loadSavedRuns(): SavedRun[] {
  return readRaw().sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );
}

export function saveRun(input: {
  mode: RunMode;
  prompt: string;
  results: GenerationResult[];
  winnerId?: string;
}): SavedRun {
  const complete = input.results.filter((result) => result.status === "complete");
  const runId = complete[0]?.runId ?? `run-${Date.now()}`;
  const saved: SavedRun = {
    id: runId,
    mode: input.mode,
    prompt: input.prompt.trim(),
    createdAt: complete[0]?.createdAt ?? new Date().toISOString(),
    savedAt: new Date().toISOString(),
    modelIds: [...new Set(input.results.map((result) => result.modelId))],
    results: input.results.map((result) => ({ ...result })),
    winnerId: input.winnerId,
  };

  const existing = readRaw().filter((run) => run.id !== saved.id);
  writeRaw([saved, ...existing]);
  return saved;
}

export function deleteSavedRun(id: string) {
  writeRaw(readRaw().filter((run) => run.id !== id));
}

export function hasSavedRun(id: string) {
  return readRaw().some((run) => run.id === id);
}
