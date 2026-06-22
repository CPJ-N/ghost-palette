"use client";

import { BookmarkCheck, BookmarkPlus, Loader2 } from "lucide-react";
import { useState } from "react";

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

  const canSave =
    !disabled &&
    prompt.trim().length > 0 &&
    results.some((result) => result.status === "complete");

  function onSave() {
    if (!canSave || saved || busy) {
      return;
    }
    setBusy(true);
    saveRun({ mode, prompt, results, winnerId });
    setSaved(true);
    setBusy(false);
  }

  return (
    <button
      className={`gp-button ${saved ? "gp-button--ghost" : "gp-button--outline"}`}
      type="button"
      onClick={onSave}
      disabled={!canSave || saved || busy}
      aria-busy={busy}
    >
      {busy ? (
        <Loader2 className="gp-spin" size={16} aria-hidden="true" />
      ) : saved ? (
        <BookmarkCheck size={16} aria-hidden="true" />
      ) : (
        <BookmarkPlus size={16} aria-hidden="true" />
      )}
      {saved ? "Saved to Library" : "Save to Library"}
    </button>
  );
}
