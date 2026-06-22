import { INDUSTRY_MODELS } from "./models";
import { BENCHMARK_SOURCES } from "./sources";
import type { IndustryModel, IndustryLeaderboardRow, SortKey } from "./types";

export { BENCHMARK_SOURCES } from "./sources";
export { INDUSTRY_MODELS } from "./models";
export type {
  BenchmarkSource,
  BenchmarkSourceId,
  IndustryModel,
  IndustryLeaderboardRow,
  /** @deprecated Use IndustryLeaderboardRow */
  LeaderboardRow,
  SortKey,
  SourcedValue,
} from "./types";

export function getBenchmarkGlossary() {
  return BENCHMARK_SOURCES;
}

export function getGpModelIds(): string[] {
  return INDUSTRY_MODELS.filter((m) => m.inGhostPalette).map(
    (m) => m.ghostPaletteId ?? m.id,
  );
}

function sortValue(model: IndustryModel, key: SortKey): number | string {
  switch (key) {
    case "name":
      return model.name;
    case "arenaElo":
      return model.arenaElo?.value ?? -1;
    case "imageBenchPassRate":
      return model.imageBenchPassRate?.value ?? -1;
    case "genevalOverall":
      return model.genevalOverall?.value ?? -1;
    case "medianGenTimeSec":
      return model.medianGenTimeSec?.value ?? Infinity;
    case "pricePer1kImagesUsd":
      return model.pricePer1kImagesUsd?.value ?? Infinity;
  }
}

export function getLeaderboardRows(
  options: {
    gpOnly?: boolean;
    sortBy?: SortKey;
    sortAsc?: boolean;
  } = {},
): IndustryLeaderboardRow[] {
  const { gpOnly = false, sortBy = "arenaElo", sortAsc = false } = options;

  const models = (
    gpOnly
      ? INDUSTRY_MODELS.filter((m) => m.inGhostPalette)
      : [...INDUSTRY_MODELS]
  );

  models.sort((a, b) => {
    const av = sortValue(a, sortBy);
    const bv = sortValue(b, sortBy);
    if (typeof av === "string" && typeof bv === "string") {
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    const an = av as number;
    const bn = bv as number;
    return sortAsc ? an - bn : bn - an;
  });

  return models.map((model, index) => ({
    ...model,
    rank: index + 1,
  }));
}

export function getSourceById(id: string) {
  return BENCHMARK_SOURCES.find((s) => s.id === id);
}

export const DATA_AS_OF = "2026-06";
