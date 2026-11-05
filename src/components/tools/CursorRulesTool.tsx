"use client";

import { useMemo, useRef, useState } from "react";
import { FileCode2, Hammer, ShieldCheck } from "lucide-react";
import { buildMdc, slugify, validateCursorRule, type RuleType } from "@/lib/cursor-rules";
import { chrome } from "@/lib/i18n/chrome";
import { useLocale } from "@/lib/i18n/context";
import {
  CopyButtons, Editor, Field, FindingsList, GhostButton, inputCls, LocalNote, PaneHeader, SectionTitle, SeverityCounts, Stat,
  Tabs, toDiagnostics, ToolCard, Toolbar, type CodeEditorHandle,
} from "./ui";
import { cn } from "@/lib/cn";

type Tab = "validate" | "build";

const PRESETS: Record<string, { label: string; filename: string; text: string }> = {
  good: {
    label: "Good .mdc", filename: ".cursor/rules/react-components.mdc",
    text: `---
globs: src/components/**/*.tsx
alwaysApply: false
---

- Use function components and named exports.
- Keep props typed with an interface named \`<Component>Props\`.
- Put styles in Tailwind classes; no inline style objects.

@src/components/Button.tsx
`,
  },
  bad: {
    label: "Broken .mdc", filename: ".cursor/rules/style.md",
    text: `---
description: Style
glob: *.ts
alwaysApply: "yes"
---
`,
  },
  legacy: {
    label: "Legacy .cursorrules", filename: ".cursorrules",
    text: `You are an expert TypeScript developer.
Always use strict types. Prefer pnpm.
`,
  },
};

const TYPES: RuleType[] = ["always", "intelligent", "files", "manual"];

