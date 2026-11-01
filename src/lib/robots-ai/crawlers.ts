import { SRC } from "./sources";

export type CrawlerPurpose = "training" | "search" | "user";

export interface AiCrawler {
  token: string;
  owner: string;
  purpose: CrawlerPurpose;
  note: string;
  ref: string;
  /** Not in the operator's current documentation. */
  legacy?: boolean;
  /** The operator says robots.txt may not apply (user-initiated fetches). */
  mayIgnoreRobots?: boolean;
  /** A robots.txt control token, not a separate crawler. */
  controlToken?: boolean;
  /** We could not find first-party documentation. */
  unofficial?: boolean;
}

export const AI_CRAWLERS: AiCrawler[] = [
  { token: "GPTBot", owner: "OpenAI", purpose: "training", note: "Crawls content that may be used to train OpenAI's models.", ref: SRC.openaiBots },
  { token: "OAI-SearchBot", owner: "OpenAI", purpose: "search", note: "Surfaces sites in ChatGPT search results. Not used for training.", ref: SRC.openaiBots },
  { token: "ChatGPT-User", owner: "OpenAI", purpose: "user", note: "Visits pages when a ChatGPT user asks. OpenAI says robots.txt rules may not apply.", ref: SRC.openaiBots, mayIgnoreRobots: true },
  { token: "ClaudeBot", owner: "Anthropic", purpose: "training", note: "Collects public web content that may be used to train Anthropic's models.", ref: SRC.anthropic },
  { token: "Claude-SearchBot", owner: "Anthropic", purpose: "search", note: "Indexes pages to improve Claude's search results.", ref: SRC.anthropic },
  { token: "Claude-User", owner: "Anthropic", purpose: "user", note: "Fetches pages when a Claude user asks a question.", ref: SRC.anthropic },
  { token: "anthropic-ai", owner: "Anthropic", purpose: "training", note: "Older token that is no longer in Anthropic's crawler documentation. Use ClaudeBot.", ref: SRC.anthropic, legacy: true },
  { token: "Claude-Web", owner: "Anthropic", purpose: "user", note: "Older token that is no longer in Anthropic's crawler documentation. Use Claude-User.", ref: SRC.anthropic, legacy: true },
  { token: "Google-Extended", owner: "Google", purpose: "training", note: "Control token, not a crawler. Controls use of content for Gemini training and grounding. Googlebot and Search are not affected.", ref: SRC.googleCrawlers, controlToken: true },
  { token: "Applebot-Extended", owner: "Apple", purpose: "training", note: "Control token, not a crawler. Opts out of training Apple's foundation models. Applebot search crawling is not affected.", ref: SRC.apple, controlToken: true },
  { token: "PerplexityBot", owner: "Perplexity", purpose: "search", note: "Indexes sites for Perplexity search results.", ref: SRC.perplexity },
  { token: "Perplexity-User", owner: "Perplexity", purpose: "user", note: "Fetches pages for user questions. Perplexity says it generally ignores robots.txt.", ref: SRC.perplexity, mayIgnoreRobots: true },
  { token: "Meta-ExternalAgent", owner: "Meta", purpose: "training", note: "Crawls for AI model training and for indexing.", ref: SRC.meta },
  { token: "Meta-ExternalFetcher", owner: "Meta", purpose: "user", note: "Fetches links that users ask for. Meta says it may bypass robots.txt.", ref: SRC.meta, mayIgnoreRobots: true },
  { token: "CCBot", owner: "Common Crawl", purpose: "training", note: "Builds the open Common Crawl dataset, which many AI models are trained on.", ref: SRC.commoncrawl },
  { token: "Amazonbot", owner: "Amazon", purpose: "training", note: "Amazon's crawler. Amazon says it may be used to train its AI models.", ref: SRC.amazon },
  { token: "Amzn-SearchBot", owner: "Amazon", purpose: "search", note: "Amazon's search crawler. Amazon says it is not used for AI model training.", ref: SRC.amazon },
  { token: "Amzn-User", owner: "Amazon", purpose: "user", note: "Fetches live pages for user requests, such as Alexa questions.", ref: SRC.amazon },
  { token: "Bytespider", owner: "ByteDance", purpose: "training", note: "ByteDance crawler. We found no first-party documentation for it.", ref: SRC.rfc9309, unofficial: true },
];

/** The draft policy token from draft-kelley-aipref-training-preference-signal. */
export const POLICY_TOKEN = "__usage_ai-training";

export const PURPOSE_LABEL: Record<CrawlerPurpose, string> = {
  training: "AI training",
  search: "AI search",
  user: "User-initiated",
};
