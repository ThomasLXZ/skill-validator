import SamplingTool from "@/components/tools/SamplingTool";
import { ContentSection, Faq, faqJsonLd, Sources, ToolPage } from "@/components/tools/PageShell";
import { REF } from "@/lib/claude-sampling";
import { localePath, type Locale } from "@/lib/i18n/routing";
import { pageMeta, SITE } from "@/lib/site";
import { InfoGrid } from "./bits";

const PATH = "/text-watermark/";

const copy = {
  en: {
    title: "Claude Text Watermark Checker for Sampling Parameters",
    description: "Check a Claude Messages request for temperature, top_p, and top_k. On Claude Sonnet 4.6 and Opus 4.6, non-default sampling can drop Anthropic’s text watermark. Newer models reject most of those fields.",
    keywords: ["claude text watermark", "claude sampling parameters", "temperature top_p top_k", "claude sonnet 4.6 watermark", "claude opus 4.6 watermark"],
    eyebrow: "Claude text watermark",
    h1: "Will sampling drop the watermark?",
    bullets: ["Sonnet 4.6 and Opus 4.6", "Omit beats sending 1.0", "Newer models reject non-defaults"],
    appName: "Claude Text Watermark Sampling Checker",
    docsTitle: "What the docs actually say",
    docsIntro: "The rules below are the ones this checker implements. It does not invent a detector.",
    cards: [
      ["Omit the three keys", "If you rely on the watermark, omit temperature, top_p, and top_k, including defaults a library sets for you."],
      ["Sonnet 4.6 and Opus 4.6", "A non-default value may mean the output does not carry the text watermark. The watermark adds no tokens and no hidden characters."],
      ["After Opus 4.6", "temperature other than 1.0, top_p below 0.99, and any top_k are rejected. Leave them unset."],
    ],
    sourcesTitle: "Sources",
    faqTitle: "FAQ",
    faq: [
      { q: "Does this detect a watermark in text?", a: "No. Anthropic’s detector is a separate preview. This page only reads the request JSON and compares temperature, top_p, and top_k with the published sampling rules. It cannot tell you whether a paragraph is watermarked." },
      { q: "Which models lose the watermark when sampling changes?", a: "Anthropic’s text-watermark page says Claude Sonnet 4.6 output might not carry the watermark when temperature, top_p, or top_k is set to a non-default value, and that you should omit all three if you rely on the mark. The help-center article names both Claude Opus 4.6 and Claude Sonnet 4.6 for that case. Other model ids get a tip to check the current table, not a warning." },
      { q: "Why is temperature 1 still a tip?", a: "1.0 is the usual default, but the docs say to omit the parameter, including values a framework or client library inserts. Sending the key is not the same as leaving it out." },
      { q: "What about models after Opus 4.6?", a: "The API reference says models released after Claude Opus 4.6 reject temperature other than 1.0, reject top_p below 0.99, and reject any top_k. A value of 1.0 or a top_p at or above 0.99 is only kept for compatibility. This checker flags those as errors when the model id looks like that generation." },
    ],
    sources: [
      { label: "Text watermark", href: REF.watermark, status: "docs", note: "Sonnet 4.6 sampling note: omit temperature, top_p, and top_k." },
      { label: "How Claude marks AI-generated content", href: REF.marking, status: "help", note: "Model table. Opus 4.6 and Sonnet 4.6 are named for non-default sampling." },
      { label: "API reference: sampling parameters", href: REF.sampling, status: "reference", note: "Models after Opus 4.6 reject non-default temperature, top_p, and top_k." },
    ],
  },
  zh: {
    title: "Claude 文本水印检查：采样参数",
    description: "检查一条 Claude Messages 请求里的 temperature、top_p 和 top_k。在 Claude Sonnet 4.6 和 Opus 4.6 上，非默认采样可能丢掉 Anthropic 的文本水印。更晚的模型会拒绝其中大多数字段。",
    keywords: ["claude 文本水印", "claude 采样参数", "temperature top_p top_k", "claude sonnet 4.6 水印"],
    eyebrow: "Claude 文本水印",
    h1: "采样会丢掉水印吗？",
    bullets: ["针对 Sonnet 4.6 与 Opus 4.6", "省略，优于直接发送 1.0", "更晚的模型会拒绝非默认值"],
    appName: "Claude 文本水印采样检查",
    docsTitle: "文档实际是怎么写的",
    docsIntro: "下面这些是检查器真正实现的规则。它没有另外做一个水印检测器。",
    cards: [
      ["省略这三个键", "如果要依赖水印，就不要发送 temperature、top_p 和 top_k，库替你填上的默认值也算。"],
      ["Sonnet 4.6 与 Opus 4.6", "非默认值可能让输出不再带文本水印。另外，水印本身不增加 token，也没有隐藏字符。"],
      ["Opus 4.6 之后", "不是 1.0 的 temperature、低于 0.99 的 top_p，以及任何 top_k，都会被拒绝。这些键不要设置。"],
    ],
    sourcesTitle: "来源",
    faqTitle: "常见问题",
    faq: [
      { q: "它能从文本里检测出水印吗？", a: "不能。Anthropic 的检测器是另一项预览功能。这一页只读取请求 JSON，用来对照 temperature、top_p、top_k 和已经公布的采样规则。所以它不能判断一段文字里有没有水印。" },
      { q: "改了采样之后，哪些模型会失去水印？", a: "Anthropic 的文本水印页面写的是：temperature、top_p 或 top_k 被设成非默认值时，Claude Sonnet 4.6 的输出可能不再带水印。如果要依赖这个标记，三个参数都应省略。帮助中心的文章把 Claude Opus 4.6 和 Claude Sonnet 4.6 都列进了这种情况。其他模型 id 不会因此报警，只会提示你去核对当前的表格。" },
      { q: "为什么 temperature 设成 1 仍然是提示？", a: "1.0 通常就是默认值。但文档要求把这个参数整个省略，包括框架或客户端库替你写上的值。请求里出现这个键，和完全不写，不是一回事。" },
      { q: "Opus 4.6 之后的模型呢？", a: "API 参考写明，Claude Opus 4.6 之后发布的模型会拒绝三件事：不是 1.0 的 temperature、低于 0.99 的 top_p，以及任何 top_k。等于 1.0 的 temperature，或大于等于 0.99 的 top_p，只是为了兼容而保留。如果模型 id 看起来属于这一代，检查器会把上述取值标成错误。" },
    ],
    sources: [
      { label: "文本水印", href: REF.watermark, status: "文档", note: "Sonnet 4.6 的采样说明：省略 temperature、top_p 和 top_k。" },
      { label: "Claude 如何标记 AI 生成的内容", href: REF.marking, status: "帮助", note: "模型表。非默认采样点名了 Opus 4.6 和 Sonnet 4.6。" },
      { label: "API 参考：采样参数", href: REF.sampling, status: "参考", note: "Opus 4.6 之后的模型会拒绝非默认的 temperature、top_p 和 top_k。" },
    ],
  },
} as const;

