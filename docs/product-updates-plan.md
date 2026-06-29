# Ghost Palette Product Updates Plan

## Direction

Ghost Palette is moving from a comparison-only app into a general-purpose image
generation studio. The wedge stays the same: users can create normally, then use
model-aware comparison, benchmarks, and saved winners to choose the right model
for the job.

Positioning:

> Ghost Palette is the model-smart image studio for generating, comparing,
> refining, and saving AI images across leading models.

## Credit System

- 1 credit = $0.02
- $1 = 50 credits
- Paid tiers should keep credit volume and price in this ratio unless a discount
  is explicitly described.
- Annual billing may discount the cash price, but the monthly credit allowance
  should remain clear.

## Update Phases

### Phase 1 — Reposition The Existing MVP

- Present `/arena` as the primary Create/Studio workflow.
- Keep multi-model comparison as the differentiator, not the whole product.
- Update landing, navigation, pricing, footer, README, and billing copy.
- Make the credit exchange rate explicit everywhere pricing appears.
- Keep benchmarks as proof/model guidance rather than the main promise.
- Prefer shadcn UI primitives for interactive controls, form fields, badges,
  cards, menus, and app chrome; keep custom CSS for Ghost Palette-specific
  layout and generated-image artwork.

### Phase 2 — Make Create Feel General Purpose

- Add a single-model quick generation mode. **Done for `/arena`: one selected
  model now generates normally, two or more models compare.**
- Keep multi-model mode as an advanced or comparison mode.
- Add prompt presets for common jobs: product shot, logo direction, character,
  poster, social ad, photoreal scene, illustration.
- Add model recommendation copy near the selector.
- Persist recent prompt history and saved outputs in the Library.
- Decide the per-model credit cost table, then debit credits in `/api/generate`
  before each provider request.

### Phase 3 — Add Editing Primitives

- Improve Refine into a real edit workspace.
- Add reference image, image-to-image, variation, upscale, and background remove
  actions where provider support allows.
- Store every output as an asset with prompt, model, seed, and credit cost.
- Add project folders to the Library.

### Phase 4 — Model Intelligence

- Turn benchmark data into practical recommendations.
- Show "best for text", "best for realism", "best for product", and similar
  guidance.
- Add per-model cost/quality/speed notes.
- Use user picks to learn local preferences.

### Phase 5 — Launch Polish

- Rename routes only after redirects are planned, for example `/arena` to
  `/studio` or `/create`.
- Add account credit balance UI, spend ledger UI, and low-credit states.
- Verify Clerk, fal, Supabase, Stripe checkout, and Stripe webhook end to end.
- Replace any remaining old comparison-only language.
