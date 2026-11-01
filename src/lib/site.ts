import type { Metadata } from "next";

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
export const SITE_NAME = "Skill Validator";

export const NAV = [
  { href: "/", label: "Skill Validator", short: "Skills" },
  { href: "/agents-md/", label: "AGENTS.md", short: "AGENTS.md" },
  { href: "/robots-ai/", label: "robots.txt AI", short: "robots.txt" },
  { href: "/tool-result-size/", label: "Tool result size", short: "Result size" },
  { href: "/cursor-rules/", label: "Cursor rules", short: "Cursor" },
  { href: "/learn/mcp-tool-vs-resource-vs-prompt/", label: "Learn MCP", short: "Learn" },
] as const;

/** Cards for the home “More tools” grid. */
export const TOOL_CARDS = [
  { href: "/", title: "Claude Skill Validator", blurb: "Check SKILL.md frontmatter, naming, description quality, references and secrets before you upload." },
  { href: "/agents-md/", title: "AGENTS.md", blurb: "Validate and generate the open Markdown instruction file used by Codex, Cursor, Copilot and more." },
  { href: "/cursor-rules/", title: "Cursor rules", blurb: "Validate .cursor/rules/*.mdc frontmatter and build Always / Intelligent / Files / Manual rules." },
  { href: "/robots-ai/", title: "robots.txt AI", blurb: "Check AI crawler rules, generate a robots.txt, and skim llms.txt basics." },
  { href: "/tool-result-size/", title: "Tool result size", blurb: "Estimate MCP / Claude tool-result payload size before you hit context limits." },
  { href: "/learn/mcp-tool-vs-resource-vs-prompt/", title: "Learn MCP", blurb: "Tool vs resource vs prompt — with a PDF converter example." },
] as const;

/** Per-page metadata with a trailing-slash canonical, matching `trailingSlash: true`. */
export function pageMeta(o: { title: string; description: string; path: string; keywords?: string[]; type?: "website" | "article" }): Metadata {
  return {
    title: o.title,
    description: o.description,
    keywords: o.keywords,
    alternates: { canonical: o.path },
    openGraph: { type: o.type ?? "website", url: o.path, title: o.title, description: o.description, siteName: SITE_NAME },
    twitter: { card: "summary_large_image", title: o.title, description: o.description },
  };
}
