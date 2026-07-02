import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Run the ImageBench V1 Suite — Ghost Palette",
  description:
    "Grade AI image models pass/fail across the ImageBench V1 challenge set and feed results into the live leaderboard.",
  alternates: { canonical: "/benchmark" },
  openGraph: {
    url: "/benchmark",
    title: "Run the ImageBench V1 Suite — Ghost Palette",
    description:
      "Grade AI image models pass/fail across the ImageBench V1 challenge set and feed results into the live leaderboard.",
  },
};

export default function BenchmarkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
