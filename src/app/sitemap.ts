import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://labops.microcdlabs.com";

const routes = [
  { path: "", priority: 1, changeFrequency: "weekly" as const },
  { path: "/features/reports", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/features/traceability", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/pricing", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/security", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/request-demo", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/legal/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/legal/terms", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/legal/acceptable-use", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/legal/ai-use", priority: 0.2, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-07-23T00:00:00.000Z");
  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
