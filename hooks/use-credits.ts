"use client";

import { useCallback, useEffect, useState } from "react";

export type CreditSummary = {
  balance: number;
  plan: string;
  monthlyCredits: number;
  currentPeriodEnd: string | null;
  nextRefreshAt: string | null;
  creditPriceCents: number;
  creditsPerUsd: number;
  starterCredits: number;
};

let lastCredits: CreditSummary | null = null;
let inFlightCredits: Promise<CreditSummary> | null = null;

async function fetchCredits() {
  const response = await fetch("/api/credits");
  const data = (await response.json()) as CreditSummary & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to load credits");
  }
  return data;
}

function requestCredits(options: { force?: boolean } = {}) {
  if (!options.force && inFlightCredits) {
    return inFlightCredits;
  }

  const request = fetchCredits()
    .then((data) => {
      lastCredits = data;
      return data;
    })
    .finally(() => {
      if (inFlightCredits === request) {
        inFlightCredits = null;
      }
    });

  inFlightCredits = request;
  return request;
}

export function useCredits() {
  const [credits, setCredits] = useState<CreditSummary | null>(lastCredits);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(!lastCredits);

  const refreshCredits = useCallback(async () => {
    setIsLoadingCredits(true);
    try {
      const data = await requestCredits({ force: true });
      setCredits(data);
      setCreditError(null);
      return data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load credits";
      setCreditError(message);
      return null;
    } finally {
      setIsLoadingCredits(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void requestCredits()
      .then((data) => {
        if (cancelled) return;
        setCredits(data);
        setCreditError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Failed to load credits";
        setCreditError(message);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingCredits(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    credits,
    creditError,
    isLoadingCredits,
    refreshCredits,
  };
}
