"use client";

import {
  AlertTriangle,
  Check,
  Clock3,
  Command,
  Eye,
  EyeOff,
  Heart,
  History,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  Search,
  Star,
  Wand2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";

type Provider = "openai" | "google" | "bfl" | "stability" | "ideogram";

type ModelDefinition = {
  id: string;
  name: string;
  provider: Provider;
  description: string;
  adapter: string;
  artClass: string;
};

type GenerationStatus = "generating" | "complete" | "error";

type GenerationResult = {
  id: string;
  runId: string;
  modelId: string;
  prompt: string;
  createdAt: string;
  status: GenerationStatus;
  favorite: boolean;
  seed: number;
  error?: string;
};

type HistoryRun = {
  id: string;
  prompt: string;
  createdAt: string;
  modelIds: string[];
  results: GenerationResult[];
};

const STORAGE_KEYS = {
  keys: "ghost-palette:api-keys",
  history: "ghost-palette:generation-history",
  favorites: "ghost-palette:favorites",
};

const PROVIDERS: Array<{
  id: Provider;
  name: string;
  helper: string;
}> = [
  {
    id: "openai",
    name: "OpenAI",
    helper: "Images API key",
  },
  {
    id: "google",
    name: "Google",
    helper: "Imagen or Gemini key",
  },
  {
    id: "bfl",
    name: "Black Forest Labs",
    helper: "Flux API key",
  },
  {
    id: "stability",
    name: "Stability AI",
    helper: "Stable Diffusion key",
  },
  {
    id: "ideogram",
    name: "Ideogram",
    helper: "Ideogram key",
  },
];

const MODELS: ModelDefinition[] = [
  {
    id: "openai-images",
    name: "OpenAI Images",
    provider: "openai",
    description: "General-purpose composition and prompt following.",
    adapter: "adapter pending",
    artClass: "art-openai",
  },
  {
    id: "imagen",
    name: "Imagen",
    provider: "google",
    description: "Photographic scenes and grounded visual detail.",
    adapter: "adapter pending",
    artClass: "art-google",
  },
  {
    id: "flux-pro",
    name: "Flux Pro",
    provider: "bfl",
    description: "Graphic design, texture, and fast visual iteration.",
    adapter: "adapter pending",
    artClass: "art-bfl",
  },
  {
    id: "sd-large",
    name: "SD Large",
    provider: "stability",
    description: "Open ecosystem baseline for broad comparison.",
    adapter: "adapter pending",
    artClass: "art-stability",
  },
  {
    id: "ideogram",
    name: "Ideogram",
    provider: "ideogram",
    description: "Text-aware layouts, posters, and product marks.",
    adapter: "adapter pending",
    artClass: "art-ideogram",
  },
];

const EMPTY_KEYS: Record<Provider, string> = {
  openai: "",
  google: "",
  bfl: "",
  stability: "",
  ideogram: "",
};

const DEFAULT_SELECTION = ["openai-images", "imagen", "flux-pro"];

const EXAMPLE_PROMPT =
  "A weathered brass compass resting on a linen map, soft window light.";
const EXAMPLE_MODEL_IDS = ["openai-images", "imagen", "flux-pro", "sd-large"];
const SHOWCASE_PROMPT =
  "Studio still life — a single ripe persimmon on a concrete plinth, raking light.";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function hashSeed(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash % 10000);
}

