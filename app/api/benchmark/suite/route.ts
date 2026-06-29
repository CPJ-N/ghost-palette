import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { apiLogger, durationMs, logUnauthorized, logValidationError } from "@/lib/api-log";
import {
  createSuiteRun,
  finalizeSuiteRun,
} from "@/lib/benchmark-store";
import { ensureProfile } from "@/lib/credits";
import { createId } from "@/lib/domain";
import { filterChallenges } from "@/lib/imagebench";

export async function POST(request: Request) {
  const started = Date.now();
  const { userId } = await auth();
  const log = apiLogger({ scope: "api.benchmark.suite", userId, request });

  if (!userId) {
    logUnauthorized(log);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    modelId?: string;
    category?: string;
    limit?: number;
  };
  try {
    body = await request.json();
  } catch {
    logValidationError(log, "invalid_json");
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { modelId, category, limit } = body;
  if (!modelId) {
    logValidationError(log, "missing_model_id");
    return NextResponse.json({ error: "modelId required" }, { status: 400 });
  }

  try {
    await ensureProfile(userId);
  } catch (error) {
    log.error("suite.profile_failed", error, { latencyMs: durationMs(started) });
    const message =
      error instanceof Error ? error.message : "Failed to prepare account";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const challenges = filterChallenges({
    category: category || undefined,
    limit: limit ?? undefined,
  });

  if (challenges.length === 0) {
    logValidationError(log, "no_challenges", { modelId, category, limit });
    return NextResponse.json({ error: "No challenges matched" }, { status: 400 });
  }

  const suiteRunId = createId("suite");
  const runLog = log.child({ suiteRunId, modelId, category: category ?? null, limit: limit ?? null });

  try {
    await createSuiteRun({
      id: suiteRunId,
      userId,
      modelId,
      totalChallenges: challenges.length,
      categoryFilter: category ?? null,
    });
  } catch (err) {
    runLog.error("suite.create_failed", err, { latencyMs: durationMs(started) });
    const message = err instanceof Error ? err.message : "Failed to create suite run";
    return NextResponse.json(
      {
        error: message,
        hint: "Run supabase/schema-benchmark.sql in your Supabase project.",
      },
      { status: 503 },
    );
  }

  runLog.info("suite.started", {
    totalChallenges: challenges.length,
    latencyMs: durationMs(started),
  });

  return NextResponse.json({
    suiteRunId,
    challengeIds: challenges.map((c) => c.id),
    total: challenges.length,
  });
}

export async function PATCH(request: Request) {
  const started = Date.now();
  const { userId } = await auth();
  const log = apiLogger({ scope: "api.benchmark.suite", userId, request });

  if (!userId) {
    logUnauthorized(log);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    suiteRunId?: string;
    passCount?: number;
    failCount?: number;
    status?: "complete" | "error";
  };
  try {
    body = await request.json();
  } catch {
    logValidationError(log, "invalid_json");
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.suiteRunId) {
    logValidationError(log, "missing_suite_run_id");
    return NextResponse.json({ error: "suiteRunId required" }, { status: 400 });
  }

  try {
    await ensureProfile(userId);
  } catch (error) {
    log.error("suite.profile_failed", error, { latencyMs: durationMs(started) });
    const message =
      error instanceof Error ? error.message : "Failed to prepare account";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const runLog = log.child({
    suiteRunId: body.suiteRunId,
    passCount: body.passCount ?? 0,
    failCount: body.failCount ?? 0,
    status: body.status ?? "complete",
  });

  try {
    await finalizeSuiteRun(
      body.suiteRunId,
      body.passCount ?? 0,
      body.failCount ?? 0,
      body.status ?? "complete",
    );
  } catch (err) {
    runLog.error("suite.finalize_failed", err, { latencyMs: durationMs(started) });
    const message = err instanceof Error ? err.message : "Failed to finalize";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  runLog.info("suite.finalized", { latencyMs: durationMs(started) });
  return NextResponse.json({ ok: true });
}
