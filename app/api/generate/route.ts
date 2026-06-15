import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { runModel } from "@/lib/fal/client";
import { MODELS } from "@/lib/models";

// Generates ONE image. The client fires one request per (model × seed) so each
// serverless invocation stays short and gives natural per-tile progress.
// FAL_KEY never leaves the server. Credit deduction + persistence layer in later.
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { modelId?: string; prompt?: string; seed?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  const model = MODELS.find((entry) => entry.id === body.modelId);
  if (!model || !prompt) {
    return NextResponse.json(
      { error: "A valid modelId and prompt are required" },
      { status: 400 },
    );
  }

  try {
    const result = await runModel({
      adapter: model.adapter,
      prompt,
      seed: body.seed,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
