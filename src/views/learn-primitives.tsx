import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Faq, faqJsonLd } from "@/components/tools/PageShell";
import { I18nProvider } from "@/lib/i18n/context";
import { localePath, type Locale } from "@/lib/i18n/routing";
import { pageMeta, SITE } from "@/lib/site";
import { textLink } from "./bits";

const SPEC = "https://modelcontextprotocol.io/specification/2026-07-28";
const L = { server: `${SPEC}/server`, tools: `${SPEC}/server/tools`, resources: `${SPEC}/server/resources`, prompts: `${SPEC}/server/prompts` };
const PATH = "/learn/mcp-tool-vs-resource-vs-prompt/";

const copy = {
  en: {
    title: "MCP Tool vs Resource vs Prompt: Which One Should You Use?",
    description: "Tools are model-controlled, resources are application-driven, prompts are user-controlled. A plain explanation of the three MCP server primitives, based on the 2026-07-28 spec, with a worked PDF converter example.",
    keywords: ["MCP tool vs resource", "MCP prompt", "MCP resources", "model context protocol primitives"],
    kicker: "Learn",
    based: "Based on the",
    spec: "MCP spec, version 2026-07-28",
    h1: "MCP tool vs resource vs prompt",
    lead: "An MCP server can offer three kinds of things. The difference is not what they contain but who decides to use them: the model, the application, or the user.",
    headers: ["Primitive", "Controlled by", "What it is", "Methods"],
    rows: [
      { p: "Tool", who: "Model", what: "Functions the model can call to act or fetch information", m: "tools/list, tools/call", ex: "Search issues, send an email, convert a file", href: L.tools },
      { p: "Resource", who: "Application", what: "Data the client application chooses to load as context", m: "resources/list, resources/read, resources/templates/list", ex: "File contents, a database schema, git history", href: L.resources },
      { p: "Prompt", who: "User", what: "Templates the user picks, often as slash commands", m: "prompts/list, prompts/get", ex: "/review-pr, /summarize-meeting", href: L.prompts },
    ],
    controlNote: "Control column from the spec's server overview.",
    hTools: "Tools: the model decides",
    pTools1: "The tools spec calls tools model-controlled: the model discovers them with tools/list and calls them with tools/call when it thinks they help. Each tool has a name, a description, an inputSchema, and optionally an outputSchema and annotations.",
    pTools2: "Because tools can do things, the spec says there should always be a human in the loop able to deny a call. A result carries content blocks (text, image, audio, resource_link, embedded resources), optional structuredContent, and isError for failures the model should see.",
    hRes: "Resources: the application decides",
    pRes1: "Resources are application-driven. Each one has a URI. The client lists them with resources/list, reads them with resources/read, and discovers parameterized ones through resources/templates/list. The app might show them in a picker, let users search them, or include them automatically.",
    pRes2: "In this spec version, clients watch a resource for changes with subscriptions/listen and receive notifications/resources/updated.",
    hPrompt: "Prompts: the user decides",
    pPrompt: "Prompts are user-controlled: they are meant for the user to select, typically as slash commands. The server still writes the content. prompts/list returns names and arguments; prompts/get fills in the arguments and returns messages for the conversation.",
    hChoose: "Which one should you use?",
    choose: [
      "The model must do it on its own (look something up, change something): a tool.",
      "It's data someone wants to attach and it has a stable address: a resource.",
      "A person starts it by name as a repeatable workflow: a prompt.",
      "Large outputs: a tool can return a resource_link instead of the full content, so the result stays small.",
    ],
    exampleTitle: "Example: a PDF converter MCP server",
    examples: [
      { k: "Tool", n: "convert_pdf", d: "Takes a PDF path and output format. The model calls it when a user asks to convert a file. Returns a short summary and a resource_link to the output." },
      { k: "Resource", n: "pdf://{name}/text", d: "A resource template for converted text. The app can let the user attach a converted document without calling the tool again." },
      { k: "Prompt", n: "/summarize-pdf", d: "Takes a file argument and returns messages asking for a structured summary. The user starts it from the slash menu." },
    ],
    exampleNote: "Illustrative design, not a published server. Names like pdf:// are examples.",
    faqTitle: "FAQ",
    onSite: "On this site",
    specTitle: "Spec references (2026-07-28)",
    refs: [["Server features overview", L.server], ["Tools", L.tools], ["Resources", L.resources], ["Prompts", L.prompts]] as const,
    links: [
      { href: "/mcp/", label: "MCP server test suite", note: "inspect tools/list, generate curl, write a config." },
      { href: "/learn/mcp-server-shi-shenme/", label: "What is an MCP server", note: "one handshake, and how it differs from the model." },
      { href: "/tool-result-size/", label: "MCP token counter", note: "size a tool result before it hits a client limit." },
    ],
    faq: [
      { q: "Can the model read a resource by itself?", a: "The spec leaves this to the host application. Resources are application-driven: a client may show them in a picker, search them, or include them automatically based on heuristics or the model's selection. If you need the model to fetch data on its own in every client, expose a tool." },
      { q: "Can a tool return a resource?", a: "Yes. A tool result can include a resource_link content block with a URI the client can fetch or subscribe to, or an embedded resource with the contents inline." },
      { q: "Who writes a prompt's content?", a: "The server. User-controlled refers to who decides when the prompt is used, not who authors it. prompts/get returns messages the client adds to the conversation." },
      { q: "Should I make everything a tool?", a: "Many clients support tools best, so tools are the safe default for anything the model must do on its own. Add resources for data users or apps want to attach, and prompts for workflows users start by name." },
    ],
  },
  zh: {
    title: "MCP 工具、资源与提示：该用哪一个？",
    description: "工具由模型决定，资源由应用决定，提示由用户决定。这篇按 2026-07-28 规范，用一个 PDF 转换器的例子说明 MCP server 的三种原语。",
    keywords: ["MCP 工具 资源 提示", "MCP tool vs resource", "MCP prompt", "model context protocol"],
    kicker: "学习",
    based: "依据",
    spec: "MCP 规范 2026-07-28",
    h1: "MCP 的工具、资源与提示",
    lead: "一个 MCP server 可以提供三种东西。差别不在内容本身，而在于谁决定使用：模型、应用程序，还是用户。",
    headers: ["原语", "由谁控制", "它是什么", "方法"],
    rows: [
      { p: "Tool（工具）", who: "模型", what: "函数，由模型调用，用来做事或取信息", m: "tools/list, tools/call", ex: "搜索 issue、发邮件、转换文件", href: L.tools },
      { p: "Resource（资源）", who: "应用程序", what: "数据，由客户端应用决定要不要放进上下文", m: "resources/list, resources/read, resources/templates/list", ex: "文件内容、数据库结构、git 历史", href: L.resources },
      { p: "Prompt（提示）", who: "用户", what: "模板，由用户主动挑选，通常是斜杠命令", m: "prompts/list, prompts/get", ex: "/review-pr、/summarize-meeting", href: L.prompts },
    ],
    controlNote: "“由谁控制”这一列，来自规范里的 server 概览。",
    hTools: "工具：由模型决定",
    pTools1: "工具规范把工具称为由模型控制。模型用 tools/list 发现它们，觉得有帮助时再用 tools/call 调用。每个工具都有名字、描述和 inputSchema，也可以再带 outputSchema 和 annotations。",
    pTools2: "工具可以真的去做事情，所以规范要求始终留有一个人，能拒绝这次调用。返回结果里有 content 块，可以是文本、图片、音频、resource_link 或内嵌资源，也可以附带 structuredContent。失败时带上 isError，让模型看到这次失败。",
    hRes: "资源：由应用程序决定",
    pRes1: "资源由应用程序决定要不要用。每一项资源都有自己的 URI。客户端用 resources/list 列出它们，用 resources/read 读取，用 resources/templates/list 发现带参数的模板。应用可以把资源放进选择器、让用户搜索，或自动放进上下文。",
    pRes2: "在这一版规范里，客户端用 subscriptions/listen 关注资源有没有变化，并接收 notifications/resources/updated。",
    hPrompt: "提示：由用户决定",
    pPrompt: "提示由用户控制，本来就是让用户来选的，通常做成斜杠命令。不过内容仍由服务器编写。prompts/list 返回名字和参数；prompts/get 填上参数，返回要放进对话的消息。",
    hChoose: "该用哪一个？",
    choose: [
      "必须由模型自己去做，例如查一件事或改一件事：用工具。",
      "是别人想附上的数据，而且地址稳定：用资源。",
      "由人按名字启动、并且可以重复做的流程：用提示。",
      "输出很大时，工具可以返回 resource_link，而不是整份内容，这样结果保持短小。",
    ],
    exampleTitle: "例子：一个做 PDF 转换的 MCP server",
    examples: [
      { k: "工具", n: "convert_pdf", d: "接收 PDF 路径和输出格式。用户要求转换文件时，由模型来调用。返回一句短摘要，以及指向输出的 resource_link。" },
      { k: "资源", n: "pdf://{name}/text", d: "这是转换后文本的资源模板。应用可以让用户附上已经转换好的文档，不必再调一次工具。" },
      { k: "提示", n: "/summarize-pdf", d: "接收一个文件参数，返回一组消息，要求做结构化摘要。用户从斜杠菜单启动它。" },
    ],
    exampleNote: "这是用来说明的设计，不是已经发布的服务器。pdf:// 这类名字只是例子。",
    faqTitle: "常见问题",
    onSite: "本站还可以看",
    specTitle: "规范引用（2026-07-28）",
    refs: [["Server 功能概览", L.server], ["工具", L.tools], ["资源", L.resources], ["提示", L.prompts]] as const,
    links: [
      { href: "/mcp/", label: "MCP server 测试", note: "检查 tools/list，生成 curl，并写出配置。" },
      { href: "/learn/mcp-server-shi-shenme/", label: "MCP 是什么", note: "用一次握手，说明它和模型有什么不同。" },
      { href: "/tool-result-size/", label: "MCP token 计数", note: "先估算工具结果的体积，再看会不会碰到客户端上限。" },
    ],
    faq: [
      { q: "模型能自己读资源吗？", a: "规范把这件事留给宿主应用，没有规定每一种客户端都必须这样做。资源由应用决定：客户端可以放进选择器、提供搜索，或按启发式以及模型的选择自动带上。如果你需要模型在每个客户端里都能自己去取数据，就另外提供一个工具。" },
      { q: "工具能返回资源吗？", a: "可以。工具结果可以带一个 resource_link 内容块，里面是 URI，客户端可以获取或订阅。也可以把资源内嵌进去，把内容直接放在结果里。" },
      { q: "提示的内容是谁写的？", a: "服务器写的。这里说的用户控制，指的是谁决定何时使用这条提示，不是谁撰写内容。prompts/get 返回的消息，由客户端加进对话。" },
      { q: "是不是全部做成工具就好？", a: "很多客户端对工具的支持最好。所以凡是模型必须自己做的事，工具是比较稳妥的默认。用户或应用想附上的数据，用资源。用户按名字启动的流程，用提示。" },
    ],
  },
} as const;

