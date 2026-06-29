"use client";

import {
  AlertTriangle,
  ArrowUp,
  BadgeCheck,
  Eye,
  EyeOff,
  GalleryHorizontalEnd,
  Library,
  Loader2,
  Minus,
  Plus,
  Settings,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ComposerBackdrop } from "@/components/composer-backdrop";
import { SaveRunButton } from "@/components/save-run-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

import { useCredits } from "@/hooks/use-credits";
import { createId, hashSeed } from "@/lib/domain";
import { generateOne } from "@/lib/generate";
import { getModel, MODELS } from "@/lib/models";
import type { GenerationResult } from "@/lib/types";

const DEFAULT = ["flux2-pro", "flux2-dev"];
const MAX_BATCH_SIZE = 4;

export default function ArenaPage() {
  const [prompt, setPrompt] = useState("");
  const [selected, setSelected] = useState<string[]>(DEFAULT);
  const [batchSize, setBatchSize] = useState(1);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [blind, setBlind] = useState(true);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const { credits, creditError, isLoadingCredits, refreshCredits } = useCredits();

  const selectedCost = useMemo(
    () =>
      selected.reduce(
        (sum, modelId) => sum + getModel(modelId).creditCost,
        0,
      ) * batchSize,
    [batchSize, selected],
  );
  const hasInsufficientCredits =
    typeof credits?.balance === "number" && credits.balance < selectedCost;
  const hasCreditBlock = Boolean(creditError && !credits);
  const isComparison = selected.length > 1;
  const imageCount = selected.length * batchSize;

  const canGenerate =
    prompt.trim().length > 0 &&
    selected.length >= 1 &&
    !isGenerating &&
    !hasInsufficientCredits &&
    !hasCreditBlock;

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id],
    );
  }

  function changeBatchSize(delta: number) {
    setBatchSize((current) =>
      Math.min(MAX_BATCH_SIZE, Math.max(1, current + delta)),
    );
  }

  async function start() {
    const trimmed = prompt.trim();
    if (!trimmed || selected.length < 1 || isGenerating) {
      return;
    }

    const latestCredits = await refreshCredits();
    if (!latestCredits) {
      setRunError("Credits are unavailable. Check the Supabase connection.");
      return;
    }
    if (latestCredits.balance < selectedCost) {
      setRunError(
        `This run needs ${selectedCost} credits. You have ${latestCredits.balance}.`,
      );
      return;
    }

    setWinnerId(null);
    setRevealed(false);
    setRunError(null);

    const runId = createId("run");
    const createdAt = new Date().toISOString();
    const queued: GenerationResult[] = selected.flatMap((modelId) =>
      Array.from({ length: batchSize }, (_, variantIndex) => ({
        id: createId("result"),
        runId,
        modelId,
        prompt: trimmed,
        createdAt,
        status: "generating" as const,
        favorite: false,
        seed: hashSeed(`${trimmed}-${modelId}-${variantIndex}`),
      })),
    );

    setIsGenerating(true);
    setResults(queued);

    await Promise.all(
      queued.map(async (item) => {
        try {
          const data = await generateOne(item.modelId, trimmed, {
            seed: item.seed,
          });
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
    await refreshCredits();
  }

  const allDone = results.length > 0 && results.every((r) => r.status !== "generating");
  const hasCompleteResults = results.some((r) => r.status === "complete");
  const showNames = revealed || !blind || !isComparison;
  const composerNotice =
    runError ??
    (hasInsufficientCredits
      ? `This run needs ${selectedCost} credits. Add credits to continue.`
      : hasCreditBlock
        ? "Credits are unavailable. Check the Supabase connection."
        : creditError);

  return (
    <div className="gp-composer-studio">
      <ComposerBackdrop />
      <div className="gp-composer-studio__veil" />

      <header className="gp-composer-topbar" aria-label="Studio navigation">
        <Link href="/" className="gp-composer-topbar__brand">
          <span className="gp-mark" aria-hidden="true">
            GP
          </span>
          <span>Ghost Palette</span>
        </Link>
        <div className="gp-composer-topbar__right">
          <span className="gp-composer-topbar__status">
            <BadgeCheck size={15} aria-hidden="true" />
            {isLoadingCredits && !credits
              ? "Checking credits"
              : credits
                ? `${credits.balance} credits`
                : "Credits unavailable"}
          </span>
          <button
            className="gp-composer-topbar__pill"
            type="button"
            onClick={() => setBlind((value) => !value)}
            disabled={!isComparison}
          >
            {blind ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
            {isComparison ? (blind ? "Blind" : "Named") : "Named"}
          </button>
          <Link className="gp-composer-topbar__pill" href="/library">
            <Library size={15} aria-hidden="true" />
            Library
          </Link>
          <Link className="gp-composer-topbar__icon" href="/pricing" aria-label="Pricing">
            <GalleryHorizontalEnd size={17} aria-hidden="true" />
          </Link>
          <Link className="gp-composer-topbar__icon" href="/settings" aria-label="Settings">
            <Settings size={17} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="gp-composer-studio__content" aria-live="polite">
        {results.length === 0 ? (
          <h1 className="gp-composer-studio__headline">
            Describe an image, then run it across models.
          </h1>
        ) : (
          <div className="gp-composer-studio__results">
            <div className="gp-composer-studio__results-head">
              <div>
                <h1>
                  {winnerId
                    ? "Your pick"
                    : isComparison
                      ? "Pick the strongest image"
                      : "Generated image"}
                </h1>
                <p>
                  {allDone && isComparison && !winnerId
                    ? "Choose the output that best matches the prompt."
                    : allDone
                      ? "Save the output or run another direction."
                      : "Images appear here as models finish."}
                </p>
              </div>
              {winnerId || (allDone && hasCompleteResults) ? (
                <SaveRunButton
                  mode="arena"
                  prompt={prompt}
                  results={results}
                  winnerId={winnerId ?? undefined}
                />
              ) : null}
            </div>

            <div className="gp-composer-studio__grid">
              {results.map((result, index) => {
                const model = getModel(result.modelId);
                const isWinner = winnerId === result.id;
                const modelLabel = showNames
                  ? model.name
                  : `Model ${String.fromCharCode(65 + index)}`;

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
                      aria-label={modelLabel}
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
                      <h2>{modelLabel}</h2>
                      {result.status === "complete" && isComparison ? (
                        <Button
                          variant={isWinner ? "default" : "ghost"}
                          size="lg"
                          className={`gp-button ${isWinner ? "gp-button--primary" : "gp-button--ghost"}`}
                          type="button"
                          onClick={() => {
                            setWinnerId(result.id);
                            setRevealed(true);
                          }}
                          disabled={Boolean(winnerId) && !isWinner}
                        >
                          {isWinner ? "Winner" : "Pick"}
                        </Button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <form
        className="gp-composer-dock"
        onSubmit={(event) => {
          event.preventDefault();
          void start();
        }}
      >
        <Textarea
          aria-label="Prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={3}
          placeholder="Describe your image..."
        />

        <div className="gp-composer-dock__bar">
          <div className="gp-composer-dock__left">
            <button
              className="gp-composer-dock__icon"
              type="button"
              onClick={() => setPrompt("")}
              aria-label="Clear prompt"
            >
              <Plus size={18} aria-hidden="true" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger className="gp-composer-dock__pill" type="button">
                {selected.length} model{selected.length === 1 ? "" : "s"}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="gp-composer-dock__menu" align="start">
                <DropdownMenuLabel>Models</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {MODELS.map((model) => (
                  <DropdownMenuCheckboxItem
                    key={model.id}
                    checked={selected.includes(model.id)}
                    onCheckedChange={() => toggle(model.id)}
                    onSelect={(event) => event.preventDefault()}
                  >
                    <span className="gp-composer-dock__model">
                      <strong>{model.name}</strong>
                      <span>
                        {model.creditCost} credit{model.creditCost === 1 ? "" : "s"}
                      </span>
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button className="gp-composer-dock__pill" type="button">
              1:1
            </button>

            <span className="gp-composer-dock__stepper" aria-label="Images per model">
              <button
                type="button"
                onClick={() => changeBatchSize(-1)}
                disabled={batchSize <= 1}
                aria-label="Generate fewer images per model"
              >
                <Minus size={14} aria-hidden="true" />
              </button>
              <strong>{batchSize}x</strong>
              <button
                type="button"
                onClick={() => changeBatchSize(1)}
                disabled={batchSize >= MAX_BATCH_SIZE}
                aria-label="Generate more images per model"
              >
                <Plus size={14} aria-hidden="true" />
              </button>
            </span>
          </div>

          <div className="gp-composer-dock__right">
            <span className="gp-composer-dock__count">
              {imageCount} image{imageCount === 1 ? "" : "s"} · {selectedCost} credit
              {selectedCost === 1 ? "" : "s"}
            </span>
            <button
              className="gp-composer-dock__run"
              type="submit"
              disabled={!canGenerate}
              aria-busy={isGenerating}
              aria-label="Generate images"
            >
              {isGenerating ? (
                <Loader2 className="gp-spin" size={20} aria-hidden="true" />
              ) : (
                <ArrowUp size={20} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {composerNotice ? (
          <p className="gp-composer-dock__notice">
            {composerNotice}
            {hasInsufficientCredits ? <Link href="/pricing">Add credits</Link> : null}
          </p>
        ) : null}
      </form>
    </div>
  );
}
