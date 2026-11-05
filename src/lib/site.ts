import type { Metadata } from "next";

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
export const SITE_NAME = "Skill Validator";

export const NAV = [
  { href: "/", label: "Skill Validator", short: "Skills" },
  { href: "/agents-md/", label: "AGENTS.md", short: "AGENTS.md" },
  { href: "/json-schema/", label: "JSON Schema", short: "Schema" },
  { href: "/mcp/", label: "MCP", short: "MCP" },
  { href: "/text-watermark/", label: "Text watermark", short: "Watermark" },
  { href: "/robots-ai/", label: "robots.txt AI", short: "robots.txt" },
  { href: "/tool-result-size/", label: "Token counter", short: "Tokens" },
  { href: "/cursor-rules/", label: "Cursor rules", short: "Cursor" },
  { href: "/learn/mcp-tool-vs-resource-vs-prompt/", label: "Learn MCP", short: "Learn" },
  { href: "/learn/mcp-server-shi-shenme/", label: "MCP 是什么", short: "是什么" },
] as const;

/** Cards for the home “More tools” grid. */
export const TOOL_CARDS = [
  { href: "/", title: "Claude Skill Validator", blurb: "Check SKILL.md frontmatter, naming, description quality, references and secrets before you upload." },
  { href: "/agents-md/", title: "AGENTS.md validator", blurb: "Validate and generate the open Markdown instruction file used by Codex, Cursor, Copilot and more." },
  { href: "/json-schema/", title: "JSON Schema", blurb: "Validate a draft-07 schema and enums, check an instance, and see if OpenAI strict structured output will accept it." },
  { href: "/mcp/", title: "MCP server test suite", blurb: "Inspect a tools/list payload, generate Streamable HTTP curl, and build a Claude, Cursor, or VS Code config." },
  { href: "/text-watermark/", title: "Text watermark", blurb: "See if temperature, top_p, or top_k on a Claude request would drop the watermark or be rejected." },
  { href: "/cursor-rules/", title: "Cursor rules", blurb: "Validate .cursor/rules/*.mdc frontmatter and build Always / Intelligent / Files / Manual rules." },
  { href: "/robots-ai/", title: "robots.txt AI", blurb: "Check AI crawler rules, generate a robots.txt, and skim llms.txt basics." },
  { href: "/tool-result-size/", title: "MCP token counter", blurb: "Estimate tokens in an MCP tool result and compare them with Claude Code’s output limits." },
  { href: "/learn/mcp-tool-vs-resource-vs-prompt/", title: "Learn MCP", blurb: "Tool vs resource vs prompt — with a PDF converter example." },
  { href: "/learn/mcp-server-shi-shenme/", title: "MCP Server 是什么", blurb: "用一次握手说明 MCP server 是什么，以及它和模型、Skill 的差别。" },
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
