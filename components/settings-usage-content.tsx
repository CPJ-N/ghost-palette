"use client";

import { useCredits } from "@/hooks/use-credits";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  basic: "Basic",
  pro: "Pro",
  enterprise: "Enterprise",
};

export function SettingsUsageContent() {
  const { credits, isLoadingCredits } = useCredits();

  const plan = credits?.plan ?? "free";
  const isPaid = plan === "basic" || plan === "pro";
  const balance = credits?.balance;
  const monthly = credits?.monthlyCredits;
  const renewISO = isPaid
    ? (credits?.currentPeriodEnd ?? credits?.nextRefreshAt)
    : credits?.nextRefreshAt;

  const remainingPct =
    typeof balance === "number" && typeof monthly === "number" && monthly > 0
      ? Math.max(0, Math.min(100, Math.round((balance / monthly) * 100)))
      : null;

  return (
    <section className="gp-settings-panel">
      <h2>Usage</h2>
      <p className="gp-settings-copy">
        Credits are spent per generation (cost varies by model) and reset to your
        plan&apos;s allotment each month.
      </p>

      {remainingPct !== null ? (
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: "var(--color-paper-4)",
            overflow: "hidden",
            margin: "var(--space-sm) 0 var(--space-md)",
          }}
          role="progressbar"
          aria-valuenow={remainingPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Credits remaining this period"
        >
          <span
            style={{
              display: "block",
              height: "100%",
              width: `${remainingPct}%`,
              background: "var(--color-accent)",
            }}
          />
        </div>
      ) : null}

      <dl className="gp-settings-dl">
        <div>
          <dt>Plan</dt>
          <dd>{PLAN_LABEL[plan] ?? plan}</dd>
        </div>
        <div>
          <dt>Credits remaining</dt>
          <dd>
            {isLoadingCredits && !credits
              ? "checking…"
              : typeof balance === "number"
                ? balance.toLocaleString()
                : "—"}
          </dd>
        </div>
        <div>
          <dt>Monthly allotment</dt>
          <dd>
            {typeof monthly === "number"
              ? `${monthly.toLocaleString()} credits / month`
              : "—"}
          </dd>
        </div>
        <div>
          <dt>{isPaid ? "Renews" : "Refreshes"}</dt>
          <dd>{formatDate(renewISO)}</dd>
        </div>
      </dl>

      <p className="gp-settings-note">
        A detailed spend history (per run and per model) will appear here once the
        credit-ledger view ships.
      </p>
    </section>
  );
}
