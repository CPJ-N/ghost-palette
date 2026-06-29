"use client";

import { BookmarkCheck, BookmarkPlus, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { saveRun, hasSavedRun } from "@/lib/runs-storage";
import type { GenerationResult, RunMode } from "@/lib/types";

type SaveRunButtonProps = {
  mode: RunMode;
  prompt: string;
  results: GenerationResult[];
  winnerId?: string;
  disabled?: boolean;
};

export function SaveRunButton({
  mode,
  prompt,
  results,
  winnerId,
  disabled,
}: SaveRunButtonProps) {
  const runId = results[0]?.runId;
  const [saved, setSaved] = useState(() => (runId ? hasSavedRun(runId) : false));
  const [busy, setBusy] = useState(false);
  // True when the local cache write succeeded but the cloud POST did not.
  const [cloudError, setCloudError] = useState(false);

  const canSave =
    !disabled &&
    prompt.trim().length > 0 &&
    results.some((result) => result.status === "complete");

  async function onSave() {
    if (!canSave || saved || busy) {
      return;
    }
    setBusy(true);
    setCloudError(false);
    // Write the offline cache first so the Library keeps the run even if the
    // network request fails; the cloud POST is the durable copy.
    saveRun({ mode, prompt, results, winnerId });
    setSaved(true);
    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          mode,
          winnerId,
          results: results
            .filter((result) => result.status === "complete")
            .map((result) => ({
              modelId: result.modelId,
              url: result.url,
              seed: result.seed,
            })),
        }),
      });
      setCloudError(!response.ok);
    } catch {
      setCloudError(true);
    } finally {
      setBusy(false);
    }
  }

  const label = busy
    ? "Saving…"
    : saved
      ? cloudError
        ? "Saved offline"
        : "Saved to Library"
      : "Save to Library";

  return (
    <Button
      variant={saved ? "ghost" : "outline"}
      size="lg"
      className={`gp-button ${saved ? "gp-button--ghost" : "gp-button--outline"}`}
      type="button"
      onClick={() => void onSave()}
      disabled={!canSave || saved || busy}
      aria-busy={busy}
      title={
        saved && cloudError
          ? "Saved in this browser. Cloud sync failed — it will retry next time."
          : undefined
      }
    >
      {busy ? (
        <Loader2 className="gp-spin" size={16} aria-hidden="true" />
      ) : saved ? (
        <BookmarkCheck size={16} aria-hidden="true" />
      ) : (
        <BookmarkPlus size={16} aria-hidden="true" />
      )}
      {label}
    </Button>
  );
}
