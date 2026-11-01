"use client";

import dynamic from "next/dynamic";
import { forwardRef, useState } from "react";
import { AlertTriangle, ArrowUpRight, Check, CheckCircle2, Copy, Download, Info, Lock, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { countFindings, type Finding, type Severity } from "@/lib/common/finding";
import type { CodeEditorHandle, LineDiagnostic } from "../CodeEditor";

export const Editor = dynamic(() => import("../CodeEditor"), {
  ssr: false,
  loading: () => <div className="h-full animate-pulse bg-editor" />,
});

export const SEV: Record<Severity, { label: string; text: string; soft: string; Icon: typeof XCircle }> = {
  error: { label: "Errors", text: "text-error", soft: "bg-error-soft", Icon: XCircle },
  warning: { label: "Warnings", text: "text-warning", soft: "bg-warning-soft", Icon: AlertTriangle },
  tip: { label: "Tips", text: "text-tip", soft: "bg-tip-soft", Icon: Info },
};

export function toDiagnostics(f: Finding[]): LineDiagnostic[] {
  return f.filter((x) => x.line).map((x) => ({ line: x.line!, severity: x.severity === "tip" ? "info" : x.severity, message: `${x.message}${x.fix ? `\nFix: ${x.fix}` : ""}` }));
}

export const ToolCard = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string; id?: string }>(function ToolCard({ children, className, id }, ref) {
  return (
    <div ref={ref} id={id} className={cn("tool overflow-hidden rounded-2xl border bg-background shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_40px_-12px_rgb(0_0_0/0.12)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.02),0_20px_60px_-20px_rgb(0_0_0/0.8)]", className)}>
      {children}
    </div>
  );
});

export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-subtle px-3 py-2.5 sm:px-4">{children}</div>;
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: string; Icon?: typeof Info }[]; value: T; onChange(t: T): void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-lg border bg-background p-0.5">
      {tabs.map(({ id, label: l, Icon }) => (
        <button
          key={id}
          role="tab"
          aria-selected={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
            value === id ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {Icon && <Icon className="size-3.5" aria-hidden />}
          {l}
        </button>
      ))}
    </div>
  );
}

export function GhostButton({ children, onClick, title }: { children: React.ReactNode; onClick(): void; title?: string }) {
  return (
    <button onClick={onClick} title={title} className="chip inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      {children}
    </button>
  );
}

export function PaneHeader({ icon, title, children }: { icon?: React.ReactNode; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-[41px] flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b px-3 py-1.5">
      <div className="flex min-w-0 items-center gap-2 text-[13px] font-medium">{icon}{title}</div>
      <div className="flex flex-wrap items-center gap-1">{children}</div>
    </div>
  );
}

export function LocalNote({ children = "Checked locally. Nothing you paste is uploaded." }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-t bg-subtle px-4 py-2 text-[12px] text-muted-foreground">
      <Lock className="size-3" aria-hidden />
      {children}
    </div>
  );
}

export function SeverityCounts({ findings }: { findings: Finding[] }) {
  const c = countFindings(findings);
  return (
    <div className="counts flex flex-wrap gap-1.5">
      {(["error", "warning", "tip"] as Severity[]).map((g) => {
        const { text, soft, Icon, label } = SEV[g];
        const n = c[g];
        return (
          <span key={g} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium", n ? [text, soft] : "bg-muted text-muted-foreground")}>
            <Icon className="size-3" aria-hidden />
            {n} {n === 1 ? label.slice(0, -1).toLowerCase() : label.toLowerCase()}
          </span>
        );
      })}
    </div>
  );
}

export function FindingsList({ findings, onJump, empty = "No issues found." }: { findings: Finding[]; onJump?(line: number): void; empty?: string }) {
  if (!findings.length)
    return (
      <div className="ok flex items-center gap-3 rounded-xl border border-ok/30 bg-ok-soft px-4 py-3 text-[14px] text-ok">
        <CheckCircle2 className="size-4 shrink-0" aria-hidden />
        {empty}
      </div>
    );
  return (
    <ul className="flex flex-col gap-2">
      {findings.map((i, n) => {
        const { text, Icon } = SEV[i.severity];
        return (
          <li key={`${i.rule}-${n}`} className={cn("issue rounded-xl border bg-background px-3.5 py-3", i.severity)}>
            <div className="flex gap-2.5">
              <Icon className={cn("mt-0.5 size-4 shrink-0", text)} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] leading-snug">{i.message}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                  <code className="font-mono text-[11.5px]">{i.rule}</code>
                  {i.line ? (onJump ? (
                    <button onClick={() => onJump(i.line!)} className="font-mono text-[11.5px] underline decoration-dotted underline-offset-2 hover:text-foreground" title="Show in editor">line {i.line}</button>
                  ) : <span className="font-mono text-[11.5px]">line {i.line}</span>) : null}
                  {i.ref && (
                    <a className="ml-auto inline-flex items-center gap-0.5 hover:text-foreground" href={i.ref} target="_blank" rel="noopener noreferrer">
                      Source<ArrowUpRight className="size-3" aria-hidden />
                    </a>
                  )}
                </div>
                {i.fix && (
                  <div className="mt-2.5 rounded-lg bg-subtle px-3 py-2 text-[12.5px] leading-relaxed ring-1 ring-border ring-inset">
                    <span className="font-medium">Fix: </span>
                    <span className="whitespace-pre-wrap text-muted-foreground">{i.fix}</span>
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "ok" | "warning" | "error" }) {
  return (
    <div className="rounded-lg border px-3 py-2.5">
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-[17px] font-semibold tabular-nums tracking-tight", tone === "ok" && "text-ok", tone === "warning" && "text-warning", tone === "error" && "text-error")}>{value}</div>
      {sub ? <div className="mt-0.5 text-[11.5px] text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

export function SectionTitle({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <h3 className="mb-2 mt-6 flex items-center gap-2 text-[13px] font-medium first:mt-0">
      {children}
      {count !== undefined && <span className="rounded-full bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">{count}</span>}
    </h3>
  );
}

export function CopyButtons({ text, filename }: { text: string; filename: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <GhostButton onClick={copy}>{copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}{copied ? "Copied" : "Copy"}</GhostButton>
      <GhostButton onClick={download}><Download className="size-3.5" aria-hidden />Download</GhostButton>
    </>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium">{label}</span>
      {hint ? <span className="mt-0.5 block text-[12px] text-muted-foreground">{hint}</span> : null}
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

export const inputCls = "w-full rounded-md border bg-background px-2.5 py-1.5 text-[13px] outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground/40 focus:ring-2 focus:ring-ring/20";

export function Segmented<T extends string>({ options, value, onChange, size = "sm" }: { options: { id: T; label: string }[]; value: T; onChange(v: T): void; size?: "sm" | "xs" }) {
  return (
    <div className="inline-flex rounded-md border bg-background p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded px-2 font-medium transition-colors",
            size === "xs" ? "py-0.5 text-[11.5px]" : "py-1 text-[12.5px]",
            value === o.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export type { CodeEditorHandle };
