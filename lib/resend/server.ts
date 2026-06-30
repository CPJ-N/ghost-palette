import "server-only";

import { Resend } from "resend";

let cached: Resend | null = null;

/**
 * Server-only Resend client (API key). Until a sending domain is verified in
 * the Resend dashboard, mail must be sent from `onboarding@resend.dev`.
 */
export function resend(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set in .env.local");
  }
  cached = new Resend(key);
  return cached;
}
