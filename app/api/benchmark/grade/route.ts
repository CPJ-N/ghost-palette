import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { apiLogger, durationMs, logUnauthorized, logValidationError } from "@/lib/api-log";
import { gradeImageWithVlm } from "@/lib/fal/vision";

export async function POST(request: Request) {
  const started = Date.now();
  const { userId } = await auth();
  const log = apiLogger({ scope: "api.benchmark.grade", userId, request });

  if (!userId) {
    logUnauthorized(log);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    imageUrl?: string;
    visionQuestion?: string;
    vlm?: string;
  };
  try {
    body = await request.json();
  } catch {
    logValidationError(log, "invalid_json");
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.imageUrl || !body.visionQuestion) {
    logValidationError(log, "missing_grade_fields");
    return NextResponse.json(
      { error: "imageUrl and visionQuestion required" },
      { status: 400 },
    );
  }

  log.info("grade.start", { vlm: body.vlm ?? null });

  try {
    const grade = await gradeImageWithVlm({
      imageUrl: body.imageUrl,
      visionQuestion: body.visionQuestion,
      vlm: body.vlm,
    });

    log.info("grade.success", {
      passed: grade.passed,
      latencyMs: durationMs(started),
    });

    return NextResponse.json(grade);
  } catch (error) {
    log.error("grade.failed", error, { latencyMs: durationMs(started) });
    const message = error instanceof Error ? error.message : "Grading failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
