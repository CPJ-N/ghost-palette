// Mirrors the pricing page and the Stripe products/prices created via the CLI.
// The app resolves prices by `lookupKey` at runtime, so test/live price IDs are
// never hardcoded. Credit grants come from each price's `metadata.credits`.

export type PaidPlan = "basic" | "pro";

export type CreditPack = {
  lookupKey: string;
  plan: PaidPlan;
  credits: number;
  priceUsd: number;
  label: string;
};

export const CREDIT_PACKS: CreditPack[] = [
  {
    lookupKey: "gp_basic_1000_monthly",
    plan: "basic",
    credits: 1000,
    priceUsd: 20,
    label: "Basic — 1,000 credits / mo",
  },
  {
    lookupKey: "gp_basic_2000_monthly",
    plan: "basic",
    credits: 2000,
    priceUsd: 40,
    label: "Basic — 2,000 credits / mo",
  },
  {
    lookupKey: "gp_pro_5000_monthly",
    plan: "pro",
    credits: 5000,
    priceUsd: 100,
    label: "Pro — 5,000 credits / mo",
  },
];

/** Credits granted to every account on the free plan, per month. */
export const FREE_MONTHLY_CREDITS = 50;

export function packByLookupKey(lookupKey: string): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.lookupKey === lookupKey);
}
