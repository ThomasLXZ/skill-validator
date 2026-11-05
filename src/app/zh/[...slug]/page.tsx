import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgentsMdPage, agentsMeta } from "@/views/agents-md";
import { CursorRulesPage, cursorMeta } from "@/views/cursor-rules";
import { SchemaPage, schemaMeta } from "@/views/json-schema";
import { PrimitivesPage, primitivesMeta } from "@/views/learn-primitives";
import { WhatMcpPage, whatMeta } from "@/views/learn-what";
import { McpPage, mcpMeta } from "@/views/mcp";
import { RobotsAiPage, robotsMeta } from "@/views/robots-ai";
import { WatermarkPage, watermarkMeta } from "@/views/text-watermark";
import { TokensPage, tokensMeta } from "@/views/tool-result-size";
import type { Locale } from "@/lib/i18n/routing";

const PAGES = {
  "agents-md": { meta: agentsMeta, Page: AgentsMdPage },
  "cursor-rules": { meta: cursorMeta, Page: CursorRulesPage },
  "json-schema": { meta: schemaMeta, Page: SchemaPage },
  "learn/mcp-tool-vs-resource-vs-prompt": { meta: primitivesMeta, Page: PrimitivesPage },
  "learn/mcp-server-shi-shenme": { meta: whatMeta, Page: WhatMcpPage },
  mcp: { meta: mcpMeta, Page: McpPage },
  "robots-ai": { meta: robotsMeta, Page: RobotsAiPage },
  "text-watermark": { meta: watermarkMeta, Page: WatermarkPage },
  "tool-result-size": { meta: tokensMeta, Page: TokensPage },
} as const;

type Key = keyof typeof PAGES;

export const dynamicParams = false;

export function generateStaticParams() {
  return (Object.keys(PAGES) as Key[]).map((key) => ({ slug: key.split("/") }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = PAGES[slug.join("/") as Key];
  return page ? page.meta("zh" satisfies Locale) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const page = PAGES[slug.join("/") as Key];
  if (!page) notFound();
  const View = page.Page;
  return <View locale="zh" />;
}
