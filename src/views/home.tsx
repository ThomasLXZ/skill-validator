import Validator from "@/components/Validator";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Code from "@/components/Code";
import Link from "next/link";
import { Check, Braces, FileSearch, Link2, ScrollText, ShieldAlert, Tag, ArrowUpRight } from "lucide-react";
import { I18nProvider } from "@/lib/i18n/context";
import { NAV_ITEMS } from "@/lib/i18n/nav";
import { localePath, type Locale } from "@/lib/i18n/routing";
import { pageMeta, SITE } from "@/lib/site";

const PATH = "/";

const copy = {
  en: {
    title: "Claude Skill Validator – Check SKILL.md Online (Free)",
    description: "Free Claude Skill validator. Paste a SKILL.md or upload a skill .zip/folder to check frontmatter, name and description rules, broken file references, scripts and best practices. Runs 100% in your browser.",
    keywords: ["claude skill validator", "SKILL.md validator", "agent skills validator", "claude skills checker", "validate claude skill", "skill.md linter", "anthropic agent skills", "claude code skills"],
    eyebrow: "Up to date with the Agent Skills spec",
    h1: "Claude Skill Validator",
    leadBefore: "Check your",
    leadAfter: "before you upload it to Claude. Paste the file or drop your skill folder and get a score, the exact line of every problem, and how to fix it. Free, and it runs entirely in your browser.",
    bullets: ["72 rules from the spec and Anthropic's guide", "Errors underlined on the exact line", "Nothing leaves your browser"],
    checksTitle: "What the validator checks",
    checksIntroBefore: "72 rules taken from the public specification, Anthropic's best practices and the official",
    checksIntroAfter: ". Errors block an upload, warnings hurt triggering, tips are polish.",
    rules: [
      { title: "Frontmatter", text: "Starts on line 1 with ---, parses as YAML, has no duplicate or unknown keys.", ids: ["FM_MISSING", "FM_YAML_INVALID", "FM_UNKNOWN_KEY"] },
      { title: "name", text: "1–64 characters of a–z, 0–9 and hyphens. No leading, trailing or double hyphens, no “claude” or “anthropic”, and it matches the folder name.", ids: ["NAME_CHARSET", "NAME_RESERVED_WORD", "NAME_DIR_MISMATCH"], mono: true },
      { title: "description", text: "1–1024 characters, no angle brackets, written in third person, and says both what the skill does and when to use it.", ids: ["DESC_NO_WHEN", "DESC_VAGUE", "DESC_TOO_LONG"], mono: true },
      { title: "Body", text: "Under 500 lines and about 5k tokens, organised with headings, free of Windows paths and dated instructions. Citation markers should link a source.", ids: ["BODY_TOO_MANY_LINES", "BODY_CITE_NO_SOURCE"] },
      { title: "References", text: "Every linked file and script exists with the same casing, paths are relative and one level deep, anchors resolve.", ids: ["REF_MISSING_FILE", "REF_CASE_MISMATCH", "REF_NESTED"] },
      { title: "Scripts and security", text: "Scripts are referenced and their dependencies documented. No hard-coded API keys, .env files or curl | sh.", ids: ["SEC_SECRET", "SEC_DANGEROUS_COMMAND", "STRUCT_ENV_FILE"] },
    ],
    formatTitle: "SKILL.md format in 30 seconds",
    format1: "A skill is a folder. Only SKILL.md is required: YAML frontmatter with a name and a description, then Markdown instructions.",
    format2: "Claude reads only the name and description to decide whether to load the skill, so the description has to say when to use it.",
    relatedBefore: "Related: repo-wide agent instructions live in",
    relatedMid: "; Cursor-scoped rules use",
    relatedAfter: "files.",
    folderLayout: "Folder layout",
    toolsTitle: "More tools",
    toolsIntro: "Same browser-only approach for related agent files: an AGENTS.md validator, JSON Schema and structured output, an MCP server test suite, sampling checks, and an MCP token counter.",
    faqTitle: "Frequently asked questions",
    faq: [
      { q: "What does the Claude Skill Validator check?", a: "It parses the YAML frontmatter of SKILL.md and checks the required name and description fields against the Agent Skills spec and Anthropic's rules (max 64-char lowercase hyphenated name, no reserved words, max 1024-char description without XML tags), flags unknown keys that make claude.ai uploads fail, scores how clearly the description says what the skill does and when to use it, checks body length (under 500 lines / ~5k tokens), verifies that every referenced file and script exists in your zip, and scans for leaked secrets." },
      { q: "Is my skill uploaded anywhere?", a: "No. Validation runs entirely in your browser. Your SKILL.md, zip or folder never leaves your machine." },
      { q: "Why does my skill upload fail with \"Unexpected key(s) in SKILL.md frontmatter\"?", a: "claude.ai and the Skills API only accept name, description, license, compatibility, metadata and allowed-tools. Claude Code-only fields such as argument-hint, disable-model-invocation or model must be removed before uploading. Switch the target to Claude Code if the skill is only used there." },
      { q: "Why isn't Claude using my skill?", a: "Claude decides whether to load a skill from its name and description alone. A vague description like \"Helps with documents\" rarely triggers. Describe the concrete actions and add a \"Use when…\" sentence with the words users actually say." },
      { q: "Is this an official Anthropic tool?", a: "No. It is an independent validator built from the public Agent Skills specification and Anthropic's published documentation." },
      { q: "Can it check citations in a skill?", a: "If the instructions use an author-year citation such as (Smith, 2024), or a marker like [1] next to wording about a source, and the skill never links an http(s) URL, you get a tip: BODY_CITE_NO_SOURCE. It does not fetch the page or decide whether the source supports the claim. Add the URL, or drop the marker." },
    ],
    appName: "Claude Skill Validator",
    appDescription: "Validate Claude Agent Skills (SKILL.md) in your browser: frontmatter, naming, description quality, file references and best practices.",
    footerBefore: "Based on the",
    footerSpec: "Agent Skills specification",
    footerAnd: "and Anthropic's",
    footerPractices: "skill authoring best practices",
    footerAfter: "Not affiliated with Anthropic. Claude is a trademark of Anthropic, PBC.",
  },
  zh: {
    title: "Claude Skill 校验器 – 在线检查 SKILL.md（免费）",
    description: "免费的 Claude Skill 校验器。粘贴 SKILL.md，或上传 skill 的 zip / 文件夹，检查前言、name 与 description 规则、失效的文件引用、脚本和最佳实践。全部在浏览器中运行。",
    keywords: ["claude skill 校验", "SKILL.md 检查", "agent skills validator", "claude skills", "skill.md linter"],
    eyebrow: "与 Agent Skills 规范保持同步",
    h1: "Claude Skill 校验器",
    leadBefore: "上传到 Claude 之前，先检查",
    leadAfter: "。粘贴文件或拖入 skill 文件夹，得到分数、每一处问题所在的行，以及怎么改。免费，并且完全在你的浏览器里运行。",
    bullets: ["来自规范和 Anthropic 指南的 72 条规则", "错误标在对应的那一行", "内容不会离开你的浏览器"],
    checksTitle: "校验器会检查什么",
    checksIntroBefore: "72 条规则来自公开规范、Anthropic 的最佳实践，以及官方的",
    checksIntroAfter: "。错误会挡住上传，警告会影响触发，提示是打磨。",
    rules: [
      { title: "前言", text: "从第 1 行的 --- 开始，能解析为 YAML，没有重复或未知的键。", ids: ["FM_MISSING", "FM_YAML_INVALID", "FM_UNKNOWN_KEY"] },
      { title: "name", text: "1–64 个字符，只能是 a–z、0–9 和连字符。不能以连字符开头或结尾，不能有连续连字符，不能含 “claude” 或 “anthropic”，并且要和文件夹名一致。", ids: ["NAME_CHARSET", "NAME_RESERVED_WORD", "NAME_DIR_MISMATCH"], mono: true },
      { title: "description", text: "1–1024 个字符，不含尖括号，用第三人称，并且同时说明 skill 做什么、什么时候用。", ids: ["DESC_NO_WHEN", "DESC_VAGUE", "DESC_TOO_LONG"], mono: true },
      { title: "正文", text: "少于 500 行、大约 5k token，有标题，没有 Windows 路径和过时说明。引用标记应当链到一个来源。", ids: ["BODY_TOO_MANY_LINES", "BODY_CITE_NO_SOURCE"] },
      { title: "引用", text: "每个链接到的文件和脚本都存在，大小写一致，路径是相对的且只深一层，锚点能对上。", ids: ["REF_MISSING_FILE", "REF_CASE_MISMATCH", "REF_NESTED"] },
      { title: "脚本与安全", text: "脚本被引用，依赖有说明。没有硬编码的 API 密钥、.env 文件或 curl | sh。", ids: ["SEC_SECRET", "SEC_DANGEROUS_COMMAND", "STRUCT_ENV_FILE"] },
    ],
    formatTitle: "30 秒看懂 SKILL.md",
    format1: "一个 skill 就是一个文件夹。只有 SKILL.md 是必需的：YAML 前言里有 name 和 description，后面是 Markdown 说明。",
    format2: "Claude 只读 name 和 description 来决定要不要加载这个 skill，所以 description 必须写明什么时候用。",
    relatedBefore: "相关：仓库级的 agent 说明写在",
    relatedMid: "；Cursor 范围内的规则用",
    relatedAfter: "文件。",
    folderLayout: "文件夹结构",
    toolsTitle: "更多工具",
    toolsIntro: "同一套只在浏览器里运行的做法，覆盖相关的 agent 文件：AGENTS.md 校验、JSON Schema 与结构化输出、MCP server 测试、采样参数检查，以及 MCP token 计数。",
    faqTitle: "常见问题",
    faq: [
      { q: "Claude Skill 校验器检查什么？", a: "它解析 SKILL.md 的 YAML 前言，按 Agent Skills 规范和 Anthropic 的规则检查必需的 name 与 description（最长 64 字符、小写连字符、不含保留词，description 最长 1024 字符且不含 XML 标签），标出会导致 claude.ai 上传失败的未知键，评估 description 是否说清了做什么、何时使用，检查正文长度（500 行以内 / 约 5k token），核对 zip 里被引用的文件和脚本是否存在，并扫描泄露的密钥。" },
      { q: "我的 skill 会被上传到别处吗？", a: "不会。校验完全在你的浏览器里进行。SKILL.md、zip 或文件夹不会离开你的电脑。" },
      { q: "为什么上传失败并提示 “Unexpected key(s) in SKILL.md frontmatter”？", a: "claude.ai 和 Skills API 只接受 name、description、license、compatibility、metadata 和 allowed-tools。argument-hint、disable-model-invocation、model 这类仅 Claude Code 使用的字段，上传前必须去掉。如果这个 skill 只在 Claude Code 里用，把校验目标切换到 Claude Code。" },
      { q: "为什么 Claude 不用我的 skill？", a: "Claude 只根据 name 和 description 决定是否加载。像 “Helps with documents” 这样笼统的描述很少会被触发。写上具体动作，并加一句 “Use when…”，用用户真正会说的词。" },
      { q: "这是 Anthropic 的官方工具吗？", a: "不是。它是根据公开的 Agent Skills 规范和 Anthropic 已发布文档做的独立校验器。" },
      { q: "它能检查 skill 里的引用吗？", a: "如果说明里用了 (Smith, 2024) 这种作者-年份引用，或在提到来源的文字旁写了 [1]，而 skill 里从未链接 http(s) 网址，你会得到一条提示：BODY_CITE_NO_SOURCE。它不会去抓取页面，也不会判断来源是否支持这个说法。补上 URL，或者删掉这个标记。" },
    ],
    appName: "Claude Skill 校验器",
    appDescription: "在浏览器里校验 Claude Agent Skills（SKILL.md）：前言、命名、描述质量、文件引用和最佳实践。",
    footerBefore: "依据",
    footerSpec: "Agent Skills 规范",
    footerAnd: "以及 Anthropic 的",
    footerPractices: "skill 编写最佳实践",
    footerAfter: "与 Anthropic 无隶属关系。Claude 是 Anthropic, PBC 的商标。",
  },
} as const;

