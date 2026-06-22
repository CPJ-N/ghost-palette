"use client";

import { useAuth } from "@clerk/nextjs";
import { Check, Loader2, Play, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { MarketingNav } from "@/components/marketing-nav";
import { SiteFooter } from "@/components/site-footer";
import {
  CATEGORY_INFO,
  getCategories,
  IMAGEBENCH_ATTRIBUTION,
} from "@/lib/imagebench";
import { MODELS } from "@/lib/models";

type ChallengeResult = {
  challengeId: string;
  category: string;
  prompt: string;
  imageUrl?: string;
  passed: boolean | null;
  vlmOutput?: string;
  error?: string;
};

const PRESETS = [
  { label: "Quick", detail: "3 challenges", limit: 3 },
  { label: "Sample", detail: "5 challenges", limit: 5 },
  { label: "Full category", detail: "one category", limit: 0 },
  { label: "Full suite", detail: "192 challenges", limit: 192 },
] as const;

export default function BenchmarkPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const categories = getCategories();
  const [modelId, setModelId] = useState(MODELS[0]?.id ?? "");
  const [category, setCategory] = useState(categories[0] ?? "");
  const [presetIdx, setPresetIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<ChallengeResult[]>([]);
  const [suiteError, setSuiteError] = useState<string | null>(null);

  const preset = PRESETS[presetIdx];
  const isFullSuite = preset.label === "Full suite";
  const isFullCategory = preset.label === "Full category";

  const estimatedCount = useMemo(() => {
    if (isFullCategory) {
      const info = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
      return info ? info.tests * 3 : 15;
    }
    return preset.limit;
  }, [preset, category, isFullCategory]);

  async function runSuite() {
    if (!modelId || running) return;

    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/benchmark");
      return;
    }

    setRunning(true);
    setResults([]);
    setSuiteError(null);

    const limit = isFullCategory ? undefined : isFullSuite ? 192 : preset.limit;

    let suiteRunId: string;
    let challengeIds: string[];

    try {
      const startRes = await fetch("/api/benchmark/suite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId,
          category: isFullSuite ? undefined : category,
          limit,
        }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) {
        throw new Error(startData.error ?? startData.hint ?? "Suite start failed");
      }
      suiteRunId = startData.suiteRunId;
      challengeIds = startData.challengeIds as string[];
    } catch (err) {
      setSuiteError(err instanceof Error ? err.message : "Suite start failed");
      setRunning(false);
      return;
    }

    setProgress({ done: 0, total: challengeIds.length });
    let passCount = 0;
    let failCount = 0;
    const collected: ChallengeResult[] = [];

    for (const challengeId of challengeIds) {
      try {
        const res = await fetch("/api/benchmark/challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ suiteRunId, challengeId, modelId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Challenge failed");

        const item: ChallengeResult = {
          challengeId: data.challengeId,
          category: data.category,
          prompt: data.prompt,
          imageUrl: data.imageUrl,
          passed: data.passed,
          vlmOutput: data.vlmOutput,
        };
        if (data.passed === true) passCount += 1;
        else if (data.passed === false) failCount += 1;
        collected.push(item);
        setResults([...collected]);
      } catch (err) {
        collected.push({
          challengeId,
          category,
          prompt: "",
          passed: null,
          error: err instanceof Error ? err.message : "Failed",
        });
        setResults([...collected]);
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    await fetch("/api/benchmark/suite", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suiteRunId, passCount, failCount, status: "complete" }),
    }).catch(() => undefined);

    setRunning(false);
  }

  const graded = results.filter((r) => r.passed !== null).length;
  const passes = results.filter((r) => r.passed === true).length;
  const passRate = graded > 0 ? ((passes / graded) * 100).toFixed(1) : null;
  const progressPct =
    progress.total > 0 ? (progress.done / progress.total) * 100 : 0;
  const needsAuth = isLoaded && !isSignedIn;

  return (
    <main className="gp-shell">
      <MarketingNav />

      <section className="gp-eval">
        <header className="gp-eval__head">
          <p className="gp-kicker">Benchmark suite</p>
          <h1>Run the ImageBench V1 suite</h1>
          <p>
            Generate against a fixed 192-prompt suite from{" "}
            <a
              href={IMAGEBENCH_ATTRIBUTION.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="gp-docs-inline-link"
            >
              ImageBench
            </a>
            , grade each output pass/fail with a VLM judge, and contribute to the{" "}
            <Link href="/leaderboard" className="gp-docs-inline-link">
              live leaderboard
            </Link>
            .
            {needsAuth ? (
              <>
                {" "}
                <Link href="/sign-in?redirect_url=/benchmark" className="gp-docs-inline-link">
                  Sign in
                </Link>{" "}
                to run — generation requires an account.
              </>
            ) : null}
          </p>
        </header>

        <div className="gp-eval__categories" aria-label="Suite categories">
          {(Object.keys(CATEGORY_INFO) as (keyof typeof CATEGORY_INFO)[]).map(
            (name) => (
              <div key={name} className="gp-eval__cat">
                <span className="gp-eval__cat-name">{name}</span>
                <span className="gp-eval__cat-tests">
                  {CATEGORY_INFO[name].tests} tests
                </span>
              </div>
            ),
          )}
        </div>

        <div className="gp-eval__runner">
          <div className="gp-eval__field">
            <label htmlFor="bm-model">Model</label>
            <select
              id="bm-model"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              disabled={running}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="gp-eval__field">
            <label htmlFor="bm-category">Category</label>
            <select
              id="bm-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={running || isFullSuite}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="gp-eval__field gp-eval__field--scope">
            <label>Scope</label>
            <div className="gp-eval__scopes" role="group" aria-label="Run scope">
              {PRESETS.map((p, i) => (
                <button
                  key={p.label}
                  type="button"
                  className={`gp-eval__scope ${presetIdx === i ? "is-active" : ""}`}
                  onClick={() => setPresetIdx(i)}
                  disabled={running}
                >
                  <span>{p.label}</span>
                  <span className="gp-eval__scope-detail">{p.detail}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="gp-button gp-button--primary gp-eval__run"
            disabled={running || !modelId}
            onClick={runSuite}
          >
            {running ? (
              <>
                <Loader2 size={16} className="gp-spin" aria-hidden="true" />
                Running {progress.done}/{progress.total}
              </>
            ) : needsAuth ? (
              <>Sign in to run</>
            ) : (
              <>
                <Play size={16} aria-hidden="true" />
                Run ~{estimatedCount} challenges
              </>
            )}
          </button>
        </div>

        {running ? (
          <div className="gp-eval__progress" aria-live="polite">
            <div className="gp-eval__progress-track">
              <span
                className="gp-eval__progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="gp-eval__progress-label">
              {progress.done} of {progress.total} graded
            </span>
          </div>
        ) : null}

        {suiteError ? <p className="gp-eval__error">{suiteError}</p> : null}

        {passRate !== null && !running ? (
          <p className="gp-eval__summary">
            Session pass rate: <strong>{passRate}%</strong> ({passes}/{graded}{" "}
            passed)
            {" · "}
            <Link href="/leaderboard" className="gp-docs-inline-link">
              View live leaderboard
            </Link>
          </p>
        ) : null}

        {results.length > 0 ? (
          <div className="gp-eval__cards">
            {results.map((result) => (
              <article key={result.challengeId} className="gp-eval__card">
                <div className="gp-eval__card-head">
                  <span>{result.challengeId}</span>
                  {result.passed === true ? (
                    <span className="gp-eval__verdict is-pass">
                      <Check size={13} aria-hidden="true" /> PASS
                    </span>
                  ) : result.passed === false ? (
                    <span className="gp-eval__verdict is-fail">
                      <X size={13} aria-hidden="true" /> FAIL
                    </span>
                  ) : (
                    <span className="gp-eval__verdict is-muted">—</span>
                  )}
                </div>
                {result.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result.imageUrl} alt="" className="gp-eval__card-img" />
                ) : (
                  <div className="gp-eval__card-err">
                    {result.error ?? "No image"}
                  </div>
                )}
                <p className="gp-eval__card-prompt">
                  {result.prompt || result.category}
                </p>
              </article>
            ))}
          </div>
        ) : !running ? (
          <div className="gp-eval__empty">
            <Trophy size={30} aria-hidden="true" />
            <h2>Pick a model and scope</h2>
            <p>
              Run the suite to grade outputs pass/fail. Results feed the{" "}
              <Link href="/leaderboard" className="gp-docs-inline-link">
                live leaderboard
              </Link>
              .
            </p>
          </div>
        ) : null}
      </section>

      <SiteFooter />
    </main>
  );
}
