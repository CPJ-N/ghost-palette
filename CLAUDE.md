@AGENTS.md

# Ghost Palette

Open-source image-generation **comparison** app (frontend MVP). One prompt → several
image models → side-by-side grid. Provider generation is the roadmap; the comparison
grid currently shows designed placeholders (being replaced with real fal.ai images).

## Commands

- `pnpm dev` (or `npm run dev`) — dev server (Turbopack), default port 3000.
- `pnpm build` — production build; also runs TypeScript + ESLint.
- `pnpm lint` — ESLint.

## Stack

- Next.js 16 App Router (React 19, Turbopack). **Middleware is `proxy.ts`** in Next 16,
  not `middleware.ts`.
- Tailwind v4 + shadcn-style OKLCH CSS variables.
- Clerk auth (`@clerk/nextjs` v7) — uses the **signals / "Future" hooks API**, not the
  classic `useSignIn` shape (`useSignIn()` returns `{ signIn }`; flow methods like
  `signIn.password()`, `signUp.verifications.verifyEmailCode()`, `.finalize()` return
  `{ error }` instead of throwing).
- Lucide icons. Fonts: Geist + Geist Mono + Nunito Sans (wordmark) via `next/font`.

## Design system (Hallmark)

- Macrostructure **Split Studio**, theme **Midnight grayscale**, genre atmospheric.
  **Strictly grayscale** (near-zero-chroma OKLCH) — do not introduce hue without asking.
- Tokens live in `tokens.css`; page styling uses `gp-*` classes in `app/globals.css`.
  Reference tokens by name — no inline raw color values.
- Placeholder "renders" are layered grayscale procedural CSS art (`.gp-art` + per-model
  `.art-*`), distinct per model.
- Keep it **simple, minimal, elegant — MVP, not the full app.** Prefer in-place edits.

## Key files

- `app/page.tsx` — landing + comparison workbench (client component; `localStorage` for
  keys/history/favorites). Nav holds Clerk account controls.
- `app/globals.css` — all `gp-*` and `gp-auth*` styling.
- `components/auth-form.tsx` — custom themed sign-in/up (Clerk Future API).
- `app/sign-in`, `app/sign-up`, `app/sso-callback` — auth routes (our UI, not Clerk's).
- `proxy.ts` — `clerkMiddleware()`; does NOT force-protect, so the landing stays public.

## Environment

- `.env.local` (gitignored) holds secrets: `FAL_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
  `CLERK_SECRET_KEY`. `.env.example` is the committed template.

## Gotchas

- Read `node_modules/next/dist/docs/` before using Next APIs (per AGENTS.md).
- Clerk instance: email+password sign-up + email-code verification, Google OAuth, Smart
  CAPTCHA ON — custom flows must mount `<div id="clerk-captcha">` (sign-up + sso-callback).
- A separate "Tashvi Design Studio" project can leave a service worker on `localhost:3000`;
  use a fresh port or clear site data if the browser shows the wrong app.
