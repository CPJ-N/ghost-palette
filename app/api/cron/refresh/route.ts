import { NextResponse } from "next/server";

import { apiLogger, durationMs } from "@/lib/api-log";
import { refreshDueCredits } from "@/lib/credits";
import { cleanupRateLimits } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Monthly credit reset. Vercel Cron calls this on a schedule (see vercel.json)
// and attaches `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set in
// the project env. Resets every due profile to its monthly allotment, and
// piggybacks the rate-limit table cleanup — no need for a second schedule.
export async function GET(request: Request) {
  const started = Date.now();
  const log = apiLogger({ scope: "api.cron.refresh", request });
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    log.warn("cron.unauthorized", { hasSecret: Boolean(secret) });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const refreshed = await refreshDueCredits();
    const rateLimitRowsDeleted = await cleanupRateLimits().catch((err) => {
      log.error("cron.rate_limit_cleanup_failed", err);
      return null;
    });
    log.info("cron.refresh.done", {
      refreshed,
      rateLimitRowsDeleted,
      latencyMs: durationMs(started),
    });
    return NextResponse.json({ refreshed, rateLimitRowsDeleted });
  } catch (err) {
    log.error("cron.refresh.failed", err, { latencyMs: durationMs(started) });
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
