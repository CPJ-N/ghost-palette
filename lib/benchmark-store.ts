import "server-only";

import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabase/server";

const log = createLogger("benchmark-store");

function isMissingBenchmarkTable(error: { code?: string; message?: string }) {
  if (error.code === "42P01") return true;
  const msg = error.message?.toLowerCase() ?? "";
  return (
    msg.includes("benchmark_suite_runs") ||
    msg.includes("benchmark_challenge_results") ||
    msg.includes("schema cache")
  );
}

function isBenignReadError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: string; message?: string };
  if (isMissingBenchmarkTable(record)) return true;
  const msg = (record.message ?? String(error)).toLowerCase();
  return (
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound")
  );
}

export const MIN_LIVE_LEADERBOARD_GRADES = 3;

export type LiveLeaderboardRow = {
  modelId: string;
  passCount: number;
  failCount: number;
  total: number;
  passRate: number;
};

/** @deprecated Use LiveLeaderboardRow */
export type LeaderboardRow = LiveLeaderboardRow;

export type BenchmarkSuiteRun = {
  id: string;
  userId: string;
  modelId: string;
  status: string;
  passCount: number;
  failCount: number;
  totalChallenges: number;
  categoryFilter: string | null;
  createdAt: string;
  completedAt: string | null;
};

export async function createSuiteRun(args: {
  id: string;
  userId: string;
  modelId: string;
  totalChallenges: number;
  categoryFilter?: string | null;
  suiteVersion?: string;
}) {
  const sb = supabaseAdmin();
  const { error } = await sb.from("benchmark_suite_runs").insert({
    id: args.id,
    user_id: args.userId,
    model_id: args.modelId,
    suite_version: args.suiteVersion ?? "imagebench-v1",
    total_challenges: args.totalChallenges,
    category_filter: args.categoryFilter ?? null,
    status: "running",
  });
  if (error) {
    log.error("suite_run.create_failed", error, {
      suiteRunId: args.id,
      userId: args.userId,
      modelId: args.modelId,
    });
    throw new Error(error.message);
  }
  log.debug("suite_run.created", {
    suiteRunId: args.id,
    userId: args.userId,
    modelId: args.modelId,
    totalChallenges: args.totalChallenges,
  });
}

export async function recordChallengeResult(args: {
  id: string;
  suiteRunId: string;
  userId: string;
  challengeId: string;
  modelId: string;
  category: string;
  imageUrl?: string;
  passed: boolean | null;
  vlmOutput?: string;
  latencyMs?: number;
}) {
  const sb = supabaseAdmin();
  const { error } = await sb.from("benchmark_challenge_results").insert({
    id: args.id,
    suite_run_id: args.suiteRunId,
    user_id: args.userId,
    challenge_id: args.challengeId,
    model_id: args.modelId,
    category: args.category,
    image_url: args.imageUrl ?? null,
    passed: args.passed,
    vlm_output: args.vlmOutput ?? null,
    latency_ms: args.latencyMs ?? null,
  });
  if (error) {
    log.error("challenge_result.insert_failed", error, {
      resultId: args.id,
      suiteRunId: args.suiteRunId,
      challengeId: args.challengeId,
    });
    throw new Error(error.message);
  }
  log.debug("challenge_result.recorded", {
    resultId: args.id,
    suiteRunId: args.suiteRunId,
    challengeId: args.challengeId,
    passed: args.passed,
  });
}

export async function finalizeSuiteRun(
  suiteRunId: string,
  passCount: number,
  failCount: number,
  status: "complete" | "error" = "complete",
) {
  const sb = supabaseAdmin();
  const { error } = await sb.from("benchmark_suite_runs").update({
    pass_count: passCount,
    fail_count: failCount,
    status,
    completed_at: new Date().toISOString(),
  }).eq("id", suiteRunId);
  if (error) {
    log.error("suite_run.finalize_failed", error, { suiteRunId, passCount, failCount, status });
    throw new Error(error.message);
  }
  log.info("suite_run.finalized", { suiteRunId, passCount, failCount, status });
}

export async function getPublicLeaderboard(): Promise<LiveLeaderboardRow[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("benchmark_challenge_results")
    .select("model_id, challenge_id, passed, created_at")
    .not("passed", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    if (isBenignReadError(error)) {
      log.warn("leaderboard.read_unavailable", {
        code: error.code,
        message: error.message,
      });
      return [];
    }
    log.error("leaderboard.query_failed", error);
    throw new Error(error.message);
  }

  // Latest grade per model + challenge (re-runs replace earlier scores).
  const latestByChallenge = new Map<
    string,
    { modelId: string; passed: boolean }
  >();

  for (const row of data ?? []) {
    const key = `${row.model_id}:${row.challenge_id}`;
    if (latestByChallenge.has(key)) continue;
    latestByChallenge.set(key, {
      modelId: row.model_id,
      passed: row.passed as boolean,
    });
  }

  const byModel = new Map<string, { pass: number; fail: number }>();
  for (const entry of latestByChallenge.values()) {
    const cur = byModel.get(entry.modelId) ?? { pass: 0, fail: 0 };
    if (entry.passed) cur.pass += 1;
    else cur.fail += 1;
    byModel.set(entry.modelId, cur);
  }

  return [...byModel.entries()]
    .map(([modelId, counts]) => {
      const total = counts.pass + counts.fail;
      return {
        modelId,
        passCount: counts.pass,
        failCount: counts.fail,
        total,
        passRate: total > 0 ? (counts.pass / total) * 100 : 0,
      };
    })
    .filter((r) => r.total >= MIN_LIVE_LEADERBOARD_GRADES)
    .sort((a, b) => b.passRate - a.passRate || b.total - a.total);
}

export async function getRecentSuiteRuns(limit = 20): Promise<BenchmarkSuiteRun[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("benchmark_suite_runs")
    .select("*")
    .eq("status", "complete")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isBenignReadError(error)) {
      log.warn("suite_runs.read_unavailable", {
        code: error.code,
        message: error.message,
      });
      return [];
    }
    log.error("suite_runs.query_failed", error);
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    modelId: row.model_id,
    status: row.status,
    passCount: row.pass_count,
    failCount: row.fail_count,
    totalChallenges: row.total_challenges,
    categoryFilter: row.category_filter,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }));
}
