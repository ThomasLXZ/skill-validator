import Link from "next/link";
import AgentsMdTool from "@/components/tools/AgentsMdTool";
import { ContentSection, Faq, faqJsonLd, Sources, ToolPage } from "@/components/tools/PageShell";
import { CODEX_DEFAULT_MAX_BYTES, REF, RECOMMENDED_SECTIONS } from "@/lib/agents-md";
import { localePath, type Locale } from "@/lib/i18n/routing";
import { pageMeta, SITE } from "@/lib/site";
import { textLink } from "./bits";

const PATH = "/agents-md/";

const SECTION_ZH: Record<string, string> = {
  overview: "项目概览",
  build: "构建与测试命令",
  style: "代码风格",
  testing: "测试说明",
  security: "安全注意事项",
  pr: "PR / 提交说明",
};

const copy = {
  en: {
    title: "AGENTS.md Validator — Check and Generate agents.md",
    description: "Free agents.md validator and generator. Check an AGENTS.md file for the sections, size, and hygiene that agents.md tools and Codex expect. Plain Markdown, no required schema. Runs in your browser.",
    keywords: ["agents.md validator", "agents.md tools", "AGENTS.md validator", "AGENTS.md generator", "agents md checker", "codex agents.md", "cursor agents.md", "ai coding agents instructions"],
    eyebrow: "agents.md tools",
    h1: "AGENTS.md validator",
    bullets: ["Convention checks (not a schema)", "Codex 32 KiB size tip", "Generator with Check-it"],
    appName: "AGENTS.md Validator",
    sectionsTitle: "Popular sections (convention)",
    sectionsIntro: "agents.md lists these as popular choices. They are not required fields — the format has no schema. This checker only warns when core headings look missing.",
    matched: "Matched by heading text (case-insensitive). Any wording works.",
    relatedTitle: "Related formats",
    relatedIntro: "Same problem space, different files. Use one source of truth when you can.",
    skillBody: "Reusable workflows with YAML frontmatter (name + description). Triggered by Claude from the description alone.",
    cursorBody: "Scoped project rules in .cursor/rules/ with alwaysApply, globs, and descriptions. Cursor also reads root AGENTS.md.",
    agentsBody: "Cross-tool repo instructions. Plain Markdown; nested files for monorepos; closest wins.",
    sourcesTitle: "Sources",
    sourcesNote: "Claude Code's preference for CLAUDE.md and the ~200-line soft tip are ecosystem notes surfaced as tips only — verify against your Claude Code version's docs before treating them as hard rules.",
    faqTitle: "FAQ",
    faq: [
      { q: "Is AGENTS.md a formal specification with required fields?", a: "No. agents.md states there are no required fields — AGENTS.md is standard Markdown and you can use any headings. This tool's section checks are convention quality tips drawn from agents.md “popular choices” and OpenAI Codex docs, not a schema." },
      { q: "Where should I put AGENTS.md?", a: "At the repository root for project-wide guidance. For large monorepos, agents.md recommends nested AGENTS.md files per package; the closest file to the edited path wins. Codex also supports AGENTS.override.md in the same directory." },
      { q: "How big can AGENTS.md be?", a: `OpenAI Codex stops adding instruction files once the combined size reaches project_doc_max_bytes (32 KiB / ${CODEX_DEFAULT_MAX_BYTES.toLocaleString("en-US")} bytes by default). Keep the file short and link out to deeper docs. Line-count tips in this tool are soft guidance, not a formal limit.` },
      { q: "How does AGENTS.md relate to Cursor rules and Claude Skills?", a: "AGENTS.md is a repo-level instruction file many coding agents read. Cursor also has scoped .cursor/rules/*.mdc files. Claude Agent Skills use SKILL.md with YAML frontmatter for reusable workflows. Prefer one source of truth and thin adapters (for example a CLAUDE.md that imports @AGENTS.md) so agents do not disagree." },
      { q: "What if instructions conflict?", a: "Per agents.md: the closest AGENTS.md to the edited file wins, and explicit user chat prompts override everything." },
      { q: "Is this an agents.md validator?", a: "Yes. Paste AGENTS.md or AGENTS.override.md and it checks the headings people expect, the Codex 32 KiB combined-docs cap, and a few hygiene tips. It is one of the agents.md tools on this site, together with a generator that fills those sections. The format has no required fields, so nothing here is a schema error." },
    ],
    sources: [
      { label: "agents.md — open format", href: REF.site, note: "Official hub: no required fields, popular sections, nested files, conflict rules. Stewarded under the Linux Foundation's Agentic AI Foundation.", status: "verified" },
      { label: "OpenAI Codex: Custom instructions with AGENTS.md", href: REF.codex, note: "Discovery order, AGENTS.override.md, project_doc_max_bytes default 32 KiB, fallback filenames.", status: "verified" },
      { label: "OpenAI Codex: Best practices", href: REF.codexBest, note: "What belongs in AGENTS.md; keep it short; link out when large.", status: "verified" },
    ],
  },
  zh: {
    title: "AGENTS.md 校验器 — 检查并生成 agents.md",
    description: "免费的 agents.md 校验与生成。检查章节、体积和书写是否整齐，依据是 agents.md 生态和 Codex 的习惯。文件仍是普通 Markdown，没有必填 schema。检查在浏览器里完成。",
    keywords: ["agents.md 校验", "AGENTS.md 生成", "agents md", "codex agents.md", "cursor agents.md"],
    eyebrow: "agents.md 工具",
    h1: "AGENTS.md 校验器",
    bullets: ["按惯例检查，不是 schema", "Codex 32 KiB 的体积提示", "生成一份后，可以马上再检查"],
    appName: "AGENTS.md 校验器",
    sectionsTitle: "常见章节（惯例）",
    sectionsIntro: "agents.md 把这些列为常见选择。它们不是必填字段，因为这个格式没有 schema。只有核心标题看起来缺失时，检查器才会警告。",
    matched: "按标题文字匹配，不区分大小写。标题的具体措辞可以不同。",
    relatedTitle: "相关格式",
    relatedIntro: "这几份文件处理的是同一类问题，但格式不同。能共用一份原文时，就不要各写各的。",
    skillBody: "可复用流程写在 SKILL.md 里，前言包含 name 和 description。Claude 是否触发，只看 description。",
    cursorBody: "规则放在 .cursor/rules/，用 alwaysApply、globs 和 description 决定何时生效。另外，Cursor 也会读根目录的 AGENTS.md。",
    agentsBody: "这是给多种工具共用的仓库说明，格式是普通 Markdown。单体仓库里可以按包再放一份；真正生效的，是离改动最近的那份。",
    sourcesTitle: "来源",
    sourcesNote: "有两条只作为生态提示出现：Claude Code 更偏好 CLAUDE.md，以及大约 200 行的软性长度建议。把它们当成硬规则之前，先核对你所用 Claude Code 版本的文档。",
    faqTitle: "常见问题",
    faq: [
      { q: "AGENTS.md 是有必填字段的正式规范吗？", a: "不是。agents.md 写明没有必填字段：AGENTS.md 就是普通 Markdown，标题可以自定。本工具的章节检查来自 agents.md 的“常见选择”和 OpenAI Codex 文档，只是质量提示，不是 schema。" },
      { q: "AGENTS.md 应该放在哪里？", a: "一般放在仓库根目录，作为全项目说明。如果是大型单体仓库，agents.md 建议每个包再放一份；离被编辑路径最近的那份优先。Codex 另外支持同一目录下的 AGENTS.override.md。" },
      { q: "AGENTS.md 可以多大？", a: `说明文件合计达到 project_doc_max_bytes（默认 32 KiB / ${CODEX_DEFAULT_MAX_BYTES.toLocaleString("en-US")} 字节）后，OpenAI Codex 就不再继续加入。所以这份文件要写短，细节用链接指向别处。本工具里的行数提示只是软建议，不是正式上限。` },
      { q: "AGENTS.md 和 Cursor 规则、Claude Skill 是什么关系？", a: "AGENTS.md 是很多编程 agent 会读的仓库级说明。Cursor 另外还有 .cursor/rules/*.mdc，用来限定生效范围。Claude Agent Skills 用带 YAML 前言的 SKILL.md 写可复用流程。最好只维护一份原文，其他文件只做一层转发（例如 CLAUDE.md 里引入 @AGENTS.md），免得各个 agent 说法不一致。" },
      { q: "说明互相冲突时怎么办？", a: "按 agents.md，离被编辑文件最近的 AGENTS.md 优先。用户在对话里明确说的话优先级更高，会覆盖文件里的说明。" },
      { q: "这是 agents.md 校验器吗？", a: "是。粘贴 AGENTS.md 或 AGENTS.override.md，它会检查人们常写的标题、Codex 合计 32 KiB 的上限，以及几条书写提示。填这些章节的生成器也在这一页。格式没有必填字段，所以这里不会报 schema 错误。" },
    ],
    sources: [
      { label: "agents.md — 开放格式", href: REF.site, note: "官方站：没有必填字段、常见章节、嵌套文件、冲突规则。由 Linux Foundation 的 Agentic AI Foundation 管理。", status: "已核对" },
      { label: "OpenAI Codex：用 AGENTS.md 写自定义说明", href: REF.codex, note: "发现顺序、AGENTS.override.md、project_doc_max_bytes 默认 32 KiB、回退文件名。", status: "已核对" },
      { label: "OpenAI Codex：最佳实践", href: REF.codexBest, note: "什么该写进 AGENTS.md；保持短；太大就用链接指到别处。", status: "已核对" },
    ],
  },
} as const;