const SAMPLE = `// tools/call result from convert_pdf
{
  "content": [
    { "type": "text", "text": "Converted report.pdf to Markdown (12 pages)." },
    {
      "type": "resource_link",
      "uri": "pdf://report/text",
      "name": "report.md",
      "mimeType": "text/markdown"
    }
  ],
  "isError": false
}`;

export function primitivesMeta(locale: Locale) {
  const c = copy[locale];
  return pageMeta({ title: c.title, description: c.description, path: PATH, locale, type: "article", keywords: [...c.keywords] });
}

export function PrimitivesPage({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "TechArticle", headline: c.h1, description: c.description, url: `${SITE}${localePath(locale, PATH)}`, inLanguage: locale === "zh" ? "zh-Hans" : "en", dateModified: "2026-11-05", about: "Model Context Protocol", citation: [L.server, L.tools, L.resources, L.prompts] },
    faqJsonLd([...c.faq]),
  ] };
  return (
    <I18nProvider locale={locale}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main lang={locale === "zh" ? "zh-Hans" : "en"}>
        <article className="mx-auto max-w-[760px] px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
          <p className="text-[13px] text-muted-foreground">
            {c.kicker} · {c.based} <a className={textLink} href={L.server} target="_blank" rel="noopener noreferrer">{c.spec}</a>
          </p>
          <h1 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[44px]">{c.h1}</h1>
          <p className="mt-4 text-[18px] leading-relaxed text-muted-foreground">{c.lead}</p>
          <div className="mt-8 overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[640px] text-left text-[14px]">
              <thead className="bg-subtle text-[12.5px] text-muted-foreground">
                <tr>{c.headers.map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y">
                {c.rows.map((r) => (
                  <tr key={r.p} className="align-top">
                    <td className="px-4 py-3 font-medium"><a className={textLink} href={r.href} target="_blank" rel="noopener noreferrer">{r.p}</a></td>
                    <td className="px-4 py-3">{r.who}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.what}<div className="mt-1 text-[12.5px]">{locale === "zh" ? "例如 " : "e.g. "}{r.ex}</div></td>
                    <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">{r.m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[12.5px] text-muted-foreground">{c.controlNote}</p>
          <div className="prose-article mt-10">
            <h2 id="tools">{c.hTools}</h2>
            <p>{c.pTools1}</p>
            <p>{c.pTools2}</p>
            <h2 id="resources">{c.hRes}</h2>
            <p>{c.pRes1}</p>
            <p>{c.pRes2}</p>
            <h2 id="prompts">{c.hPrompt}</h2>
            <p>{c.pPrompt}</p>
            <h2 id="choose">{c.hChoose}</h2>
            <ul>
              {c.choose.map((item) => <li key={item}>{item}{" "}
                {item === c.choose[3] ? <Link className={textLink} href={localePath(locale, "/tool-result-size/")}>{locale === "zh" ? "用 token 计数看看你的结果有多大。" : "Check yours with the token counter."}</Link> : null}
              </li>)}
            </ul>
          </div>
          <section className="pdf-example mt-10 overflow-hidden rounded-2xl border">
            <div className="flex items-center gap-2 border-b bg-subtle px-4 py-2.5 text-[13px] font-medium">
              <FileText className="size-4 text-muted-foreground" aria-hidden />
              {c.exampleTitle}
            </div>
            <div className="grid gap-px bg-border sm:grid-cols-3">
              {c.examples.map((x) => (
                <div key={x.n} className="bg-background p-4">
                  <div className="text-[12px] font-medium text-muted-foreground">{x.k}</div>
                  <div className="mt-1 font-mono text-[13px] font-medium">{x.n}</div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{x.d}</p>
                </div>
              ))}
            </div>
            <pre className="overflow-x-auto border-t bg-editor p-4 font-mono text-[12.5px] leading-relaxed">{SAMPLE}</pre>
            <p className="border-t px-4 py-2.5 text-[12px] text-muted-foreground">{c.exampleNote}</p>
          </section>
          <h2 className="mb-2 mt-12 text-[24px] font-semibold tracking-[-0.02em]">{c.faqTitle}</h2>
          <Faq items={[...c.faq]} />
          <div className="mt-10 rounded-2xl border p-5 text-[14px]">
            <div className="font-medium">{c.onSite}</div>
            <ul className="mt-2 space-y-1.5">
              {c.links.map((item) => (
                <li key={item.href}>
                  <Link className={textLink} href={localePath(locale, item.href)}>{item.label}</Link>
                  <span className="text-muted-foreground"> — {item.note}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 rounded-2xl border p-5 text-[14px]">
            <div className="font-medium">{c.specTitle}</div>
            <ul className="mt-2 space-y-1.5">
              {c.refs.map(([t, h]) => (
                <li key={h}><a href={h} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${textLink}`}>{t}<ArrowUpRight className="size-3.5" aria-hidden /></a></li>
              ))}
            </ul>
          </div>
        </article>
      </main>
      <SiteFooter locale={locale} />
    </I18nProvider>
  );
}
