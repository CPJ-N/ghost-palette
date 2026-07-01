"use client";

import {
  ArrowUp,
  ChevronDown,
  CloudOff,
  ImagePlus,
  Layers,
  Loader2,
  MousePointer2,
  PenLine,
  Redo2,
  Shapes,
  Type,
  Undo2,
} from "lucide-react";
import posthog from "posthog-js";
import { useCallback, useRef, useState } from "react";

import { RefineCompare } from "@/components/refine-compare";
import { createId, hashSeed } from "@/lib/domain";
import { generateOne } from "@/lib/generate";
import { getModel } from "@/lib/models";
import { structuralSimilarity } from "@/lib/similarity";

const TIERS = {
  classic: { label: "Classic", modelId: "flux2-dev" },
  premium: { label: "Premium", modelId: "flux2-pro" },
} as const;

type Tier = keyof typeof TIERS;

type ChatTurn = {
  id: string;
  prompt: string;
  modelId: string;
  imageUrl?: string;
  score?: number | null;
  status: "generating" | "complete" | "error";
  error?: string;
  createdAt: string;
  /** False when the generation succeeded but the durable save failed. */
  persisted?: boolean;
};

export default function EvalsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [referenceSrc, setReferenceSrc] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState("Untitled");
  // One run id per Refine session — every turn in this session groups under it.
  const [sessionRunId] = useState(() => createId("run"));
  const [tier, setTier] = useState<Tier>("premium");
  const [canvasInfluence, setCanvasInfluence] = useState(60);
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [zoom] = useState(100);

  const completedTurns = turns.filter((t) => t.status === "complete" && t.imageUrl);
  const renderIndex =
    historyIndex >= 0 ? historyIndex : Math.max(0, completedTurns.length - 1);
  const activeTurn = completedTurns[renderIndex];
  const activeOutput = activeTurn?.imageUrl ?? null;
  const pendingTurn = turns.find((t) => t.status === "generating");

  const onReference = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setReferenceSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const scrollChat = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  async function sendPrompt() {
    const trimmed = draft.trim();
    if (!referenceSrc || !trimmed || isRunning) return;

    if (sessionName === "Untitled") {
      setSessionName(trimmed.split(/\s+/).slice(0, 3).join(" ") || "Refine");
    }

    const modelId = TIERS[tier].modelId;
    const turnId = createId("turn");
    const createdAt = new Date().toISOString();
    const influenceNote =
      canvasInfluence >= 50
        ? " Preserve the composition and structure of the reference image."
        : "";

    posthog.capture("refine_turn_started", {
      run_id: sessionRunId,
      result_id: turnId,
      model_id: modelId,
      tier,
      canvas_influence: canvasInfluence,
      turn_number: turns.length + 1,
    });

    setDraft("");
    setIsRunning(true);
    setTurns((current) => [
      ...current,
      {
        id: turnId,
        prompt: trimmed,
        modelId,
        status: "generating",
        createdAt,
      },
    ]);
    scrollChat();

    try {
      const data = await generateOne(modelId, `${trimmed}${influenceNote}`, {
        imageUrl: canvasInfluence > 0 ? referenceSrc : undefined,
        seed: hashSeed(`${trimmed}-${modelId}-${canvasInfluence}`),
        runId: sessionRunId,
        resultId: turnId,
        mode: "eval",
      });
      const score = await structuralSimilarity(referenceSrc, data.url);

      setTurns((current) => {
        const updated = current.map((turn) =>
          turn.id === turnId
            ? {
                ...turn,
                status: "complete" as const,
                imageUrl: data.url,
                score,
                persisted: data.persisted,
              }
            : turn,
        );
        const completed = updated.filter(
          (turn) => turn.status === "complete" && turn.imageUrl,
        );
        setHistoryIndex(completed.length - 1);
        return updated;
      });
    } catch (error) {
      setTurns((current) =>
        current.map((turn) =>
          turn.id === turnId
            ? {
                ...turn,
                status: "error",
                error: error instanceof Error ? error.message : "Generation failed",
              }
            : turn,
        ),
      );
    } finally {
      setIsRunning(false);
      scrollChat();
    }
  }

  function undoRender() {
    const idx = historyIndex >= 0 ? historyIndex : Math.max(0, completedTurns.length - 1);
    if (idx > 0) setHistoryIndex(idx - 1);
  }

  function redoRender() {
    const idx = historyIndex >= 0 ? historyIndex : Math.max(0, completedTurns.length - 1);
    if (idx < completedTurns.length - 1) setHistoryIndex(idx + 1);
  }

  const canSend = Boolean(referenceSrc) && draft.trim().length > 0 && !isRunning;

  return (
    <div className="gp-refine-studio">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={onReference}
        hidden
      />

      <header className="gp-refine__toolbar" aria-label="Refine tools">
        <div className="gp-refine__tools">
          <button type="button" className="gp-refine__tool is-active" aria-label="Select">
            <MousePointer2 size={16} aria-hidden="true" />
          </button>
          <button type="button" className="gp-refine__tool" aria-label="Draw" disabled>
            <PenLine size={16} aria-hidden="true" />
          </button>
          <button type="button" className="gp-refine__tool" aria-label="Shapes" disabled>
            <Shapes size={16} aria-hidden="true" />
          </button>
          <button type="button" className="gp-refine__tool" aria-label="Text" disabled>
            <Type size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="gp-refine__tool"
            aria-label="Upload reference"
            onClick={() => fileRef.current?.click()}
          >
            <Layers size={16} aria-hidden="true" />
          </button>
        </div>

        <nav className="gp-refine__crumb" aria-label="Session">
          <span>GP</span>
          <span aria-hidden="true">/</span>
          <span>{sessionName}</span>
        </nav>

        <div className="gp-refine__toolbar-right">
          <button
            type="button"
            className="gp-refine__tool"
            aria-label="Undo render"
            onClick={undoRender}
            disabled={renderIndex <= 0 || completedTurns.length === 0}
          >
            <Undo2 size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="gp-refine__tool"
            aria-label="Redo render"
            onClick={redoRender}
            disabled={renderIndex >= completedTurns.length - 1 || completedTurns.length === 0}
          >
            <Redo2 size={16} aria-hidden="true" />
          </button>
          <span className="gp-refine__zoom" aria-live="polite">
            {zoom}%
          </span>
          <button type="button" className="gp-refine__menu" aria-label="View options">
            Split
            <ChevronDown size={14} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="gp-refine__workspace">
        <section className="gp-refine__canvas" aria-label="Canvas">
          {referenceSrc ? (
            <RefineCompare
              beforeSrc={referenceSrc}
              afterSrc={activeOutput}
              afterLoading={Boolean(pendingTurn)}
            />
          ) : (
            <button
              type="button"
              className="gp-refine__upload"
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus size={28} aria-hidden="true" />
              <strong>Upload a reference</strong>
              <span>Sketch, photo, or prior render — then refine it in chat.</span>
            </button>
          )}
        </section>

        <aside className="gp-refine__chat" aria-label="Refine chat">
          <header className="gp-refine__chat-head">
            <h2>Chat</h2>
          </header>

          <div className="gp-refine__messages">
            {turns.length === 0 ? (
              <p className="gp-refine__chat-empty">
                Upload a reference, describe the refinement, and compare the output on
                canvas.
              </p>
            ) : (
              turns.map((turn) => (
                <article key={turn.id} className="gp-refine__message">
                  <div className="gp-refine__bubble">
                    <p>{turn.prompt}</p>
                  </div>
                  {turn.status === "generating" ? (
                    <div className="gp-refine__thumb gp-refine__thumb--loading">
                      <Loader2 className="gp-spin" size={18} aria-hidden="true" />
                    </div>
                  ) : null}
                  {turn.status === "complete" && turn.imageUrl ? (
                    <button
                      type="button"
                      className="gp-refine__thumb"
                      onClick={() => {
                        const idx = completedTurns.findIndex((t) => t.id === turn.id);
                        if (idx >= 0) setHistoryIndex(idx);
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={turn.imageUrl} alt="" />
                      <span>{getModel(turn.modelId).name}</span>
                      {typeof turn.score === "number" ? (
                        <span className="gp-refine__score">{turn.score} match</span>
                      ) : null}
                      {turn.persisted === false ? (
                        <span
                          className="gp-refine__sync-state"
                          title="Generated, but the durable save failed — this image may not appear in your Gallery."
                        >
                          <CloudOff size={13} aria-hidden="true" />
                          Didn&apos;t sync
                        </span>
                      ) : null}
                    </button>
                  ) : null}
                  {turn.status === "error" ? (
                    <p className="gp-refine__error">{turn.error ?? "Failed"}</p>
                  ) : null}
                </article>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <footer className="gp-refine__composer">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={2}
              placeholder="Ask or request anything…"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendPrompt();
                }
              }}
            />

            <div className="gp-refine__composer-meta">
              <div className="gp-refine__tiers" role="group" aria-label="Model tier">
                {(Object.keys(TIERS) as Tier[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`gp-refine__tier ${tier === key ? "is-active" : ""}`}
                    onClick={() => setTier(key)}
                  >
                    {TIERS[key].label}
                  </button>
                ))}
              </div>

              <label className="gp-refine__influence">
                <span>Canvas Influence</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={canvasInfluence}
                  onChange={(event) => setCanvasInfluence(Number(event.target.value))}
                />
                <span className="gp-refine__influence-val">{canvasInfluence}%</span>
              </label>
            </div>

            <button
              type="button"
              className="gp-refine__send"
              disabled={!canSend}
              onClick={() => void sendPrompt()}
              aria-label="Send prompt"
            >
              {isRunning ? (
                <Loader2 className="gp-spin" size={18} aria-hidden="true" />
              ) : (
                <ArrowUp size={18} aria-hidden="true" />
              )}
            </button>
          </footer>
        </aside>
      </div>
    </div>
  );
}
