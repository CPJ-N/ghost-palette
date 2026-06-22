import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { apiLogger, durationMs, logUnauthorized, logValidationError } from "@/lib/api-log";
import { recordChallengeResult } from "@/lib/benchmark-store";
import { createId } from "@/lib/domain";
import { gradeImageWithVlm } from "@/lib/fal/vision";
import { runModel } from "@/lib/fal/client";
import { getChallenge } from "@/lib/imagebench";
import { MODELS } from "@/lib/models";

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

  const runLog = log.child({ suiteRunId, challengeId, modelId, category: challenge.category });
  runLog.info("challenge.start");

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
    });
  } catch (error) {
    runLog.error("challenge.failed", error, {
      latencyMs: durationMs(genStart),
      totalLatencyMs: durationMs(started),
    });
    const message = error instanceof Error ? error.message : "Challenge failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function serializePersistError(error: unknown) {
  if (error instanceof Error) return { persistError: error.message };
  return { persistError: String(error) };
}
