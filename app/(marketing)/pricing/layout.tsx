import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Ghost Palette",
  description:
    "Free to start with 50 credits a month. Upgrade for more credits, more models, and priority generation.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    url: "/pricing",
    title: "Pricing — Ghost Palette",
    description:
      "Free to start with 50 credits a month. Upgrade for more credits, more models, and priority generation.",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
