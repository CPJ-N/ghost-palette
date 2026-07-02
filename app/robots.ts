import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ghostpalette.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/studio",
        "/composer",
        "/arena",
        "/evals",
        "/library",
        "/gallery",
        "/settings",
        "/dashboard",
        "/preview",
        "/sso-callback",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
