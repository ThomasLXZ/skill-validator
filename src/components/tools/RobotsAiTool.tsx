"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowUpRight, Bot, FileText, ScrollText, Wand2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { checkRobots, type AccessStatus, type CrawlerResult } from "@/lib/robots-ai/check";
import { AI_CRAWLERS, PURPOSE_LABEL, type CrawlerPurpose } from "@/lib/robots-ai/crawlers";
import { AIPREF_LABELS, type AiprefLabel, type Pref } from "@/lib/robots-ai/aipref";
import { defaultOptions, generateRobots, presetAccess, type Access, type GeneratorOptions, type Preset } from "@/lib/robots-ai/generate";
import { checkLlmsTxt } from "@/lib/robots-ai/llms";
import { SRC } from "@/lib/robots-ai/sources";
import {
  CopyButtons, Editor, Field, FindingsList, GhostButton, inputCls, LocalNote, PaneHeader, SectionTitle, Segmented,
  SeverityCounts, Stat, Tabs, toDiagnostics, ToolCard, Toolbar, type CodeEditorHandle,
} from "./ui";

type Tab = "check" | "generate" | "llms";

const EX_TYPICAL = `# Block AI training, keep AI search
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: anthropic-ai
Disallow: /

User-agent: CCBot
Disallow: /private/

User-agent: *
Allow: /
Content-Usage: Train-AI=n
Content-Usage: /blog/ ai-train=no

User-Agent: __usage_ai-training
Disallow: /drafts/

Sitemap: https://example.com/sitemap.xml
`;

const EX_DRAFTS = `# IETF aipref drafts, both mechanisms
User-Agent: *
Allow: /
Content-Usage: train-ai=n
Content-Usage: /ai-ok/ train-ai=y

User-Agent: __usage_ai-training
Disallow: /
Allow: /press-kit/
`;

const EX_LLMS = `# Example Docs

> Example is a TypeScript SDK for building MCP servers.

Install with npm and read the quick start first.

## Docs

- [Quick start](https://example.com/docs/quick-start.md): Install and run your first server
- [API reference](https://example.com/docs/api.md)
- Changelog: https://example.com/changelog

## Optional

- [Blog](https://example.com/blog.md)
`;

const STATUS: Record<AccessStatus, { label: string; cls: string }> = {
  blocked: { label: "Blocked", cls: "bg-error-soft text-error" },
  partial: { label: "Partial", cls: "bg-warning-soft text-warning" },
  allowed: { label: "Allowed", cls: "bg-ok-soft text-ok" },
};

const PREF: Record<Pref, { label: string; cls: string }> = {
  allow: { label: "allow", cls: "text-ok" },
  disallow: { label: "disallow", cls: "text-error" },
  unknown: { label: "unknown", cls: "text-muted-foreground" },
};

