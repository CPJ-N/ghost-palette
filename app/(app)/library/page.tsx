"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  deleteSavedRun,
  loadSavedRuns,
  subscribeSavedRuns,
} from "@/lib/runs-storage";
import { getModel } from "@/lib/models";
import type { SavedRun } from "@/lib/types";

// Stable empty reference for the server/initial snapshot (a fresh [] each call
// would also trip useSyncExternalStore's snapshot-stability check).
const EMPTY_RUNS: SavedRun[] = [];

const MODE_LABEL: Record<SavedRun["mode"], string> = {
  composer: "Composer",
  arena: "Create",
  eval: "Refine",
};

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default function LibraryPage() {
  // Offline cache (synchronous, always available).
  const localRuns = useSyncExternalStore(
    subscribeSavedRuns,
    loadSavedRuns,
    () => EMPTY_RUNS,
  );
  // Server copy from /api/runs; null until the request resolves.
  const [serverRuns, setServerRuns] = useState<SavedRun[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/runs");
        if (!response.ok) return;
        const data = (await response.json()) as { runs?: SavedRun[] };
        if (!cancelled && Array.isArray(data.runs)) {
          setServerRuns(data.runs);
        }
      } catch {
        // Network/auth failure — fall back to the localStorage cache below.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Prefer the synced account copy; fall back to the local cache when the
  // request failed (serverRuns === null) or returned nothing.
  const runs = serverRuns && serverRuns.length > 0 ? serverRuns : localRuns;

  function handleDelete(id: string) {
    // Clear the local cache copy and optimistically drop it from the synced
    // list so the row disappears regardless of which source is showing.
    deleteSavedRun(id);
    setServerRuns((prev) => (prev ? prev.filter((run) => run.id !== id) : prev));
  }

  return (
    <div className="gp-feature">
      <header className="gp-feature__head">
        <Badge variant="secondary" className="gp-tag">
          Library
        </Badge>
        <h1>Saved images and model picks</h1>
        <p>
          Studio winners and refinement outputs you save appear here, synced to
          your account with an offline copy kept in this browser.
        </p>
      </header>

      {runs.length === 0 ? (
        <div className="gp-listempty">
          Nothing saved yet. Generate in{" "}
          <Link href="/studio">Create</Link> or{" "}
          <Link href="/evals">Refine</Link>, then use Save to Library.
        </div>
      ) : (
        <div className="gp-library">
          {runs.map((run) => {
            const winner = run.results.find((result) => result.id === run.winnerId);
            const thumbs = run.results.filter((result) => result.status === "complete");
            return (
              <Card className="gp-library__item" key={run.id}>
                <CardHeader className="gp-library__head">
                  <div>
                    <Badge variant="secondary" className="gp-tag">
                      {MODE_LABEL[run.mode]}
                    </Badge>
                    <h2>{run.prompt}</h2>
                    <p>
                      Saved {formatWhen(run.savedAt)} · {thumbs.length} image
                      {thumbs.length === 1 ? "" : "s"}
                      {winner ? ` · Winner: ${getModel(winner.modelId).name}` : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="gp-button gp-button--ghost gp-library__delete"
                    type="button"
                    onClick={() => handleDelete(run.id)}
                    aria-label="Delete saved run"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Delete
                  </Button>
                </CardHeader>
                <CardContent className="gp-library__grid">
                  {thumbs.map((result) => {
                    const model = getModel(result.modelId);
                    const isWinner = result.id === run.winnerId;
                    return (
                      <figure
                        className={`gp-library__thumb ${isWinner ? "is-winner" : ""}`}
                        key={result.id}
                      >
                        <div className={`gp-art ${model.artClass}`}>
                          {result.url ? (
                            <img
                              className="gp-art__img is-live"
                              src={result.url}
                              alt={`${model.name} output`}
                              loading="lazy"
                            />
                          ) : null}
                        </div>
                        <figcaption>
                          <strong>{model.name}</strong>
                        </figcaption>
                      </figure>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
