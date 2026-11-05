"use client";

import { useMemo, useRef, useState } from "react";
import { FileText, Hammer, ShieldCheck } from "lucide-react";
import {
  buildAgentsMd,
  CODEX_DEFAULT_MAX_BYTES,
  validateAgentsMd,
  type Grade,
} from "@/lib/agents-md";
import {
  CopyButtons, Editor, Field, FindingsList, GhostButton, inputCls, LocalNote, PaneHeader, SectionTitle, SeverityCounts, Stat,
  Tabs, toDiagnostics, ToolCard, Toolbar, type CodeEditorHandle,
} from "./ui";
import { cn } from "@/lib/cn";
import { chrome } from "@/lib/i18n/chrome";
import { useLocale } from "@/lib/i18n/context";

type Tab = "validate" | "build";

const GOOD = `# AGENTS.md

## Project overview
Next.js 15 static-export site that validates Claude Agent Skills and related agent config files in the browser.

## Setup commands
\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## Code style
- TypeScript strict mode
- Prefer named exports
- Keep UI copy in English to match the site

## Testing instructions
\`\`\`bash
pnpm test
pnpm build
\`\`\`
- Fix failing checks before finishing the task.
- Add or update tests for code you change.

## Security considerations
- Never commit \`.env\` files; commit \`.env.example\` with placeholders.
- Do not put API keys in AGENTS.md or SKILL.md.

## Pull request guidelines
- Keep PRs focused and small.
- Title format: \`[area] summary\`
`;

const BAD = `# agent notes

Always use npm.
Never use npm for installs.

todo: write real instructions later
`;

const PRESETS = {
  good: { label: "Good AGENTS.md", filename: "AGENTS.md", text: GOOD },
  bad: { label: "Thin / conflicting", filename: "agent.md", text: BAD },
  nested: {
    label: "Nested override",
    filename: "packages/api/AGENTS.override.md",
    text: `# Payments API

## Setup commands
\`\`\`bash
make test-payments
\`\`\`

## Security considerations
- Never rotate API keys without notifying the security channel.
`,
  },
} as const;

const GRADE_COLOR: Record<Grade, string> = {
  A: "var(--ok)", B: "var(--ok)", C: "var(--warning)", D: "var(--warning)", F: "var(--error)",
};

function ScoreRing({ score, grade }: { score: number; grade: Grade }) {
  const r = 36, c = 2 * Math.PI * r;
  return (
    <div className="relative size-[88px] shrink-0" aria-label={`Score ${score} grade ${grade}`}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="7" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke={GRADE_COLOR[grade]} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(score, 0.5) / 100)}
          style={{ transition: "stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1), stroke .3s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[24px] font-semibold leading-none tabular-nums tracking-tight">{score}</span>
        <span className="mt-0.5 text-[10px] text-muted-foreground">{grade}</span>
      </div>
    </div>
  );
}

const fmt = (n: number) => n.toLocaleString("en-US");

