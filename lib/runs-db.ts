import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createLogger } from "@/lib/logger";
import { getModel } from "@/lib/models";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { GenerationResult, GenerationStatus, RunMode, SavedRun } from "@/lib/types";

const log = createLogger("runs-db");

const ARTIFACTS_BUCKET = "artifacts";
/** Signed-URL lifetime handed to the Gallery — roughly one week. */
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;
/** Cap how many runs we hydrate for the Gallery in one GET. */
const DEFAULT_RUN_LIMIT = 100;

type Admin = SupabaseClient<Database>;

export type PersistResultInput = {
  runId: string;
  resultId: string;
  userId: string;
  mode: RunMode;
  prompt: string;
  modelId: string;
  seed?: number | null;
  status: "complete" | "error";
  /** Transient provider (fal.media) image URL. Copied into Storage when http(s). */
  url?: string | null;
  width?: number | null;
  height?: number | null;
  error?: string | null;
};

/**
 * Persist one generated image (a row in `results`, plus the parent `runs` row
 * if this is the first result in its batch). Called synchronously from
 * `/api/generate` for every generation — success or failure — so a generation
 * the user already paid credits for is never silently lost. Keyed by the
 * client-supplied `runId`/`resultId` so parallel calls in the same batch
 * upsert idempotently instead of racing or double-inserting. Never throws —
 * a failed save is reported back as `{ persisted: false }` so the caller can
 * surface it instead of showing a falsely-confident "saved" state.
 */
