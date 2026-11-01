"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle, ArrowUpRight, CheckCircle2, ClipboardPaste, FileArchive, FileText, FolderOpen,
  Info, Loader2, Lock, Upload, XCircle, ChevronDown,
} from "lucide-react";
import {
  bundleFromFileList, bundleFromText, bundleFromZip, validateSkill,
  type Issue, type Report, type Severity, type SkillBundle, type Target,
} from "@/lib/validator";
import { cn } from "@/lib/cn";
import type { CodeEditorHandle, LineDiagnostic } from "./CodeEditor";
import { EXAMPLES } from "./examples";

const CodeEditor = dynamic(() => import("./CodeEditor"), {
  ssr: false,
  loading: () => <div className="h-full animate-pulse bg-editor" />,
});

type Tab = "paste" | "zip" | "folder";

const SEV: Record<Severity, { label: string; text: string; soft: string; border: string; Icon: typeof XCircle }> = {
  error: { label: "Errors", text: "text-error", soft: "bg-error-soft", border: "border-error/30", Icon: XCircle },
  warning: { label: "Warnings", text: "text-warning", soft: "bg-warning-soft", border: "border-warning/30", Icon: AlertTriangle },
  tip: { label: "Tips", text: "text-tip", soft: "bg-tip-soft", border: "border-tip/30", Icon: Info },
};

const TABS: Array<{ id: Tab; label: string; Icon: typeof FileText }> = [
  { id: "paste", label: "Paste SKILL.md", Icon: ClipboardPaste },
  { id: "zip", label: "Upload .zip", Icon: FileArchive },
  { id: "folder", label: "Upload folder", Icon: FolderOpen },
];