export default function AgentsMdTool() {
  const labels = chrome(useLocale()).agents;
  const [tab, setTab] = useState<Tab>("validate");
  const [filename, setFilename] = useState<string>(PRESETS.bad.filename);
  const [text, setText] = useState<string>(PRESETS.bad.text);
  const editor = useRef<CodeEditorHandle>(null);
  const r = useMemo(() => validateAgentsMd(text, { filename }), [text, filename]);
  const diags = useMemo(() => toDiagnostics(r.findings), [r]);

  const [projectName, setProjectName] = useState("my-app");
  const [overview, setOverview] = useState("TypeScript monorepo for the customer dashboard. Apps live in apps/, shared packages in packages/.");
  const [setup, setSetup] = useState("pnpm install\npnpm dev");
  const [tests, setTests] = useState("pnpm test\npnpm lint");
  const [style, setStyle] = useState("- TypeScript strict mode\n- Single quotes, no semicolons\n- Prefer functional patterns where possible");
  const [security, setSecurity] = useState("- Never commit `.env` files; commit `.env.example` with placeholders.\n- Do not log secrets or customer PII.");
  const [pr, setPr] = useState("- Run `pnpm lint` and `pnpm test` before opening a PR.\n- Keep changes small and focused.");
  const [extra, setExtra] = useState("");
  const built = useMemo(
    () => buildAgentsMd({ projectName, overview, setupCommands: setup, testCommands: tests, codeStyle: style, security, prGuidelines: pr, extra }),
    [projectName, overview, setup, tests, style, security, pr, extra],
  );
  const builtCheck = useMemo(() => validateAgentsMd(built, { filename: "AGENTS.md" }), [built]);

  const checkBuilt = () => {
    setText(built);
    setFilename("AGENTS.md");
    setTab("validate");
  };

  return (
    <ToolCard id="agents-md-tool">
      <Toolbar>
        <Tabs<Tab>
          label="Mode"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "validate", label: labels.check, Icon: ShieldCheck },
            { id: "build", label: labels.generate, Icon: Hammer },
          ]}
        />
        <span className="hidden text-[12.5px] text-muted-foreground md:block">
          Open format at <code className="font-mono">AGENTS.md</code> — no required schema
        </span>
      </Toolbar>

      {tab === "validate" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
          <div className="flex min-h-[420px] flex-col border-b lg:h-[640px] lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-2 border-b px-3 py-1.5">
              <FileText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <input
                aria-label="File path"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="min-w-0 flex-1 bg-transparent py-1 font-mono text-[12.5px] outline-none"
              />
              <div className="flex shrink-0 items-center gap-1">
                {Object.entries(PRESETS).map(([k, p]) => (
                  <GhostButton key={k} onClick={() => { setText(p.text); setFilename(p.filename); }}>{p.label}</GhostButton>
                ))}
              </div>
            </div>
            <div className="h-[420px] min-h-0 flex-1 lg:h-auto">
              <Editor
                ref={editor}
                value={text}
                onChange={setText}
                diagnostics={diags}
                ariaLabel="AGENTS.md content"
                placeholderText={"# AGENTS.md\n\n## Setup commands\n```bash\npnpm install\n```"}
              />
            </div>
          </div>
          <div className="output min-h-[320px] p-4 sm:p-5 lg:h-[640px] lg:overflow-y-auto" aria-live="polite">
            <div className="flex flex-wrap items-center gap-5">
              <ScoreRing score={r.score} grade={r.grade} />
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-3">
                <Stat label="Lines" value={r.lines} sub="Keep it short" tone={r.lines > 400 ? "warning" : undefined} />
                <Stat
                  label="Size"
                  value={`${fmt(r.bytes)} B`}
                  sub={`Codex default cap ${fmt(CODEX_DEFAULT_MAX_BYTES)} B`}
                  tone={r.bytes > CODEX_DEFAULT_MAX_BYTES ? "warning" : undefined}
                />
                <Stat label="Tokens (est.)" value={fmt(r.estimatedTokens)} sub="≈ chars ÷ 4" />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {r.presentSections.map((id) => (
                <span key={id} className="rounded-full bg-ok-soft px-2 py-0.5 text-[11.5px] font-medium text-ok">{id}</span>
              ))}
              {r.missingSections.map((id) => (
                <span key={id} className="rounded-full bg-muted px-2 py-0.5 text-[11.5px] font-medium text-muted-foreground line-through decoration-muted-foreground/40">{id}</span>
              ))}
            </div>
            <div className="mt-5"><SeverityCounts findings={r.findings} /></div>
            <div className="mt-3">
              <FindingsList
                findings={r.findings}
                onJump={(l) => editor.current?.jumpTo(l)}
                empty="Solid AGENTS.md — matches common agents.md / Codex guidance."
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="builder space-y-4 border-b p-4 sm:p-5 lg:h-[640px] lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <Field label="Project name">
              <input className={inputCls} value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            </Field>
            <Field label="Project overview" hint="What the repo is for and where important code lives.">
              <textarea className={cn(inputCls, "min-h-[72px]")} value={overview} onChange={(e) => setOverview(e.target.value)} />
            </Field>
            <Field label="Setup / build commands" hint="One command per line — wrapped in a bash fence.">
              <textarea className={cn(inputCls, "min-h-[72px] font-mono text-[12.5px]")} value={setup} onChange={(e) => setSetup(e.target.value)} />
            </Field>
            <Field label="Test / lint commands" hint="Commands the agent should run before finishing.">
              <textarea className={cn(inputCls, "min-h-[72px] font-mono text-[12.5px]")} value={tests} onChange={(e) => setTests(e.target.value)} />
            </Field>
            <Field label="Code style">
              <textarea className={cn(inputCls, "min-h-[72px]")} value={style} onChange={(e) => setStyle(e.target.value)} />
            </Field>
            <Field label="Security considerations">
              <textarea className={cn(inputCls, "min-h-[64px]")} value={security} onChange={(e) => setSecurity(e.target.value)} />
            </Field>
            <Field label="PR / commit guidelines">
              <textarea className={cn(inputCls, "min-h-[64px]")} value={pr} onChange={(e) => setPr(e.target.value)} />
            </Field>
            <Field label="Extra instructions" hint="Optional. Deploy steps, large datasets, anything you’d tell a new teammate.">
              <textarea className={cn(inputCls, "min-h-[64px]")} value={extra} onChange={(e) => setExtra(e.target.value)} />
            </Field>
          </div>
          <div className="flex min-h-[360px] flex-col lg:h-[640px]">
            <PaneHeader
              icon={<FileText className="size-3.5 text-muted-foreground" aria-hidden />}
              title={<span className="truncate font-mono text-[12.5px]">AGENTS.md</span>}
            >
              <GhostButton onClick={checkBuilt}>Check it</GhostButton>
              <CopyButtons text={built} filename="AGENTS.md" />
            </PaneHeader>
            <pre className="generated min-h-[180px] flex-1 overflow-auto bg-editor p-4 font-mono text-[12.5px] leading-relaxed">{built}</pre>
            <div className="max-h-[45%] overflow-y-auto border-t p-4">
              <SectionTitle count={builtCheck.findings.length}>Check</SectionTitle>
              <FindingsList findings={builtCheck.findings} empty="Generated file looks good." />
            </div>
          </div>
        </div>
      )}
      <LocalNote />
    </ToolCard>
  );
}