export async function persistResult(
  input: PersistResultInput,
): Promise<{ persisted: boolean }> {
  const sb = supabaseAdmin();

  let storagePath: string | null = null;
  if (input.status === "complete") {
    const isVideo = getModel(input.modelId).kind === "video";
    storagePath = await uploadResultMedia(
      sb,
      input.userId,
      input.runId,
      input.resultId,
      input.url,
      isVideo ? "mp4" : "png",
      isVideo ? "video/mp4" : "image/png",
    );
  }

  const writeRows = async () => {
    // model_ids/seeds are vestigial — the Gallery derives the real,
    // up-to-date model list from `results` instead, so these columns only
    // need to satisfy the NOT NULL constraint, not stay in sync. `prompt`
    // DOES matter and must be kept current: a plain (non-ignoreDuplicates)
    // upsert means each call refreshes it, which is required for sessions
    // that reuse one runId across turns with different prompts (Refine) —
    // otherwise the run would be frozen at whichever call landed first.
    const { error: runError } = await sb.from("runs").upsert({
      id: input.runId,
      user_id: input.userId,
      mode: input.mode,
      prompt: input.prompt,
      model_ids: [input.modelId],
      seeds: typeof input.seed === "number" ? [input.seed] : null,
    });
    if (runError) throw new Error(runError.message);

    const { error: resultError } = await sb.from("results").upsert(
      {
        id: input.resultId,
        run_id: input.runId,
        user_id: input.userId,
        model_id: input.modelId,
        prompt: input.prompt,
        seed: typeof input.seed === "number" ? input.seed : null,
        status: input.status,
        storage_path: storagePath,
        width: input.width ?? null,
        height: input.height ?? null,
        error: input.status === "error" ? (input.error ?? null) : null,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (resultError) throw new Error(resultError.message);
  };

  try {
    await withRetry(writeRows, { attempts: 3, delayMs: 300 });
    log.info("result.persisted", {
      runId: input.runId,
      resultId: input.resultId,
      userId: input.userId,
      status: input.status,
      storedImage: storagePath !== null,
    });
    return { persisted: true };
  } catch (error) {
    log.error("result.persist_failed", error, {
      runId: input.runId,
      resultId: input.resultId,
      userId: input.userId,
      modelId: input.modelId,
    });
    return { persisted: false };
  }
}

/** Record which result the user picked as the winner of a comparison run. */
export async function setRunWinner(
  userId: string,
  runId: string,
  winnerId: string,
): Promise<void> {
  const sb = supabaseAdmin();

  const { data: winner, error: lookupError } = await sb
    .from("results")
    .select("id")
    .eq("id", winnerId)
    .eq("run_id", runId)
    .eq("user_id", userId)
    .maybeSingle();
  if (lookupError) {
    log.error("run.winner_lookup_failed", lookupError, { userId, runId, winnerId });
    throw new Error(lookupError.message);
  }
  if (!winner) {
    throw new Error("winnerId does not belong to this run");
  }

  const { error } = await sb
    .from("runs")
    .update({ winner_id: winnerId })
    .eq("id", runId)
    .eq("user_id", userId);
  if (error) {
    log.error("run.winner_update_failed", error, { userId, runId, winnerId });
    throw new Error(error.message);
  }
}

/** Toggle the favorite flag on a single result. */
export async function setResultFavorite(
  userId: string,
  resultId: string,
  favorite: boolean,
): Promise<void> {
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("results")
    .update({ favorite })
    .eq("id", resultId)
    .eq("user_id", userId);
  if (error) {
    log.error("result.favorite_update_failed", error, { userId, resultId });
    throw new Error(error.message);
  }
}

/**
 * Delete a run (cascades its `results` rows via the FK) and best-effort clean
 * up the Storage objects those results pointed at.
 */
export async function deleteRun(userId: string, runId: string): Promise<void> {
  const sb = supabaseAdmin();

  const { data: rows, error: selectError } = await sb
    .from("results")
    .select("storage_path")
    .eq("run_id", runId)
    .eq("user_id", userId);
  if (selectError) {
    log.error("run.delete_lookup_failed", selectError, { userId, runId });
    throw new Error(selectError.message);
  }

  const { error: deleteError } = await sb
    .from("runs")
    .delete()
    .eq("id", runId)
    .eq("user_id", userId);
  if (deleteError) {
    log.error("run.delete_failed", deleteError, { userId, runId });
    throw new Error(deleteError.message);
  }

  const paths = (rows ?? [])
    .map((row) => row.storage_path)
    .filter((path): path is string => Boolean(path));
  if (paths.length > 0) {
    const { error: storageError } = await sb.storage
      .from(ARTIFACTS_BUCKET)
      .remove(paths);
    if (storageError) {
      log.warn("run.delete_storage_cleanup_failed", {
        userId,
        runId,
        message: storageError.message,
      });
    }
  }
}

/**
 * Load the current user's saved runs newest-first, shaped to the SavedRun type
 * the Gallery consumes. Each stored image is exposed as a freshly minted
 * Storage signed URL; results without a stored image carry no `url`.
 */
export async function listSavedRuns(
  userId: string,
  limit = DEFAULT_RUN_LIMIT,
): Promise<SavedRun[]> {
  const sb = supabaseAdmin();

  const { data: runRows, error: runsError } = await sb
    .from("runs")
    .select("id, prompt, mode, winner_id, created_at")
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

  return runs
    .filter((run) => (resultsByRun.get(run.id) ?? []).length > 0)
    .map((run) => {
      const runResults = resultsByRun.get(run.id) ?? [];
      const saved: SavedRun = {
        id: run.id,
        prompt: run.prompt,
        createdAt: run.created_at,
        savedAt: run.created_at,
        mode: run.mode as RunMode,
        modelIds: uniqueInOrder(runResults.map((row) => row.model_id)),
        results: runResults.map((row) => {
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

// Generated images only ever come from fal's CDN. Enforce https + a host
// allowlist + no redirects so the server can only ever fetch from fal — an
// unrestricted server-side fetch of a client-influenced URL would otherwise
// be an SSRF vector (internal services / cloud metadata).
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

  // `download: true` sets Content-Disposition: attachment so the Gallery's
  // download link actually saves a file — browsers ignore the HTML `download`
  // attribute on cross-origin URLs (Storage is always a different origin)
  // without it. Harmless for the same URL used as an <img src>: browsers only
  // honor Content-Disposition for navigations/explicit downloads, not for
  // embedded resource fetches.
  const { data, error } = await sb.storage
    .from(ARTIFACTS_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS, { download: true });
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

async function withRetry(
  fn: () => Promise<void>,
  { attempts, delayMs }: { attempts: number; delayMs: number },
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await fn();
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}
