"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import {
  deleteSavedRun,
  loadSavedRuns,
  subscribeSavedRuns,
} from "@/lib/runs-storage";
import { getModel } from "@/lib/models";
import type { SavedRun } from "@/lib/types";

const MODE_LABEL: Record<SavedRun["mode"], string> = {
  composer: "Composer",
  arena: "Arena",
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
        <span className="gp-tag">Library</span>
        <h1>Saved evaluations</h1>
        <p>
          Composer batches, arena winners, and refinement comparisons you save
          appear here. Runs stay in this browser until Supabase persistence
          ships.
        </p>
      </header>

      {runs.length === 0 ? (
        <div className="gp-listempty">
          Nothing saved yet. Generate in{" "}
          <Link href="/composer">Composer</Link>, judge in{" "}
          <Link href="/arena">Arena</Link>, or compare in{" "}
          <Link href="/evals">Refine</Link>, then use Save to Library.
        </div>
      ) : (
        <div className="gp-library">
          {runs.map((run) => {
            const winner = run.results.find((result) => result.id === run.winnerId);
            const thumbs = run.results.filter((result) => result.status === "complete");
            return (
              <article className="gp-library__item" key={run.id}>
                <header className="gp-library__head">
                  <div>
                    <span className="gp-tag">{MODE_LABEL[run.mode]}</span>
                    <h2>{run.prompt}</h2>
                    <p>
                      Saved {formatWhen(run.savedAt)} · {thumbs.length} image
                      {thumbs.length === 1 ? "" : "s"}
                      {winner ? ` · Winner: ${getModel(winner.modelId).name}` : ""}
                    </p>
                  </div>
                  <button
                    className="gp-button gp-button--ghost gp-library__delete"
                    type="button"
                    onClick={() => deleteSavedRun(run.id)}
                    aria-label="Delete saved run"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Delete
                  </button>
                </header>
                <div className="gp-library__grid">
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
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