export function watermarkMeta(locale: Locale) {
  const c = copy[locale];
  return pageMeta({ title: c.title, description: c.description, path: PATH, locale, keywords: [...c.keywords] });
}

export function WatermarkPage({ locale }: { locale: Locale }) {
  const c = copy[locale];
  return (
    <ToolPage
      locale={locale}
      eyebrow={c.eyebrow}
      title={c.h1}
      lead={locale === "zh" ? (
        <>粘贴一份 Messages API 的请求体。检查器会查看 <code className="font-mono text-[0.9em]">temperature</code>、<code className="font-mono text-[0.9em]">top_p</code> 和 <code className="font-mono text-[0.9em]">top_k</code>：一边对照 Anthropic 的文本水印说明，一边对照较新模型的采样限制。</>
      ) : (
        <>Paste a Messages API body. The checker looks at <code className="font-mono text-[0.9em]">temperature</code>, <code className="font-mono text-[0.9em]">top_p</code>, and <code className="font-mono text-[0.9em]">top_k</code> against Anthropic’s text-watermark note and the sampling limits on newer models.</>
      )}
      bullets={[...c.bullets]}
      tool={<SamplingTool />}
      jsonLd={{ "@context": "https://schema.org", "@graph": [
        { "@type": "WebApplication", name: c.appName, url: `${SITE}${localePath(locale, PATH)}`, inLanguage: locale === "zh" ? "zh-Hans" : "en", applicationCategory: "DeveloperApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: c.description },
        faqJsonLd([...c.faq]),
      ] }}
    >
      <ContentSection title={c.docsTitle} muted intro={c.docsIntro}>
        <InfoGrid items={c.cards.map(([t, d]) => ({ t, d }))} cols="lg:grid-cols-3" />
      </ContentSection>
      <ContentSection title={c.sourcesTitle}>
        <Sources items={c.sources.map((s) => ({ ...s }))} />
      </ContentSection>
      <ContentSection title={c.faqTitle} muted><Faq items={[...c.faq]} /></ContentSection>
    </ToolPage>
  );
}
