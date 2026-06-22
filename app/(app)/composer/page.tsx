"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ComposerBackdrop } from "@/components/composer-backdrop";
import { SaveRunButton } from "@/components/save-run-button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createId, formatSeed, hashSeed } from "@/lib/domain";
import { DEFAULT_SELECTION, getModel, MODELS } from "@/lib/models";
import type { GenerationResult } from "@/lib/types";

const ASPECTS = ["1:1", "4:5", "3:4", "16:9"] as const;
type Aspect = (typeof ASPECTS)[number];

export default function ComposerPage() {
  const [prompt, setPrompt] = useState("");
  const [selectedModelIds, setSelectedModelIds] =
    useState<string[]>(DEFAULT_SELECTION);
  const [aspect, setAspect] = useState<Aspect>("1:1");
  const [quantity, setQuantity] = useState(1);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const totalImages = selectedModelIds.length * quantity;
  const hasResults = results.length > 0;
  const canGenerate =
    prompt.trim().length > 0 && selectedModelIds.length > 0 && !isGenerating;

  const aspectLabel = useMemo(() => aspect, [aspect]);

  function toggleModel(modelId: string) {
    setSelectedModelIds((current) =>
      current.includes(modelId)
        ? current.filter((id) => id !== modelId)
        : [...current, modelId],
    );
  }

  function cycleAspect() {
    setAspect((current) => {
      const index = ASPECTS.indexOf(current);
      return ASPECTS[(index + 1) % ASPECTS.length];
    });
  }

  async function startGeneration() {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || selectedModelIds.length === 0 || isGenerating) {
      return;
    }

    const runId = createId("run");
    const createdAt = new Date().toISOString();
    const queued: GenerationResult[] = [];

    for (const modelId of selectedModelIds) {
      for (let copy = 0; copy < quantity; copy += 1) {
        queued.push({
          id: createId("result"),
          runId,
          modelId,
          prompt: trimmedPrompt,
          createdAt,
          status: "generating",
          favorite: false,
          seed: hashSeed(`${trimmedPrompt}-${modelId}-${copy}`),
        });
      }
    }

    setIsGenerating(true);
    setResults(queued);

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

  const allDone =
    results.length > 0 && results.every((result) => result.status !== "generating");

  return (
    <div className="gp-composer-studio">
      <ComposerBackdrop />
      <div className="gp-composer-studio__veil" aria-hidden="true" />

      <div className="gp-composer-studio__content">
        {!hasResults ? (
          <h1 className="gp-composer-studio__headline">
            Describe an image, then run it across models.
          </h1>
        ) : (
          <section className="gp-composer-studio__results" aria-live="polite">
            <header className="gp-composer-studio__results-head">
              <div>
                <h2>Comparison grid</h2>
                <p>{results.length} outputs · {aspectLabel}</p>
              </div>
              {allDone ? (
                <SaveRunButton mode="composer" prompt={prompt} results={results} />
              ) : null}
            </header>

            <div className="gp-composer-studio__grid">
              {results.map((result) => {
                const model = getModel(result.modelId);
                return (
                  <article className="gp-composer-studio__tile" key={result.id}>
                    <div
                      className={`gp-art ${model.artClass} ${
                        result.status === "generating" ? "is-loading" : ""
                      } ${result.status === "error" ? "is-error" : ""}`}
                      role="img"
                      aria-label={`${model.name} output`}
                    >
                      {result.status === "complete" && result.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
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
                    <div className="gp-composer-studio__tile-meta">
                      <strong>{model.name}</strong>
                      {result.error ? <span>{result.error}</span> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="gp-composer-dock" aria-label="Composer prompt">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Describe your image…"
          rows={3}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void startGeneration();
            }
          }}
        />

        <div className="gp-composer-dock__bar">
          <div className="gp-composer-dock__left">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="gp-composer-dock__pill">
                  {selectedModelIds.length} model
                  {selectedModelIds.length === 1 ? "" : "s"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="gp-composer-dock__menu">
                <DropdownMenuLabel>Models</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {MODELS.map((model) => (
                  <DropdownMenuCheckboxItem
                    key={model.id}
                    checked={selectedModelIds.includes(model.id)}
                    onCheckedChange={() => toggleModel(model.id)}
                    onSelect={(event) => event.preventDefault()}
                  >
                    {model.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              className="gp-composer-dock__pill"
              onClick={cycleAspect}
              aria-label={`Aspect ratio ${aspectLabel}`}
            >
              {aspectLabel}
            </button>

            <div className="gp-composer-dock__stepper" aria-label="Quantity per model">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={quantity <= 1 || isGenerating}
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                <Minus size={14} aria-hidden="true" />
              </button>
              <span>{quantity}x</span>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={quantity >= 4 || isGenerating}
                onClick={() => setQuantity((value) => Math.min(4, value + 1))}
              >
                <Plus size={14} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="gp-composer-dock__right">
            <span className="gp-composer-dock__count">
              {totalImages} image{totalImages === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              className="gp-composer-dock__run"
              disabled={!canGenerate}
              onClick={() => void startGeneration()}
              aria-busy={isGenerating}
              aria-label="Generate"
            >
              {isGenerating ? (
                <Loader2 className="gp-spin" size={20} aria-hidden="true" />
              ) : (
                <ArrowUpRight size={20} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
