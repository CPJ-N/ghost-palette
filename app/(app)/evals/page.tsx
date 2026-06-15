"use client";

import { AlertTriangle, ImagePlus, Loader2, Target, Trophy } from "lucide-react";
import { useState } from "react";

import { createId, hashSeed } from "@/lib/domain";
import { generateOne } from "@/lib/generate";
import { getModel, MODELS } from "@/lib/models";
import { structuralSimilarity } from "@/lib/similarity";
import type { GenerationResult } from "@/lib/types";

const DEFAULT = ["flux2-pro", "flux2-dev", "flux1-dev", "sd35-large"];

type Scored = GenerationResult & { score?: number | null; rank?: number };

export default function EvalsPage() {
  const [referenceSrc, setReferenceSrc] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selected, setSelected] = useState<string[]>(DEFAULT);
  const [results, setResults] = useState<Scored[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const canRun =
    Boolean(referenceSrc) &&
    prompt.trim().length > 0 &&
    selected.length > 0 &&
    !isRunning;

  function onReference(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setReferenceSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id],
    );
  }

  async function run() {
    const trimmed = prompt.trim();
    if (!referenceSrc || !trimmed || selected.length === 0 || isRunning) {
      return;
    }

    const runId = createId("run");
    const createdAt = new Date().toISOString();
    const queued: Scored[] = selected.map((modelId) => ({
      id: createId("result"),
      runId,
      modelId,
      prompt: trimmed,
      createdAt,
      status: "generating",
      favorite: false,
      seed: hashSeed(`${trimmed}-${modelId}`),
    }));

    setIsRunning(true);
    setResults(queued);

    await Promise.all(
      queued.map(async (item) => {
        try {
          const data = await generateOne(item.modelId, trimmed);
          const score = await structuralSimilarity(referenceSrc, data.url);
          setResults((current) =>
            current.map((result) =>
              result.id === item.id
                ? {
                    ...result,
                    status: "complete",
                    url: data.url,
                    seed:
                      typeof data.seed === "number" ? data.seed : result.seed,
                    score,
                  }
                : result,
            ),
          );
        } catch (error) {
          setResults((current) =>
            current.map((result) =>
              result.id === item.id
                ? {
                    ...result,
                    status: "error",
                    error:
                      error instanceof Error ? error.message : "Generation failed",
                  }
                : result,
            ),
          );
        }
      }),
    );

    setResults((current) => {
      const ranked = current
        .filter((r) => typeof r.score === "number")
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      const rankMap = new Map(ranked.map((r, i) => [r.id, i + 1]));
      return current.map((r) => ({ ...r, rank: rankMap.get(r.id) }));
    });
    setIsRunning(false);
  }

  const sorted = [...results].sort(
    (a, b) => (a.rank ?? 999) - (b.rank ?? 999),
  );

  return (
    <div className="gp-feature">
      <header className="gp-feature__head">
        <span className="gp-tag">Evals</span>
        <h1>Reference comparison</h1>
        <p>
          Upload a target image, generate with each model, and see which gets
          closest — side by side and by structural similarity.
        </p>
      </header>

      <section className="gp-workbench" aria-label="Evals workbench">
        <aside className="gp-panel gp-controls">
          <div className="gp-field">
            <label htmlFor="evals-ref">Reference image</label>
            <label className="gp-dropzone" htmlFor="evals-ref">
              <input
                id="evals-ref"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onReference}
                hidden
              />
              {referenceSrc ? (
                <img
                  src={referenceSrc}
                  alt="Reference"
                  className="gp-dropzone__preview"
                />
              ) : (
                <span className="gp-dropzone__empty">
                  <ImagePlus size={22} aria-hidden="true" />
                  Upload a target image
                </span>
              )}
            </label>
          </div>

          <div className="gp-field">
            <label htmlFor="evals-prompt">Prompt</label>
            <textarea
              id="evals-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={4}
              placeholder="The prompt each model will attempt to match the reference."
            />
          </div>

          <div className="gp-selector">
            <div className="gp-sectionhead">
              <h2>Models</h2>
              <p>{selected.length} selected</p>
            </div>
            <div className="gp-models">
              {MODELS.map((model) => {
                const sel = selected.includes(model.id);
                return (
                  <label className={`gp-model ${sel ? "is-selected" : ""}`} key={model.id}>
                    <input
                      type="checkbox"
                      checked={sel}
                      onChange={() => toggle(model.id)}
                    />
                    <span className="gp-model__body">
                      <span className="gp-model__top">
                        <strong>{model.name}</strong>
                      </span>
                      <span>{model.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="gp-actions">
            <button
              className="gp-button gp-button--primary"
              type="button"
              onClick={run}
              disabled={!canRun}
              aria-busy={isRunning}
            >
              {isRunning ? (
                <Loader2 className="gp-spin" size={18} aria-hidden="true" />
              ) : (
                <Target size={18} aria-hidden="true" />
              )}
              {isRunning ? "Comparing" : "Generate & compare"}
            </button>
          </div>
        </aside>

        <section className="gp-results" aria-live="polite">
          <div className="gp-sectionhead">
            <div>
              <h2>Comparison</h2>
              <p>
                {results.length === 0
                  ? "Upload a reference and run to compare."
                  : "Ranked by structural similarity to your reference."}
              </p>
            </div>
          </div>

          {referenceSrc ? (
            <div className="gp-evalref">
              <div className="gp-art">
                <img className="gp-art__img is-live" src={referenceSrc} alt="Reference" />
                <span className="gp-art__caption">Reference</span>
              </div>
              <div>
                <strong>Your target</strong>
                <p>Every model below is scored against this image.</p>
              </div>
            </div>
          ) : null}

          {results.length === 0 ? (
            <div className="gp-listempty">No comparison yet.</div>
          ) : (
            <div className="gp-grid">
              {sorted.map((result) => {
                const model = getModel(result.modelId);
                return (
                  <article
                    className={`gp-result ${result.rank === 1 ? "is-winner" : ""}`}
                    key={result.id}
                  >
                    <div
                      className={`gp-art ${model.artClass} ${
                        result.status === "generating" ? "is-loading" : ""
                      } ${result.status === "error" ? "is-error" : ""}`}
                      role="img"
                      aria-label={model.name}
                    >
                      {result.status === "complete" && result.url ? (
                        <img className="gp-art__img is-live" src={result.url} alt="" />
                      ) : null}
                      {result.status === "generating" ? (
                        <span className="gp-art__state">
                          <Loader2 className="gp-spin" size={20} aria-hidden="true" />
                          Rendering
                        </span>
                      ) : null}
                      {result.status === "error" ? (
                        <span className="gp-art__state">
                          <AlertTriangle size={20} aria-hidden="true" />
                          Failed
                        </span>
                      ) : null}
                      {result.rank === 1 ? (
                        <span className="gp-versus__crown">
                          <Trophy size={15} aria-hidden="true" /> Closest
                        </span>
                      ) : null}
                    </div>
                    <div className="gp-result__body">
                      <div>
                        <h3>{model.name}</h3>
                        {result.rank ? <p>Rank #{result.rank}</p> : null}
                      </div>
                      {typeof result.score === "number" ? (
                        <div className="gp-score">
                          <span className="gp-score__val">{result.score}</span>
                          <span className="gp-score__unit">match</span>
                        </div>
                      ) : result.status === "complete" ? (
                        <div className="gp-score gp-score--na">—</div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
