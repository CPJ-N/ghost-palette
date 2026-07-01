import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { apiLogger, durationMs, logUnauthorized, logValidationError, truncate } from "@/lib/api-log";
import { getPostHogClient } from "@/lib/posthog-server";
import {
  ensureProfile,
  grantCredits,
  InsufficientCreditsError,
  spendCredits,
} from "@/lib/credits";
import { createId } from "@/lib/domain";
import { runModel } from "@/lib/fal/client";
import { isModelAvailable, MODELS } from "@/lib/models";
import { persistResult } from "@/lib/runs-db";
import { RUN_MODES, type RunMode } from "@/lib/types";

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

  let body: {
    modelId?: string;
    prompt?: string;
    seed?: number;
    imageUrl?: string;
    runId?: string;
    resultId?: string;
    mode?: string;
  };
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

  // `mode` is required (not optional-and-silently-skipped) so persistence can
  // never be quietly bypassed by a caller that forgets to pass it — every
  // generation must be saveable by construction, not by caller discipline.
  if (!RUN_MODES.includes(body.mode as RunMode)) {
    logValidationError(log, "missing_or_invalid_mode", { mode: body.mode });
    return NextResponse.json(
      { error: "A valid mode is required" },
      { status: 400 },
    );
  }
  const mode = body.mode as RunMode;
  const runId = body.runId ?? createId("run");
  const resultId = body.resultId ?? createId("result");

  // Internal models (non-commercial / unreleased) are usable in local dev only —
  // reject them in production even if a client is modified to request one.
  if (!isModelAvailable(model.id)) {
    logValidationError(log, "model_unavailable", { modelId: model.id });
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
      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: userId,
        event: "insufficient_credits_blocked",
        properties: {
          model_id: model.id,
          credits_required: error.required,
          credits_balance: error.balance,
        },
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
      kind: model.kind,
    });

    const latencyMs = durationMs(started);
    log.info("generate.success", {
      modelId: model.id,
      seed: result.seed,
      latencyMs,
      imageUrlHost: safeHost(result.url),
      creditCost: model.creditCost,
      creditsBalance: balanceAfterDebit,
    });

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: userId,
      event: "image_generation_completed",
      properties: {
        model_id: model.id,
        run_id: runId,
        result_id: resultId,
        mode,
        latency_ms: latencyMs,
        credit_cost: model.creditCost,
        credits_balance: balanceAfterDebit,
      },
    });

    const { persisted } = await persistResult({
      runId,
      resultId,
      userId,
      mode,
      prompt,
      modelId: model.id,
      seed: result.seed,
      status: "complete",
      url: result.url,
      width: result.width,
      height: result.height,
    });

    return NextResponse.json({
      ...result,
      creditsCharged: model.creditCost,
      creditsBalance: balanceAfterDebit,
      runId,
      resultId,
      persisted,
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

    const failLatencyMs = durationMs(started);
    log.error("generate.failed", error, {
      modelId: model.id,
      seed: body.seed ?? null,
      latencyMs: failLatencyMs,
      refunded: balanceAfterRefund !== null,
    });
    const message = error instanceof Error ? error.message : "Generation failed";
    const posthogErr = getPostHogClient();
    posthogErr.capture({
      distinctId: userId,
      event: "image_generation_failed",
      properties: {
        model_id: model.id,
        run_id: runId,
        result_id: resultId,
        mode,
        latency_ms: failLatencyMs,
        refunded: balanceAfterRefund !== null,
      },
    });

    const { persisted: errorPersisted } = await persistResult({
      runId,
      resultId,
      userId,
      mode,
      prompt,
      modelId: model.id,
      seed: body.seed,
      status: "error",
      error: message,
    });

    return NextResponse.json(
      {
        error: message,
        creditsRefunded: balanceAfterRefund !== null ? model.creditCost : 0,
        creditsBalance: balanceAfterRefund,
        runId,
        resultId,
        persisted: errorPersisted,
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
