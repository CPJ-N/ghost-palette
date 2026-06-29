import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PreviewSwitcher } from "@/components/preview-switcher";
import { getTheme, PREVIEW_THEMES } from "@/lib/preview-themes";
import { cn } from "@/lib/utils";

const CANDIDATES = [
  { name: "FLUX.2 [pro]", img: "/samples/example-flux2-pro.jpg", score: 96, win: true },
  { name: "FLUX.2 [dev]", img: "/samples/example-flux2-dev.png", score: 89, win: false },
  { name: "SD 3.5 Large", img: "/samples/example-sd35-large.jpg", score: 77, win: false },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    per: "",
    features: ["50 credits / mo", "Image Arena", "All five models"],
    cta: "Get started",
    featured: false,
  },
  {
    name: "Pro",
    price: "$100",
    per: "/mo",
    features: ["5,000 credits / mo", "Everything in Free + Evals", "Semantic scoring & ranking", "Priority generation"],
    cta: "Choose Pro",
    featured: true,
  },
  {
    name: "Basic",
    price: "$20",
    per: "/mo",
    features: ["1,000 credits / mo", "Arena & Refine", "All five models"],
    cta: "Choose Basic",
    featured: false,
  },
];

const accentFill = "border-0 bg-[image:var(--pv-gradient)] text-primary-foreground hover:opacity-90";

export function ThemePreview({ variant }: { variant: string }) {
  const theme = getTheme(variant) ?? PREVIEW_THEMES[0];

  return (
    <div className="min-h-svh bg-background text-foreground" style={theme.vars}>
      <PreviewSwitcher current={theme.id} />

      <div className="mx-auto w-full max-w-6xl space-y-16 px-5 py-12 sm:px-8 sm:py-16">
        {/* nav */}
        <header className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 text-[0.95rem] font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-[image:var(--pv-gradient)] text-xs font-bold text-primary-foreground">
              GP
            </span>
            Ghost Palette
          </span>
          <nav className="ml-3 hidden gap-5 text-sm text-muted-foreground md:flex">
            <span>Arena</span>
            <span className="font-medium text-foreground">Refine</span>
            <span>Pricing</span>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
            <Button size="sm" className={accentFill}>
              Open the app
            </Button>
          </div>
        </header>

        {/* hero */}
        <section className="space-y-5">
          <Badge variant="outline" className="border-primary/40 text-primary">
            The evaluation layer for AI image models
          </Badge>
          <h1 className="max-w-[18ch] text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.75rem] lg:leading-[1.02]">
            Stop guessing which model is best. Prove it.
          </h1>
          <p className="max-w-[54ch] text-base text-muted-foreground sm:text-lg">
            Upload your reference, generate with every model, and get a scored,
            ranked verdict — pick the winner with evidence.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" className={accentFill}>
              Run an evaluation
            </Button>
            <Button size="lg" variant="outline">
              See pricing
            </Button>
          </div>
        </section>

        {/* eval comparison */}
        <Card>
          <div className="flex flex-wrap items-center gap-3 px-(--card-spacing)">
            <Badge>Evaluation</Badge>
            <span className="text-sm text-muted-foreground">
              &ldquo;A ripe persimmon on a concrete plinth, raking light.&rdquo;
            </span>
          </div>
          <Separator />
          <CardContent>
            <div className="grid gap-6 md:grid-cols-[15rem_minmax(0,1fr)]">
              <figure className="space-y-2">
                <div className="aspect-square overflow-hidden rounded-lg ring-1 ring-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/samples/example-flux2-pro.jpg"
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
                <figcaption className="text-sm text-muted-foreground">
                  Your reference — everything is scored against this
                </figcaption>
              </figure>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {CANDIDATES.map((c) => (
                  <figure key={c.name} className="space-y-2">
                    <div
                      className={cn(
                        "relative aspect-square overflow-hidden rounded-lg ring-1 ring-border",
                        c.win &&
                          "ring-2 ring-primary shadow-[0_0_0_1px_var(--ring),0_18px_44px_var(--pv-glow)]"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.img} alt="" className="size-full object-cover" />
                      {c.win && (
                        <Badge className={cn("absolute left-2 top-2 border-transparent", accentFill)}>
                          ★ Best match
                        </Badge>
                      )}
                    </div>
                    <figcaption className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{c.name}</span>
                      <span
                        className={cn(
                          "text-lg font-semibold tabular-nums",
                          c.win ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {c.score}
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* pricing */}
        <section className="grid gap-4 md:grid-cols-3 md:items-start">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={cn("relative", plan.featured && "ring-2 ring-primary")}
            >
              <CardContent className="space-y-4">
                {plan.featured && (
                  <Badge className={cn("border-transparent", accentFill)}>Recommended</Badge>
                )}
                <div className="text-base font-medium">{plan.name}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.per}</span>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Button
                  className={cn("w-full", plan.featured && accentFill)}
                  variant={plan.featured ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}
