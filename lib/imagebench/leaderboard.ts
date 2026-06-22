import leaderboard from "@/data/imagebench/leaderboard-v1.json";

import { IMAGEBENCH_ATTRIBUTION } from "./types";

export type ImageBenchLeaderboardModel = {
  rank: number;
  slug: string;
  name: string;
  passRate: number;
  passCount: number | null;
  failCount: number | null;
  medianLatencySec: number | null;
};

export type ImageBenchLeaderboardSnapshot = {
  source: string;
  suiteVersion: string;
  syncedAt: string;
  modelCount: number;
  challengeCount: number;
  models: ImageBenchLeaderboardModel[];
};

export const IMAGEBENCH_LEADERBOARD =
  leaderboard as ImageBenchLeaderboardSnapshot;

export function getImageBenchLeaderboard(): ImageBenchLeaderboardModel[] {
  return IMAGEBENCH_LEADERBOARD.models;
}

export function getImageBenchLeaderboardMeta() {
  return {
    source: IMAGEBENCH_LEADERBOARD.source,
    syncedAt: IMAGEBENCH_LEADERBOARD.syncedAt,
    modelCount: IMAGEBENCH_LEADERBOARD.modelCount,
    challengeCount: IMAGEBENCH_LEADERBOARD.challengeCount,
    attribution: IMAGEBENCH_ATTRIBUTION,
  };
}
