import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

const ROUTES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/agents-md/", priority: 0.9, changeFrequency: "weekly" },
  { path: "/json-schema/", priority: 0.9, changeFrequency: "weekly" },
  { path: "/mcp/", priority: 0.9, changeFrequency: "weekly" },
  { path: "/text-watermark/", priority: 0.8, changeFrequency: "monthly" },
  { path: "/robots-ai/", priority: 0.8, changeFrequency: "weekly" },
  { path: "/tool-result-size/", priority: 0.8, changeFrequency: "monthly" },
  { path: "/cursor-rules/", priority: 0.8, changeFrequency: "monthly" },
  { path: "/learn/mcp-tool-vs-resource-vs-prompt/", priority: 0.7, changeFrequency: "monthly" },
  { path: "/learn/mcp-server-shi-shenme/", priority: 0.7, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-11-05");
  return ROUTES.map((r) => ({ url: `${SITE}${r.path}`, lastModified, changeFrequency: r.changeFrequency, priority: r.priority }));
}
