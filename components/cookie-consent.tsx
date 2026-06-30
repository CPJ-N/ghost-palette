"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "gp-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Client-only feature detection (localStorage doesn't exist during SSR) —
    // there's no way to compute this during render without risking a
    // hydration mismatch, so the effect is the correct place for it.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!window.localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable (e.g. private browsing) — skip the banner
      // rather than show it on every load with no way to dismiss it.
    }
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Best effort — if storage isn't available the banner will just
      // reappear next visit, which is an acceptable degraded outcome.
    }
  }

  if (!visible) return null;

  return (
    <div className="gp-cookie-banner" role="status" aria-live="polite">
      <p>
        We use a strictly necessary cookie to keep you signed in. We don&apos;t
        use advertising or tracking cookies. See our{" "}
        <Link href="/privacy">Privacy Policy</Link> for details.
      </p>
      <button
        type="button"
        className="gp-button gp-button--primary gp-cookie-banner__action"
        onClick={dismiss}
      >
        Got it
      </button>
    </div>
  );
}
