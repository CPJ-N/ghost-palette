# Ghost Palette — Landing Page Polish (MVP)

- **Date:** 2026-06-13
- **Status:** Design approved; ready to implement
- **Scope guardrail:** Simple, minimal, elegant — this is the MVP, not the full app.

## Context

Ghost Palette is an open-source image-generation comparison app (frontend MVP).
The landing page lives in `app/page.tsx` + `app/globals.css`, built with Hallmark
**Split Studio** macrostructure + **Midnight grayscale** atmospheric theme. It is
structurally solid but reads as *hollow* in its cold state: a strong hero followed by
empty dashed boxes ("No run yet", "No saved runs yet", "Favorite…") and near-invisible
placeholder art tiles. Measured: the workbench is **997px tall but the results column
fills only 392px → a 605px dead black gap** when there are no results.

## Goals

1. Make the product visibly *work* in its default state — show the "same prompt →
   different model outputs" thesis instead of empty boxes.
2. Sharpen the hero and the proof strip.
3. Add **one** new section that pitches the comparison value.

## Non-goals (deferred / out of scope)

- Real provider adapters / live generation (README roadmap — later).
- Any color/theme change — strict grayscale, Midnight theme preserved.
- Auth, billing, database.
- More than one new section. No marketing bloat.
- New dependencies. In-place edits only.

## Design

### 1. Grayscale "image" engine (`.gp-art` upgrade)
Replace the faint gradient tiles with layered **procedural grayscale art** that reads as
distinct image output:
- Per-model distinct composition (focal shape, position, layering) so a row of tiles
  looks genuinely different model-to-model — that *is* the comparison.
- Depth: soft vignette + highlight, layered radial/conic gradients, subtle film grain
  (inline SVG `feTurbulence` data-URI at low opacity).
- Keep the `--color-art-*` token structure; deepen per-model values within grayscale
  (luminance/contrast/texture variation, never hue).
- Reused everywhere a tile appears: hero preview, workbench results, new showcase,
  favorites thumbnails.
- **Honest:** abstract by design, never presented as a real render.

### 2. Workbench — kill the 605px void
- Default the results grid to a clearly **labeled "Example" comparison** (a fixed sample
  prompt across the 3 default models) on first load; it is replaced the moment the user
  runs their own prompt.
- Make the real empty/loading state a **column-filling skeleton grid** that tracks the
  controls-column height — no dead gap at any state.

### 3. Hero & proof
- Hero preview card uses the new tile engine (reads as real output); tighten the
  headline → subcopy → actions spacing.
- Upgrade the thin proof strip into a substantive **3-step "How it works"**:
  Prompt once → Compare side by side → Keep the winner. More visual weight (numbered,
  larger), still exactly 3 items.

### 4. New section — "One prompt, five interpretations"
- A compact, **curated** example head-to-head: one prompt line, the 5 models' tiles, and
  a one-line strength note per model. Editorial counterpart to the interactive workbench.
- Placement: directly **after** the workbench (hero → how-it-works → workbench → showcase
  → keys/history → favorites → footer), so the comparison grids don't stack at the top.

### 5. Favorites & History
- Replace the empty voids with **elegant, column-filling empty states** (icon + one line
  + faint skeleton) — not fake seeded favorites/history. Keeps it honest and uncluttered.

### 6. Footer
- Keep the Ft5 statement (already strong). Spacing polish only.

## Honesty & Hallmark compliance

- Every sample/example surface is labeled as an example. No fabricated metrics, no fake
  stock imagery (Hallmark gates 46/47).
- Strict grayscale; all colors via named tokens, no inline color values (gate 48).
- Mobile verified at 320 / 375 / 414 / 768px; no horizontal scroll.
- `prefers-reduced-motion` respected; animate transform/opacity only.

## Files touched

- `app/page.tsx` — example-run seed + label, how-it-works content, new showcase section,
  filled empty-state markup.
- `app/globals.css` — new art engine, skeleton, how-it-works + showcase styles, void fix.
- `tokens.css` — any new tokens (grain, deepened art values) declared by name.

## Verification

- Dev server renders; cold page shows the labeled example + filled states; **no 605px gap**.
- `pnpm lint` and `pnpm build` pass.
- Visual check at desktop + the four mobile widths.
