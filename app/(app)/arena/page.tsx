"use client";

import { AlertTriangle, Eye, EyeOff, Loader2, Swords, Trophy } from "lucide-react";
import { useState } from "react";

import { SaveRunButton } from "@/components/save-run-button";

import { createId, hashSeed } from "@/lib/domain";
import { generateOne } from "@/lib/generate";
import { getModel, MODELS } from "@/lib/models";
import type { GenerationResult } from "@/lib/types";

const DEFAULT = ["flux2-pro", "flux2-dev", "flux1-dev"];

export default function ArenaPage() {
  const [prompt, setPrompt] = useState(
    "A lone lighthouse on a rocky coast at dusk, dramatic clouds.",
  );
  const [selected, setSelected] = useState<string[]>(DEFAULT);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [blind, setBlind] = useState(true);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const canGenerate =
    prompt.trim().length > 0 && selected.length >= 2 && !isGenerating;

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id],
    );
  }

  async function start() {
    const trimmed = prompt.trim();
    if (!trimmed || selected.length < 2 || isGenerating) {
      return;
    }
    setWinnerId(null);
    setRevealed(false);

    const runId = createId("run");
    const createdAt = new Date().toISOString();
    const queued: GenerationResult[] = selected.map((modelId) => ({
      id: createId("result"),
      runId,
      modelId,
      prompt: trimmed,
      createdAt,
      status: "generating",
      favorite: false,
      seed: hashSeed(`${trimmed}-${modelId}`),
    }));

    setIsGenerating(true);
    setResults(queued);

    await Promise.all(
      queued.map(async (item) => {
        try {
          const data = await generateOne(item.modelId, trimmed);
          setResults((current) =>
            current.map((result) =>
              result.id === item.id
                ? {
                    ...result,
                    status: "complete",
                    url: data.url,
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
                      error instanceof Error ? error.message : "Generation failed",
                  }
                : result,
            ),
          );
        }
      }),
    );

    setIsGenerating(false);
  }

  const allDone = results.length > 0 && results.every((r) => r.status !== "generating");
  const showNames = revealed || !blind;

  return (
    <div className="gp-feature">
      <header className="gp-feature__head">
        <span className="gp-tag">Arena</span>
        <h1>Judge models head to head</h1>
        <p>
          Run the same prompt through two or more models, compare the outputs,
          and record which model produced the stronger result
          {blind ? " with names hidden until you choose." : "."}
        </p>
      </header>

      <section className="gp-workbench" aria-label="Arena workbench">
        <aside className="gp-panel gp-controls">
          <div className="gp-field">
            <label htmlFor="arena-prompt">Prompt</label>
            <textarea
              id="arena-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={5}
              placeholder="Describe the image the models will compete on."
            />
          </div>

          <div className="gp-selector">
            <div className="gp-sectionhead">
              <h2>Contenders</h2>
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
              onClick={start}
              disabled={!canGenerate}
              aria-busy={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="gp-spin" size={18} aria-hidden="true" />
              ) : (
                <Swords size={18} aria-hidden="true" />
              )}
              {isGenerating ? "Generating" : "Start arena"}
            </button>
            <button
              className="gp-button gp-button--ghost"
              type="button"
              onClick={() => setBlind((value) => !value)}
            >
              {blind ? (
                <EyeOff size={16} aria-hidden="true" />
              ) : (
                <Eye size={16} aria-hidden="true" />
              )}
              {blind ? "Blind" : "Named"}
            </button>
          </div>
        </aside>

        <section className="gp-results" aria-live="polite">
          <div className="gp-sectionhead">
            <div>
              <h2>{winnerId ? "Your pick" : "Pick the winner"}</h2>
              <p>
                {results.length === 0
                  ? "Run an arena to compare models head-to-head."
                  : allDone && !winnerId
                    ? "Click the strongest result."
                    : "Outputs appear here as they finish."}
              </p>
            </div>
            {winnerId ? (
              <SaveRunButton
                mode="arena"
                prompt={prompt}
                results={results}
                winnerId={winnerId}
              />
            ) : null}
          </div>

          {results.length === 0 ? (
            <div className="gp-listempty">
              Pick at least two models and start an arena.
            </div>
          ) : (
            <div className="gp-grid">
              {results.map((result, index) => {
                const model = getModel(result.modelId);
                const isWinner = winnerId === result.id;
                return (
                  <article
                    className={`gp-result gp-versus ${isWinner ? "is-winner" : ""}`}
                    key={result.id}
                  >
                    <div
                      className={`gp-art ${model.artClass} ${
                        result.status === "generating" ? "is-loading" : ""
                      } ${result.status === "error" ? "is-error" : ""}`}
                      role="img"
                      aria-label={showNames ? model.name : `Model ${String.fromCharCode(65 + index)}`}
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
                      {isWinner ? (
                        <span className="gp-versus__crown">
                          <Trophy size={15} aria-hidden="true" /> Winner
                        </span>
                      ) : null}
                    </div>
                    <div className="gp-result__body">
                      <div>
                        <h3>
                          {showNames
                            ? model.name
                            : `Model ${String.fromCharCode(65 + index)}`}
                        </h3>
                      </div>
                      {result.status === "complete" ? (
                        <button
                          className={`gp-button ${isWinner ? "gp-button--primary" : "gp-button--ghost"}`}
                          type="button"
                          onClick={() => {
                            setWinnerId(result.id);
                            setRevealed(true);
                          }}
                          disabled={Boolean(winnerId) && !isWinner}
                        >
                          {isWinner ? "Winner" : "Pick"}
                        </button>
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
