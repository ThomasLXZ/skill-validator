import ToolResultSizeTool from "@/components/tools/ToolResultSizeTool";
import { ContentSection, Faq, faqJsonLd, Sources, ToolPage } from "@/components/tools/PageShell";
import { LIMITS, REF } from "@/lib/tool-result-size";
import { pageMeta, SITE } from "@/lib/site";

const TITLE = "MCP Tool Result Size Checker: Tokens vs Claude Code Limits";
const DESC = "Paste an MCP tool result or any tool output to estimate characters, bytes and tokens, compare against Claude Code's 10k warning and 25k default limit, and get tips to shrink it.";

export const metadata = pageMeta({
  title: TITLE, description: DESC, path: "/tool-result-size/",
  keywords: ["MCP tool output too large", "MAX_MCP_OUTPUT_TOKENS", "tool result token limit", "Claude Code MCP output", "maxResultSizeChars", "token counter"],
});

const n = (x: number) => x.toLocaleString("en-US");

const TIPS: { t: string; d: React.ReactNode }[] = [
  { t: "Paginate lists", d: <>Return a page of items plus a <code className="font-mono">nextCursor</code>, and accept a <code className="font-mono">cursor</code> argument. MCP uses the same pattern for its own list methods.</> },
  { t: "Return a resource link", d: <>For big files or exports, return a <code className="font-mono">resource_link</code> content block and let the client fetch it with <code className="font-mono">resources/read</code> when needed.</> },
  { t: "Select fields", d: <>Add a <code className="font-mono">fields</code> or <code className="font-mono">verbose</code> argument so the model asks for what it needs. Drop nulls and empty arrays.</> },
  { t: "Minify JSON", d: <>Pretty-printing adds whitespace the model still reads. Serialize without indentation.</> },
  { t: "Don't send data twice", d: <>If you return <code className="font-mono">structuredContent</code>, keep the text block short instead of repeating the whole JSON.</> },
  { t: "Truncate with a pointer", d: <>When text must be cut, say so and tell the model how to get more, e.g. &ldquo;showing 50 of 1,240 rows; call again with offset=50&rdquo;.</> },
];

const FAQ = [
  { q: "What is Claude Code's MCP output limit?", a: `Claude Code warns when an MCP tool result passes ${n(LIMITS.warnTokens)} tokens and by default caps it at ${n(LIMITS.defaultMaxTokens)} tokens. You can change the cap with the MAX_MCP_OUTPUT_TOKENS environment variable.` },
  { q: "How accurate is the token estimate?", a: "It is a heuristic: about 4 characters per token for English, 3 for JSON or code, and 1 per CJK character. Use Anthropic's token counting API for an exact count with a specific model." },
  { q: "Do other MCP clients use the same limits?", a: "No. The MCP specification does not set a size limit. Each client decides, so keep results small whichever client you target." },
];

export default function Page() {
  return (
    <ToolPage
      eyebrow="For MCP server and agent tool authors"
      title="Is your tool result too big?"
      lead={<>Paste what your tool returns. See its size in characters, bytes and estimated tokens, how it compares with Claude Code&apos;s documented MCP limits, and what to cut.</>}
      bullets={["MCP CallToolResult aware", `${n(LIMITS.warnTokens)} / ${n(LIMITS.defaultMaxTokens)} token limits`, "JSON bloat finder"]}
      tool={<ToolResultSizeTool />}
      jsonLd={{ "@context": "https://schema.org", "@graph": [
        { "@type": "WebApplication", name: "Tool Result Size Checker", url: `${SITE}/tool-result-size/`, applicationCategory: "DeveloperApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
        faqJsonLd(FAQ),
      ] }}
    >
      <ContentSection title="How to shrink a tool result" muted>
        <div className="tips grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {TIPS.map((x) => (
            <div key={x.t} className="bg-background p-5">
              <h3 className="text-[15px] font-medium">{x.t}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{x.d}</p>
            </div>
          ))}
        </div>
      </ContentSection>
      <ContentSection title="The limits we check" intro={<>
        From the Claude Code docs: a warning above {n(LIMITS.warnTokens)} tokens, a default cap of {n(LIMITS.defaultMaxTokens)} tokens (<code className="font-mono text-[14px]">MAX_MCP_OUTPUT_TOKENS</code>), text results over {n(LIMITS.textCharsToFile)} characters saved to a file, a {n(LIMITS.hardCeilingChars)}-character ceiling for a server&apos;s <code className="font-mono text-[14px]">maxResultSizeChars</code>, and error results over {n(LIMITS.errorTruncateAboveChars)} characters cut to the first {n(LIMITS.errorKeepChars)}.
      </>}>
        <Sources items={[
          { label: "Claude Code: MCP output limits", href: REF.claudeCodeMcp, note: "Warning threshold, MAX_MCP_OUTPUT_TOKENS, maxResultSizeChars." },
          { label: "MCP spec: Tools", href: REF.tools, status: "2026-07-28", note: "CallToolResult, content blocks, structuredContent, resource_link." },
          { label: "MCP spec: Pagination", href: REF.pagination, status: "2026-07-28", note: "The cursor / nextCursor pattern." },
          { label: "Anthropic token counting", href: REF.tokenCounting, note: "Exact token counts for a model." },
        ]} />
      </ContentSection>
      <ContentSection title="FAQ" muted><Faq items={FAQ} /></ContentSection>
    </ToolPage>
  );
}
