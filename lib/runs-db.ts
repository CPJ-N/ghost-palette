import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createId } from "@/lib/domain";
import { createLogger } from "@/lib/logger";
import { getModel } from "@/lib/models";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { GenerationResult, GenerationStatus, RunMode, SavedRun } from "@/lib/types";

const log = createLogger("runs-db");

const ARTIFACTS_BUCKET = "artifacts";
/** Signed-URL lifetime handed to the Library — roughly one week. */
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;
/** Cap how many runs we hydrate for the Library in one GET. */
const DEFAULT_RUN_LIMIT = 100;

type Admin = SupabaseClient<Database>;

export type PersistResultInput = {
  modelId: string;
  /** Transient provider (fal.media) image URL. Copied into Storage when http(s). */
  url?: string | null;
  seed?: number | null;
};

export type PersistRunInput = {
  userId: string;
  prompt: string;
  mode: RunMode;
  winnerId?: string | null;
  results: PersistResultInput[];
};

/**
 * Persist one run + its results. For every result with an http(s) URL we fetch
 * the bytes server-side and upload them to the "artifacts" Storage bucket at
 * `${userId}/${runId}/${resultId}.{png|mp4}` (extension/contentType derived from
 * the model kind — image vs video), recording that path on the row. A single
 * media fetch/upload failure never fails the run — the row is stored with a null
 * `storage_path` instead.
 */
export async function persistRun(
  input: PersistRunInput,
): Promise<{ runId: string; storedImages: number }> {
  const sb = supabaseAdmin();
  const runId = createId("run");

  const modelIds = uniqueInOrder(input.results.map((result) => result.modelId));
  const seeds = input.results.map((result) =>
    typeof result.seed === "number" ? result.seed : null,
  );

  // Insert the parent run first so the result rows' FK resolves.
  const { error: runError } = await sb.from("runs").insert({
    id: runId,
    user_id: input.userId,
    mode: input.mode,
    prompt: input.prompt,
    model_ids: modelIds,
    seeds,
    winner_id: input.winnerId ?? null,
  });
  if (runError) {
    log.error("run.insert_failed", runError, { runId, userId: input.userId });
    throw new Error(runError.message);
  }

  // Upload images in parallel (best effort), then batch-insert the result rows.
  const rows = await Promise.all(
    input.results.map(async (result) => {
      const resultId = createId("result");
      const isVideo = getModel(result.modelId).kind === "video";
      const storagePath = await uploadResultMedia(
        sb,
        input.userId,
        runId,
        resultId,
        result.url,
        isVideo ? "mp4" : "png",
        isVideo ? "video/mp4" : "image/png",
      );
      return {
        id: resultId,
        run_id: runId,
        user_id: input.userId,
        model_id: result.modelId,
        prompt: input.prompt,
        seed: typeof result.seed === "number" ? result.seed : null,
        storage_path: storagePath,
        status: "complete",
      };
    }),
  );

  const { error: resultsError } = await sb.from("results").insert(rows);
  if (resultsError) {
    log.error("results.insert_failed", resultsError, {
      runId,
      count: rows.length,
    });
    throw new Error(resultsError.message);
  }

  const storedImages = rows.filter((row) => row.storage_path !== null).length;
  log.info("run.persisted", {
    runId,
    userId: input.userId,
    results: rows.length,
    storedImages,
  });
  return { runId, storedImages };
}

/**
 * Load the current user's saved runs newest-first, shaped to the SavedRun type
 * the Library already consumes. Each stored image is exposed as a freshly minted
 * Storage signed URL; results without a stored image carry no `url`.
 */
