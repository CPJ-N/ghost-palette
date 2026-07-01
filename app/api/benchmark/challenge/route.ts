import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { apiLogger, durationMs, logUnauthorized, logValidationError } from "@/lib/api-log";
import { recordChallengeResult } from "@/lib/benchmark-store";
import {
  ensureProfile,
  grantCredits,
  InsufficientCreditsError,
  spendCredits,
} from "@/lib/credits";
import { createId } from "@/lib/domain";
import { gradeImageWithVlm } from "@/lib/fal/vision";
import { runModel } from "@/lib/fal/client";
import { getChallenge } from "@/lib/imagebench";
import { MODELS } from "@/lib/models";
import { getPostHogClient } from "@/lib/posthog-server";

const VLM_JUDGE_CREDIT_COST = 1;

export async function POST(request: Request) {
  const started = Date.now();
  const { userId } = await auth();
  const log = apiLogger({ scope: "api.benchmark.challenge", userId, request });

  if (!userId) {
    logUnauthorized(log);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    suiteRunId?: string;
    challengeId?: string;
    modelId?: string;
  };
  try {
    body = await request.json();
  } catch {
    logValidationError(log, "invalid_json");
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { suiteRunId, challengeId, modelId } = body;
  if (!suiteRunId || !challengeId || !modelId) {
    logValidationError(log, "missing_fields", { suiteRunId, challengeId, modelId });
    return NextResponse.json(
      { error: "suiteRunId, challengeId, and modelId are required" },
      { status: 400 },
    );
  }

  const challenge = getChallenge(challengeId);
  if (!challenge) {
    logValidationError(log, "invalid_challenge", { challengeId });
    return NextResponse.json({ error: "Invalid challenge" }, { status: 400 });
  }

  const model = MODELS.find((m) => m.id === modelId);
  if (!model) {
    logValidationError(log, "invalid_model", { modelId });
    return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  }

  const creditCost = model.creditCost + VLM_JUDGE_CREDIT_COST;
  const creditRef = createId("bench");
  let balanceAfterDebit: number;
  try {
    await ensureProfile(userId);
    balanceAfterDebit = await spendCredits(
      userId,
      creditCost,
      "benchmark",
      creditRef,
    );
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      log.info("challenge.insufficient_credits", {
        suiteRunId,
        challengeId,
        modelId,
        requiredCredits: error.required,
        balance: error.balance,
      });
      getPostHogClient().capture({
        distinctId: userId,
        event: "insufficient_credits_blocked",
        properties: {
          model_id: modelId,
          mode: "benchmark",
          suite_run_id: suiteRunId,
          challenge_id: challengeId,
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
    log.error("challenge.credit_check_failed", error, {
      suiteRunId,
      challengeId,
      modelId,
      creditCost,
    });
    const message =
      error instanceof Error ? error.message : "Credit check failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const runLog = log.child({ suiteRunId, challengeId, modelId, category: challenge.category });
  runLog.info("challenge.start", {
    creditCost,
    creditsBalance: balanceAfterDebit,
  });

  const genStart = Date.now();
  try {
    const image = await runModel({
      adapter: model.adapter,
      prompt: challenge.originalPrompt,
      seed: 42,
    });

    const grade = await gradeImageWithVlm({
      imageUrl: image.url,
      visionQuestion: challenge.visionQuestion,
      vlm: challenge.vlm,
    });

    const resultId = createId("bresult");
    const latencyMs = durationMs(genStart);

    try {
      await recordChallengeResult({
        id: resultId,
        suiteRunId,
        userId,
        challengeId: challenge.id,
        modelId,
        category: challenge.category,
        imageUrl: image.url,
        passed: grade.passed,
        vlmOutput: grade.raw,
        latencyMs,
      });
    } catch (error) {
      runLog.warn("challenge.persist_failed", {
        resultId,
        ...serializePersistError(error),
      });
    }

    runLog.info("challenge.success", {
      passed: grade.passed,
      latencyMs,
      totalLatencyMs: durationMs(started),
    });

    getPostHogClient().capture({
      distinctId: userId,
      event: "image_generation_completed",
      properties: {
        model_id: modelId,
        mode: "benchmark",
        run_id: suiteRunId,
        result_id: resultId,
        media_type: model.kind ?? "image",
        challenge_id: challenge.id,
        category: challenge.category,
        passed: grade.passed,
        latency_ms: latencyMs,
        credit_cost: creditCost,
        credits_balance: balanceAfterDebit,
      },
    });

    return NextResponse.json({
      challengeId: challenge.id,
      category: challenge.category,
      subcategory: challenge.subcategory,
      difficulty: challenge.difficulty,
      evaluationCriteria: challenge.evaluationCriteria,
      prompt: challenge.originalPrompt,
      imageUrl: image.url,
      passed: grade.passed,
      vlmOutput: grade.raw,
      latencyMs,
      creditsCharged: creditCost,
      creditsBalance: balanceAfterDebit,
    });
  } catch (error) {
    const balanceAfterRefund = await grantCredits(
      userId,
      creditCost,
      "benchmark_refund",
      creditRef,
    ).catch((refundError) => {
      runLog.error("challenge.refund_failed", refundError, {
        creditRef,
        creditCost,
      });
      return null;
    });

    runLog.error("challenge.failed", error, {
      latencyMs: durationMs(genStart),
      totalLatencyMs: durationMs(started),
      refunded: balanceAfterRefund !== null,
    });

    getPostHogClient().capture({
      distinctId: userId,
      event: "image_generation_failed",
      properties: {
        model_id: modelId,
        mode: "benchmark",
        run_id: suiteRunId,
        media_type: model.kind ?? "image",
        challenge_id: challengeId,
        latency_ms: durationMs(genStart),
        refunded: balanceAfterRefund !== null,
      },
    });

    const message = error instanceof Error ? error.message : "Challenge failed";
    return NextResponse.json(
      {
        error: message,
        creditsRefunded: balanceAfterRefund !== null ? creditCost : 0,
        creditsBalance: balanceAfterRefund,
      },
      { status: 502 },
    );
  }
}

function serializePersistError(error: unknown) {
  if (error instanceof Error) return { persistError: error.message };
  return { persistError: String(error) };
}
