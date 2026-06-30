import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  apiLogger,
  durationMs,
  logUnauthorized,
  logValidationError,
} from "@/lib/api-log";
import { setResultFavorite } from "@/lib/runs-db";

// PATCH /api/results/[resultId] — toggle favorite on one result.
// Body: { favorite: boolean }. Response: 200 {}.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ resultId: string }> },
) {
  const started = Date.now();
  const { userId } = await auth();
  const log = apiLogger({ scope: "api.results.patch", userId, request });

  if (!userId) {
    logUnauthorized(log);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { resultId } = await params;

  let body: { favorite?: unknown };
  try {
    body = await request.json();
  } catch {
    logValidationError(log, "invalid_json");
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.favorite !== "boolean") {
    logValidationError(log, "missing_favorite");
    return NextResponse.json({ error: "favorite (boolean) is required" }, { status: 400 });
  }

  try {
    await setResultFavorite(userId, resultId, body.favorite);
    log.info("results.favorite_set", {
      resultId,
      favorite: body.favorite,
      latencyMs: durationMs(started),
    });
    return NextResponse.json({});
  } catch (error) {
    log.error("results.favorite_set_failed", error, { resultId });
    return NextResponse.json({ error: "Failed to update favorite" }, { status: 500 });
  }
}
