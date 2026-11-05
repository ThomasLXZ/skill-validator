import Validator from "@/components/Validator";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Code from "@/components/Code";
import Link from "next/link";
import { Check, Braces, FileSearch, FolderTree, Link2, ScrollText, ShieldAlert, Tag, ArrowUpRight } from "lucide-react";
import { TOOL_CARDS } from "@/lib/site";

const FAQ = [
  {
    q: "What does the Claude Skill Validator check?",
    a: "It parses the YAML frontmatter of SKILL.md and checks the required name and description fields against the Agent Skills spec and Anthropic's rules (max 64-char lowercase hyphenated name, no reserved words, max 1024-char description without XML tags), flags unknown keys that make claude.ai uploads fail, scores how clearly the description says what the skill does and when to use it, checks body length (under 500 lines / ~5k tokens), verifies that every referenced file and script exists in your zip, and scans for leaked secrets.",
  },
  {
    q: "Is my skill uploaded anywhere?",
    a: "No. Validation runs entirely in your browser. Your SKILL.md, zip or folder never leaves your machine.",
  },
  {
    q: "Why does my skill upload fail with \"Unexpected key(s) in SKILL.md frontmatter\"?",
    a: "claude.ai and the Skills API only accept name, description, license, compatibility, metadata and allowed-tools. Claude Code-only fields such as argument-hint, disable-model-invocation or model must be removed before uploading. Switch the target to Claude Code if the skill is only used there.",
  },
  {
    q: "Why isn't Claude using my skill?",
    a: "Claude decides whether to load a skill from its name and description alone. A vague description like \"Helps with documents\" rarely triggers. Describe the concrete actions and add a \"Use when…\" sentence with the words users actually say.",
  },
  {
    q: "Is this an official Anthropic tool?",
    a: "No. It is an independent validator built from the public Agent Skills specification and Anthropic's published documentation.",
  },
  {
    q: "Can it check citations in a skill?",
    a: "If the instructions use an author-year citation such as (Smith, 2024), or a marker like [1] next to wording about a source, and the skill never links an http(s) URL, you get a tip: BODY_CITE_NO_SOURCE. It does not fetch the page or decide whether the source supports the claim. Add the URL, or drop the marker.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "Claude Skill Validator",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (browser)",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description: "Validate Claude Agent Skills (SKILL.md) in your browser: frontmatter, naming, description quality, file references and best practices.",
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ],
};

const RULES = [
  { Icon: Braces, title: "Frontmatter", text: "Starts on line 1 with ---, parses as YAML, has no duplicate or unknown keys.", ids: ["FM_MISSING", "FM_YAML_INVALID", "FM_UNKNOWN_KEY"] },
  { Icon: Tag, title: "name", text: "1–64 characters of a–z, 0–9 and hyphens. No leading, trailing or double hyphens, no “claude” or “anthropic”, and it matches the folder name.", ids: ["NAME_CHARSET", "NAME_RESERVED_WORD", "NAME_DIR_MISMATCH"] },
  { Icon: FileSearch, title: "description", text: "1–1024 characters, no angle brackets, written in third person, and says both what the skill does and when to use it.", ids: ["DESC_NO_WHEN", "DESC_VAGUE", "DESC_TOO_LONG"] },
  { Icon: ScrollText, title: "Body", text: "Under 500 lines and about 5k tokens, organised with headings, free of Windows paths and dated instructions. Citation markers should link a source.", ids: ["BODY_TOO_MANY_LINES", "BODY_CITE_NO_SOURCE"] },
  { Icon: Link2, title: "References", text: "Every linked file and script exists with the same casing, paths are relative and one level deep, anchors resolve.", ids: ["REF_MISSING_FILE", "REF_CASE_MISMATCH", "REF_NESTED"] },
  { Icon: ShieldAlert, title: "Scripts and security", text: "Scripts are referenced and their dependencies documented. No hard-coded API keys, .env files or curl | sh.", ids: ["SEC_SECRET", "SEC_DANGEROUS_COMMAND", "STRUCT_ENV_FILE"] },
];

const TREE = `my-skill/
├── SKILL.md        # required
├── scripts/        # code Claude can run
├── references/     # docs loaded on demand
└── assets/         # templates, data`;

