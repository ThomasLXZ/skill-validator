import ToolResultSizeTool from "@/components/tools/ToolResultSizeTool";
import { ContentSection, Faq, faqJsonLd, Sources, ToolPage } from "@/components/tools/PageShell";
import { LIMITS, REF } from "@/lib/tool-result-size";
import { localePath, type Locale } from "@/lib/i18n/routing";
import { pageMeta, SITE } from "@/lib/site";
import { textLink } from "./bits";

const PATH = "/tool-result-size/";
const n = (x: number) => x.toLocaleString("en-US");

const copy = {
  en: {
    title: "MCP Token Counter and Tool Result Size Checker",
    description: "MCP token counter for tool results. Paste an MCP tool result or any text to estimate tokens, characters, and bytes, then compare with Claude Code's 10k warning and 25k default limit.",
    keywords: ["mcp token counter", "MCP token counter", "MCP tool output too large", "MAX_MCP_OUTPUT_TOKENS", "tool result token limit", "Claude Code MCP output", "maxResultSizeChars", "token counter"],
    eyebrow: "MCP token counter",
    h1: "How many tokens is this tool result?",
    bullets: ["MCP CallToolResult aware", `${n(LIMITS.warnTokens)} / ${n(LIMITS.defaultMaxTokens)} token limits`, "Works on any pasted text"],
    appName: "MCP Token Counter",
    shrinkTitle: "How to shrink a tool result",
    limitsTitle: "The limits we check",
    faqTitle: "FAQ",
    tips: [
      { t: "Paginate lists", d: "Return a page of items plus a nextCursor, and accept a cursor argument. MCP uses the same pattern for its own list methods." },
      { t: "Return a resource link", d: "For big files or exports, return a resource_link content block and let the client fetch it with resources/read when needed." },
      { t: "Select fields", d: "Add a fields or verbose argument so the model asks for what it needs. Drop nulls and empty arrays." },
      { t: "Minify JSON", d: "Pretty-printing adds whitespace the model still reads. Serialize without indentation." },
      { t: "Don't send data twice", d: "If you return structuredContent, keep the text block short instead of repeating the whole JSON." },
      { t: "Truncate with a pointer", d: "When text must be cut, say so and tell the model how to get more, e.g. “showing 50 of 1,240 rows; call again with offset=50”." },
    ],
    faq: [
      { q: "What is Claude Code's MCP output limit?", a: `Claude Code warns when an MCP tool result passes ${n(LIMITS.warnTokens)} tokens and by default caps it at ${n(LIMITS.defaultMaxTokens)} tokens. You can change the cap with the MAX_MCP_OUTPUT_TOKENS environment variable.` },
      { q: "How accurate is the token estimate?", a: "It is a heuristic: about 4 characters per token for English, 3 for JSON or code, and 1 per CJK character. Use Anthropic's token counting API for an exact count with a specific model." },
      { q: "Do other MCP clients use the same limits?", a: "No. The MCP specification does not set a size limit. Each client decides, so keep results small whichever client you target." },
      { q: "Can I use this as an MCP token counter?", a: "Yes. Paste a tool result, a tool description, or any other text. The count is an estimate: about 4 characters per token for English, 3 for JSON or code, and 1 per CJK character. It is not the model's tokenizer. For an exact count on a Claude model, use Anthropic's token counting API." },
    ],
    sources: [
      { label: "Claude Code: MCP output limits", href: REF.claudeCodeMcp, note: "Warning threshold, MAX_MCP_OUTPUT_TOKENS, maxResultSizeChars." },
      { label: "MCP spec: Tools", href: REF.tools, status: "2026-07-28", note: "CallToolResult, content blocks, structuredContent, resource_link." },
      { label: "MCP spec: Pagination", href: REF.pagination, status: "2026-07-28", note: "The cursor / nextCursor pattern." },
      { label: "Anthropic token counting", href: REF.tokenCounting, note: "Exact token counts for a model." },
    ],
  },
  zh: {
    title: "MCP Token 计数与工具结果体积检查",
    description: "给工具结果用的 MCP token 计数。粘贴 MCP 工具结果或任意文本，先估算 token、字符和字节，再对照 Claude Code 的 1 万警告线和 2.5 万默认上限。",
    keywords: ["mcp token 计数", "MCP token counter", "工具结果太大", "MAX_MCP_OUTPUT_TOKENS", "token 计数器"],
    eyebrow: "MCP token 计数",
    h1: "这条工具结果有多少 token？",
    bullets: ["能识别 MCP CallToolResult", `对照 ${n(LIMITS.warnTokens)} / ${n(LIMITS.defaultMaxTokens)} 的 token 上限`, "粘贴任意文本都能估算"],
    appName: "MCP Token 计数器",
    shrinkTitle: "怎样缩小工具结果",
    limitsTitle: "我们对照的上限",
    faqTitle: "常见问题",
    tips: [
      { t: "给列表分页", d: "返回一页条目，再附上 nextCursor，并接受 cursor 参数。MCP 自己的列表方法用的就是这个模式。" },
      { t: "返回资源链接", d: "文件或导出结果很大时，改返回 resource_link 内容块。客户端需要时，再用 resources/read 去取。" },
      { t: "让调用方选字段", d: "加一个 fields 或 verbose 参数，让模型只取它需要的字段。同时去掉 null 和空数组。" },
      { t: "压缩 JSON", d: "美化打印会多出空白，模型仍然要读这些空白。序列化时不要缩进。" },
      { t: "不要发两遍", d: "如果已经返回 structuredContent，文本块就写短一点，不要把整份 JSON 再重复一遍。" },
      { t: "截断时指出下一步", d: "必须截断时，先说明截断了，再告诉模型怎么继续。例如：“显示 1240 行中的 50 行；用 offset=50 再调用一次”。" },
    ],
    faq: [
      { q: "Claude Code 的 MCP 输出上限是多少？", a: `MCP 工具结果超过 ${n(LIMITS.warnTokens)} token 时，Claude Code 会警告，并默认截到 ${n(LIMITS.defaultMaxTokens)} token。要用别的上限，设置环境变量 MAX_MCP_OUTPUT_TOKENS。` },
      { q: "token 估算有多准？", a: "这是启发式估算，不是模型的分词结果：英文大约 4 个字符算 1 个 token，JSON 或代码大约 3 个字符，每个汉字大约 1 个。要某个具体模型的精确数字，用 Anthropic 的 token counting API。" },
      { q: "其他 MCP 客户端用同样的上限吗？", a: "不用。MCP 规范没有规定体积上限，每个客户端自己决定。所以不管客户端是哪一个，都把结果控制得小一些。" },
      { q: "可以把它当成 MCP token 计数器吗？", a: "可以。粘贴工具结果、工具描述或其他文本都能估算。英文大约 4 个字符算 1 个 token，JSON 或代码大约 3 个字符，每个汉字大约算 1 个 token。它不是模型的分词器。要 Claude 某个模型的精确数字，用 Anthropic 的 token counting API。" },
    ],
    sources: [
      { label: "Claude Code：MCP 输出上限", href: REF.claudeCodeMcp, note: "警告阈值、MAX_MCP_OUTPUT_TOKENS、maxResultSizeChars。" },
      { label: "MCP 规范：Tools", href: REF.tools, status: "2026-07-28", note: "CallToolResult、内容块、structuredContent、resource_link。" },
      { label: "MCP 规范：分页", href: REF.pagination, status: "2026-07-28", note: "cursor / nextCursor 模式。" },
      { label: "Anthropic token 计数", href: REF.tokenCounting, note: "某个模型的精确 token 数。" },
    ],
  },
} as const;

