import Link from "next/link";
import CursorRulesTool from "@/components/tools/CursorRulesTool";
import { ContentSection, Faq, faqJsonLd, Sources, ToolPage } from "@/components/tools/PageShell";
import { REF, RULE_TYPE_HELP, RULE_TYPE_LABEL, type RuleType } from "@/lib/cursor-rules";
import { pageMeta, SITE } from "@/lib/site";

const TITLE = "Cursor Rules Validator & .mdc Generator";
const DESC = "Validate Cursor project rules (.cursor/rules/*.mdc) and legacy .cursorrules files: frontmatter, alwaysApply, globs and descriptions. Build a correct .mdc rule from a form.";

export const metadata = pageMeta({
  title: TITLE, description: DESC, path: "/cursor-rules/",
  keywords: ["cursor rules", ".mdc file", "cursorrules", "cursor rules generator", "alwaysApply", "cursor globs", "cursor project rules"],
});

const SNIPPETS: Record<RuleType, string> = {
  always: "---\nalwaysApply: true\n---",
  intelligent: "---\ndescription: React component conventions. Use when editing components.\nalwaysApply: false\n---",
  files: "---\nglobs: src/**/*.ts, src/**/*.tsx\nalwaysApply: false\n---",
  manual: "---\nalwaysApply: false\n---",
};

const FAQ = [
  { q: "Is .cursorrules still supported?", a: "Cursor's help center calls the root .cursorrules file legacy and says it will be deprecated. Move its content to .cursor/rules/ as one or more .mdc files." },
  { q: "Which frontmatter fields does a Cursor rule have?", a: "Three: description, globs and alwaysApply. Which ones you set decides the rule type: Always Apply, Apply Intelligently, Apply to Specific Files, or Apply Manually." },
  { q: "Why does my glob not match files in subfolders?", a: "A pattern like *.ts only matches the root. Use **/*.ts to match every folder. Separate multiple globs with commas." },
  { q: "How long should a rule be?", a: "Cursor recommends keeping rules under 500 lines and splitting large ones. Reference files with @path instead of pasting their contents." },
];

export default function Page() {
  return (
    <ToolPage
      eyebrow="Cursor Project Rules"
      title="Validate and build Cursor rules"
      lead={<>Paste a <code className="font-mono text-[0.9em]">.mdc</code> rule or an old <code className="font-mono text-[0.9em]">.cursorrules</code> file to see which type Cursor will treat it as and what&apos;s wrong. Or fill in a form and get a correct rule file.</>}
      bullets={["All 4 rule types", "Glob checks", "Legacy migration hints"]}
      tool={<CursorRulesTool />}
      jsonLd={{ "@context": "https://schema.org", "@graph": [
        { "@type": "WebApplication", name: "Cursor Rules Validator", url: `${SITE}/cursor-rules/`, applicationCategory: "DeveloperApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
        faqJsonLd(FAQ),
      ] }}
    >
      <ContentSection title="The four rule types" intro="The frontmatter you write decides when Cursor includes the rule. These match the examples in Cursor's docs." muted>
        <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(SNIPPETS) as RuleType[]).map((t) => (
            <div key={t} className="bg-background p-5">
              <h3 className="text-[15px] font-medium">{RULE_TYPE_LABEL[t]}</h3>
              <p className="mt-1 text-[13.5px] text-muted-foreground">{RULE_TYPE_HELP[t]}</p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-editor p-3 font-mono text-[12px] leading-relaxed">{SNIPPETS[t]}</pre>
            </div>
          ))}
        </div>
      </ContentSection>

      <ContentSection title="Related formats" intro="Cursor reads both project .mdc rules and root AGENTS.md. Claude Skills are a separate SKILL.md format.">
        <ul className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3">
          <li className="bg-background p-5">
            <Link href="/agents-md/" className="text-[14.5px] font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">AGENTS.md</Link>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">Cross-tool repo instructions. Plain Markdown; no frontmatter schema. Nested files for monorepos.</p>
          </li>
          <li className="bg-background p-5">
            <span className="text-[14.5px] font-medium">Cursor rules (.mdc)</span>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">Scoped with description, globs and alwaysApply. Best when different files need different rules.</p>
          </li>
          <li className="bg-background p-5">
            <Link href="/" className="text-[14.5px] font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">Claude Skill (SKILL.md)</Link>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">Reusable workflows with required name + description frontmatter for Claude.</p>
          </li>
        </ul>
      </ContentSection>

      <ContentSection title="Sources">
        <Sources items={[
          { label: "Cursor docs: Rules", href: REF.rules, note: "Rule types, frontmatter, globs, 500-line guidance, legacy .cursorrules." },
          { label: "Cursor help: Rules", href: REF.help, note: "Glob syntax and how rules are applied." },
        ]} />
      </ContentSection>
      <ContentSection title="FAQ" muted><Faq items={FAQ} /></ContentSection>
    </ToolPage>
  );
}
