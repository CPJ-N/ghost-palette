import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { apiLogger, durationMs, logUnauthorized } from "@/lib/api-log";
import { listSavedRuns } from "@/lib/runs-db";

// GET /api/runs — list the current user's saved runs newest-first.
// Response: 200 { runs: SavedRun[] } (each stored image as a ~1-week signed URL).
// Saving happens automatically in POST /api/generate — there is no POST here.
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
