import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { apiLogger, durationMs, logUnauthorized, logValidationError, truncate } from "@/lib/api-log";
import {
  ensureProfile,
  grantCredits,
  InsufficientCreditsError,
  spendCredits,
} from "@/lib/credits";
import { createId } from "@/lib/domain";
import { runModel } from "@/lib/fal/client";
import { MODELS } from "@/lib/models";

// Generates ONE image. The client fires one request per (model × seed) so each
// serverless invocation stays short and gives natural per-tile progress.
// FAL_KEY never leaves the server. Credits are debited before the provider call
// and refunded if provider generation fails.
export async function POST(request: Request) {
  const started = Date.now();
  const { userId } = await auth();
  const log = apiLogger({ scope: "api.generate", userId, request });

  if (!userId) {
    logUnauthorized(log);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { modelId?: string; prompt?: string; seed?: number; imageUrl?: string };
  try {
    body = await request.json();
  } catch {
    logValidationError(log, "invalid_json");
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  const model = MODELS.find((entry) => entry.id === body.modelId);
  if (!model || !prompt) {
    logValidationError(log, "missing_model_or_prompt", {
      modelId: body.modelId,
      hasPrompt: Boolean(prompt),
    });
    return NextResponse.json(
      { error: "A valid modelId and prompt are required" },
      { status: 400 },
    );
  }

  const creditRef = createId("gen");
  let balanceAfterDebit: number;
  try {
    await ensureProfile(userId);
    balanceAfterDebit = await spendCredits(
      userId,
      model.creditCost,
      "generation",
      creditRef,
    );
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      log.info("generate.insufficient_credits", {
        modelId: model.id,
        requiredCredits: error.required,
        balance: error.balance,
      });
      return NextResponse.json(
        {
          error: "Not enough credits",
          code: "insufficient_credits",
          creditsRequired: error.required,
          creditsBalance: error.balance,
        },
        { status: 402 },
      );
    }
    log.error("generate.credit_check_failed", error, {
      modelId: model.id,
      creditCost: model.creditCost,
    });
    const message =
      error instanceof Error ? error.message : "Credit check failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  log.info("generate.start", {
    modelId: model.id,
    seed: body.seed ?? null,
    promptLength: prompt.length,
    promptPreview: truncate(prompt, 80),
    hasReferenceImage: Boolean(body.imageUrl),
    creditCost: model.creditCost,
    creditsBalance: balanceAfterDebit,
  });

  try {
    const result = await runModel({
      adapter: model.adapter,
      prompt,
      seed: body.seed,
      imageUrl: body.imageUrl,
    });

    log.info("generate.success", {
      modelId: model.id,
      seed: result.seed,
      latencyMs: durationMs(started),
      imageUrlHost: safeHost(result.url),
      creditCost: model.creditCost,
      creditsBalance: balanceAfterDebit,
    });

    return NextResponse.json({
      ...result,
      creditsCharged: model.creditCost,
      creditsBalance: balanceAfterDebit,
    });
  } catch (error) {
    const balanceAfterRefund = await grantCredits(
      userId,
      model.creditCost,
      "generation_refund",
      creditRef,
    ).catch((refundError) => {
      log.error("generate.refund_failed", refundError, {
        modelId: model.id,
        creditRef,
        creditCost: model.creditCost,
      });
      return null;
    });

    log.error("generate.failed", error, {
      modelId: model.id,
      seed: body.seed ?? null,
      latencyMs: durationMs(started),
      refunded: balanceAfterRefund !== null,
    });
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json(
      {
        error: message,
        creditsRefunded: balanceAfterRefund !== null ? model.creditCost : 0,
        creditsBalance: balanceAfterRefund,
      },
      { status: 502 },
    );
  }
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}
