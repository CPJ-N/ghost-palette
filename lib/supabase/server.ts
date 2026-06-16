import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";

import type { Database } from "./types";

// `@supabase/supabase-js` eagerly constructs a Realtime client that needs a
// global `WebSocket` constructor — Node < 22 has none, so createClient() throws.
// We never use Realtime, but the constructor validates it, so polyfill it.
const globalWithWs = globalThis as unknown as { WebSocket?: unknown };
if (typeof globalWithWs.WebSocket === "undefined") {
  globalWithWs.WebSocket = WebSocket;
}

let cached: SupabaseClient<Database> | null = null;

/**
 * Privileged, server-only Supabase client (service-role key — bypasses RLS).
 *
 * Auth is handled by Clerk, not Supabase: every caller MUST derive `userId`
 * from `auth()` and scope its queries by `user_id`. There are no RLS policies
 * yet, so this client trusts the caller completely — never import it into a
 * Client Component or expose it to the browser.
 */
export function supabaseAdmin(): SupabaseClient<Database> {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }

  cached = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
