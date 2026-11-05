import Link from "next/link";
import McpTool from "@/components/tools/McpTool";
import { ContentSection, Faq, faqJsonLd, Sources, ToolPage } from "@/components/tools/PageShell";
import { MCP_PROTOCOL, REF } from "@/lib/mcp";
import { pageMeta, SITE } from "@/lib/site";

const PATH = "/mcp/";
const TITLE = "MCP Server Test Suite: Tool Inspector, curl, and Config Generator";
const DESC = "MCP server test suite in the browser: inspect a tools/list payload, generate Streamable HTTP curl for initialize and tools/call, and build or check an MCP config for Claude Desktop, Cursor, and VS Code.";

export const metadata = pageMeta({
  title: TITLE,
  description: DESC,
  path: PATH,
  keywords: [
    "mcp server test suite", "mcp test curl", "web mcp tool inspector", "mcp config generator",
    "mcp tool inspector", "mcp.json generator",
  ],
});

const FAQ = [
  { q: "Does this page call my MCP server?", a: "No. The inspector checks JSON you paste. The curl tab writes commands you run in a terminal, which is what actually reaches the server. Browsers block most cross-origin MCP calls, and a local stdio server has no HTTP port." },
  { q: "Which protocol version is in the curl?", a: `initialize sends protocolVersion ${MCP_PROTOCOL}, and the MCP-Protocol-Version header matches it. That is the Streamable HTTP handshake current servers expect. Copy mcp-session-id from the initialize response into MCP_SESSION_ID. If the server is stateless and omits the header, drop Mcp-Session-Id on the later calls.` },
  { q: "Where do the generated configs go?", a: "Claude Desktop uses mcpServers in claude_desktop_config.json. Cursor uses the same mcpServers object in ~/.cursor/mcp.json or .cursor/mcp.json. VS Code uses servers in .vscode/mcp.json with type stdio or http. Confirm the path in the client you are using; the shapes change between versions." },
  { q: "How is this different from the token counter?", a: "This page checks names, input schemas, and the handshake. When a tool result is large, use the MCP token counter to estimate tokens against Claude Code’s limits." },
];

export default function Page() {
  return (
    <ToolPage
      eyebrow="MCP server test suite"
      title="Inspect tools, write curl, generate config"
      lead={<>Paste a <code className="font-mono text-[0.9em]">tools/list</code> result, generate a Streamable HTTP test script, or build an MCP config. For a plain-language intro, read <Link className="underline decoration-border underline-offset-4 hover:decoration-foreground" href="/learn/mcp-server-shi-shenme/">MCP Server 是什么</Link>. Measure a result with the <Link className="underline decoration-border underline-offset-4 hover:decoration-foreground" href="/tool-result-size/">MCP token counter</Link>.</>}
      bullets={["Tool list checks", `curl for ${MCP_PROTOCOL}`, "Claude, Cursor, VS Code"]}
      tool={<McpTool />}
      jsonLd={{ "@context": "https://schema.org", "@graph": [
        { "@type": "WebApplication", name: "MCP Server Test Suite", url: `${SITE}${PATH}`, applicationCategory: "DeveloperApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: DESC },
        faqJsonLd(FAQ),
      ] }}
    >
      <ContentSection title="What the inspector checks" muted intro="These are static checks on the JSON a server already returned. They are not a substitute for the client’s own handshake.">
        <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Tool name", "Letters, numbers, underscores, and hyphens, 1–64 characters. Duplicates are an error."],
            ["Description", "A missing description is a tip. Models pick a tool from that text."],
            ["inputSchema", "Should be a JSON Schema object. required entries should exist on properties."],
            ["initialize", "The curl opens a session, then sends notifications/initialized before tools/list."],
            ["tools/call", "Pick a tool in the inspector to fill a sample arguments object from its schema."],
            ["Config shape", "mcpServers for Claude Desktop and Cursor. servers with type for VS Code. SSE is flagged as the older transport."],
          ].map(([t, d]) => (
            <div key={t} className="bg-background p-5">
              <h3 className="text-[15px] font-medium">{t}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </ContentSection>
      <ContentSection title="Sources">
        <Sources items={[
          { label: "MCP transports (2025-06-18)", href: REF.transports, note: "Streamable HTTP, Accept header, and Mcp-Session-Id." },
          { label: "MCP lifecycle", href: REF.lifecycle, note: "initialize, then notifications/initialized." },
          { label: "MCP tools", href: REF.tools, note: "tools/list, tools/call, name, description, inputSchema." },
        ]} />
      </ContentSection>
      <ContentSection title="FAQ" muted><Faq items={FAQ} /></ContentSection>
    </ToolPage>
  );
}
