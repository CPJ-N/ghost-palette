export type BenchmarkSourceId =
  | "artificial-analysis"
  | "imagebench"
  | "geneval"
  | "arena-ai"
  | "t2i-compbench"
  | "imagenhub";

export type BenchmarkSource = {
  id: BenchmarkSourceId;
  name: string;
  description: string;
  url: string;
  methodologyUrl?: string;
  primaryMetric: string;
  bestFor: string;
};

export type SourcedValue = {
  value: number;
  sourceId: BenchmarkSourceId;
  asOf: string;
};

export type IndustryModel = {
  id: string;
  name: string;
  provider: string;
  openWeights: boolean;
  inGhostPalette: boolean;
  ghostPaletteId?: string;
  arenaElo?: SourcedValue;
  imageBenchPassRate?: SourcedValue;
  genevalOverall?: SourcedValue;
  medianGenTimeSec?: SourcedValue;
  pricePer1kImagesUsd?: SourcedValue;
};

export type LeaderboardRow = IndustryModel & {
  rank: number;
};

export type SortKey =
  | "arenaElo"
  | "imageBenchPassRate"
  | "genevalOverall"
  | "medianGenTimeSec"
  | "pricePer1kImagesUsd"
  | "name";
