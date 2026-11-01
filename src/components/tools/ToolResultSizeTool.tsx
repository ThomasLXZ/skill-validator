"use client";

import { useMemo, useRef, useState } from "react";
import { Braces, FileText } from "lucide-react";
import { cn } from "@/lib/cn";
import { analyzeToolResult, LIMITS, REF } from "@/lib/tool-result-size";
import { Editor, FindingsList, GhostButton, LocalNote, PaneHeader, SectionTitle, SeverityCounts, Stat, Toolbar, toDiagnostics, ToolCard, type CodeEditorHandle } from "./ui";

function bigJson(): string {
  const items = Array.from({ length: 120 }, (_, i) => ({
    id: i + 1, title: `Invoice ${1000 + i}`, customer: { name: `Customer ${i}`, email: `c${i}@example.com`, phone: null, fax: null },
    total: Math.round(((i * 37) % 900) * 100) / 100 + 10, notes: null, tags: [], archived: false,
  }));
  return JSON.stringify({ content: [{ type: "text", text: JSON.stringify({ items }) }], structuredContent: { items } }, null, 2);
}

const EXAMPLES = {
  mcp: { label: "MCP result", text: () => bigJson() },
  small: { label: "Small result", text: () => JSON.stringify({ content: [{ type: "text", text: "Converted report.pdf to report.md (12 pages, 18,402 chars)." }, { type: "resource_link", uri: "file:///tmp/report.md", name: "report.md", mimeType: "text/markdown" }] }, null, 2) },
  text: { label: "Plain text", text: () => "Search results for \"rate limit\":\n" + Array.from({ length: 60 }, (_, i) => `${i + 1}. docs/page-${i}.md — ...rate limit section ${i}...`).join("\n") },
};

const fmt = (n: number) => n.toLocaleString("en-US");

