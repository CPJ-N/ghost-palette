# Ghost Palette

Ghost Palette is a model-smart image generation studio.

The app lets users generate AI images, compare leading models side by side when
the model choice matters, refine from references, save winning outputs, and use
benchmark data to understand which model fits a job.

## MVP

- Prompt-based image creation
- One-or-more-model Create workflow at `/arena`
- Server-side fal generation through `/api/generate`
- Clerk authentication for protected workflows
- Starter credits and per-generation credit spend
- Blind or named model comparison
- Winner selection
- Reference-based Refine workspace
- Browser-local Library for saved runs
- Credit-based pricing and Stripe checkout
- Supabase-backed credit/profile and benchmark persistence
- ImageBench benchmark runner and live leaderboard

## Product Direction

Ghost Palette is moving from comparison-only toward a general-purpose image
studio. The wedge stays model intelligence:

- Create normally when the user knows what they want
- Compare models when the prompt is important
- Refine from a reference when the first output is close
- Save winners and prompt history into the Library
- Use benchmarks and model data as practical guidance

Credit system:

- 1 credit = $0.02
- $1 = 50 credits
- Paid packs should preserve this exchange rate unless a discount is clearly
  described

## Tech Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS v4
- shadcn-style CSS variables
- Clerk authentication (custom-themed sign-in / sign-up)
- fal.ai image generation
- Supabase persistence
- Stripe checkout and webhooks
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

- `app/(marketing)/page.tsx` - main landing page
- `app/(app)/arena/page.tsx` - Create workflow with model comparison
- `app/(app)/evals/page.tsx` - Refine workspace
- `app/globals.css` - global styles and Ghost Palette page styling
- `tokens.css` - portable design tokens for colors, type, spacing, and motion
- `docs/product-updates-plan.md` - roadmap toward the general-purpose studio
- `docs/launch-checklist.md` - launch operations checklist