const ICONS = [Braces, Tag, FileSearch, ScrollText, Link2, ShieldAlert];

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

export function homeMeta(locale: Locale) {
  const c = copy[locale];
  return pageMeta({ title: c.title, description: c.description, path: PATH, locale, keywords: [...c.keywords] });
}

export function HomePage({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const linkCls = "text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: c.appName,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any (browser)",
        inLanguage: locale === "zh" ? "zh-Hans" : "en",
        url: `${SITE}${localePath(locale, PATH)}`,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description: c.appDescription,
      },
      {
        "@type": "FAQPage",
        mainEntity: c.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };
  const cards = NAV_ITEMS.filter((item) => item.href !== "/");
  return (
    <I18nProvider locale={locale}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main lang={locale === "zh" ? "zh-Hans" : "en"}>
        <section className="hero relative">
          <div className="hero-grid pointer-events-none absolute inset-x-0 top-0 h-[520px]" aria-hidden />
          <div className="relative mx-auto max-w-[1240px] px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
            <div className="max-w-[880px]">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-[12.5px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-ok" aria-hidden />
                {c.eyebrow}
              </p>
              <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[60px]">{c.h1}</h1>
              <p className="lead mt-5 max-w-[620px] text-[17px] leading-relaxed text-muted-foreground sm:text-[18px]">
                {c.leadBefore}{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.88em] text-foreground">SKILL.md</code>{" "}
                {c.leadAfter}
              </p>
              <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-muted-foreground">
                {c.bullets.map((t) => (
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
              <h2 className="text-[28px] font-semibold tracking-[-0.025em] sm:text-[32px]">{c.checksTitle}</h2>
              <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
                {c.checksIntroBefore}
                <code className="mx-1 font-mono text-[0.9em]">quick_validate.py</code>
                {c.checksIntroAfter}
              </p>
            </div>
            <div className="rules mt-10 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {c.rules.map((rule, i) => {
                const Icon = ICONS[i];
                if (!Icon) return null;
                return (
                  <div key={rule.title} className="flex flex-col bg-background p-6">
                    <Icon className="size-5 text-accent" aria-hidden />
                    <h3 className={`mt-4 text-[15px] font-semibold ${"mono" in rule && rule.mono ? "font-mono" : ""}`}>{rule.title}</h3>
                    <p className="mt-2 flex-1 text-[14px] leading-relaxed text-muted-foreground">{rule.text}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {rule.ids.map((id) => (
                        <code key={id} className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">{id}</code>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="format" className="border-t bg-subtle">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div>
              <h2 className="text-[28px] font-semibold tracking-[-0.025em] sm:text-[32px]">{c.formatTitle}</h2>
              <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">{c.format1}</p>
              <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">{c.format2}</p>
              <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
                {c.relatedBefore}{" "}
                <Link className={linkCls} href={localePath(locale, "/agents-md/")}>AGENTS.md</Link>
                {c.relatedMid}{" "}
                <Link className={linkCls} href={localePath(locale, "/cursor-rules/")}>.mdc</Link>
                {" "}{c.relatedAfter}
              </p>
              <div className="mt-6"><Code title={c.folderLayout}>{TREE}</Code></div>
            </div>
            <Code title="processing-pdfs/SKILL.md">{SKILL_SAMPLE}</Code>
          </div>
        </section>

        <section id="tools" className="border-t bg-subtle">
          <div className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6">
            <div className="max-w-[620px]">
              <h2 className="text-[28px] font-semibold tracking-[-0.025em] sm:text-[32px]">{c.toolsTitle}</h2>
              <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">{c.toolsIntro}</p>
            </div>
            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((t) => (
                <Link key={t.href} href={localePath(locale, t.href)} className="group flex flex-col bg-background p-6 transition-colors hover:bg-subtle">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[15px] font-semibold">{t.label[locale]}</h3>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                  </div>
                  <p className="mt-2 flex-1 text-[14px] leading-relaxed text-muted-foreground">{t.blurb[locale]}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="border-t">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <h2 className="text-[28px] font-semibold tracking-[-0.025em] sm:text-[32px]">{c.faqTitle}</h2>
            <div className="divide-y border-y">
              {c.faq.map((f) => (
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
      <SiteFooter locale={locale}>
        <p>
          {c.footerBefore}{" "}
          <a className={linkCls} href="https://agentskills.io/specification">{c.footerSpec}</a>
          {" "}{c.footerAnd}{" "}
          <a className={linkCls} href="https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices">{c.footerPractices}</a>
          . {c.footerAfter}
        </p>
      </SiteFooter>
    </I18nProvider>
  );
}