export default function ToolResultSizeTool() {
  const [text, setText] = useState(EXAMPLES.mcp.text);
  const [isError, setIsError] = useState(false);
  const editor = useRef<CodeEditorHandle>(null);
  const r = useMemo(() => analyzeToolResult(text, { isError }), [text, isError]);
  const diags = useMemo(() => toDiagnostics(r.findings), [r]);
  const c = r.counted;

  return (
    <ToolCard id="tool-result-size-tool">
      <Toolbar>
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <Braces className="size-4 text-muted-foreground" aria-hidden />
          Paste a tool result: raw text, JSON, or an MCP <code className="font-mono text-[12px]">CallToolResult</code>
        </div>
        <label className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
          <input type="checkbox" checked={isError} onChange={(e) => setIsError(e.target.checked)} className="size-3.5 accent-current" />
          Error result (<code className="font-mono text-[12px]">isError: true</code>)
        </label>
      </Toolbar>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
        <div className="flex min-h-[420px] flex-col border-b lg:h-[700px] lg:border-b-0 lg:border-r">
          <PaneHeader icon={<FileText className="size-3.5 text-muted-foreground" aria-hidden />} title="Tool result">
            {Object.values(EXAMPLES).map((e) => <GhostButton key={e.label} onClick={() => setText(e.text())}>{e.label}</GhostButton>)}
            <GhostButton onClick={() => setText("")}>Clear</GhostButton>
          </PaneHeader>
          <div className="h-[420px] min-h-0 flex-1 lg:h-auto">
            <Editor ref={editor} language="plain" value={text} onChange={setText} diagnostics={diags} ariaLabel="Tool result" placeholderText="Paste the output your tool returns" />
          </div>
        </div>
        <div className="output min-h-[320px] p-4 sm:p-5 lg:h-[700px] lg:overflow-y-auto" aria-live="polite">
          {r.kind === "empty" ? (
            <div className="grid h-full min-h-[280px] place-items-center text-center">
              <div><p className="text-[15px] font-medium">Paste a tool result</p><p className="mt-1 text-[13px] text-muted-foreground">We measure it and compare it with Claude Code&apos;s MCP output limits.</p></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Characters" value={fmt(c.chars)} sub={r.kind === "mcp" ? "text blocks only" : undefined} />
                <Stat label="UTF-8 bytes" value={fmt(c.bytes)} />
                <Stat label="Lines" value={fmt(c.lines)} />
                <Stat label="Tokens (estimate)" value={`~${fmt(c.approxTokens)}`} sub={c.cjkChars ? `${fmt(c.cjkChars)} CJK chars` : "heuristic, not a tokenizer"}
                  tone={c.approxTokens > LIMITS.defaultMaxTokens ? "error" : c.approxTokens > LIMITS.warnTokens ? "warning" : "ok"} />
              </div>

              <SectionTitle>Against Claude Code&apos;s documented limits</SectionTitle>
              <div className="meters space-y-3 rounded-xl border p-3.5">
                <Bar label="Warning threshold" value={c.approxTokens} max={LIMITS.warnTokens} unit="tokens" estimate />
                <Bar label="Default max output (MAX_MCP_OUTPUT_TOKENS)" value={c.approxTokens} max={LIMITS.defaultMaxTokens} unit="tokens" estimate />
                <Bar label="Text saved to a file instead of shown" value={c.chars} max={LIMITS.textCharsToFile} unit="chars" />
                <Bar label="Hard ceiling (maxResultSizeChars max)" value={c.chars} max={LIMITS.hardCeilingChars} unit="chars" />
                {isError && <Bar label="Error results truncated above" value={c.chars} max={LIMITS.errorTruncateAboveChars} unit="chars" />}
                <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                  Limits from <a className="underline underline-offset-2" href={REF.claudeCodeMcp} target="_blank" rel="noopener noreferrer">Claude Code MCP docs</a>. Token bars use an estimate; for exact counts use the{" "}
                  <a className="underline underline-offset-2" href={REF.tokenCounting} target="_blank" rel="noopener noreferrer">token counting API</a>. Other clients set their own limits.
                </p>
              </div>

              <div className="mt-5"><SeverityCounts findings={r.findings} /></div>
              <div className="mt-3"><FindingsList findings={r.findings} onJump={(l) => editor.current?.jumpTo(l)} empty="This result is comfortably small." /></div>

              {r.json?.valid && (
                <>
                  <SectionTitle>What takes the space</SectionTitle>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {r.json.minifiedChars !== undefined && <Stat label="Minified JSON" value={fmt(r.json.minifiedChars)} sub={`${Math.round((1 - r.json.minifiedChars / Math.max(1, r.stats.chars)) * 100)}% smaller than pasted`} />}
                    <Stat label="null / empty values" value={fmt(r.json.nullish)} sub={`max depth ${r.json.maxDepth}`} />
                    {r.json.mcp && <Stat label="Content blocks" value={Object.entries(r.json.mcp.blocks).map(([k, v]) => `${v} ${k}`).join(", ") || "none"} sub={r.json.mcp.hasStructured ? (r.json.mcp.duplicatedStructured ? "structuredContent duplicates text" : "has structuredContent") : undefined} />}
                    {r.json.mcp && r.json.mcp.imageBase64Chars > 0 && <Stat label="Image data" value={fmt(r.json.mcp.imageBase64Chars)} sub="base64 chars" />}
                  </div>
                  {r.json.largestArrays.length > 0 && (
                    <ul className="mt-2 divide-y rounded-xl border text-[12.5px]">
                      {r.json.largestArrays.slice(0, 4).map((a) => (
                        <li key={a.path} className="flex justify-between px-3 py-1.5"><code className="truncate font-mono">{a.path}</code><span className="tabular-nums text-muted-foreground">{fmt(a.length)} items</span></li>
                      ))}
                      {r.json.longStrings.slice(0, 3).map((s) => (
                        <li key={s.path} className="flex justify-between px-3 py-1.5"><code className="truncate font-mono">{s.path}</code><span className="tabular-nums text-muted-foreground">{fmt(s.length)} chars{s.base64 ? " · base64" : ""}</span></li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      <LocalNote />
    </ToolCard>
  );
}

function Bar({ label, value, max, unit, estimate }: { label: string; value: number; max: number; unit: string; estimate?: boolean }) {
  const pct = Math.min(100, (value / max) * 100);
  const over = value > max;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
        <span>{label}</span>
        <span className={cn("tabular-nums", over ? "font-medium text-error" : "text-muted-foreground")}>
          {estimate ? "~" : ""}{fmt(value)} / {fmt(max)} {unit}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-[width]", over ? "bg-error" : pct > 70 ? "bg-warning" : "bg-ok")} style={{ width: `${Math.max(pct, value ? 1.5 : 0)}%` }} />
      </div>
    </div>
  );
}
