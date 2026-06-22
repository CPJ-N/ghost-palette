// Mirrors the pricing page and the Stripe products/prices created via the CLI.
// The app resolves prices by `lookupKey` at runtime, so test/live price IDs are
// never hardcoded.
//
// `credits` is always the MONTHLY allotment. Monthly plans grant it on each
// Stripe invoice; annual plans (billed once a year) grant the first month on
// purchase and the rest via the monthly credit-refresh job. `priceUsd` is the
// amount actually charged for the chosen interval (annual = 10× monthly — i.e.
// two months free).

export type PaidPlan = "basic" | "pro";
export type BillingInterval = "month" | "year";

export type CreditPack = {
  lookupKey: string;
  plan: PaidPlan;
  interval: BillingInterval;
  credits: number; // monthly allotment
  priceUsd: number; // charged per interval
  label: string;
};

export const CREDIT_PACKS: CreditPack[] = [
  // monthly
  { lookupKey: "gp_basic_1000_monthly", plan: "basic", interval: "month", credits: 1000, priceUsd: 20, label: "Basic — 1,000 credits / mo" },
  { lookupKey: "gp_basic_2000_monthly", plan: "basic", interval: "month", credits: 2000, priceUsd: 40, label: "Basic — 2,000 credits / mo" },
  { lookupKey: "gp_pro_5000_monthly", plan: "pro", interval: "month", credits: 5000, priceUsd: 100, label: "Pro — 5,000 credits / mo" },
  { lookupKey: "gp_pro_10000_monthly", plan: "pro", interval: "month", credits: 10000, priceUsd: 200, label: "Pro — 10,000 credits / mo" },
  // annual (2 months free)
  { lookupKey: "gp_basic_1000_annual", plan: "basic", interval: "year", credits: 1000, priceUsd: 200, label: "Basic — 1,000 credits / mo (annual)" },
  { lookupKey: "gp_basic_2000_annual", plan: "basic", interval: "year", credits: 2000, priceUsd: 400, label: "Basic — 2,000 credits / mo (annual)" },
  { lookupKey: "gp_pro_5000_annual", plan: "pro", interval: "year", credits: 5000, priceUsd: 1000, label: "Pro — 5,000 credits / mo (annual)" },
  { lookupKey: "gp_pro_10000_annual", plan: "pro", interval: "year", credits: 10000, priceUsd: 2000, label: "Pro — 10,000 credits / mo (annual)" },
];

/** Credits granted to every account on the free plan, per month. */
export const FREE_MONTHLY_CREDITS = 50;

export function packByLookupKey(lookupKey: string): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.lookupKey === lookupKey);
}
