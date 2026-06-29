import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { apiLogger, logUnauthorized } from "@/lib/api-log";
import { ensureProfile, getCreditSummary } from "@/lib/credits";
import {
  CREDIT_PRICE_CENTS,
  CREDITS_PER_USD,
  FREE_MONTHLY_CREDITS,
} from "@/lib/stripe/catalog";

export async function GET(request: Request) {
  const { userId } = await auth();
  const log = apiLogger({ scope: "api.credits", userId, request });

  if (!userId) {
    logUnauthorized(log);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? undefined;

  try {
    await ensureProfile(userId, email);
    const summary = await getCreditSummary(userId);
    return NextResponse.json({
      ...summary,
      creditPriceCents: CREDIT_PRICE_CENTS,
      creditsPerUsd: CREDITS_PER_USD,
      starterCredits: FREE_MONTHLY_CREDITS,
    });
  } catch (error) {
    log.error("credits.read_failed", error);
    const message = error instanceof Error ? error.message : "Failed to load credits";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
