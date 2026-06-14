# Ghost Palette

Ghost Palette is an open-source image generation comparison app.

The app gives users one prompt box, a model selector, local provider-key setup,
and a side-by-side output grid so they can compare which image model handled the
same prompt best.

## MVP

- Prompt input
- Multi-model selector
- Local API key fields for supported providers
- Generate a comparison grid across selected models
- Save favorite outputs
- Basic local generation history
- Account sign-in via Clerk (custom-themed); no billing, database, or evaluation layer yet

## Current State

This repository currently implements the frontend MVP:

- A grayscale landing page with the Ghost Palette workbench below the hero
- Nunito Sans Black wordmark styling
- Provider key storage in `localStorage`
- Favorites and history stored in `localStorage`
- Deterministic placeholder image cards for the comparison flow
- Custom-themed Clerk auth (Google + email/password) at `/sign-in` and `/sign-up`

Provider API adapters are not wired yet. The generation UI is ready for real
provider calls, but the current output cards are local placeholders.

## Tech Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS v4
- shadcn-style CSS variables
- Clerk authentication (custom-themed sign-in / sign-up)
- Lucide icons

## Getting Started

Install dependencies, then start the local dev server:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
pnpm dev
pnpm lint
pnpm build
pnpm start
```

## Project Structure

- `app/page.tsx` - main landing page and comparison workbench
- `app/globals.css` - global styles and Ghost Palette page styling
- `tokens.css` - portable design tokens for colors, type, spacing, and motion
- `.hallmark/` - Hallmark design preflight and project memory

## Provider Roadmap

The next implementation step is to replace the placeholder generation path with
provider adapters. Each adapter should accept the shared prompt and return a
normalised result shape for the comparison grid.

Initial providers in the UI:

- OpenAI Images
- Imagen
- Flux Pro
- SD Large
- Ideogram