export function agentsMeta(locale: Locale) {
  const c = copy[locale];
  return pageMeta({ title: c.title, description: c.description, path: PATH, locale, keywords: [...c.keywords] });
}

export function AgentsMdPage({ locale }: { locale: Locale }) {
  const c = copy[locale];
  return (
    <ToolPage
      locale={locale}
      eyebrow={c.eyebrow}
      title={c.h1}
      lead={locale === "zh" ? (
        <>给 Codex、Cursor 和 Copilot 用的开放说明文件做校验。粘贴 <code className="font-mono text-[0.9em]">AGENTS.md</code>，按 <a className={textLink} href={REF.site} target="_blank" rel="noopener noreferrer">agents.md</a> 和 Codex 文档检查章节、体积和书写是否整齐，也可以先生成一份起步文件。文件仍是普通 Markdown，没有必填 schema。</>
      ) : (
        <>An agents.md validator for the open instruction file used by Codex, Cursor, and Copilot. Paste <code className="font-mono text-[0.9em]">AGENTS.md</code> to check sections, size, and hygiene against <a className={textLink} href={REF.site} target="_blank" rel="noopener noreferrer">agents.md</a> and the Codex docs — or generate a starter. Plain Markdown; no required schema.</>
      )}
      bullets={[...c.bullets]}
      tool={<AgentsMdTool />}
      jsonLd={{ "@context": "https://schema.org", "@graph": [
        { "@type": "WebApplication", name: c.appName, url: `${SITE}${localePath(locale, PATH)}`, inLanguage: locale === "zh" ? "zh-Hans" : "en", applicationCategory: "DeveloperApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: c.description },
        faqJsonLd([...c.faq]),
      ] }}
    >
      <ContentSection title={c.sectionsTitle} intro={c.sectionsIntro} muted>
        <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {RECOMMENDED_SECTIONS.map((s) => (
            <div key={s.id} className="bg-background p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[15px] font-medium">{locale === "zh" ? (SECTION_ZH[s.id] ?? s.label) : s.label}</h3>
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">{s.source}</span>
              </div>
              <p className="mt-2 text-[13.5px] text-muted-foreground">{c.matched}</p>
            </div>
          ))}
        </div>
      </ContentSection>
      <ContentSection title={c.relatedTitle} intro={c.relatedIntro}>
        <ul className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3">
          <li className="bg-background p-5">
            <Link href={localePath(locale, "/")} className={`text-[14.5px] font-medium ${textLink}`}>{locale === "zh" ? "Claude Skill（SKILL.md）" : "Claude Skill (SKILL.md)"}</Link>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{c.skillBody}</p>
          </li>
          <li className="bg-background p-5">
            <Link href={localePath(locale, "/cursor-rules/")} className={`text-[14.5px] font-medium ${textLink}`}>{locale === "zh" ? "Cursor 规则（.mdc）" : "Cursor rules (.mdc)"}</Link>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{c.cursorBody}</p>
          </li>
          <li className="bg-background p-5">
            <span className="text-[14.5px] font-medium">AGENTS.md</span>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{c.agentsBody}</p>
          </li>
        </ul>
      </ContentSection>
      <ContentSection title={c.sourcesTitle}>
        <Sources items={c.sources.map((s) => ({ ...s }))} />
        <p className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground">{c.sourcesNote}</p>
      </ContentSection>
      <ContentSection title={c.faqTitle} muted><Faq items={[...c.faq]} /></ContentSection>
    </ToolPage>
  );
}
