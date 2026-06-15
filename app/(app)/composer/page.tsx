"use client";

import { AlertTriangle, ImageIcon, Loader2, Wand2 } from "lucide-react";
import { useRef, useState } from "react";

import { createId, formatSeed, hashSeed } from "@/lib/domain";
import { DEFAULT_SELECTION, getModel, MODELS } from "@/lib/models";
import { EXAMPLE_MODEL_IDS, EXAMPLE_PROMPT, sampleSrc } from "@/lib/samples";
import type { GenerationResult } from "@/lib/types";

export default function ComposerPage() {
  const [prompt, setPrompt] = useState(
    "A quiet studio desk at night, five image models interpreting the same ceramic lamp.",
  );
  const [selectedModelIds, setSelectedModelIds] =
    useState<string[]>(DEFAULT_SELECTION);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  const canGenerate =
    prompt.trim().length > 0 && selectedModelIds.length > 0 && !isGenerating;

  function toggleModel(modelId: string) {
    setSelectedModelIds((current) =>
      current.includes(modelId)
        ? current.filter((id) => id !== modelId)
        : [...current, modelId],
    );
  }

  // Real generation: one /api/generate request per model, run concurrently.
  async function startGeneration() {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || selectedModelIds.length === 0 || isGenerating) {
      return;
    }

    const runId = createId("run");
    const createdAt = new Date().toISOString();
    const queued: GenerationResult[] = selectedModelIds.map((modelId) => ({
      id: createId("result"),
      runId,
      modelId,
      prompt: trimmedPrompt,
      createdAt,
      status: "generating",
      favorite: false,
      seed: hashSeed(`${trimmedPrompt}-${modelId}`),
    }));

    setIsGenerating(true);
    setResults(queued);
    window.setTimeout(
      () =>
        resultsRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }),
      0,
    );

    await Promise.all(
      queued.map(async (item) => {
        try {
          const response = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ modelId: item.modelId, prompt: trimmedPrompt }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data?.error ?? `Request failed (${response.status})`);
          }
          setResults((current) =>
            current.map((result) =>
              result.id === item.id
                ? {
                    ...result,
                    status: "complete",
                    url: data.url as string,
                    width: data.width as number | undefined,
                    height: data.height as number | undefined,
                    seed:
                      typeof data.seed === "number" ? data.seed : result.seed,
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
                      error instanceof Error
                        ? error.message
                        : "Generation failed",
                  }
                : result,
            ),
          );
        }
      }),
    );

    setIsGenerating(false);
  }

  return (
    <div className="gp-feature">
      <header className="gp-feature__head">
        <span className="gp-tag">Composer</span>
        <h1>One prompt, every model</h1>
        <p>
          Pick your models, run the prompt, and review the grid side by side.
          Live fal generation and seed variations wire in next.
        </p>
      </header>

      <section className="gp-workbench" aria-label="Generation workbench">
        <aside className="gp-panel gp-controls" aria-label="Prompt and model controls">
          <div className="gp-field">
            <label htmlFor="prompt">Prompt</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the image you want every model to attempt."
              rows={6}
            />
          </div>

          <div className="gp-selector" aria-label="Model selector">
            <div className="gp-sectionhead">
              <h2>Models</h2>
              <p>{selectedModelIds.length} selected</p>
            </div>
            <div className="gp-models">
              {MODELS.map((model) => {
                const selected = selectedModelIds.includes(model.id);
                return (
                  <label
                    className={`gp-model ${selected ? "is-selected" : ""}`}
                    key={model.id}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleModel(model.id)}
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
              onClick={startGeneration}
              disabled={!canGenerate}
              aria-busy={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="gp-spin" size={18} aria-hidden="true" />
              ) : (
                <Wand2 size={18} aria-hidden="true" />
              )}
              {isGenerating ? "Generating" : "Generate grid"}
            </button>
            <button
              className="gp-button gp-button--ghost"
              type="button"
              onClick={() => setSelectedModelIds(MODELS.map((model) => model.id))}
            >
              Select all
            </button>
          </div>
        </aside>

        <section className="gp-results" ref={resultsRef} aria-live="polite">
          <div className="gp-sectionhead">
            <div>
              <h2>Results</h2>
              <p>Outputs land here as soon as a run begins.</p>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="gp-example" aria-label="Example comparison">
              <div className="gp-example__head">
                <span className="gp-tag">
                  <ImageIcon size={13} aria-hidden="true" /> Example
                </span>
                <p>{EXAMPLE_PROMPT}</p>
              </div>
              <div className="gp-example__grid">
                {EXAMPLE_MODEL_IDS.map((id) => {
                  const model = getModel(id);
                  const seed = hashSeed(`${EXAMPLE_PROMPT}-${id}`);
                  const src = sampleSrc("example", id);
                  return (
                    <figure className="gp-tile-card" key={id}>
                      <div
                        className={`gp-art ${model.artClass}`}
                        role="img"
                        aria-label={`${model.name} interpretation of the example prompt`}
                      >
                        {src ? (
                          <img className="gp-art__img" src={src} alt="" loading="lazy" />
                        ) : null}
                        <span className="gp-art__caption">seed {formatSeed(seed)}</span>
                      </div>
                      <figcaption>
                        <strong>{model.name}</strong>
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
              <p className="gp-example__hint">
                Pick models and run your own prompt to replace this sample.
              </p>
            </div>
          ) : (
            <div className="gp-grid">
              {results.map((result) => {
                const model = getModel(result.modelId);
                return (
                  <article className="gp-result" key={result.id}>
                    <div
                      className={`gp-art ${model.artClass} ${
                        result.status === "generating" ? "is-loading" : ""
                      } ${result.status === "error" ? "is-error" : ""}`}
                      role="img"
                      aria-label={`${model.name} output`}
                    >
                      {result.status === "complete" && result.url ? (
                        <img
                          className="gp-art__img is-live"
                          src={result.url}
                          alt={`${model.name} output`}
                        />
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
                      {result.status === "complete" ? (
                        <span className="gp-art__caption">
                          seed {formatSeed(result.seed)}
                        </span>
                      ) : null}
                    </div>
                    <div className="gp-result__body">
                      <div>
                        <h3>{model.name}</h3>
                        <p>{result.error ?? model.description}</p>
                      </div>
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