function getModel(modelId: string) {
  return MODELS.find((model) => model.id === modelId) ?? MODELS[0];
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function shortPrompt(prompt: string) {
  if (prompt.length <= 88) {
    return prompt;
  }

  return `${prompt.slice(0, 85)}...`;
}

function formatSeed(value: number) {
  return value.toString().padStart(4, "0");
}

export default function Home() {
  const { isLoaded: authLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const accountInitial = (
    user?.primaryEmailAddress?.emailAddress?.[0] ??
    user?.firstName?.[0] ??
    "?"
  ).toUpperCase();

  const [prompt, setPrompt] = useState(
    "A quiet studio desk at night, five image models interpreting the same ceramic lamp.",
  );
  const [selectedModelIds, setSelectedModelIds] =
    useState<string[]>(DEFAULT_SELECTION);
  const [apiKeys, setApiKeys] = useState<Record<Provider, string>>(EMPTY_KEYS);
  const [visibleKeys, setVisibleKeys] = useState<Record<Provider, boolean>>({
    openai: false,
    google: false,
    bfl: false,
    stability: false,
    ideogram: false,
  });
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [history, setHistory] = useState<HistoryRun[]>([]);
  const [favorites, setFavorites] = useState<GenerationResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");

  const promptRef = useRef<HTMLTextAreaElement>(null);
  const keysRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const commandDialogRef = useRef<HTMLDialogElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const pendingTimers = useRef<number[]>([]);

  const canGenerate =
    prompt.trim().length > 0 && selectedModelIds.length > 0 && !isGenerating;

  const filteredCommandModels = useMemo(() => {
    const query = commandQuery.trim().toLowerCase();
    if (!query) {
      return MODELS;
    }

    return MODELS.filter((model) =>
      `${model.name} ${model.description} ${model.provider}`
        .toLowerCase()
        .includes(query),
    );
  }, [commandQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setApiKeys(
        readStored<Record<Provider, string>>(STORAGE_KEYS.keys, EMPTY_KEYS),
      );
      setHistory(readStored<HistoryRun[]>(STORAGE_KEYS.history, []));
      setFavorites(readStored<GenerationResult[]>(STORAGE_KEYS.favorites, []));
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.keys, JSON.stringify(apiKeys));
  }, [apiKeys, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  }, [history, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
  }, [favorites, hydrated]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const dialog = commandDialogRef.current;
    if (!dialog) {
      return;
    }

    if (commandOpen && !dialog.open) {
      dialog.showModal();
      window.setTimeout(() => commandInputRef.current?.focus(), 0);
    }

    if (!commandOpen && dialog.open) {
      dialog.close();
    }
  }, [commandOpen]);

  useEffect(() => {
    return () => {
      pendingTimers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  function updateKey(provider: Provider, value: string) {
    setApiKeys((current) => ({
      ...current,
      [provider]: value,
    }));
  }

  function toggleModel(modelId: string) {
    setSelectedModelIds((current) => {
      if (current.includes(modelId)) {
        return current.filter((id) => id !== modelId);
      }

      return [...current, modelId];
    });
  }

  function clearPendingTimers() {
    pendingTimers.current.forEach((timer) => window.clearTimeout(timer));
    pendingTimers.current = [];
  }

  function startGeneration() {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || selectedModelIds.length === 0 || isGenerating) {
      return;
    }

    clearPendingTimers();

    const runId = createId("run");
    const createdAt = new Date().toISOString();
    const queuedResults = selectedModelIds.map((modelId) => ({
      id: createId("result"),
      runId,
      modelId,
      prompt: trimmedPrompt,
      createdAt,
      status: "generating" as const,
      favorite: false,
      seed: hashSeed(`${trimmedPrompt}-${modelId}`),
    }));

    const finalResults = queuedResults.map((result) => {
      const model = getModel(result.modelId);
      const hasKey = Boolean(apiKeys[model.provider]?.trim());

      return {
        ...result,
        status: hasKey ? ("complete" as const) : ("error" as const),
        error: hasKey
          ? undefined
          : `${model.name} needs a ${PROVIDERS.find(
              (provider) => provider.id === model.provider,
            )?.name} key before it can run.`,
      };
    });

    setIsGenerating(true);
    setResults(queuedResults);

    finalResults.forEach((result, index) => {
      const timer = window.setTimeout(
        () => {
          setResults((current) =>
            current.map((item) => (item.id === result.id ? result : item)),
          );
        },
        720 + index * 280,
      );
      pendingTimers.current.push(timer);
    });

    const doneTimer = window.setTimeout(
      () => {
        const run: HistoryRun = {
          id: runId,
          prompt: trimmedPrompt,
          createdAt,
          modelIds: selectedModelIds,
          results: finalResults,
        };

        setResults(finalResults);
        setHistory((current) => [run, ...current].slice(0, 8));
        setIsGenerating(false);
        resultsRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      },
      900 + selectedModelIds.length * 280,
    );
    pendingTimers.current.push(doneTimer);
  }

  function toggleFavorite(result: GenerationResult) {
    if (result.status !== "complete") {
      return;
    }

    const exists = favorites.some((favorite) => favorite.id === result.id);
    const nextFavorite = {
      ...result,
      favorite: !exists,
    };

    setFavorites((current) =>
      exists
        ? current.filter((favorite) => favorite.id !== result.id)
        : [nextFavorite, ...current].slice(0, 24),
    );

    setResults((current) =>
      current.map((item) => (item.id === result.id ? nextFavorite : item)),
    );

    setHistory((current) =>
      current.map((run) => ({
        ...run,
        results: run.results.map((item) =>
          item.id === result.id ? nextFavorite : item,
        ),
      })),
    );
  }

  function restoreRun(run: HistoryRun) {
    setPrompt(run.prompt);
    setSelectedModelIds(run.modelIds);
    setResults(run.results);
    window.setTimeout(() => promptRef.current?.focus(), 0);
  }

  function runCommand(action: "prompt" | "keys" | "results" | "generate" | "all") {
    setCommandOpen(false);

    window.setTimeout(() => {
      if (action === "prompt") {
        promptRef.current?.focus();
      }

      if (action === "keys") {
        keysRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      }

      if (action === "results") {
        resultsRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      }

      if (action === "generate") {
        startGeneration();
      }

      if (action === "all") {
        setSelectedModelIds(MODELS.map((model) => model.id));
      }
    }, 0);
  }

  return (
    <main className="gp-shell">
      <header className="gp-nav" aria-label="Primary navigation">
        <div className="gp-nav__brand">
          <span className="gp-mark" aria-hidden="true">
            GP
          </span>
          <span>Ghost Palette</span>
        </div>
        <button
          className="gp-searchpill"
          type="button"
          onClick={() => setCommandOpen(true)}
          aria-label="Open command palette"
        >
          <Search size={16} aria-hidden="true" />
          <span>Search models</span>
          <kbd>
            <Command size={12} aria-hidden="true" />K
          </kbd>
        </button>
	        <nav className="gp-nav__links" aria-label="Page sections">
	          <a href="#compare">Compare</a>
	          <a href="#keys">Setup</a>
	          <a href="#history">History</a>
	        </nav>
	        <div className="gp-nav__auth">
	          {authLoaded ? (
	            isSignedIn ? (
	              <span className="gp-nav__account">
	                <span className="gp-avatar" aria-hidden="true">
	                  {accountInitial}
	                </span>
	                <button
	                  className="gp-button gp-button--ghost"
	                  type="button"
	                  onClick={() => signOut({ redirectUrl: "/" })}
	                >
	                  Sign out
	                </button>
	              </span>
	            ) : (
	              <a className="gp-button gp-button--ghost" href="/sign-in">
	                Sign in
	              </a>
	            )
	          ) : null}
	        </div>
	      </header>

	      <section className="gp-hero" aria-labelledby="hero-title">
	        <div className="gp-hero__copy">
	          <p className="gp-kicker">Open-source image comparison</p>
	          <h1 id="hero-title">Find the model that gets it right.</h1>
	          <p>
	            Run one prompt through several image models, inspect the outputs
	            side by side, and save the result worth keeping.
	          </p>
	          <div className="gp-hero__actions">
	            <a className="gp-button gp-button--primary" href="#compare">
	              Start comparing
	            </a>
	            <a className="gp-button gp-button--ghost" href="#keys">
	              Add providers
	            </a>
	          </div>
	        </div>
	        <div className="gp-hero__preview" aria-label="Ghost Palette product preview">
	          <div className="gp-preview__bar">
	            <span>same prompt</span>
	            <span>{selectedModelIds.length} models selected</span>
	          </div>
	          <div className="gp-preview__prompt">
	            A matte black product photo with soft studio light and no visible
	            brand marks.
	          </div>
	          <div className="gp-preview__models">
	            {MODELS.slice(0, 4).map((model) => (
	              <span key={model.id}>{model.name}</span>
	            ))}
	          </div>
	          <div className="gp-preview__grid">
	            {MODELS.slice(0, 4).map((model) => (
	              <span className={`gp-preview__tile ${model.artClass}`} key={model.id}>
	                <small>{model.name}</small>
	              </span>
	            ))}
	          </div>
	        </div>
	      </section>

	      <section className="gp-how" aria-label="How Ghost Palette works">
	        <ol className="gp-steps">
	          <li>
	            <span className="gp-step__n">01</span>
	            <strong>Prompt once</strong>
	            <span>Write one brief and keep it identical across every model.</span>
	          </li>
	          <li>
	            <span className="gp-step__n">02</span>
	            <strong>Compare side by side</strong>
	            <span>See composition, detail, and text handling in a single grid.</span>
	          </li>
	          <li>
	            <span className="gp-step__n">03</span>
	            <strong>Keep the winner</strong>
	            <span>Favorite the best output and restore recent runs — no account.</span>
	          </li>
	        </ol>
	      </section>

	      <section className="gp-workbench" id="compare" aria-label="Generation workbench">
	        <aside className="gp-panel gp-controls" aria-label="Prompt and model controls">
          <div className="gp-field">
            <label htmlFor="prompt">Prompt</label>
            <textarea
              id="prompt"
              ref={promptRef}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the image you want every model to attempt."
              rows={6}
              aria-describedby="prompt-help"
            />
            <p id="prompt-help">
              This local MVP queues the same prompt across every selected model.
            </p>
          </div>

          <div className="gp-selector" aria-label="Model selector">
            <div className="gp-sectionhead">
              <h2>Model selector</h2>
              <p>{selectedModelIds.length} selected</p>
            </div>
            <div className="gp-models">
              {MODELS.map((model) => {
                const providerHasKey = Boolean(apiKeys[model.provider]?.trim());
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
                        <span
                          className={`gp-badge ${
                            providerHasKey ? "is-ready" : "is-missing"
                          }`}
                        >
                          {providerHasKey ? "key ready" : "needs key"}
                        </span>
                      </span>
                      <span>{model.description}</span>
                      <span className="gp-model__adapter">{model.adapter}</span>
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
	              <h2>Start a comparison</h2>
	              <p>Outputs land here as soon as a run begins.</p>
	            </div>
            {results.length > 0 ? (
              <span className="gp-runmeta">
                <Clock3 size={16} aria-hidden="true" /> {results.length} results
              </span>
            ) : null}
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
	                  return (
	                    <figure className="gp-tile-card" key={id}>
	                      <div
	                        className={`gp-art ${model.artClass}`}
	                        role="img"
	                        aria-label={`${model.name} interpretation of the example prompt`}
	                      >
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
	                Add provider keys, pick models, and run your own prompt to replace
	                this sample.
	              </p>
	            </div>
	          ) : (
            <div className="gp-grid">
              {results.map((result) => {
                const model = getModel(result.modelId);
                const isFavorite =
                  result.favorite ||
                  favorites.some((favorite) => favorite.id === result.id);

                return (
                  <article className="gp-result" key={result.id}>
                    <div
                      className={`gp-art ${model.artClass} ${
                        result.status === "generating" ? "is-loading" : ""
                      } ${result.status === "error" ? "is-error" : ""}`}
                      role="img"
                      aria-label={`${model.name} preview for ${shortPrompt(
                        result.prompt,
                      )}`}
                    >
                      {result.status === "generating" ? (
                        <span className="gp-art__state">
                          <Loader2 className="gp-spin" size={20} aria-hidden="true" />
                          Rendering
                        </span>
                      ) : null}
                      {result.status === "error" ? (
                        <span className="gp-art__state">
                          <AlertTriangle size={20} aria-hidden="true" />
                          Needs key
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
                      <button
                        className={`gp-iconbutton ${isFavorite ? "is-active" : ""}`}
                        type="button"
                        onClick={() => toggleFavorite(result)}
                        disabled={result.status !== "complete"}
                        aria-label={
                          isFavorite
                            ? `Remove ${model.name} output from favorites`
                            : `Save ${model.name} output as favorite`
                        }
                      >
                        <Star size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>

      <section className="gp-showcase" id="examples" aria-labelledby="showcase-title">
        <div className="gp-showcase__head">
          <h2 id="showcase-title">One prompt, five interpretations</h2>
          <p>{SHOWCASE_PROMPT}</p>
        </div>
        <div className="gp-showcase__grid">
          {MODELS.map((model) => {
            const seed = hashSeed(`${SHOWCASE_PROMPT}-${model.id}`);
            return (
              <figure className="gp-tile-card" key={model.id}>
                <div
                  className={`gp-art ${model.artClass}`}
                  role="img"
                  aria-label={`${model.name} interpretation of the showcase prompt`}
                >
                  <span className="gp-art__caption">seed {formatSeed(seed)}</span>
                </div>
                <figcaption>
                  <strong>{model.name}</strong>
                  <span>{model.description}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </section>

      <section className="gp-aux">
        <div className="gp-panel gp-keys" id="keys" ref={keysRef}>
	          <div className="gp-sectionhead">
	            <div>
	              <h2>API keys</h2>
	              <p>Stored locally in this browser. No login, no database.</p>
            </div>
            <KeyRound size={18} aria-hidden="true" />
          </div>
          <div className="gp-keygrid">
            {PROVIDERS.map((provider) => {
              const hasKey = Boolean(apiKeys[provider.id]?.trim());

              return (
                <div className="gp-keyfield" key={provider.id}>
                  <label htmlFor={`key-${provider.id}`}>{provider.name}</label>
                  <div className="gp-secret">
                    <input
                      id={`key-${provider.id}`}
                      type={visibleKeys[provider.id] ? "text" : "password"}
                      value={apiKeys[provider.id]}
                      onChange={(event) =>
                        updateKey(provider.id, event.target.value)
                      }
                      placeholder={provider.helper}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="gp-iconbutton"
                      onClick={() =>
                        setVisibleKeys((current) => ({
                          ...current,
                          [provider.id]: !current[provider.id],
                        }))
                      }
                      aria-label={
                        visibleKeys[provider.id]
                          ? `Hide ${provider.name} key`
                          : `Show ${provider.name} key`
                      }
                    >
                      {visibleKeys[provider.id] ? (
                        <EyeOff size={16} aria-hidden="true" />
                      ) : (
                        <Eye size={16} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <p className={hasKey ? "is-ready" : "is-muted"}>
                    {hasKey ? (
                      <>
                        <Check size={14} aria-hidden="true" /> Stored locally
                      </>
                    ) : (
                      "Required before this provider can run"
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="gp-panel gp-history" id="history">
          <div className="gp-sectionhead">
            <div>
              <h2>History</h2>
              <p>Recent local runs, newest first.</p>
            </div>
            <History size={18} aria-hidden="true" />
          </div>

          {history.length === 0 ? (
            <div className="gp-listempty">No saved runs yet.</div>
          ) : (
            <div className="gp-runlist">
              {history.map((run) => (
                <button
                  className="gp-run"
                  key={run.id}
                  type="button"
                  onClick={() => restoreRun(run)}
                >
                  <span>{shortPrompt(run.prompt)}</span>
                  <small>
                    {formatTime(run.createdAt)} / {run.results.length} outputs
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="gp-favorites" aria-label="Favorite outputs">
        <div className="gp-sectionhead">
          <div>
            <h2>Saved outputs</h2>
            <p>Keep the best result from a run without creating an account.</p>
          </div>
          <Heart size={18} aria-hidden="true" />
        </div>
        {favorites.length === 0 ? (
          <div className="gp-listempty">Favorite a completed output to pin it here.</div>
        ) : (
          <div className="gp-favoritelist">
            {favorites.slice(0, 6).map((favorite) => {
              const model = getModel(favorite.modelId);

              return (
                <article className="gp-favorite" key={favorite.id}>
                  <span className={`gp-favorite__thumb ${model.artClass}`} />
                  <div>
                    <strong>{model.name}</strong>
                    <p>{shortPrompt(favorite.prompt)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

	      <footer className="gp-footer">
	        <p>
	          Compare the model, keep the output, and stay in control of the
	          setup. The first version stays local on purpose.
	        </p>
        <div>
          <span>Ghost Palette</span>
          <span>Open-source MVP / 2026</span>
        </div>
      </footer>

      <dialog
        className="gp-command"
        ref={commandDialogRef}
        onClose={() => setCommandOpen(false)}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setCommandOpen(false);
          }
        }}
      >
        <div className="gp-command__panel">
          <div className="gp-command__field">
            <Search size={18} aria-hidden="true" />
            <input
              ref={commandInputRef}
              value={commandQuery}
              onChange={(event) => setCommandQuery(event.target.value)}
              placeholder="Search models or actions"
              aria-label="Search commands"
            />
            <button
              className="gp-iconbutton"
              type="button"
              onClick={() => setCommandOpen(false)}
              aria-label="Close command palette"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="gp-command__group">
            <p>Actions</p>
            <button type="button" onClick={() => runCommand("prompt")}>
              Focus prompt
            </button>
            <button type="button" onClick={() => runCommand("keys")}>
              Open API keys
            </button>
            <button type="button" onClick={() => runCommand("all")}>
              Select every model
            </button>
            <button type="button" onClick={() => runCommand("generate")}>
              Generate grid
            </button>
            <button type="button" onClick={() => runCommand("results")}>
              View results
            </button>
          </div>

          <div className="gp-command__group">
            <p>Models</p>
            {filteredCommandModels.map((model) => (
              <button
                type="button"
                key={model.id}
                onClick={() => {
                  toggleModel(model.id);
                  setCommandOpen(false);
                }}
              >
                <span>{model.name}</span>
                <small>
                  {selectedModelIds.includes(model.id) ? "selected" : "not selected"}
                </small>
              </button>
            ))}
          </div>
        </div>
      </dialog>
    </main>
  );
}
