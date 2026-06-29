"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

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
  const runs = useSyncExternalStore(
    subscribeSavedRuns,
    () => loadSavedRuns(),
    () => [] as SavedRun[],
  );

  return (
    <div className="gp-feature">
      <header className="gp-feature__head">
        <Badge variant="secondary" className="gp-tag">
          Library
        </Badge>
        <h1>Saved images and model picks</h1>
        <p>
          Studio winners and refinement outputs you save appear here. Runs stay
          in this browser until Supabase persistence ships.
        </p>
      </header>

      {runs.length === 0 ? (
        <div className="gp-listempty">
          Nothing saved yet. Generate in{" "}
          <Link href="/arena">Create</Link> or{" "}
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
                    onClick={() => deleteSavedRun(run.id)}
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