export default function CursorRulesTool() {
  const labels = chrome(useLocale()).cursor;
  const [tab, setTab] = useState<Tab>("validate");
  const [filename, setFilename] = useState(PRESETS.bad.filename);
  const [text, setText] = useState(PRESETS.bad.text);
  const editor = useRef<CodeEditorHandle>(null);
  const r = useMemo(() => validateCursorRule(text, { filename }), [text, filename]);
  const diags = useMemo(() => toDiagnostics(r.findings), [r]);

  const [name, setName] = useState("React components");
  const [type, setType] = useState<RuleType>("files");
  const [desc, setDesc] = useState("Conventions for React components. Use when creating or editing files in src/components.");
  const [globs, setGlobs] = useState("src/components/**/*.tsx");
  const [body, setBody] = useState("- Use function components and named exports.\n- Type props with an interface named `<Component>Props`.\n\n@src/components/Button.tsx");
  const built = useMemo(() => buildMdc({ type, description: desc, globs, body }), [type, desc, globs, body]);
  const builtPath = `.cursor/rules/${slugify(name)}.mdc`;
  const builtCheck = useMemo(() => validateCursorRule(built, { filename: builtPath }), [built, builtPath]);

  return (
    <ToolCard id="cursor-rules-tool">
      <Toolbar>
        <Tabs<Tab> label="Mode" value={tab} onChange={setTab} tabs={[{ id: "validate", label: labels.validate, Icon: ShieldCheck }, { id: "build", label: labels.build, Icon: Hammer }]} />
        <span className="hidden text-[12.5px] text-muted-foreground md:block">Project Rules in <code className="font-mono">.cursor/rules/*.mdc</code></span>
      </Toolbar>

      {tab === "validate" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
          <div className="flex min-h-[420px] flex-col border-b lg:h-[640px] lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-2 border-b px-3 py-1.5">
              <FileCode2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <input aria-label="File path" value={filename} onChange={(e) => setFilename(e.target.value)} className="min-w-0 flex-1 bg-transparent py-1 font-mono text-[12.5px] outline-none" />
              <div className="flex shrink-0 items-center gap-1">
                {Object.entries(PRESETS).map(([k, p]) => (
                  <GhostButton key={k} onClick={() => { setText(p.text); setFilename(p.filename); }}>{p.label}</GhostButton>
                ))}
              </div>
            </div>
            <div className="h-[420px] min-h-0 flex-1 lg:h-auto">
              <Editor ref={editor} value={text} onChange={setText} diagnostics={diags} ariaLabel="Rule file content" placeholderText={"---\ndescription: ...\nalwaysApply: false\n---\n\nRule text"} />
            </div>
          </div>
          <div className="output min-h-[320px] p-4 sm:p-5 lg:h-[640px] lg:overflow-y-auto" aria-live="polite">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Stat label={labels.ruleType} value={<span className="text-[15px]">{r.mode === "legacy" ? labels.legacy : r.type ? labels.types[r.type].label : labels.unknown}</span>} sub={r.type ? labels.types[r.type].help : r.mode === "legacy" ? labels.legacyHint : undefined} />
              <Stat label="Globs" value={r.globs.length} sub={r.globs.slice(0, 2).join(", ") || undefined} />
              <Stat label="Body lines" value={r.bodyLines} sub="Keep under 500" tone={r.bodyLines > 500 ? "warning" : undefined} />
            </div>
            <div className="mt-5"><SeverityCounts findings={r.findings} /></div>
            <div className="mt-3"><FindingsList findings={r.findings} onJump={(l) => editor.current?.jumpTo(l)} empty="This rule matches Cursor's documented format." /></div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="builder space-y-4 border-b p-4 sm:p-5 lg:h-[640px] lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <Field label="Rule name" hint={<>Saved as <code className="font-mono">{builtPath}</code></>}>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div>
              <div className="text-[13px] font-medium">When should Cursor use it?</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {TYPES.map((t) => (
                  <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)}
                    className={cn("rounded-lg border px-3 py-2 text-left transition-colors", type === t ? "border-foreground bg-subtle ring-1 ring-foreground" : "hover:bg-subtle")}>
                    <div className="text-[13px] font-medium">{labels.types[t].label}</div>
                    <div className="mt-0.5 text-[12px] text-muted-foreground">{labels.types[t].help}</div>
                  </button>
                ))}
              </div>
            </div>
            {type === "intelligent" && (
              <Field label="Description" hint="The Agent reads this to decide relevance. Say what it covers and when to use it.">
                <textarea className={cn(inputCls, "min-h-[64px]")} value={desc} onChange={(e) => setDesc(e.target.value)} />
              </Field>
            )}
            {type === "files" && (
              <Field label="Globs" hint={<>Comma-separated. <code className="font-mono">**/*.ts</code> matches every folder; <code className="font-mono">*.ts</code> only the root.</>}>
                <input className={cn(inputCls, "font-mono")} value={globs} onChange={(e) => setGlobs(e.target.value)} />
              </Field>
            )}
            <Field label="Rule text" hint="Markdown. Reference files with @path instead of pasting them.">
              <textarea className={cn(inputCls, "min-h-[150px] font-mono text-[12.5px]")} value={body} onChange={(e) => setBody(e.target.value)} />
            </Field>
          </div>
          <div className="flex min-h-[360px] flex-col lg:h-[640px]">
            <PaneHeader icon={<FileCode2 className="size-3.5 text-muted-foreground" aria-hidden />} title={<span className="truncate font-mono text-[12.5px]">{builtPath}</span>}>
              <CopyButtons text={built} filename={`${slugify(name)}.mdc`} />
            </PaneHeader>
            <pre className="generated min-h-[180px] flex-1 overflow-auto bg-editor p-4 font-mono text-[12.5px] leading-relaxed">{built}</pre>
            <div className="max-h-[45%] overflow-y-auto border-t p-4">
              <SectionTitle count={builtCheck.findings.length}>Check</SectionTitle>
              <FindingsList findings={builtCheck.findings} empty="Valid rule file." />
            </div>
          </div>
        </div>
      )}
      <LocalNote />
    </ToolCard>
  );
}
