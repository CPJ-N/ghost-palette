import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  apiLogger,
  durationMs,
  logUnauthorized,
  logValidationError,
  truncate,
} from "@/lib/api-log";
import { ensureProfile } from "@/lib/credits";
import { listSavedRuns, persistRun, type PersistResultInput } from "@/lib/runs-db";
import type { RunMode } from "@/lib/types";

const RUN_MODES: readonly RunMode[] = ["composer", "arena", "eval"];

type IncomingResult = { modelId?: unknown; url?: unknown; seed?: unknown };
type IncomingBody = {
  prompt?: unknown;
  mode?: unknown;
  winnerId?: unknown;
  results?: unknown;
};

// POST /api/runs — persist a saved run + its images.
// Body: { prompt: string, mode: "composer"|"arena"|"eval", winnerId?: string,
//         results: Array<{ modelId: string, url?: string, seed?: number }> }
// Response: 200 { runId }.
export async function POST(request: Request) {
  const started = Date.now();
  const { userId } = await auth();
  const log = apiLogger({ scope: "api.runs.post", userId, request });

  if (!userId) {
    logUnauthorized(log);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: IncomingBody;
  try {
    body = await request.json();
  } catch {
    logValidationError(log, "invalid_json");
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const mode =
    typeof body.mode === "string" && RUN_MODES.includes(body.mode as RunMode)
      ? (body.mode as RunMode)
      : null;

  if (!prompt || !mode) {
    logValidationError(log, "missing_prompt_or_mode", {
      hasPrompt: Boolean(prompt),
      mode: typeof body.mode === "string" ? body.mode : null,
    });
    return NextResponse.json(
      { error: "A valid prompt and mode are required" },
      { status: 400 },
    );
  }

  const rawResults = Array.isArray(body.results)
    ? (body.results as IncomingResult[])
    : [];
  const results: PersistResultInput[] = rawResults
    .map((result) => ({
      modelId: typeof result.modelId === "string" ? result.modelId : "",
      url: typeof result.url === "string" ? result.url : null,
      seed: typeof result.seed === "number" ? result.seed : null,
    }))
    .filter((result) => result.modelId.length > 0);

  if (results.length === 0) {
    logValidationError(log, "no_results");
    return NextResponse.json(
      { error: "At least one result with a modelId is required" },
      { status: 400 },
    );
  }

  const winnerId =
    typeof body.winnerId === "string" && body.winnerId.length > 0
      ? body.winnerId
      : null;

  try {
    // Satisfy the runs.user_id -> profiles FK for first-time savers.
    await ensureProfile(userId);
    const { runId, storedImages } = await persistRun({
      userId,
      prompt,
      mode,
      winnerId,
      results,
    });
    log.info("runs.persisted", {
      runId,
      mode,
      results: results.length,
      storedImages,
      latencyMs: durationMs(started),
      promptPreview: truncate(prompt, 80),
    });
    return NextResponse.json({ runId });
  } catch (error) {
    log.error("runs.persist_failed", error, { latencyMs: durationMs(started) });
    return NextResponse.json({ error: "Failed to save run" }, { status: 500 });
  }
}

// GET /api/runs — list the current user's saved runs newest-first.
// Response: 200 { runs: SavedRun[] } (each stored image as a ~1-week signed URL).
export async function GET(request: Request) {
  const started = Date.now();
  const { userId } = await auth();
  const log = apiLogger({ scope: "api.runs.get", userId, request });

  if (!userId) {
    logUnauthorized(log);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const runs = await listSavedRuns(userId);
    log.info("runs.listed", { count: runs.length, latencyMs: durationMs(started) });
    return NextResponse.json({ runs });
  } catch (error) {
    log.error("runs.list_failed", error, { latencyMs: durationMs(started) });
    return NextResponse.json({ error: "Failed to load runs" }, { status: 500 });
  }
}
