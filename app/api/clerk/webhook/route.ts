import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { type NextRequest, NextResponse } from "next/server";

import { apiLogger, durationMs } from "@/lib/api-log";
import { deleteProfile, upsertClerkProfile } from "@/lib/credits";
import { getPostHogClient } from "@/lib/posthog-server";

export const runtime = "nodejs";

type ClerkUser = {
  id: string;
  email_addresses?: Array<{
    id: string;
    email_address: string;
    verification?: { status?: string } | null;
  }>;
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  image_url?: string | null;
};

// Public endpoint (excluded from Clerk protection in proxy.ts). Verifies the Svix
// signature with CLERK_WEBHOOK_SIGNING_SECRET, then syncs the profile in Supabase.
export async function POST(request: NextRequest) {
  const started = Date.now();
  const log = apiLogger({ scope: "api.clerk.webhook", request });

  let event: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    event = await verifyWebhook(request);
  } catch (err) {
    log.warn("clerk_webhook.invalid_signature", {
      ...(err instanceof Error ? { errorMessage: err.message } : {}),
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const eventLog = log.child({ eventType: event.type });
  eventLog.info("clerk_webhook.received");

  try {
    switch (event.type) {
      case "user.created":
      case "user.updated": {
        const data = event.data as unknown as ClerkUser;
        const emails = data.email_addresses ?? [];
        const primary =
          emails.find((e) => e.id === data.primary_email_address_id) ?? emails[0];
        await upsertClerkProfile(
          data.id,
          {
            email: primary?.email_address ?? null,
            emailVerified: primary?.verification?.status === "verified",
            firstName: data.first_name ?? null,
            lastName: data.last_name ?? null,
            username: data.username ?? null,
            imageUrl: data.image_url ?? null,
          },
          { grantStarter: event.type === "user.created" },
        );
        eventLog.info("clerk_webhook.user_synced", { userId: data.id });
        getPostHogClient().identify({
          distinctId: data.id,
          properties: {
            email: primary?.email_address ?? null,
            firstName: data.first_name ?? null,
            lastName: data.last_name ?? null,
          },
        });
        break;
      }

      case "user.deleted": {
        const data = event.data as { id?: string };
        if (data.id) {
          await deleteProfile(data.id);
          eventLog.info("clerk_webhook.user_deleted", { userId: data.id });
        } else {
          eventLog.warn("clerk_webhook.user_deleted.missing_id");
        }
        break;
      }

      default:
        eventLog.debug("clerk_webhook.unhandled", { eventType: event.type });
        break;
    }
  } catch (err) {
    eventLog.error("clerk_webhook.handler_failed", err, {
      latencyMs: durationMs(started),
    });
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  eventLog.info("clerk_webhook.processed", { latencyMs: durationMs(started) });
  return NextResponse.json({ received: true });
}
