"use client";

import { AlertTriangle, Download, RotateCw, Search, Trash2, Wand2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FavoriteToggle } from "@/components/favorite-toggle";
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

type ActiveKey = { runId: string; resultId: string };

export default function GalleryPage() {
  const [runs, setRuns] = useState<SavedRun[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [activeKey, setActiveKey] = useState<ActiveKey | null>(null);

  async function fetchRuns(): Promise<SavedRun[] | null> {
    try {
      const response = await fetch("/api/runs");
      if (!response.ok) return null;
      const data = (await response.json()) as { runs?: SavedRun[] };
      return Array.isArray(data.runs) ? data.runs : [];
    } catch {
      return null;
    }
  }

  function load() {
    void fetchRuns().then((result) => {
      if (result === null) {
        setLoadError(true);
      } else {
        setLoadError(false);
        setRuns(result);
      }
    });
  }

  useEffect(() => {
    let cancelled = false;
    void fetchRuns().then((result) => {
      if (cancelled) return;
      if (result === null) {
        setLoadError(true);
      } else {
        setLoadError(false);
        setRuns(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: string) {
    setRuns((current) => (current ? current.filter((run) => run.id !== id) : current));
    try {
      const response = await fetch(`/api/runs/${id}`, { method: "DELETE" });
      // Re-sync with the server on failure instead of restoring a stale local
      // snapshot, which could otherwise resurrect a different run that was
      // deleted (and already removed server-side) while this request was in flight.
      if (!response.ok) load();
    } catch {
      load();
    }
  }

  function handleFavoriteChange(resultId: string, favorite: boolean) {
    setRuns((current) =>
      current
        ? current.map((run) => ({
            ...run,
            results: run.results.map((result) =>
              result.id === resultId ? { ...result, favorite } : result,
            ),
          }))
        : current,
    );
  }

  const filteredRuns = useMemo(() => {
    if (!runs) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return runs;
    return runs.filter((run) => run.prompt.toLowerCase().includes(needle));
  }, [runs, query]);

  const isLoading = runs === null && !loadError;

  // Derived (not a stored snapshot) so the dialog always reflects the latest
  // `runs` state — e.g. a favorite toggled elsewhere stays in sync instead of
  // reverting when the dialog reopens.
  const activeRun = activeKey ? runs?.find((run) => run.id === activeKey.runId) ?? null : null;
  const activeResult = activeKey
    ? activeRun?.results.find((result) => result.id === activeKey.resultId) ?? null
    : null;

  return (
    <div className="gp-feature">
      <header className="gp-feature__head">
        <Badge variant="secondary" className="gp-tag">
          Gallery
        </Badge>
        <h1>Your generated designs</h1>
        <p>
          Every image and video you generate in{" "}
          <Link href="/studio">Create</Link> or{" "}
          <Link href="/evals">Refine</Link> is saved here automatically — no
          extra step required.
        </p>
      </header>

      {runs && runs.length > 0 ? (
        <div className="gp-library__search">
          <Search size={16} aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search by prompt…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search your designs by prompt"
          />
        </div>
      ) : null}

      {isLoading ? (
        <div className="gp-listempty">Loading your designs…</div>
      ) : loadError ? (
        <div className="gp-listempty">
          Couldn&apos;t load your Gallery.
          <Button
            variant="ghost"
            size="lg"
            className="gp-button gp-button--ghost"
            type="button"
            onClick={() => load()}
          >
            <RotateCw size={16} aria-hidden="true" />
            Retry
          </Button>
        </div>
      ) : runs && runs.length === 0 ? (
        <div className="gp-listempty">
          Nothing here yet. Generate in{" "}
          <Link href="/studio">Create</Link> or{" "}
          <Link href="/evals">Refine</Link> — it&apos;ll show up here automatically.
        </div>
      ) : filteredRuns.length === 0 ? (
        <div className="gp-listempty">No designs match &ldquo;{query}&rdquo;.</div>
      ) : (
        <div className="gp-library">
          {filteredRuns.map((run) => {
            const completeCount = run.results.filter(
              (result) => result.status === "complete",
            ).length;
            return (
              <Card className="gp-library__item" key={run.id}>
                <CardHeader className="gp-library__head">
                  <div>
                    <Badge variant="secondary" className="gp-tag">
                      {MODE_LABEL[run.mode]}
                    </Badge>
                    <h2>{run.prompt}</h2>
                    <p>
                      {formatWhen(run.savedAt)} · {completeCount} image
                      {completeCount === 1 ? "" : "s"}
                      {run.winnerId
                        ? ` · Winner: ${getModel(
                            run.results.find((r) => r.id === run.winnerId)?.modelId ?? "",
                          ).name}`
                        : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="gp-button gp-button--ghost gp-library__delete"
                    type="button"
                    onClick={() => void handleDelete(run.id)}
                    aria-label="Delete saved run"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Delete
                  </Button>
                </CardHeader>
                <CardContent className="gp-library__grid">
                  {run.results.map((result) => {
                    const model = getModel(result.modelId);
                    const isWinner = result.id === run.winnerId;
                    const failed = result.status === "error";
                    return (
                      <figure
                        className={`gp-library__thumb ${isWinner ? "is-winner" : ""}`}
                        key={result.id}
                      >
                        <button
                          type="button"
                          className={`gp-art ${model.artClass} ${failed ? "is-error" : ""}`}
                          onClick={() => {
                            if (!failed) setActiveKey({ runId: run.id, resultId: result.id });
                          }}
                          disabled={failed}
                          aria-label={
                            failed
                              ? `${model.name} generation failed`
                              : `View ${model.name} details`
                          }
                        >
                          {!failed && result.url ? (
                            <img
                              className="gp-art__img is-live"
                              src={result.url}
                              alt={`${model.name} output`}
                              loading="lazy"
                            />
                          ) : null}
                          {failed ? (
                            <span className="gp-art__state">
                              <AlertTriangle size={18} aria-hidden="true" />
                              Failed
                            </span>
                          ) : null}
                        </button>
                        {/* Sibling of the button above, not nested inside it —
                            a <button> inside a <button> is invalid HTML and
                            gets silently reparented by the browser parser. */}
                        {!failed ? (
                          <FavoriteToggle
                            resultId={result.id}
                            favorite={result.favorite}
                            className="gp-library__favorite"
                            onChange={handleFavoriteChange}
                          />
                        ) : null}
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

      <Dialog open={Boolean(activeResult)} onOpenChange={(open) => !open && setActiveKey(null)}>
        {activeResult ? (
          <DialogContent className="gp-library__dialog sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{getModel(activeResult.modelId).name}</DialogTitle>
            </DialogHeader>
            {activeResult.url ? (
              <div className={`gp-art ${getModel(activeResult.modelId).artClass}`}>
                <img
                  className="gp-art__img is-live"
                  src={activeResult.url}
                  alt={`${getModel(activeResult.modelId).name} output`}
                />
              </div>
            ) : null}
            <p className="gp-library__dialog-prompt">{activeResult.prompt}</p>
            <dl className="gp-library__dialog-meta">
              <div>
                <dt>Seed</dt>
                <dd>{activeResult.seed}</dd>
              </div>
              {activeResult.width != null && activeResult.height != null ? (
                <div>
                  <dt>Size</dt>
                  <dd>
                    {activeResult.width}×{activeResult.height}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>Created</dt>
                <dd>{formatWhen(activeResult.createdAt)}</dd>
              </div>
            </dl>
            <div className="gp-library__dialog-actions">
              {activeResult.url ? (
                <Button asChild variant="outline" size="lg" className="gp-button gp-button--outline">
                  <a href={activeResult.url} download>
                    <Download size={16} aria-hidden="true" />
                    Download
                  </a>
                </Button>
              ) : null}
              <Button asChild variant="outline" size="lg" className="gp-button gp-button--outline">
                <Link href={`/studio?prompt=${encodeURIComponent(activeResult.prompt)}`}>
                  <Wand2 size={16} aria-hidden="true" />
                  Use this prompt again
                </Link>
              </Button>
              <FavoriteToggle
                resultId={activeResult.id}
                favorite={activeResult.favorite}
                className="gp-library__dialog-favorite"
                onChange={handleFavoriteChange}
              />
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