export function tokensMeta(locale: Locale) {
  const c = copy[locale];
  return pageMeta({ title: c.title, description: c.description, path: PATH, locale, keywords: [...c.keywords] });
}

export function TokensPage({ locale }: { locale: Locale }) {
  const c = copy[locale];
  return (
    <ToolPage
      locale={locale}
      eyebrow={c.eyebrow}
      title={c.h1}
      lead={<>{locale === "zh"
        ? "这是给工具返回值用的 MCP token 计数。先看字符、字节和估算的 token，再对照 Claude Code 已公开的上限，并判断该删哪里。工具列表本身请到"
        : "An MCP token counter for what your tool returns. See characters, bytes, and estimated tokens, how that compares with Claude Code's documented limits, and what to cut. Check the tool list itself on the"}{" "}
        <a className={textLink} href={localePath(locale, "/mcp/")}>{locale === "zh" ? "MCP 测试页" : "MCP test suite"}</a>
        {locale === "zh" ? "检查。" : "."}
      </>}
      bullets={[...c.bullets]}
      tool={<ToolResultSizeTool />}
      jsonLd={{ "@context": "https://schema.org", "@graph": [
        { "@type": "WebApplication", name: c.appName, url: `${SITE}${localePath(locale, PATH)}`, inLanguage: locale === "zh" ? "zh-Hans" : "en", applicationCategory: "DeveloperApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: c.description },
        faqJsonLd([...c.faq]),
      ] }}
    >
      <ContentSection title={c.shrinkTitle} muted>
        <div className="tips grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {c.tips.map((x) => (
            <div key={x.t} className="bg-background p-5">
              <h3 className="text-[15px] font-medium">{x.t}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{x.d}</p>
            </div>
          ))}
        </div>
      </ContentSection>
      <ContentSection title={c.limitsTitle} intro={locale === "zh" ? (
        <>数字来自 Claude Code 文档，分几档。超过 {n(LIMITS.warnTokens)} token 会警告；默认上限是 {n(LIMITS.defaultMaxTokens)} token（<code className="font-mono text-[14px]">MAX_MCP_OUTPUT_TOKENS</code>）。文本结果超过 {n(LIMITS.textCharsToFile)} 个字符，会存成文件。服务器的 <code className="font-mono text-[14px]">maxResultSizeChars</code> 硬顶是 {n(LIMITS.hardCeilingChars)} 个字符。错误结果超过 {n(LIMITS.errorTruncateAboveChars)} 个字符时，只保留前 {n(LIMITS.errorKeepChars)} 个。</>
      ) : (
        <>From the Claude Code docs: a warning above {n(LIMITS.warnTokens)} tokens, a default cap of {n(LIMITS.defaultMaxTokens)} tokens (<code className="font-mono text-[14px]">MAX_MCP_OUTPUT_TOKENS</code>), text results over {n(LIMITS.textCharsToFile)} characters saved to a file, a {n(LIMITS.hardCeilingChars)}-character ceiling for a server&apos;s <code className="font-mono text-[14px]">maxResultSizeChars</code>, and error results over {n(LIMITS.errorTruncateAboveChars)} characters cut to the first {n(LIMITS.errorKeepChars)}.</>
      )}>
        <Sources items={c.sources.map((s) => ({ ...s }))} />
      </ContentSection>
      <ContentSection title={c.faqTitle} muted><Faq items={[...c.faq]} /></ContentSection>
    </ToolPage>
  );
}
