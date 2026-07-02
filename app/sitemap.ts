import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ghostpalette.app";

const ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.8 },
  { path: "/leaderboard", changeFrequency: "daily", priority: 0.7 },
  { path: "/benchmark", changeFrequency: "weekly", priority: 0.6 },
  { path: "/docs", changeFrequency: "monthly", priority: 0.6 },
  { path: "/docs/imagebench", changeFrequency: "monthly", priority: 0.5 },
  { path: "/docs/methodology", changeFrequency: "monthly", priority: 0.5 },
  { path: "/docs/benchmarks", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