export async function listSavedRuns(
  userId: string,
  limit = DEFAULT_RUN_LIMIT,
): Promise<SavedRun[]> {
  const sb = supabaseAdmin();

  const { data: runRows, error: runsError } = await sb
    .from("runs")
    .select("id, prompt, mode, model_ids, winner_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (runsError) {
    log.error("runs.list_failed", runsError, { userId });
    throw new Error(runsError.message);
  }

  const runs = runRows ?? [];
  if (runs.length === 0) return [];

  const runIds = runs.map((run) => run.id);
  const { data: resultRows, error: resultsError } = await sb
    .from("results")
    .select(
      "id, run_id, model_id, prompt, seed, status, storage_path, width, height, favorite, error, created_at",
    )
    .eq("user_id", userId)
    .in("run_id", runIds)
    .order("created_at", { ascending: true });
  if (resultsError) {
    log.error("results.list_failed", resultsError, { userId });
    throw new Error(resultsError.message);
  }

  const results = resultRows ?? [];

  const paths = [
    ...new Set(
      results
        .map((row) => row.storage_path)
        .filter((path): path is string => Boolean(path)),
    ),
  ];
  const signedByPath = await signPaths(sb, paths);

  const resultsByRun = new Map<string, typeof results>();
  for (const row of results) {
    const list = resultsByRun.get(row.run_id) ?? [];
    list.push(row);
    resultsByRun.set(row.run_id, list);
  }

  return runs.map((run) => {
    const saved: SavedRun = {
      id: run.id,
      prompt: run.prompt,
      createdAt: run.created_at,
      savedAt: run.created_at,
      mode: run.mode as RunMode,
      modelIds: toStringArray(run.model_ids),
      results: (resultsByRun.get(run.id) ?? []).map((row) => {
        const signedUrl = row.storage_path
          ? signedByPath.get(row.storage_path)
          : undefined;
        const result: GenerationResult = {
          id: row.id,
          runId: row.run_id,
          modelId: row.model_id,
          prompt: row.prompt,
          createdAt: row.created_at,
          status: row.status as GenerationStatus,
          favorite: row.favorite,
          seed: row.seed ?? 0,
        };
        if (signedUrl) result.url = signedUrl;
        if (row.width != null) result.width = row.width;
        if (row.height != null) result.height = row.height;
        if (row.error) result.error = row.error;
        return result;
      }),
    };
    if (run.winner_id) saved.winnerId = run.winner_id;
    return saved;
  });
}

// Generated images only ever come from fal's CDN. `url` arrives from the client
// (POST /api/runs body), so an unrestricted server-side fetch would be an SSRF
// vector (internal services / cloud metadata). Enforce https + a host allowlist
// + no redirects so the server can only ever fetch from fal.
const ALLOWED_IMAGE_HOSTS = ["fal.media", "fal.run", "fal.ai"];

function isAllowedImageUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  return ALLOWED_IMAGE_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}

async function uploadResultMedia(
  sb: Admin,
  userId: string,
  runId: string,
  resultId: string,
  url: string | null | undefined,
  extension: string,
  contentType: string,
): Promise<string | null> {
  if (!url || !isAllowedImageUrl(url)) return null;

  try {
    const response = await fetch(url, { redirect: "error" });
    if (!response.ok) {
      log.warn("media.fetch_failed", { runId, resultId, status: response.status });
      return null;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    const path = `${userId}/${runId}/${resultId}.${extension}`;
    const { error } = await sb.storage.from(ARTIFACTS_BUCKET).upload(path, bytes, {
      contentType,
      upsert: true,
    });
    if (error) {
      log.warn("media.upload_failed", { runId, resultId, message: error.message });
      return null;
    }
    return path;
  } catch (error) {
    log.warn("media.persist_error", {
      runId,
      resultId,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function signPaths(
  sb: Admin,
  paths: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (paths.length === 0) return map;

  const { data, error } = await sb.storage
    .from(ARTIFACTS_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) {
    log.warn("signed_urls.failed", { count: paths.length, message: error.message });
    return map;
  }
  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) {
      map.set(entry.path, entry.signedUrl);
    }
  }
  return map;
}

function uniqueInOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      out.push(value);
    }
  }
  return out;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}