export default function Validator() {
  const [tab, setTab] = useState<Tab>("paste");
  const [text, setText] = useState(EXAMPLES.bad.text);
  const [target, setTarget] = useState<Target>("portable");
  const [bundle, setBundle] = useState<SkillBundle | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string>("");
  const [loadError, setLoadError] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const folderRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<CodeEditorHandle>(null);

  const activeBundle = useMemo(() => (tab === "paste" ? bundleFromText(text) : bundle), [tab, text, bundle]);
  const report: Report | null = useMemo(
    () => (activeBundle ? validateSkill(activeBundle, { target }) : null),
    [activeBundle, target],
  );

  const diagnostics: LineDiagnostic[] = useMemo(() => {
    if (tab !== "paste" || !report) return [];
    return report.issues
      .filter((i) => i.line && (!i.file || i.file === "SKILL.md"))
      .map((i) => ({ line: i.line!, severity: i.severity === "tip" ? "info" : i.severity, message: `${i.message}${i.fix ? `\nFix: ${i.fix}` : ""}` }));
  }, [tab, report]);

  const onZip = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setBusy(true); setLoadError("");
    try {
      setBundle(await bundleFromZip(file));
      setSourceLabel(file.name);
    } catch (e) {
      setBundle(null);
      setLoadError(`Could not read ${file.name} as a zip: ${(e as Error).message}`);
    } finally { setBusy(false); }
  }, []);

  const onFolder = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setLoadError("");
    try {
      setBundle(await bundleFromFileList(files));
      const first = (files[0] as File & { webkitRelativePath?: string }).webkitRelativePath?.split("/")[0];
      setSourceLabel(`${first ?? "folder"}`);
    } finally { setBusy(false); }
  }, []);

  const switchTab = (t: Tab) => { setTab(t); if (t !== "paste") { setBundle(null); setSourceLabel(""); } setLoadError(""); };

  const jump = (issue: Issue) => {
    if (tab === "paste" && issue.line && (!issue.file || issue.file === "SKILL.md")) editorRef.current?.jumpTo(issue.line);
  };

  return (
    <div id="validator" className="tool overflow-hidden rounded-2xl border bg-background shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_40px_-12px_rgb(0_0_0/0.12)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.02),0_20px_60px_-20px_rgb(0_0_0/0.8)]">
      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-subtle px-3 py-2.5 sm:px-4">
        <div role="tablist" aria-label="Input method" className="inline-flex rounded-lg border bg-background p-0.5">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => switchTab(id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                tab === id ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              <span className={cn(id !== tab && "hidden sm:inline")}>{label}</span>
            </button>
          ))}
        </div>
        <label className="relative inline-flex items-center gap-2 text-[13px] text-muted-foreground">
          <span className="hidden sm:inline">Validate for</span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as Target)}
            className="h-8 appearance-none rounded-md border bg-background py-0 pl-2.5 pr-8 text-[13px] font-medium text-foreground hover:bg-muted"
          >
            <option value="portable">claude.ai, API &amp; Agent Skills spec</option>
            <option value="claude-code">Claude Code</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 size-3.5" aria-hidden />
        </label>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
        {/* input pane */}
        <div className="input flex min-h-[420px] flex-col border-b lg:h-[680px] lg:border-b-0 lg:border-r">
          {tab === "paste" && (
            <>
              <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
                <div className="flex items-center gap-2 text-[13px] font-medium">
                  <FileText className="size-3.5 text-muted-foreground" aria-hidden />
                  SKILL.md
                </div>
                <div className="examples flex items-center gap-1">
                  <GhostButton onClick={() => setText(EXAMPLES.good.text)}><Short label={EXAMPLES.good.label} /></GhostButton>
                  <GhostButton onClick={() => setText(EXAMPLES.bad.text)}><Short label={EXAMPLES.bad.label} /></GhostButton>
                  <GhostButton onClick={() => setText("")}>Clear</GhostButton>
                </div>
              </div>
              <div className="h-[420px] min-h-0 flex-1 lg:h-auto">
                <CodeEditor
                  ref={editorRef}
                  value={text}
                  onChange={setText}
                  diagnostics={diagnostics}
                  ariaLabel="SKILL.md content"
                  placeholderText={"---\nname: my-skill\ndescription: What it does. Use when ...\n---\n\n# Instructions"}
                />
              </div>
            </>
          )}

          {tab !== "paste" && (
            <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
              <div
                role="button"
                tabIndex={0}
                onClick={() => (tab === "zip" ? zipRef : folderRef).current?.click()}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (tab === "zip" ? zipRef : folderRef).current?.click(); } }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault(); setDragging(false);
                  if (tab === "zip") onZip(e.dataTransfer.files[0]); else onFolder(e.dataTransfer.files);
                }}
                className={cn(
                  "drop group flex min-h-[260px] flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 text-center transition-colors",
                  dragging ? "border-accent bg-accent-soft" : "hover:border-foreground/30 hover:bg-subtle",
                )}
              >
                <input ref={zipRef} type="file" className="hidden" accept=".zip,.skill,application/zip" onChange={(e) => onZip(e.target.files?.[0])} />
                <input
                  ref={folderRef}
                  type="file"
                  className="hidden"
                  // @ts-expect-error non-standard but widely supported
                  webkitdirectory=""
                  directory=""
                  multiple
                  onChange={(e) => onFolder(e.target.files)}
                />
                <div className={cn("grid size-11 place-items-center rounded-full border bg-background shadow-sm transition-transform", dragging && "scale-110")}>
                  {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Upload className="size-5" aria-hidden />}
                </div>
                <div>
                  <p className="text-[15px] font-medium">
                    {tab === "zip" ? "Drop a skill .zip here" : "Choose your skill folder"}
                  </p>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {tab === "zip"
                      ? "Or click to browse. The archive is unpacked in your browser."
                      : "Pick the folder that contains SKILL.md. Files are read in your browser."}
                  </p>
                </div>
              </div>
              {loadError && <p className="err rounded-lg border border-error/30 bg-error-soft px-3 py-2 text-[13px] text-error">{loadError}</p>}
              {bundle && <FileList bundle={bundle} label={sourceLabel} />}
            </div>
          )}
        </div>

        {/* report pane */}
        <div className="output min-h-[320px] lg:h-[680px] lg:overflow-y-auto" aria-live="polite">
          {report ? (
            <ReportView report={report} onJump={jump} canJump={tab === "paste"} />
          ) : (
            <div className="grid h-full min-h-[320px] place-items-center p-8 text-center">
              <div>
                <p className="text-[15px] font-medium">No skill loaded yet</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {tab === "zip" ? "Drop a .zip on the left to get a score and fixes." : "Choose a folder on the left to get a score and fixes."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t bg-subtle px-4 py-2 text-[12px] text-muted-foreground">
        <Lock className="size-3" aria-hidden />
        Checked locally. Your files are never uploaded.
      </div>
    </div>
  );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick(): void }) {
  return (
    <button onClick={onClick} className="chip whitespace-nowrap rounded-md px-2 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      {children}
    </button>
  );
}

