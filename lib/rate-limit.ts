import "server-only";

import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabase/server";

const log = createLogger("rate-limit");

/**
 * Fixed-window rate limit backed by Postgres (the `check_rate_limit`
 * function in supabase/schema.sql) rather than a separate Redis/Upstash
 * service — the app already has a DB connection on every request.
 *
 * Fails open: if the check itself errors (network blip, migration not yet
 * applied), the request is allowed rather than blocked — a rate limiter
 * outage should degrade to "no rate limiting," not "nobody can generate."
 */
export async function checkRateLimit(
  userId: string,
  bucket: string,
  windowSeconds: number,
  maxRequests: number,
): Promise<boolean> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.rpc("check_rate_limit", {
    p_user_id: userId,
    p_bucket: bucket,
    p_window_seconds: windowSeconds,
    p_max_requests: maxRequests,
  });
  if (error) {
    log.warn("check_failed", { userId, bucket, message: error.message });
    return true;
  }
  return data === true;
}

/** Deletes rate-limit rows older than a day. Called from the daily cron. */
export async function cleanupRateLimits(): Promise<number> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.rpc("cleanup_rate_limits");
  if (error) {
    log.error("cleanup_failed", error);
    throw error;
  }
  return data ?? 0;
}
