import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PREVIEW_THEMES } from "@/lib/preview-themes";

export const metadata = {
  title: "Theme previews · Ghost Palette",
};

export default function PreviewNavigator() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <header className="mb-10 max-w-[60ch] space-y-3">
          <Badge variant="outline">Theme preview</Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Pick a direction for Ghost Palette
          </h1>
          <p className="text-muted-foreground">
            Four color directions for the evals-first product — each rendered with the
            real shadcn components, not mockups. Open one full-screen, or jump between
            them from the switcher inside any preview.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/preview/fonts">Compare fonts →</Link>
          </Button>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          {PREVIEW_THEMES.map((t) => (
            <Card key={t.id} className="gap-0 py-0">
              <Link
                href={`/preview/${t.id}`}
                className="group relative block h-[260px] overflow-hidden border-b border-border bg-muted"
                aria-label={`Open the ${t.name} preview`}
              >
                <iframe
                  src={`/preview/${t.id}`}
                  title={`${t.name} preview`}
                  aria-hidden
                  tabIndex={-1}
                  scrolling="no"
                  loading="lazy"
                  className="pointer-events-none absolute left-0 top-0 origin-top-left"
                  style={{ width: "1200px", height: "820px", transform: "scale(0.5)" }}
                />
                <span className="absolute inset-0 ring-1 ring-inset ring-foreground/5 transition group-hover:ring-foreground/15" />
              </Link>

              <div className="flex items-center gap-3 p-4">
                <div className="flex gap-1.5">
                  {t.swatches.map((s) => (
                    <span
                      key={s}
                      className="size-4 rounded-full ring-1 ring-foreground/15"
                      style={{ background: s }}
                    />
                  ))}
                </div>
                <div className="mr-auto min-w-0">
                  <div className="truncate text-sm font-medium">{t.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {t.mode} · {t.blurb}
                  </div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/preview/${t.id}`}>Open →</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
