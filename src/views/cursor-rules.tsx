import Link from "next/link";
import CursorRulesTool from "@/components/tools/CursorRulesTool";
import { ContentSection, Faq, faqJsonLd, Sources, ToolPage } from "@/components/tools/PageShell";
import { REF, type RuleType } from "@/lib/cursor-rules";
import { chrome } from "@/lib/i18n/chrome";
import { localePath, type Locale } from "@/lib/i18n/routing";
import { pageMeta, SITE } from "@/lib/site";
import { textLink } from "./bits";

const PATH = "/cursor-rules/";

const SNIPPETS: Record<RuleType, string> = {
  always: "---\nalwaysApply: true\n---",
  intelligent: "---\ndescription: React component conventions. Use when editing components.\nalwaysApply: false\n---",
  files: "---\nglobs: src/**/*.ts, src/**/*.tsx\nalwaysApply: false\n---",
  manual: "---\nalwaysApply: false\n---",
};

const copy = {
  en: {
    title: "Cursor Rules Validator & .mdc Generator",
    description: "Validate Cursor project rules (.cursor/rules/*.mdc) and legacy .cursorrules files: frontmatter, alwaysApply, globs and descriptions. Build a correct .mdc rule from a form.",
    keywords: ["cursor rules", ".mdc file", "cursorrules", "cursor rules generator", "alwaysApply", "cursor globs", "cursor project rules"],
    eyebrow: "Cursor Project Rules",
    h1: "Validate and build Cursor rules",
    lead: "Paste a .mdc rule or an old .cursorrules file to see which type Cursor will treat it as and what's wrong. Or fill in a form and get a correct rule file.",
    bullets: ["All 4 rule types", "Glob checks", "Legacy migration hints"],
    appName: "Cursor Rules Validator",
    typesTitle: "The four rule types",
    typesIntro: "The frontmatter you write decides when Cursor includes the rule. These match the examples in Cursor's docs.",
    relatedTitle: "Related formats",
    relatedIntro: "Cursor reads both project .mdc rules and root AGENTS.md. Claude Skills are a separate SKILL.md format.",
    agentsBody: "Cross-tool repo instructions. Plain Markdown; no frontmatter schema. Nested files for monorepos.",
    mdcBody: "Scoped with description, globs and alwaysApply. Best when different files need different rules.",
    skillBody: "Reusable workflows with required name + description frontmatter for Claude.",
    sourcesTitle: "Sources",
    faqTitle: "FAQ",
    faq: [
      { q: "Is .cursorrules still supported?", a: "Cursor's help center calls the root .cursorrules file legacy and says it will be deprecated. Move its content to .cursor/rules/ as one or more .mdc files." },
      { q: "Which frontmatter fields does a Cursor rule have?", a: "Three: description, globs and alwaysApply. Which ones you set decides the rule type: Always Apply, Apply Intelligently, Apply to Specific Files, or Apply Manually." },
      { q: "Why does my glob not match files in subfolders?", a: "A pattern like *.ts only matches the root. Use **/*.ts to match every folder. Separate multiple globs with commas." },
      { q: "How long should a rule be?", a: "Cursor recommends keeping rules under 500 lines and splitting large ones. Reference files with @path instead of pasting their contents." },
    ],
    sources: [
      { label: "Cursor docs: Rules", href: REF.rules, note: "Rule types, frontmatter, globs, 500-line guidance, legacy .cursorrules." },
      { label: "Cursor help: Rules", href: REF.help, note: "Glob syntax and how rules are applied." },
    ],
  },
  zh: {
    title: "Cursor 规则校验与 .mdc 生成",
    description: "校验 Cursor 项目规则（.cursor/rules/*.mdc）和旧的 .cursorrules：前言、alwaysApply、globs 和描述。用表单生成一份正确的 .mdc。",
    keywords: ["cursor rules", ".mdc", "cursorrules", "cursor 规则", "alwaysApply", "cursor globs"],
    eyebrow: "Cursor 项目规则",
    h1: "校验并生成 Cursor 规则",
    lead: "粘贴一份 .mdc 规则或旧的 .cursorrules，看 Cursor 会把它当成哪一种、哪里写错了。也可以填表，得到一份正确的规则文件。",
    bullets: ["全部 4 种规则类型", "Glob 检查", "旧格式迁移提示"],
    appName: "Cursor 规则校验器",
    typesTitle: "四种规则类型",
    typesIntro: "你写的前言决定 Cursor 何时带上这条规则。下面和 Cursor 文档里的例子一致。",
    relatedTitle: "相关格式",
    relatedIntro: "Cursor 会读项目里的 .mdc 规则，也会读根目录的 AGENTS.md。Claude Skill 是另一种 SKILL.md 格式。",
    agentsBody: "跨工具的仓库说明。普通 Markdown，没有前言 schema。单体仓库里可以嵌套多份。",
    mdcBody: "用 description、globs 和 alwaysApply 限定范围。不同文件需要不同规则时最合适。",
    skillBody: "给 Claude 用的可复用流程，前言里必须有 name 和 description。",
    sourcesTitle: "来源",
    faqTitle: "常见问题",
    faq: [
      { q: ".cursorrules 还能用吗？", a: "Cursor 帮助中心把根目录的 .cursorrules 称为旧格式，并说它将被弃用。把内容挪到 .cursor/rules/，写成一份或多份 .mdc。" },
      { q: "一条 Cursor 规则有哪些前文字段？", a: "三个：description、globs 和 alwaysApply。你设置哪几个，决定规则类型：始终应用、智能应用、匹配文件时应用，或手动应用。" },
      { q: "为什么 glob 匹配不到子目录里的文件？", a: "*.ts 这样的模式只匹配根目录。要用 **/*.ts 才能匹配每一层。多个 glob 用逗号分开。" },
      { q: "一条规则应该多长？", a: "Cursor 建议规则少于 500 行，太长就拆开。用 @path 引用文件，而不是把内容贴进来。" },
    ],
    sources: [
      { label: "Cursor 文档：Rules", href: REF.rules, note: "规则类型、前言、globs、500 行建议，以及旧的 .cursorrules。" },
      { label: "Cursor 帮助：Rules", href: REF.help, note: "Glob 语法，以及规则如何被应用。" },
    ],
  },
} as const;

