import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

let cached: SupabaseClient<Database> | null = null;

/**
 * Public (anon-key) Supabase client for Client Components — safe to expose.
 *
 * Use only for non-privileged reads (e.g. public Storage URLs). All writes and
 * user-scoped reads go through Clerk-gated server routes that use
 * `supabaseAdmin()`. Since auth is Clerk (not Supabase Auth), this client is
 * unauthenticated and subject to whatever RLS the `images` bucket / tables allow.
 */
export function supabaseBrowser(): SupabaseClient<Database> {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  cached = createClient<Database>(url, anonKey);
  return cached;
}
