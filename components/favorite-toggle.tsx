"use client";

import { Heart } from "lucide-react";
import posthog from "posthog-js";
import { useState } from "react";

type FavoriteToggleProps = {
  resultId: string;
  favorite: boolean;
  className?: string;
  /** Called optimistically on click, and again to revert on failure. The
   * caller owns favorite state — this keeps every rendered instance for the
   * same result in sync instead of each one drifting independently. */
  onChange: (resultId: string, favorite: boolean) => void;
};

export function FavoriteToggle({ resultId, favorite, className, onChange }: FavoriteToggleProps) {
  const [busy, setBusy] = useState(false);

  async function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;

    const next = !favorite;
    setBusy(true);
    onChange(resultId, next);
    posthog.capture("image_favorited", { result_id: resultId, favorited: next });
    try {
      const response = await fetch(`/api/results/${resultId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: next }),
      });
      if (!response.ok) {
        onChange(resultId, !next);
      }
    } catch {
      onChange(resultId, !next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`gp-favtoggle ${favorite ? "is-favorite" : ""} ${className ?? ""}`}
      onClick={(event) => void toggle(event)}
      aria-pressed={favorite}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      disabled={busy}
    >
      <Heart size={16} aria-hidden="true" fill={favorite ? "currentColor" : "none"} />
    </button>
  );
}
