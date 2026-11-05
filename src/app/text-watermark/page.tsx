import SamplingTool from "@/components/tools/SamplingTool";
import { ContentSection, Faq, faqJsonLd, Sources, ToolPage } from "@/components/tools/PageShell";
import { REF } from "@/lib/claude-sampling";
import { pageMeta, SITE } from "@/lib/site";

const PATH = "/text-watermark/";
const TITLE = "Claude Text Watermark Checker for Sampling Parameters";
const DESC = "Check a Claude Messages request for temperature, top_p, and top_k. On Claude Sonnet 4.6 and Opus 4.6, non-default sampling can drop Anthropic’s text watermark. Newer models reject most of those fields.";

export const metadata = pageMeta({
  title: TITLE,
  description: DESC,
  path: PATH,
  keywords: [
    "claude text watermark", "claude sampling parameters", "temperature top_p top_k",
    "claude sonnet 4.6 watermark", "claude opus 4.6 watermark",
  ],
});

const FAQ = [
  { q: "Does this detect a watermark in text?", a: "No. Anthropic’s detector is a separate preview. This page only reads the request JSON and compares temperature, top_p, and top_k with the published sampling rules. It cannot tell you whether a paragraph is watermarked." },
  { q: "Which models lose the watermark when sampling changes?", a: "Anthropic’s text-watermark page says Claude Sonnet 4.6 output might not carry the watermark when temperature, top_p, or top_k is set to a non-default value, and that you should omit all three if you rely on the mark. The help-center article names both Claude Opus 4.6 and Claude Sonnet 4.6 for that case. Other model ids get a tip to check the current table, not a warning." },
  { q: "Why is temperature 1 still a tip?", a: "1.0 is the usual default, but the docs say to omit the parameter, including values a framework or client library inserts. Sending the key is not the same as leaving it out." },
  { q: "What about models after Opus 4.6?", a: "The API reference says models released after Claude Opus 4.6 reject temperature other than 1.0, reject top_p below 0.99, and reject any top_k. A value of 1.0 or a top_p at or above 0.99 is only kept for compatibility. This checker flags those as errors when the model id looks like that generation." },
];

export default function Page() {
  return (
    <ToolPage
      eyebrow="Claude text watermark"
      title="Will sampling drop the watermark?"
      lead={<>Paste a Messages API body. The checker looks at <code className="font-mono text-[0.9em]">temperature</code>, <code className="font-mono text-[0.9em]">top_p</code>, and <code className="font-mono text-[0.9em]">top_k</code> against Anthropic’s text-watermark note and the sampling limits on newer models.</>}
      bullets={["Sonnet 4.6 and Opus 4.6", "Omit beats sending 1.0", "Newer models reject non-defaults"]}
      tool={<SamplingTool />}
      jsonLd={{ "@context": "https://schema.org", "@graph": [
        { "@type": "WebApplication", name: "Claude Text Watermark Sampling Checker", url: `${SITE}${PATH}`, applicationCategory: "DeveloperApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: DESC },
        faqJsonLd(FAQ),
      ] }}
    >
      <ContentSection title="What the docs actually say" muted intro="The rules below are the ones this checker implements. It does not invent a detector.">
        <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3">
          {[
            ["Omit the three keys", "If you rely on the watermark, omit temperature, top_p, and top_k, including defaults a library sets for you."],
            ["Sonnet 4.6 and Opus 4.6", "A non-default value may mean the output does not carry the text watermark. The watermark adds no tokens and no hidden characters."],
            ["After Opus 4.6", "temperature other than 1.0, top_p below 0.99, and any top_k are rejected. Leave them unset."],
          ].map(([t, d]) => (
            <div key={t} className="bg-background p-5">
              <h3 className="text-[15px] font-medium">{t}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </ContentSection>
      <ContentSection title="Sources">
        <Sources items={[
          { label: "Text watermark", href: REF.watermark, status: "docs", note: "Sonnet 4.6 sampling note: omit temperature, top_p, and top_k." },
          { label: "How Claude marks AI-generated content", href: REF.marking, status: "help", note: "Model table. Opus 4.6 and Sonnet 4.6 are named for non-default sampling." },
          { label: "API reference: sampling parameters", href: REF.sampling, status: "reference", note: "Models after Opus 4.6 reject non-default temperature, top_p, and top_k." },
        ]} />
      </ContentSection>
      <ContentSection title="FAQ" muted><Faq items={FAQ} /></ContentSection>
    </ToolPage>
  );
}
