"use client";

import { useAuth } from "@clerk/nextjs";
import { Check, Loader2, Trophy, X } from "lucide-react";
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
  { label: "Quick (3)", limit: 3 },
  { label: "Category sample (5)", limit: 5 },
  { label: "Full category", limit: 0 },
  { label: "Full suite (192)", limit: 192 },
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
  const estimatedCount = useMemo(() => {
    if (preset.label === "Full category") {
      return CATEGORY_INFO[category as keyof typeof CATEGORY_INFO]
        ? CATEGORY_INFO[category as keyof typeof CATEGORY_INFO].tests * 3
        : 15;
    }
    return preset.limit;
  }, [preset, category]);

  async function runSuite() {
    if (!modelId || running) return;

    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/benchmark");
      return;
    }

    setRunning(true);
    setResults([]);
    setSuiteError(null);

    const isFullSuite = preset.label === "Full suite (192)";
    const limit =
      preset.label === "Full category"
        ? undefined
        : isFullSuite
          ? 192
          : preset.limit;

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

  const passRate =
    results.length > 0
      ? (
          (results.filter((r) => r.passed === true).length / results.length) *
          100
        ).toFixed(1)
      : null;

  return (
    <main className="gp-shell">
      <MarketingNav />

      <div className="gp-feature">
        <header className="gp-feature__head">
          <span className="gp-tag">Benchmark</span>
          <h1>ImageBench V1 suite</h1>
          <p>
            Run the fixed 192-prompt evaluation suite from{" "}
            <a
              href={IMAGEBENCH_ATTRIBUTION.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="gp-docs-inline-link"
            >
              ImageBench
            </a>
            . Generate, VLM-grade pass/fail, and contribute to the{" "}
            <Link href="/leaderboard">public leaderboard</Link>.{" "}
            {isLoaded && !isSignedIn ? (
              <>
                <Link href="/sign-in?redirect_url=/benchmark">Sign in</Link> to run
                the suite — generation requires an account.
              </>
            ) : null}
          </p>
        </header>

        <section className="gp-benchmark-controls">
          <label>
            Model
            <select
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
          </label>
          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={running || preset.label === "Full suite (192)"}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              {preset.label === "Full suite (192)" ? (
                <option value="">All categories</option>
              ) : null}
            </select>
          </label>
          <label>
            Scope
            <select
              value={presetIdx}
              onChange={(e) => setPresetIdx(Number(e.target.value))}
              disabled={running}
            >
              {PRESETS.map((p, i) => (
                <option key={p.label} value={i}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="gp-button gp-button--primary"
            disabled={running || !modelId}
            onClick={runSuite}
          >
            {running ? (
              <>
                <Loader2 size={16} className="gp-spin" aria-hidden="true" />
                Running {progress.done}/{progress.total}
              </>
            ) : isLoaded && !isSignedIn ? (
              <>Sign in to run</>
            ) : (
              <>Run ~{estimatedCount} challenges</>
            )}
          </button>
        </section>

        {suiteError ? <p className="gp-settings-error">{suiteError}</p> : null}

        {passRate !== null && !running ? (
          <p className="gp-benchmark-summary">
            Session pass rate: <strong>{passRate}%</strong> ({results.length} graded)
            {" · "}
            <Link href="/leaderboard">View public leaderboard</Link>
          </p>
        ) : null}

        {results.length > 0 ? (
          <div className="gp-benchmark-grid">
            {results.map((result) => (
              <article key={result.challengeId} className="gp-benchmark-card">
                <div className="gp-benchmark-card__head">
                  <span>{result.challengeId}</span>
                  {result.passed === true ? (
                    <span className="gp-benchmark-pass">
                      <Check size={14} aria-hidden="true" /> PASS
                    </span>
                  ) : result.passed === false ? (
                    <span className="gp-benchmark-fail">
                      <X size={14} aria-hidden="true" /> FAIL
                    </span>
                  ) : (
                    <span className="gp-benchmark-muted">—</span>
                  )}
                </div>
                {result.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result.imageUrl} alt="" className="gp-benchmark-card__img" />
                ) : (
                  <div className="gp-benchmark-card__err">{result.error ?? "No image"}</div>
                )}
                <p className="gp-benchmark-card__prompt">
                  {result.prompt || result.category}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="gp-benchmark-empty">
            <Trophy size={28} aria-hidden="true" />
            <p>
              Pick a model and scope, then run the suite. Results feed the{" "}
              <Link href="/leaderboard">public leaderboard</Link>.
            </p>
          </div>
        )}
      </div>

      <SiteFooter />
    </main>
  );
}
