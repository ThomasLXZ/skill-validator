import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

const ROUTES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/agents-md/", priority: 0.9, changeFrequency: "weekly" },
  { path: "/robots-ai/", priority: 0.9, changeFrequency: "weekly" },
  { path: "/tool-result-size/", priority: 0.8, changeFrequency: "monthly" },
  { path: "/cursor-rules/", priority: 0.8, changeFrequency: "monthly" },
  { path: "/learn/mcp-tool-vs-resource-vs-prompt/", priority: 0.7, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-11-01");
  return ROUTES.map((r) => ({ url: `${SITE}${r.path}`, lastModified, changeFrequency: r.changeFrequency, priority: r.priority }));
}
