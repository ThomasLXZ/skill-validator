import RobotsAiTool from "@/components/tools/RobotsAiTool";
import { ContentSection, Faq, faqJsonLd, Sources, ToolPage } from "@/components/tools/PageShell";
import { SRC } from "@/lib/robots-ai/sources";
import { pageMeta, SITE } from "@/lib/site";
import type { Locale } from "@/lib/i18n/routing";
import { localePath } from "@/lib/i18n/routing";

const PATH = "/robots-ai/";

const copy = {
  en: {
    title: "robots.txt AI Checker: GPTBot, ClaudeBot & IETF AI Preferences",
    description: "Paste your robots.txt to see which AI crawlers can read your site, check IETF aipref Content-Usage rules and the __usage_ai-training token, or generate a robots.txt that blocks AI training.",
    keywords: ["robots.txt AI", "block GPTBot", "block ClaudeBot", "AI crawler robots.txt", "Content-Usage", "aipref", "__usage_ai-training", "llms.txt validator"],
    eyebrow: "Updated for the IETF aipref drafts · Oct 2026",
    h1: "Check your robots.txt for AI crawlers",
    lead: "See exactly which AI bots can read your site, catch typos that silently allow them, and add the new IETF AI-preference signals. Or generate a robots.txt from a few toggles.",
    bullets: ["19 AI user agents", "RFC 9309 matching", "Content-Usage & __usage_ai-training", "llms.txt check"],
    appName: "robots.txt AI Checker",
    splitTitle: "Training, search and user fetches are different bots",
    splitIntro: "Most AI companies now split their crawlers by purpose. Blocking the training bot keeps you out of future models; blocking the search or user bot removes you from AI answers. The checker groups them so you can choose on purpose.",
    draftTitle: "Two draft ways to state an AI training preference",
    draft1: "The IETF AI Preferences working group defines a vocabulary (train-ai, ai-use, search) and a Content-Usage robots.txt rule to attach it. Separately, an individual draft adds a __usage_ai-training user-agent token. Disallow a path for that token to say “don't train on this”.",
    draft2: "Both are drafts and may change. Treat them as an addition to blocking crawlers, not a replacement.",
    sourcesTitle: "Sources",
    sourcesIntro: "Every crawler and rule in this tool links to the page it comes from.",
    faqTitle: "FAQ",
    faq: [
      { q: "Does blocking GPTBot stop my site appearing in ChatGPT search?", a: "No. OpenAI documents GPTBot for training and OAI-SearchBot for search as separate user agents. Block GPTBot and allow OAI-SearchBot if you want search visibility without training." },
      { q: "What is Content-Usage in robots.txt?", a: "A rule from the IETF AI Preferences working group draft (draft-ietf-aipref-attach). It attaches preferences such as train-ai=n to paths. It is a draft, and no crawler is documented as honoring it yet." },
      { q: "What is __usage_ai-training?", a: "A user-agent token from draft-kelley-aipref-training-preference-signal. Disallowing a path for it expresses a preference against AI training. On 30 October 2026 OpenAI and Google said they plan to support this signal." },
      { q: "Is Google-Extended a crawler?", a: "No. Google documents Google-Extended as a product token: Googlebot does the crawling, and the token controls whether that content may be used for Gemini training and grounding." },
      { q: "Do all AI bots obey robots.txt?", a: "No. Perplexity says Perplexity-User generally ignores robots.txt because a user requested the page, and Meta says Meta-ExternalFetcher may bypass it. robots.txt is a request, not access control." },
      { q: "Does llms.txt block AI training?", a: "No. llms.txt is a community proposal for giving models a curated map of your docs. It has no effect on crawling or training permissions." },
    ],
    sources: [
      { label: "RFC 9309: Robots Exclusion Protocol", href: SRC.rfc9309, status: "Standard", note: "Group matching, longest-match rules, Allow wins ties." },
      { label: "draft-ietf-aipref-vocab", href: SRC.vocab, status: "Internet-Draft", note: "The train-ai, ai-use and search categories and the y/n syntax." },
      { label: "draft-ietf-aipref-attach", href: SRC.attach, status: "Internet-Draft", note: "The Content-Usage robots.txt rule and the Content-Usage HTTP header." },
      { label: "draft-kelley-aipref-training-preference-signal", href: SRC.token, status: "Internet-Draft", note: "The __usage_ai-training user-agent token." },
      { label: "OpenAI: helping websites express AI training preferences", href: SRC.openaiSignal, status: "30 Oct 2026", note: "OpenAI's plan to honor the shared token." },
      { label: "Google: AI training control", href: SRC.googleSignal, status: "30 Oct 2026", note: "Google's matching announcement." },
      { label: "OpenAI crawlers", href: SRC.openaiBots, note: "GPTBot, OAI-SearchBot, ChatGPT-User." },
      { label: "Anthropic crawlers", href: SRC.anthropic, note: "ClaudeBot, Claude-SearchBot, Claude-User." },
      { label: "Google common crawlers", href: SRC.googleCrawlers, note: "Google-Extended product token." },
      { label: "Perplexity crawlers", href: SRC.perplexity, note: "PerplexityBot, Perplexity-User." },
      { label: "Applebot", href: SRC.apple, note: "Applebot-Extended control token." },
      { label: "Meta web crawlers", href: SRC.meta, note: "Meta-ExternalAgent, Meta-ExternalFetcher." },
      { label: "Amazonbot", href: SRC.amazon, note: "Amazonbot, Amzn-SearchBot, Amzn-User." },
      { label: "Common Crawl CCBot", href: SRC.commoncrawl, note: "Open web corpus widely used for AI training." },
      { label: "llmstxt.org", href: SRC.llmstxt, status: "Proposal", note: "The llms.txt format checked in the third tab." },
    ],
  },
  zh: {
    title: "robots.txt AI 检查：GPTBot、ClaudeBot 与 IETF AI 偏好",
    description: "粘贴 robots.txt，看哪些 AI 爬虫能读取你的站点，检查 IETF aipref 的 Content-Usage 规则和 __usage_ai-training 令牌，或生成一份阻止 AI 训练的 robots.txt。",
    keywords: ["robots.txt AI", "屏蔽 GPTBot", "屏蔽 ClaudeBot", "AI 爬虫 robots.txt", "Content-Usage", "aipref", "llms.txt"],
    eyebrow: "已按 IETF aipref 草案更新 · 2026 年 10 月",
    h1: "检查 robots.txt 里的 AI 爬虫",
    lead: "看清哪些 AI 机器人能读你的站点，抓住那些会静默放行的拼写错误，并加上新的 IETF AI 偏好信号。也可以用几个开关生成一份 robots.txt。",
    bullets: ["19 个 AI user-agent", "按 RFC 9309 匹配", "Content-Usage 与 __usage_ai-training", "llms.txt 检查"],
    appName: "robots.txt AI 检查器",
    splitTitle: "训练、搜索和用户抓取是不同的机器人",
    splitIntro: "多数 AI 公司现在按用途拆分爬虫。挡住训练机器人，内容就不会进未来的模型；挡住搜索或用户机器人，你就会从 AI 回答里消失。检查器按用途分组，方便你有意选择。",
    draftTitle: "两种还在草案阶段的 AI 训练偏好写法",
    draft1: "IETF AI Preferences 工作组定义了一套词表（train-ai、ai-use、search），以及用来挂上这些偏好的 Content-Usage robots.txt 规则。另一份个人草案增加了 __usage_ai-training 这个 user-agent 令牌。对该令牌 Disallow 一条路径，就是在说“不要用这个来训练”。",
    draft2: "两者都还是草案，可能变化。把它们当作屏蔽爬虫之外的补充，而不是替代。",
    sourcesTitle: "来源",
    sourcesIntro: "工具里的每个爬虫和每条规则都链到它的出处。",
    faqTitle: "常见问题",
    faq: [
      { q: "屏蔽 GPTBot 后，网站还会出现在 ChatGPT 搜索里吗？", a: "会。OpenAI 把 GPTBot（训练）和 OAI-SearchBot（搜索）写成两个 user-agent。想保留搜索、不参与训练，就屏蔽 GPTBot 并允许 OAI-SearchBot。" },
      { q: "robots.txt 里的 Content-Usage 是什么？", a: "来自 IETF AI Preferences 工作组草案（draft-ietf-aipref-attach）的一条规则。它把 train-ai=n 这类偏好挂到路径上。目前仍是草案，还没有爬虫被记录为已经遵守它。" },
      { q: "__usage_ai-training 是什么？", a: "来自 draft-kelley-aipref-training-preference-signal 的 user-agent 令牌。对它 Disallow 一条路径，表示不希望该路径被用于 AI 训练。2026 年 10 月 30 日，OpenAI 和 Google 表示计划支持这个信号。" },
      { q: "Google-Extended 是爬虫吗？", a: "不是。Google 把它记为产品令牌：真正抓取的是 Googlebot，这个令牌控制抓到的内容能否用于 Gemini 训练和 grounding。" },
      { q: "所有 AI 机器人都遵守 robots.txt 吗？", a: "不。Perplexity 说 Perplexity-User 通常忽略 robots.txt，因为是用户请求了页面；Meta 说 Meta-ExternalFetcher 也可能绕过它。robots.txt 是请求，不是访问控制。" },
      { q: "llms.txt 能阻止 AI 训练吗？", a: "不能。llms.txt 是一份社区提案，用来给模型一张精选的文档地图。它不影响抓取或训练许可。" },
    ],
    sources: [
      { label: "RFC 9309：Robots Exclusion Protocol", href: SRC.rfc9309, status: "标准", note: "分组匹配、最长匹配，Allow 在平局时胜出。" },
      { label: "draft-ietf-aipref-vocab", href: SRC.vocab, status: "互联网草案", note: "train-ai、ai-use、search 类别，以及 y/n 语法。" },
      { label: "draft-ietf-aipref-attach", href: SRC.attach, status: "互联网草案", note: "Content-Usage robots.txt 规则和 Content-Usage HTTP 头。" },
      { label: "draft-kelley-aipref-training-preference-signal", href: SRC.token, status: "互联网草案", note: "__usage_ai-training user-agent 令牌。" },
      { label: "OpenAI：帮助网站表达 AI 训练偏好", href: SRC.openaiSignal, status: "2026-10-30", note: "OpenAI 计划遵守这个共享令牌。" },
      { label: "Google：AI 训练控制", href: SRC.googleSignal, status: "2026-10-30", note: "Google 的对应公告。" },
      { label: "OpenAI 爬虫", href: SRC.openaiBots, note: "GPTBot、OAI-SearchBot、ChatGPT-User。" },
      { label: "Anthropic 爬虫", href: SRC.anthropic, note: "ClaudeBot、Claude-SearchBot、Claude-User。" },
      { label: "Google 常见爬虫", href: SRC.googleCrawlers, note: "Google-Extended 产品令牌。" },
      { label: "Perplexity 爬虫", href: SRC.perplexity, note: "PerplexityBot、Perplexity-User。" },
      { label: "Applebot", href: SRC.apple, note: "Applebot-Extended 控制令牌。" },
      { label: "Meta 网页爬虫", href: SRC.meta, note: "Meta-ExternalAgent、Meta-ExternalFetcher。" },
      { label: "Amazonbot", href: SRC.amazon, note: "Amazonbot、Amzn-SearchBot、Amzn-User。" },
      { label: "Common Crawl CCBot", href: SRC.commoncrawl, note: "广泛用于 AI 训练的开放网页语料。" },
      { label: "llmstxt.org", href: SRC.llmstxt, status: "提案", note: "第三个标签页检查的 llms.txt 格式。" },
    ],
  },
} as const;