export default function RobotsAiTool() {
  const [tab, setTab] = useState<Tab>("check");
  const [text, setText] = useState(EX_TYPICAL);
  const [llms, setLlms] = useState(EX_LLMS);
  const [opts, setOpts] = useState<GeneratorOptions>(defaultOptions);
  const editor = useRef<CodeEditorHandle>(null);
  const llmsEditor = useRef<CodeEditorHandle>(null);

  const report = useMemo(() => checkRobots(text), [text]);
  const diags = useMemo(() => toDiagnostics(report.findings), [report]);
  const llmsReport = useMemo(() => checkLlmsTxt(llms), [llms]);
  const llmsDiags = useMemo(() => toDiagnostics(llmsReport.findings), [llmsReport]);
  const generated = useMemo(() => generateRobots(opts), [opts]);

  return (
    <ToolCard id="robots-ai-tool">
      <Toolbar>
        <Tabs<Tab>
          label="Mode"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "check", label: "Check robots.txt", Icon: Bot },
            { id: "generate", label: "Generate", Icon: Wand2 },
            { id: "llms", label: "llms.txt", Icon: ScrollText },
          ]}
        />
        <span className="hidden text-[12.5px] text-muted-foreground md:block">
          {AI_CRAWLERS.length} AI user agents · RFC 9309 matching · IETF aipref drafts
        </span>
      </Toolbar>

      {tab === "check" && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
          <div className="flex min-h-[420px] flex-col border-b lg:h-[720px] lg:border-b-0 lg:border-r">
            <PaneHeader icon={<FileText className="size-3.5 text-muted-foreground" aria-hidden />} title="robots.txt">
              <GhostButton onClick={() => setText(EX_TYPICAL)}>Example</GhostButton>
              <GhostButton onClick={() => setText(EX_DRAFTS)}>Draft signals</GhostButton>
              <GhostButton onClick={() => setText("")}>Clear</GhostButton>
            </PaneHeader>
            <div className="h-[420px] min-h-0 flex-1 lg:h-auto">
              <Editor ref={editor} language="plain" value={text} onChange={setText} diagnostics={diags} ariaLabel="robots.txt content" placeholderText={"Paste your robots.txt here\n\nUser-agent: GPTBot\nDisallow: /"} />
            </div>
          </div>
          <div className="output min-h-[320px] p-4 sm:p-5 lg:h-[720px] lg:overflow-y-auto" aria-live="polite">
            {report.empty ? (
              <EmptyState title="Paste a robots.txt" text="Open yoursite.com/robots.txt, copy everything, and paste it on the left." />
            ) : (
              <RobotsReportView report={report} onJump={(l) => editor.current?.jumpTo(l)} />
            )}
          </div>
        </div>
      )}

      {tab === "generate" && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
          <div className="border-b p-4 sm:p-5 lg:h-[720px] lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <Generator opts={opts} setOpts={setOpts} />
          </div>
          <div className="flex min-h-[360px] flex-col lg:h-[720px]">
            <PaneHeader icon={<FileText className="size-3.5 text-muted-foreground" aria-hidden />} title="robots.txt">
              <CopyButtons text={generated} filename="robots.txt" />
              <GhostButton onClick={() => { setText(generated); setTab("check"); }}>Check it</GhostButton>
            </PaneHeader>
            <pre className="generated min-h-0 flex-1 overflow-auto bg-editor p-4 font-mono text-[12.5px] leading-relaxed">{generated}</pre>
          </div>
        </div>
      )}

      {tab === "llms" && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
          <div className="flex min-h-[420px] flex-col border-b lg:h-[620px] lg:border-b-0 lg:border-r">
            <PaneHeader icon={<FileText className="size-3.5 text-muted-foreground" aria-hidden />} title="llms.txt">
              <GhostButton onClick={() => setLlms(EX_LLMS)}>Example</GhostButton>
              <GhostButton onClick={() => setLlms("")}>Clear</GhostButton>
            </PaneHeader>
            <div className="h-[420px] min-h-0 flex-1 lg:h-auto">
              <Editor ref={llmsEditor} value={llms} onChange={setLlms} diagnostics={llmsDiags} ariaLabel="llms.txt content" placeholderText={"# Project name\n\n> One-line summary\n\n## Docs\n\n- [Quick start](https://example.com/start.md): notes"} />
            </div>
          </div>
          <div className="min-h-[320px] p-4 sm:p-5 lg:h-[620px] lg:overflow-y-auto">
            {!llms.trim() ? (
              <EmptyState title="Paste an llms.txt" text="We check the structure from llmstxt.org: an H1, an optional summary, then H2 sections of links." />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Title" value={<span className="block truncate text-[15px]">{llmsReport.title ?? "—"}</span>} tone={llmsReport.title ? undefined : "error"} />
                  <Stat label="Sections" value={llmsReport.sections.length} />
                  <Stat label="Links" value={llmsReport.linkCount} />
                </div>
                <div className="mt-4"><SeverityCounts findings={llmsReport.findings} /></div>
                <div className="mt-4"><FindingsList findings={llmsReport.findings} onJump={(l) => llmsEditor.current?.jumpTo(l)} empty="Matches the llms.txt format." /></div>
                <p className="mt-5 text-[12.5px] leading-relaxed text-muted-foreground">
                  llms.txt is a community proposal from <a className="underline underline-offset-2" href={SRC.llmstxt} target="_blank" rel="noopener noreferrer">llmstxt.org</a>, not a standard,
                  and it does not control crawling or training. Use robots.txt for that.
                </p>
              </>
            )}
          </div>
        </div>
      )}
      <LocalNote />
    </ToolCard>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="grid h-full min-h-[280px] place-items-center p-8 text-center">
      <div>
        <p className="text-[15px] font-medium">{title}</p>
        <p className="mt-1 max-w-[340px] text-[13px] text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function RobotsReportView({ report, onJump }: { report: ReturnType<typeof checkRobots>; onJump(l: number): void }) {
  const current = report.crawlers.filter((c) => !c.crawler.legacy);
  const n = (p: CrawlerPurpose, s: AccessStatus) => current.filter((c) => c.crawler.purpose === p && c.status === s).length;
  const tot = (p: CrawlerPurpose) => current.filter((c) => c.crawler.purpose === p).length;
  const pt = report.policyToken;
  return (
    <div className="robots-report">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Training bots blocked" value={`${n("training", "blocked")}/${tot("training")}`} sub={n("training", "partial") ? `${n("training", "partial")} partial` : undefined} />
        <Stat label="AI search bots allowed" value={`${n("search", "allowed")}/${tot("search")}`} />
        <Stat label="Content-Usage rules" value={report.contentUsage.length} sub="IETF draft" />
        <Stat label="__usage_ai-training" value={pt.present ? (pt.root === "against" ? "Against" : "In favor") : "None"} sub={pt.present ? `AI training at / · ${pt.exceptions.length} exception${pt.exceptions.length === 1 ? "" : "s"}` : "Shared token draft"} tone={pt.present ? (pt.root === "against" ? "ok" : "warning") : undefined} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <SeverityCounts findings={report.findings} />
      </div>
      <div className="mt-3"><FindingsList findings={report.findings} onJump={onJump} empty="No problems found for AI crawlers." /></div>

      <SectionTitle>AI crawlers</SectionTitle>
      <CrawlerTable rows={report.crawlers} onJump={onJump} />

      {(report.contentUsage.length > 0 || pt.present) && (
        <>
          <SectionTitle>IETF AI preference signals</SectionTitle>
          <div className="rounded-xl border">
            {report.contentUsage.map((c) => (
              <div key={c.line} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-3 py-2 text-[12.5px] last:border-b-0">
                <button onClick={() => onJump(c.line)} className="font-mono text-[11.5px] text-muted-foreground underline decoration-dotted underline-offset-2">line {c.line}</button>
                <span className="font-mono">{c.agents.join(", ")} · {c.path}</span>
                <span className="ml-auto flex gap-3">
                  {(Object.keys(AIPREF_LABELS) as AiprefLabel[]).map((k) => (
                    <span key={k}><span className="text-muted-foreground">{k}</span> <span className={cn("font-medium", PREF[c.prefs[k]].cls)}>{PREF[c.prefs[k]].label}</span></span>
                  ))}
                </span>
              </div>
            ))}
            {pt.present && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-[12.5px]">
                {pt.line && <button onClick={() => onJump(pt.line!)} className="font-mono text-[11.5px] text-muted-foreground underline decoration-dotted underline-offset-2">line {pt.line}</button>}
                <span className="font-mono">__usage_ai-training</span>
                <span className="ml-auto">
                  AI training at <code className="font-mono">/</code>: <span className={cn("font-medium", pt.root === "against" ? "text-error" : "text-ok")}>{pt.root}</span>
                  {pt.exceptions.length ? <span className="text-muted-foreground"> · {pt.exceptions.length} exception{pt.exceptions.length > 1 ? "s" : ""}</span> : null}
                </span>
              </div>
            )}
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
            Both are Internet-Drafts. No crawler is documented as honoring them yet; OpenAI and Google announced plans to support the shared token on 30 Oct 2026.
          </p>
        </>
      )}
    </div>
  );
}

