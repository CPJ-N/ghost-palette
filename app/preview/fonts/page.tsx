import type { CSSProperties } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FONT_SETS, fontVarsClass } from "@/lib/preview-fonts";

export const metadata = {
  title: "Font previews · Ghost Palette",
};

export default function FontPreview() {
  return (
    <div className={`min-h-svh bg-background text-foreground ${fontVarsClass}`}>
      <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <header className="mb-10 max-w-[62ch] space-y-3">
          <Link
            href="/preview"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ← All previews
          </Link>
          <Badge variant="outline">Type specimen</Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Find the right typeface
          </h1>
          <p className="text-muted-foreground">
            Four pairings shown in the real Ghost Palette wordmark, hero, body and UI —
            in the current theme. Each block sets a display, body, mono and wordmark
            face. Tell me which one (or which mix) feels right.
          </p>
        </header>

        <div className="space-y-6">
          {FONT_SETS.map((set) => (
            <Card
              key={set.id}
              style={
                {
                  "--font-display": set.vars.display,
                  "--font-body": set.vars.body,
                  "--font-mono": set.vars.mono,
                  "--font-wordmark": set.vars.wordmark,
                } as CSSProperties
              }
            >
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {set.name}
                  </span>
                  <Badge variant="outline">{set.note}</Badge>
                </div>

                <Separator />

                {/* wordmark */}
                <div
                  className="flex items-center gap-2.5 text-3xl font-black tracking-tight"
                  style={{ fontFamily: "var(--font-wordmark)" }}
                >
                  <span
                    aria-hidden
                    className="grid size-9 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
                  >
                    GP
                  </span>
                  Ghost Palette
                </div>

                {/* hero headline */}
                <h2
                  className="max-w-[20ch] text-4xl font-semibold tracking-tight sm:text-5xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Stop guessing which model is best. Prove it.
                </h2>

                {/* body */}
                <p
                  className="max-w-[60ch] text-base leading-relaxed text-muted-foreground"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Upload your reference, generate with every model, and get a scored,
                  ranked verdict — pick the winner with evidence. The quick brown fox
                  jumps over the lazy dog. 0123456789.
                </p>

                {/* UI + mono sample */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-muted/60 px-4 py-3">
                  <Badge>Evals</Badge>
                  <span
                    className="text-sm font-medium"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    FLUX.2 [pro]
                  </span>
                  <span
                    className="text-sm text-muted-foreground"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    seed 1840275 · 1024×1024
                  </span>
                  <span
                    className="ml-auto text-2xl font-semibold tabular-nums"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    96
                  </span>
                </div>

                {/* role labels */}
                <div
                  className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <span>display · {set.names.display}</span>
                  <span>body · {set.names.body}</span>
                  <span>mono · {set.names.mono}</span>
                  <span>wordmark · {set.names.wordmark}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