const SAMPLE = `User-Agent: *
Allow: /
Content-Usage: train-ai=n

User-Agent: __usage_ai-training
Disallow: /`;

export function robotsMeta(locale: Locale) {
  const c = copy[locale];
  return pageMeta({ title: c.title, description: c.description, path: PATH, locale, keywords: [...c.keywords] });
}

export function RobotsAiPage({ locale }: { locale: Locale }) {
  const c = copy[locale];
  return (
    <ToolPage
      locale={locale}
      eyebrow={c.eyebrow}
      title={c.h1}
      lead={c.lead}
      bullets={[...c.bullets]}
      tool={<RobotsAiTool />}
      jsonLd={{ "@context": "https://schema.org", "@graph": [
        { "@type": "WebApplication", name: c.appName, url: `${SITE}${localePath(locale, PATH)}`, inLanguage: locale === "zh" ? "zh-Hans" : "en", applicationCategory: "DeveloperApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: c.description },
        faqJsonLd([...c.faq]),
      ] }}
    >
      <ContentSection title={c.splitTitle} intro={c.splitIntro} muted />
      <ContentSection title={c.draftTitle} intro={<>
        <p>{c.draft1}</p>
        <p className="mt-3">{c.draft2}</p>
      </>}>
        <pre className="overflow-x-auto rounded-xl border bg-editor p-4 font-mono text-[13px] leading-relaxed">{SAMPLE}</pre>
      </ContentSection>
      <ContentSection id="sources" title={c.sourcesTitle} intro={c.sourcesIntro} muted>
        <Sources items={c.sources.map((s) => ({ ...s }))} />
      </ContentSection>
      <ContentSection title={c.faqTitle}><Faq items={[...c.faq]} /></ContentSection>
    </ToolPage>
  );
}