function CrawlerTable({ rows, onJump }: { rows: CrawlerResult[]; onJump(l: number): void }) {
  const purposes: CrawlerPurpose[] = ["training", "search", "user"];
  return (
    <div className="crawlers overflow-hidden rounded-xl border">
      {purposes.map((p) => (
        <div key={p}>
          <div className="border-b bg-subtle px-3 py-1.5 text-[11.5px] font-medium uppercase tracking-wide text-muted-foreground">{PURPOSE_LABEL[p]}</div>
          <ul>
            {rows.filter((r) => r.crawler.purpose === p).map((r) => (
              <li key={r.crawler.token} className="flex items-center gap-3 border-b px-3 py-2 text-[13px] last:border-b-0">
                <span className={cn("w-[64px] shrink-0 rounded-md px-1.5 py-0.5 text-center text-[11.5px] font-medium", STATUS[r.status].cls)}>{STATUS[r.status].label}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <a href={r.crawler.ref} target="_blank" rel="noopener noreferrer" className="font-mono text-[12.5px] font-medium hover:underline">{r.crawler.token}</a>
                    <span className="text-[12px] text-muted-foreground">{r.crawler.owner}</span>
                    {r.crawler.legacy && <span className="rounded bg-muted px-1 text-[10.5px] text-muted-foreground">legacy</span>}
                    {r.crawler.controlToken && <span className="rounded bg-muted px-1 text-[10.5px] text-muted-foreground">control token</span>}
                    {r.crawler.mayIgnoreRobots && <span className="rounded bg-warning-soft px-1 text-[10.5px] text-warning">may ignore robots.txt</span>}
                  </div>
                  <p className="truncate text-[12px] text-muted-foreground" title={r.crawler.note}>{r.crawler.note}</p>
                </div>
                <span className="shrink-0 text-right text-[11.5px] text-muted-foreground">
                  {r.via === "own" && r.line ? <button className="underline decoration-dotted underline-offset-2" onClick={() => onJump(r.line!)}>own group</button> : r.via === "wildcard" ? "via *" : r.via === "own" ? "own group" : "no rules"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

const PRESETS: { id: Preset; label: string }[] = [
  { id: "block-training", label: "Block AI training" },
  { id: "block-all-ai", label: "Block all AI" },
  { id: "allow-all", label: "Allow everything" },
];

function Generator({ opts, setOpts }: { opts: GeneratorOptions; setOpts(f: (o: GeneratorOptions) => GeneratorOptions): void }) {
  const setAccess = (t: string, a: Access) => setOpts((o) => ({ ...o, access: { ...o.access, [t]: a } }));
  const purposes: CrawlerPurpose[] = ["training", "search", "user"];
  return (
    <div className="generator space-y-6">
      <div>
        <div className="text-[13px] font-medium">Start from a preset</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.id} onClick={() => setOpts((o) => ({ ...o, access: presetAccess(p.id), contentUsage: p.id === "allow-all" ? {} : { "train-ai": "n" }, policyToken: p.id === "allow-all" ? "none" : "against" }))}
              className="rounded-md border px-2.5 py-1.5 text-[12.5px] font-medium hover:bg-muted">{p.label}</button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[13px] font-medium">AI crawlers</div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">“Default” writes no group, so the crawler follows <code className="font-mono">User-agent: *</code> (allowed).</p>
        <div className="mt-2 overflow-hidden rounded-xl border">
          {purposes.map((p) => (
            <div key={p}>
              <div className="border-b bg-subtle px-3 py-1.5 text-[11.5px] font-medium uppercase tracking-wide text-muted-foreground">{PURPOSE_LABEL[p]}</div>
              {AI_CRAWLERS.filter((c) => c.purpose === p && !c.legacy).map((c) => (
                <div key={c.token} className="flex items-center justify-between gap-3 border-b px-3 py-1.5 last:border-b-0">
                  <span className="min-w-0 truncate"><span className="font-mono text-[12.5px]">{c.token}</span> <span className="text-[11.5px] text-muted-foreground">{c.owner}</span></span>
                  <Segmented<Access> size="xs" value={opts.access[c.token] ?? "default"} onChange={(a) => setAccess(c.token, a)} options={[{ id: "default", label: "Default" }, { id: "allow", label: "Allow" }, { id: "block", label: "Block" }]} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 text-[13px] font-medium">
          Content-Usage <span className="rounded bg-muted px-1.5 text-[11px] font-normal text-muted-foreground">draft-ietf-aipref-attach</span>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">Added to every group that allows crawling. Preferences don&apos;t apply to blocked paths.</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {(Object.keys(AIPREF_LABELS) as AiprefLabel[]).map((k) => (
            <div key={k} className="rounded-lg border px-3 py-2">
              <div className="text-[12px]"><code className="font-mono">{k}</code> <span className="text-muted-foreground">{AIPREF_LABELS[k]}</span></div>
              <div className="mt-1.5">
                <Segmented size="xs" value={opts.contentUsage[k] ?? "-"} onChange={(v) => setOpts((o) => { const cu = { ...o.contentUsage }; if (v === "-") delete cu[k]; else cu[k] = v as "y" | "n"; return { ...o, contentUsage: cu }; })}
                  options={[{ id: "-", label: "Unset" }, { id: "y", label: "y" }, { id: "n", label: "n" }]} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 text-[13px] font-medium">
          Shared AI-training token <span className="rounded bg-muted px-1.5 text-[11px] font-normal text-muted-foreground">draft-kelley · __usage_ai-training</span>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          The signal OpenAI and Google said they plan to honor. It is a preference, not a crawl rule.{" "}
          <a className="inline-flex items-center underline underline-offset-2" href={SRC.token} target="_blank" rel="noopener noreferrer">Draft<ArrowUpRight className="size-3" aria-hidden /></a>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Segmented<GeneratorOptions["policyToken"]> value={opts.policyToken} onChange={(v) => setOpts((o) => ({ ...o, policyToken: v }))}
            options={[{ id: "none", label: "Don't add" }, { id: "against", label: "Opt out of training" }, { id: "in-favor", label: "Opt in" }]} />
        </div>
        {opts.policyToken === "against" && (
          <div className="mt-3">
            <Field label="Paths that may be used for training" hint="Comma-separated, e.g. /press-kit/, /docs/">
              <input className={inputCls} value={opts.policyTokenAllow.join(", ")} placeholder="/press-kit/"
                onChange={(e) => setOpts((o) => ({ ...o, policyTokenAllow: e.target.value.split(",") }))} />
            </Field>
          </div>
        )}
      </div>

      <Field label="Sitemap URL" hint="Optional">
        <input className={inputCls} value={opts.sitemap} placeholder="https://example.com/sitemap.xml" onChange={(e) => setOpts((o) => ({ ...o, sitemap: e.target.value }))} />
      </Field>
    </div>
  );
}
