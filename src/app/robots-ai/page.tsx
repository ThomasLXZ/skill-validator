import RobotsAiTool from "@/components/tools/RobotsAiTool";
import { ContentSection, Faq, faqJsonLd, Sources, ToolPage } from "@/components/tools/PageShell";
import { SRC } from "@/lib/robots-ai/sources";
import { pageMeta, SITE } from "@/lib/site";

const TITLE = "robots.txt AI Checker: GPTBot, ClaudeBot & IETF AI Preferences";
const DESC = "Paste your robots.txt to see which AI crawlers can read your site, check IETF aipref Content-Usage rules and the __usage_ai-training token, or generate a robots.txt that blocks AI training.";

export const metadata = pageMeta({
  title: TITLE, description: DESC, path: "/robots-ai/",
  keywords: ["robots.txt AI", "block GPTBot", "block ClaudeBot", "AI crawler robots.txt", "Content-Usage", "aipref", "__usage_ai-training", "llms.txt validator"],
});

const FAQ = [
  { q: "Does blocking GPTBot stop my site appearing in ChatGPT search?", a: "No. OpenAI documents GPTBot for training and OAI-SearchBot for search as separate user agents. Block GPTBot and allow OAI-SearchBot if you want search visibility without training." },
  { q: "What is Content-Usage in robots.txt?", a: "A rule from the IETF AI Preferences working group draft (draft-ietf-aipref-attach). It attaches preferences such as train-ai=n to paths. It is a draft, and no crawler is documented as honoring it yet." },
  { q: "What is __usage_ai-training?", a: "A user-agent token from draft-kelley-aipref-training-preference-signal. Disallowing a path for it expresses a preference against AI training. On 30 October 2026 OpenAI and Google said they plan to support this signal." },
  { q: "Is Google-Extended a crawler?", a: "No. Google documents Google-Extended as a product token: Googlebot does the crawling, and the token controls whether that content may be used for Gemini training and grounding." },
  { q: "Do all AI bots obey robots.txt?", a: "No. Perplexity says Perplexity-User generally ignores robots.txt because a user requested the page, and Meta says Meta-ExternalFetcher may bypass it. robots.txt is a request, not access control." },
  { q: "Does llms.txt block AI training?", a: "No. llms.txt is a community proposal for giving models a curated map of your docs. It has no effect on crawling or training permissions." },
];

export default function Page() {
  return (
    <ToolPage
      eyebrow="Updated for the IETF aipref drafts · Oct 2026"
      title="Check your robots.txt for AI crawlers"
      lead={<>See exactly which AI bots can read your site, catch typos that silently allow them, and add the new IETF AI-preference signals. Or generate a robots.txt from a few toggles.</>}
      bullets={["19 AI user agents", "RFC 9309 matching", "Content-Usage & __usage_ai-training", "llms.txt check"]}
      tool={<RobotsAiTool />}
      jsonLd={{ "@context": "https://schema.org", "@graph": [
        { "@type": "WebApplication", name: "robots.txt AI Checker", url: `${SITE}/robots-ai/`, applicationCategory: "DeveloperApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
        faqJsonLd(FAQ),
      ] }}
    >
      <ContentSection title="Training, search and user fetches are different bots" intro={<>Most AI companies now split their crawlers by purpose. Blocking the training bot keeps you out of future models; blocking the search or user bot removes you from AI answers. The checker groups them so you can choose on purpose.</>} muted />
      <ContentSection title="Two draft ways to state an AI training preference" intro={<>
        <p>The IETF AI Preferences working group defines a vocabulary (<code className="font-mono text-[14px]">train-ai</code>, <code className="font-mono text-[14px]">ai-use</code>, <code className="font-mono text-[14px]">search</code>) and a <code className="font-mono text-[14px]">Content-Usage</code> robots.txt rule to attach it. Separately, an individual draft adds a <code className="font-mono text-[14px]">__usage_ai-training</code> user-agent token. Disallow a path for that token to say &ldquo;don&apos;t train on this&rdquo;.</p>
        <p className="mt-3">Both are drafts and may change. Treat them as an addition to blocking crawlers, not a replacement.</p>
      </>}>
        <pre className="overflow-x-auto rounded-xl border bg-editor p-4 font-mono text-[13px] leading-relaxed">{`User-Agent: *
Allow: /
Content-Usage: train-ai=n

User-Agent: __usage_ai-training
Disallow: /`}</pre>
      </ContentSection>
      <ContentSection id="sources" title="Sources" intro="Every crawler and rule in this tool links to the page it comes from." muted>
        <Sources items={[
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
        ]} />
      </ContentSection>
      <ContentSection title="FAQ"><Faq items={FAQ} /></ContentSection>
    </ToolPage>
  );
}