export function cursorMeta(locale: Locale) {
  const c = copy[locale];
  return pageMeta({ title: c.title, description: c.description, path: PATH, locale, keywords: [...c.keywords] });
}

export function CursorRulesPage({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const types = chrome(locale).cursor.types;
  return (
    <ToolPage
      locale={locale}
      eyebrow={c.eyebrow}
      title={c.h1}
      lead={<>{locale === "zh" ? "粘贴一份" : "Paste a"} <code className="font-mono text-[0.9em]">.mdc</code> {locale === "zh" ? "规则或旧的" : "rule or an old"} <code className="font-mono text-[0.9em]">.cursorrules</code> {locale === "zh" ? "文件，看 Cursor 会把它当成哪一种、哪里写错了。也可以填表，得到一份正确的规则文件。" : "file to see which type Cursor will treat it as and what's wrong. Or fill in a form and get a correct rule file."}</>}
      bullets={[...c.bullets]}
      tool={<CursorRulesTool />}
      jsonLd={{ "@context": "https://schema.org", "@graph": [
        { "@type": "WebApplication", name: c.appName, url: `${SITE}${localePath(locale, PATH)}`, inLanguage: locale === "zh" ? "zh-Hans" : "en", applicationCategory: "DeveloperApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
        faqJsonLd([...c.faq]),
      ] }}
    >
      <ContentSection title={c.typesTitle} intro={c.typesIntro} muted>
        <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(SNIPPETS) as RuleType[]).map((t) => (
            <div key={t} className="bg-background p-5">
              <h3 className="text-[15px] font-medium">{types[t].label}</h3>
              <p className="mt-1 text-[13.5px] text-muted-foreground">{types[t].help}</p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-editor p-3 font-mono text-[12px] leading-relaxed">{SNIPPETS[t]}</pre>
            </div>
          ))}
        </div>
      </ContentSection>
      <ContentSection title={c.relatedTitle} intro={c.relatedIntro}>
        <ul className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3">
          <li className="bg-background p-5">
            <Link href={localePath(locale, "/agents-md/")} className={`text-[14.5px] font-medium ${textLink}`}>AGENTS.md</Link>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{c.agentsBody}</p>
          </li>
          <li className="bg-background p-5">
            <span className="text-[14.5px] font-medium">{locale === "zh" ? "Cursor 规则（.mdc）" : "Cursor rules (.mdc)"}</span>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{c.mdcBody}</p>
          </li>
          <li className="bg-background p-5">
            <Link href={localePath(locale, "/")} className={`text-[14.5px] font-medium ${textLink}`}>{locale === "zh" ? "Claude Skill（SKILL.md）" : "Claude Skill (SKILL.md)"}</Link>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{c.skillBody}</p>
          </li>
        </ul>
      </ContentSection>
      <ContentSection title={c.sourcesTitle}>
        <Sources items={c.sources.map((s) => ({ ...s }))} />
      </ContentSection>
      <ContentSection title={c.faqTitle} muted><Faq items={[...c.faq]} /></ContentSection>
    </ToolPage>
  );
}
