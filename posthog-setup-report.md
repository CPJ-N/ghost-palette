# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into Ghost Palette. Client-side analytics are initialized via `instrumentation-client.ts` using the Next.js 15.3+ pattern (no provider wrapper required). A reverse proxy through Next.js rewrites routes PostHog traffic via `/ingest` to reduce ad-blocker interference. Server-side tracking uses a singleton `posthog-node` client (`lib/posthog-server.ts`) shared across API routes. User identification fires on both client (email as distinct ID at login/signup) and server (Clerk user ID in the Clerk webhook). 13 events were added across 7 files covering the full user lifecycle: auth, image generation, favoriting, billing, and subscriptions.

| Event | Description | File |
|---|---|---|
| `user_signed_up` | User created a new account via email/password or OAuth. | `components/auth-form.tsx` |
| `user_signed_in` | User signed in to an existing account. | `components/auth-form.tsx` |
| `image_generation_started` | User submitted a prompt to start a generation run. | `app/(app)/studio/page.tsx` |
| `image_generation_completed` | A single image was generated successfully on the server. | `app/api/generate/route.ts` |
| `image_generation_failed` | A single image generation attempt failed on the server. | `app/api/generate/route.ts` |
| `insufficient_credits_blocked` | A generation was rejected due to insufficient credits. | `app/api/generate/route.ts` |
| `winner_picked` | User chose a winning image from a multi-model comparison. | `app/(app)/studio/page.tsx` |
| `image_favorited` | User toggled the favorite state on a generated result. | `components/favorite-toggle.tsx` |
| `checkout_started` | User initiated a Stripe checkout for a paid plan. | `components/settings-billing-content.tsx` |
| `billing_interval_toggled` | User switched between monthly and annual billing. | `components/settings-billing-content.tsx` |
| `subscription_purchased` | Stripe confirmed a new subscription checkout completed. | `app/api/stripe/webhook/route.ts` |
| `subscription_cancelled` | A subscription was cancelled; account reverted to free. | `app/api/stripe/webhook/route.ts` |
| `subscription_renewed` | A subscription renewal invoice was paid. | `app/api/stripe/webhook/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) dashboard](https://us.posthog.com/project/494009/dashboard/1787201)
- [New signups (last 30 days)](https://us.posthog.com/project/494009/insights/hBP76Xk0)
- [Image generation activity](https://us.posthog.com/project/494009/insights/hzlEU1Sp)
- [Credit exhaustion (upgrade signal)](https://us.posthog.com/project/494009/insights/bls2YiHG)
- [Signup to first generation funnel](https://us.posthog.com/project/494009/insights/zkM9Nj6H)
- [Checkout to subscription funnel](https://us.posthog.com/project/494009/insights/ROzjOeFK)

## Verify before merging

- [ ] Run a full production build (`pnpm build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and any onboarding scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify in PostHog Error Tracking.
- [ ] Confirm the returning-visitor path also calls `identify` — currently `identify` fires only at login/signup, so returning sessions that bypass the auth form start anonymous until the user signs in again. Consider calling `posthog.identify` on page load when the Clerk session is already active (e.g. in the app layout via `useUser`).

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
