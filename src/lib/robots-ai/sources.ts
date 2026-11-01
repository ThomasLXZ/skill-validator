/** Every external fact used by the robots.txt AI checker, with where it comes from. */
export const SRC = {
  rfc9309: "https://www.rfc-editor.org/rfc/rfc9309.html",
  vocab: "https://datatracker.ietf.org/doc/draft-ietf-aipref-vocab/",
  attach: "https://datatracker.ietf.org/doc/draft-ietf-aipref-attach/",
  token: "https://datatracker.ietf.org/doc/draft-kelley-aipref-training-preference-signal/",
  openaiBots: "https://developers.openai.com/api/docs/bots",
  openaiSignal: "https://openai.com/index/helping-websites-express-ai-training-preferences/",
  googleSignal: "https://developers.google.com/search/blog/2026/10/ai-training-control",
  googleCrawlers: "https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers",
  anthropic: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
  perplexity: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers",
  apple: "https://support.apple.com/en-us/119829",
  meta: "https://developers.facebook.com/docs/sharing/webmasters/web-crawlers",
  commoncrawl: "https://commoncrawl.org/ccbot",
  amazon: "https://developer.amazon.com/amazonbot",
  llmstxt: "https://llmstxt.org/",
} as const;
