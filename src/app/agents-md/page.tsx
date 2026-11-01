import Link from "next/link";
import AgentsMdTool from "@/components/tools/AgentsMdTool";
import { ContentSection, Faq, faqJsonLd, Sources, ToolPage } from "@/components/tools/PageShell";
import { CODEX_DEFAULT_MAX_BYTES, REF, RECOMMENDED_SECTIONS } from "@/lib/agents-md";
import { pageMeta, SITE } from "@/lib/site";

const TITLE = "AGENTS.md Validator & Generator";
const DESC =
  "Check and generate AGENTS.md — the open Markdown format for AI coding agents (Codex, Cursor, Copilot, and more). Convention checks for sections, size, and hygiene. No required schema.";

export const metadata = pageMeta({
  title: TITLE,
  description: DESC,
  path: "/agents-md/",
  keywords: [
    "AGENTS.md", "agents md validator", "agents md checker", "agents.md generator",
    "codex agents.md", "cursor agents.md", "ai coding agents instructions",
  ],
});

const FAQ = [
  {
    q: "Is AGENTS.md a formal specification with required fields?",
    a: "No. agents.md states there are no required fields — AGENTS.md is standard Markdown and you can use any headings. This tool's section checks are convention quality tips drawn from agents.md “popular choices” and OpenAI Codex docs, not a schema.",
  },
  {
    q: "Where should I put AGENTS.md?",
    a: "At the repository root for project-wide guidance. For large monorepos, agents.md recommends nested AGENTS.md files per package; the closest file to the edited path wins. Codex also supports AGENTS.override.md in the same directory.",
  },
  {
    q: "How big can AGENTS.md be?",
    a: `OpenAI Codex stops adding instruction files once the combined size reaches project_doc_max_bytes (32 KiB / ${CODEX_DEFAULT_MAX_BYTES.toLocaleString("en-US")} bytes by default). Keep the file short and link out to deeper docs. Line-count tips in this tool are soft guidance, not a formal limit.`,
  },
  {
    q: "How does AGENTS.md relate to Cursor rules and Claude Skills?",
    a: "AGENTS.md is a repo-level instruction file many coding agents read. Cursor also has scoped .cursor/rules/*.mdc files. Claude Agent Skills use SKILL.md with YAML frontmatter for reusable workflows. Prefer one source of truth and thin adapters (for example a CLAUDE.md that imports @AGENTS.md) so agents do not disagree.",
  },
  {
    q: "What if instructions conflict?",
    a: "Per agents.md: the closest AGENTS.md to the edited file wins, and explicit user chat prompts override everything.",
  },
];

export default function Page() {
  return (
    <ToolPage
      eyebrow="Open agent instructions format"
      title="Validate and generate AGENTS.md"
      lead={
        <>
          Paste an <code className="font-mono text-[0.9em]">AGENTS.md</code> to check common quality signals from{" "}
          <a className="underline decoration-border underline-offset-4 hover:decoration-foreground" href={REF.site} target="_blank" rel="noopener noreferrer">agents.md</a>
          {" "}and OpenAI Codex docs — or fill in a form and download a starter file. Plain Markdown; no required schema.
        </>
      }
      bullets={["Convention checks (not a schema)", "Codex 32 KiB size tip", "Generator with Check-it"]}
      tool={<AgentsMdTool />}
      jsonLd={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebApplication",
            name: "AGENTS.md Validator",
            url: `${SITE}/agents-md/`,
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Any",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            description: DESC,
          },
          faqJsonLd(FAQ),
        ],
      }}
    >
      <ContentSection
        title="Popular sections (convention)"
        intro="agents.md lists these as popular choices. They are not required fields — the format has no schema. This checker only warns when core headings look missing."
        muted
      >
        <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {RECOMMENDED_SECTIONS.map((s) => (
            <div key={s.id} className="bg-background p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[15px] font-medium">{s.label}</h3>
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">{s.source}</span>
              </div>
              <p className="mt-2 text-[13.5px] text-muted-foreground">Matched by heading text (case-insensitive). Any wording works.</p>
            </div>
          ))}
        </div>
      </ContentSection>

      <ContentSection
        title="Related formats"
        intro="Same problem space, different files. Use one source of truth when you can."
      >
        <ul className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3">
          <li className="bg-background p-5">
            <Link href="/" className="text-[14.5px] font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">Claude Skill (SKILL.md)</Link>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">Reusable workflows with YAML frontmatter (name + description). Triggered by Claude from the description alone.</p>
          </li>
          <li className="bg-background p-5">
            <Link href="/cursor-rules/" className="text-[14.5px] font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">Cursor rules (.mdc)</Link>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">Scoped project rules in .cursor/rules/ with alwaysApply, globs, and descriptions. Cursor also reads root AGENTS.md.</p>
          </li>
          <li className="bg-background p-5">
            <span className="text-[14.5px] font-medium">AGENTS.md</span>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">Cross-tool repo instructions. Plain Markdown; nested files for monorepos; closest wins.</p>
          </li>
        </ul>
      </ContentSection>

      <ContentSection title="Sources">
        <Sources
          items={[
            { label: "agents.md — open format", href: REF.site, note: "Official hub: no required fields, popular sections, nested files, conflict rules. Stewarded under the Linux Foundation's Agentic AI Foundation.", status: "verified" },
            { label: "OpenAI Codex: Custom instructions with AGENTS.md", href: REF.codex, note: "Discovery order, AGENTS.override.md, project_doc_max_bytes default 32 KiB, fallback filenames.", status: "verified" },
            { label: "OpenAI Codex: Best practices", href: REF.codexBest, note: "What belongs in AGENTS.md; keep it short; link out when large.", status: "verified" },
          ]}
        />
        <p className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground">
          Claude Code&apos;s preference for <code className="font-mono text-[0.9em]">CLAUDE.md</code> and the ~200-line soft tip are ecosystem notes surfaced as tips only — verify against your Claude Code version&apos;s docs before treating them as hard rules.
        </p>
      </ContentSection>

      <ContentSection title="FAQ" muted>
        <Faq items={FAQ} />
      </ContentSection>
    </ToolPage>
  );
}
