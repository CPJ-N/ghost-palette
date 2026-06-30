import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  apiLogger,
  durationMs,
  logUnauthorized,
  logValidationError,
} from "@/lib/api-log";
import { deleteRun, setRunWinner } from "@/lib/runs-db";

// PATCH /api/runs/[runId] — record the winner picked for a comparison run.
// Body: { winnerId: string }. Response: 200 {}.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const started = Date.now();
  const { userId } = await auth();
  const log = apiLogger({ scope: "api.runs.patch", userId, request });

  if (!userId) {
    logUnauthorized(log);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runId } = await params;

  let body: { winnerId?: unknown };
  try {
    body = await request.json();
  } catch {
    logValidationError(log, "invalid_json");
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const winnerId = typeof body.winnerId === "string" ? body.winnerId : "";
  if (!winnerId) {
    logValidationError(log, "missing_winner_id");
    return NextResponse.json({ error: "winnerId is required" }, { status: 400 });
  }

  try {
    await setRunWinner(userId, runId, winnerId);
    log.info("runs.winner_set", { runId, winnerId, latencyMs: durationMs(started) });
    return NextResponse.json({});
  } catch (error) {
    log.error("runs.winner_set_failed", error, { runId, winnerId });
    return NextResponse.json({ error: "Failed to set winner" }, { status: 500 });
  }
}

// DELETE /api/runs/[runId] — delete a run and its results/stored images.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const started = Date.now();
  const { userId } = await auth();
  const log = apiLogger({ scope: "api.runs.delete", userId, request });

  if (!userId) {
    logUnauthorized(log);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runId } = await params;

  try {
    await deleteRun(userId, runId);
    log.info("runs.deleted", { runId, latencyMs: durationMs(started) });
    return NextResponse.json({});
  } catch (error) {
    log.error("runs.delete_failed", error, { runId });
    return NextResponse.json({ error: "Failed to delete run" }, { status: 500 });
  }
}