const SKILL_SAMPLE = `---
name: processing-pdfs
description: Extracts text and tables from PDF files,
  fills forms, merges documents. Use when working with
  PDFs or when the user mentions forms or extraction.
---

# PDF processing

## Quick start
Use pdfplumber to extract text. For form filling,
see [references/FORMS.md](references/FORMS.md).`;

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SiteHeader />

      <main>
        <section className="hero relative">
          <div className="hero-grid pointer-events-none absolute inset-x-0 top-0 h-[520px]" aria-hidden />
          <div className="relative mx-auto max-w-[1240px] px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
            <div className="max-w-[880px]">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-[12.5px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-ok" aria-hidden />
                Up to date with the Agent Skills spec
              </p>
              <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[60px]">
                Claude Skill Validator
              </h1>
              <p className="lead mt-5 max-w-[620px] text-[17px] leading-relaxed text-muted-foreground sm:text-[18px]">
                Check your <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.88em] text-foreground">SKILL.md</code> before you upload it to Claude.
                Paste the file or drop your skill folder and get a score, the exact line of every problem, and how to fix it.
                Free, and it runs entirely in your browser.
              </p>
              <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-muted-foreground">
                {["72 rules from the spec and Anthropic's guide", "Errors underlined on the exact line", "Nothing leaves your browser"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="size-4 text-ok" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="relative mx-auto max-w-[1240px] px-4 pb-20 sm:px-6">
            <Validator />
          </div>
        </section>

        <section id="checks" className="content border-t">
          <div className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6">
            <div className="max-w-[620px]">
              <h2 className="text-[28px] font-semibold tracking-[-0.025em] sm:text-[32px]">What the validator checks</h2>
              <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
                72 rules taken from the public specification, Anthropic&apos;s best practices and the official
                <code className="mx-1 font-mono text-[0.9em]">quick_validate.py</code>. Errors block an upload, warnings hurt triggering, tips are polish.
              </p>
            </div>
            <div className="rules mt-10 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {RULES.map(({ Icon, title, text, ids }) => (
                <div key={title} className="flex flex-col bg-background p-6">
                  <Icon className="size-5 text-accent" aria-hidden />
                  <h3 className={`mt-4 text-[15px] font-semibold ${title === "name" || title === "description" ? "font-mono" : ""}`}>{title}</h3>
                  <p className="mt-2 flex-1 text-[14px] leading-relaxed text-muted-foreground">{text}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {ids.map((id) => (
                      <code key={id} className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">{id}</code>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="format" className="border-t bg-subtle">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div>
              <h2 className="text-[28px] font-semibold tracking-[-0.025em] sm:text-[32px]">SKILL.md format in 30 seconds</h2>
              <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
                A skill is a folder. Only <code className="font-mono text-[0.9em] text-foreground">SKILL.md</code> is required: YAML frontmatter with a
                <code className="mx-1 font-mono text-[0.9em] text-foreground">name</code> and a
                <code className="mx-1 font-mono text-[0.9em] text-foreground">description</code>, then Markdown instructions.
              </p>
              <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
                Claude reads only the name and description to decide whether to load the skill, so the description has to say when to use it.
              </p>
              <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
                Related: repo-wide agent instructions live in <Link className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground" href="/agents-md/">AGENTS.md</Link>;
                Cursor-scoped rules use <Link className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground" href="/cursor-rules/">.mdc files</Link>.
              </p>
              <div className="mt-6"><Code title="Folder layout">{TREE}</Code></div>
            </div>
            <Code title="processing-pdfs/SKILL.md">{SKILL_SAMPLE}</Code>
          </div>
        </section>


        <section id="tools" className="border-t bg-subtle">
          <div className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6">
            <div className="max-w-[620px]">
              <h2 className="text-[28px] font-semibold tracking-[-0.025em] sm:text-[32px]">More tools</h2>
              <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
                Same browser-only approach for related agent files: an AGENTS.md validator, JSON Schema and structured output, an MCP server test suite, sampling checks, and an MCP token counter.
              </p>
            </div>
            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {TOOL_CARDS.filter((t) => t.href !== "/").map((t) => (
                <Link key={t.href} href={t.href} className="group flex flex-col bg-background p-6 transition-colors hover:bg-subtle">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[15px] font-semibold">{t.title}</h3>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                  </div>
                  <p className="mt-2 flex-1 text-[14px] leading-relaxed text-muted-foreground">{t.blurb}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="border-t">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <h2 className="text-[28px] font-semibold tracking-[-0.025em] sm:text-[32px]">Frequently asked questions</h2>
            <div className="divide-y border-y">
              {FAQ.map((f) => (
                <details key={f.q} className="group">
                  <summary className="flex cursor-pointer items-start justify-between gap-6 py-5 text-[15.5px] font-medium">
                    {f.q}
                    <span className="chev mt-0.5 grid size-5 shrink-0 place-items-center text-muted-foreground transition-transform" aria-hidden>
                      <svg viewBox="0 0 16 16" className="size-4"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </span>
                  </summary>
                  <p className="-mt-1 pb-5 pr-10 text-[15px] leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter>
        <p>
          Based on the <a className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground" href="https://agentskills.io/specification">Agent Skills specification</a> and Anthropic&apos;s{" "}
          <a className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground" href="https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices">skill authoring best practices</a>.
          Not affiliated with Anthropic. Claude is a trademark of Anthropic, PBC.
        </p>
      </SiteFooter>
    </>
  );
}
