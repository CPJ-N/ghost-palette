"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { PREVIEW_THEMES } from "@/lib/preview-themes";
import { cn } from "@/lib/utils";

function subscribeEmbedded() {
  return () => {};
}

function getEmbeddedSnapshot() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function getServerEmbeddedSnapshot() {
  return false;
}

export function PreviewSwitcher({ current }: { current: string }) {
  // Hide the chrome when this page is rendered inside the navigator's preview
  // iframes, so each thumbnail reads as a clean screenshot.
  const embedded = useSyncExternalStore(
    subscribeEmbedded,
    getEmbeddedSnapshot,
    getServerEmbeddedSnapshot,
  );

  if (embedded) return null;

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-border bg-background/80 px-4 py-2.5 backdrop-blur">
      <Link
        href="/preview"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        ← All themes
      </Link>
      <span aria-hidden className="mx-1 h-4 w-px bg-border" />
      <div className="flex flex-wrap gap-1">
        {PREVIEW_THEMES.map((t) => (
          <Link
            key={t.id}
            href={`/preview/${t.id}`}
            aria-current={t.id === current ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              t.id === current
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