/** "Good example" -> "Good" on narrow screens. */
function Short({ label }: { label: string }) {
  const [head, ...rest] = label.split(" ");
  return <>{head}{rest.length ? <span className="hidden sm:inline"> {rest.join(" ")}</span> : null}</>;
}

function FileList({ bundle, label }: { bundle: SkillBundle; label: string }) {
  const paths = [...bundle.files.keys()].sort();
  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b px-3 py-2 text-[13px]">
        <span className="font-medium">{label || bundle.rootDir || "Skill"}</span>
        <span className="text-muted-foreground">{paths.length} {paths.length === 1 ? "file" : "files"}</span>
      </div>
      <ul className="max-h-48 overflow-y-auto py-1 font-mono text-[12px]">
        {paths.map((p) => (
          <li key={p} className="flex items-center gap-2 px-3 py-1 text-muted-foreground">
            <FileText className="size-3 shrink-0" aria-hidden />
            <span className={cn("truncate", p === "SKILL.md" && "font-medium text-foreground")}>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const GRADE_COLOR: Record<Report["grade"], string> = {
  A: "var(--ok)", B: "var(--ok)", C: "var(--warning)", D: "var(--warning)", F: "var(--error)",
};

function ScoreRing({ score, grade }: { score: number; grade: Report["grade"] }) {
  const r = 42, c = 2 * Math.PI * r;
  const color = GRADE_COLOR[grade];
  return (
    <div className={`score grade-${grade} relative size-[104px] shrink-0`}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="7" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(score, 0.5) / 100)}
          style={{ transition: "stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1), stroke .3s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-[30px] font-semibold leading-none tracking-tight tabular-nums">{score}</span>
        <span className="mt-1 text-[11px] text-muted-foreground">of 100</span>
      </div>
    </div>
  );
}

function Meter({ label, value, max, unit }: { label: string; value: number; max?: number; unit?: string }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  const over = max ? value > max : false;
  return (
    <div className="rounded-lg border px-3 py-2.5">
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-[15px] font-medium tabular-nums">
        {value.toLocaleString("en-US")}
        {max ? <span className="text-muted-foreground"> / {max.toLocaleString("en-US")}</span> : null}
        {unit ? <span className="text-muted-foreground"> {unit}</span> : null}
      </div>
      {max ? (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, background: over ? "var(--error)" : "var(--foreground)", opacity: over ? 1 : 0.55 }} />
        </div>
      ) : null}
    </div>
  );
}

function ReportView({ report, onJump, canJump }: { report: Report; onJump(i: Issue): void; canJump: boolean }) {
  const groups: Severity[] = ["error", "warning", "tip"];
  const verdict = report.passed ? (report.counts.warning ? "Valid, with warnings" : "Valid skill") : "Invalid skill";
  const summary = report.passed
    ? report.counts.warning
      ? "Claude will accept this skill. Fix the warnings so it triggers reliably."
      : "Ready to upload. Nothing blocks this skill."
    : `Fix ${report.counts.error === 1 ? "the error" : `the ${report.counts.error} errors`} below before uploading. Uploads with these problems are rejected or never trigger.`;
  return (
    <div className="p-4 sm:p-5">
      <div className="scorecard flex items-center gap-5">
        <ScoreRing score={report.score} grade={report.grade} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="verdict text-[18px] font-semibold tracking-tight">{verdict}</h2>
            <span
              className="rounded-md px-1.5 py-0.5 text-[12px] font-semibold"
              style={{ color: GRADE_COLOR[report.grade], background: `color-mix(in oklab, ${GRADE_COLOR[report.grade]} 14%, transparent)` }}
            >
              Grade {report.grade}
            </span>
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{summary}</p>
          <div className="counts mt-3 flex flex-wrap gap-1.5">
            {groups.map((g) => {
              const { text, soft, Icon } = SEV[g];
              const n = report.counts[g];
              return (
                <span key={g} className={cn("b inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium", g, n ? [text, soft] : "bg-muted text-muted-foreground")}>
                  <Icon className="size-3" aria-hidden />
                  {n} {n === 1 ? SEV[g].label.slice(0, -1).toLowerCase() : SEV[g].label.toLowerCase()}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Meter label="Description" value={report.stats.descriptionChars} max={1024} />
        <Meter label="Body lines" value={report.stats.bodyLines} max={500} />
        <Meter label="Body tokens" value={report.stats.approxBodyTokens} max={5000} />
        <Meter label="Files" value={report.stats.fileCount} />
      </div>

      {report.issues.length === 0 && (
        <div className="ok mt-5 flex items-center gap-3 rounded-xl border border-ok/30 bg-ok-soft px-4 py-3 text-[14px] text-ok">
          <CheckCircle2 className="size-4" aria-hidden />
          No issues found. This skill follows every rule we check.
        </div>
      )}

      {groups.map((g) => {
        const items = report.issues.filter((i) => i.severity === g);
        if (!items.length) return null;
        const { label, text } = SEV[g];
        return (
          <section key={g} className="group mt-6">
            <h3 className="mb-2 flex items-center gap-2 text-[13px] font-medium">
              <span className={text}>{label}</span>
              <span className="rounded-full bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">{items.length}</span>
            </h3>
            <ul className="flex flex-col gap-2">
              {items.map((i, n) => <IssueItem key={`${i.rule}-${n}`} issue={i} onJump={onJump} canJump={canJump} />)}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function IssueItem({ issue, onJump, canJump }: { issue: Issue; onJump(i: Issue): void; canJump: boolean }) {
  const { text, Icon } = SEV[issue.severity];
  const loc = issue.file ? `${issue.file}${issue.line ? `:${issue.line}` : ""}` : "";
  const jumpable = canJump && !!issue.line && (!issue.file || issue.file === "SKILL.md");
  return (
    <li className={cn("issue rounded-xl border bg-background px-3.5 py-3", issue.severity)}>
      <div className="flex gap-2.5">
        <Icon className={cn("mt-0.5 size-4 shrink-0", text)} aria-hidden />
        <div className="msg min-w-0 flex-1">
          <p className="text-[13.5px] leading-snug">{issue.message}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
            <code className="rule font-mono text-[11.5px]">{issue.rule}</code>
            {loc && (jumpable ? (
              <button onClick={() => onJump(issue)} className="loc font-mono text-[11.5px] underline decoration-dotted underline-offset-2 hover:text-foreground" title="Show in editor">
                {loc}
              </button>
            ) : <span className="loc font-mono text-[11.5px]">{loc}</span>)}
            {issue.ref && (
              <a className="ref ml-auto inline-flex items-center gap-0.5 hover:text-foreground" href={issue.ref} target="_blank" rel="noopener noreferrer">
                Spec<ArrowUpRight className="size-3" aria-hidden />
              </a>
            )}
          </div>
          {issue.fix && (
            <div className="fix mt-2.5 rounded-lg bg-subtle px-3 py-2 text-[12.5px] leading-relaxed ring-1 ring-border ring-inset">
              <span className="font-medium">Fix: </span>
              <span className="whitespace-pre-wrap text-muted-foreground">{issue.fix}</span>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
