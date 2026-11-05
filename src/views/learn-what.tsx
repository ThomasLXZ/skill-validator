import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Faq, faqJsonLd } from "@/components/tools/PageShell";
import { I18nProvider } from "@/lib/i18n/context";
import { localePath, type Locale } from "@/lib/i18n/routing";
import { pageMeta, SITE } from "@/lib/site";
import { textLink } from "./bits";

const PATH = "/learn/mcp-server-shi-shenme/";

const copy = {
  en: {
    title: "What Is an MCP Server? One Handshake",
    description: "An MCP server is a program that offers tools, resources, and prompts to an AI client over the Model Context Protocol. How it differs from the model, stdio versus HTTP, and how to check it locally.",
    keywords: ["what is an MCP server", "MCP server explained", "Model Context Protocol", "stdio vs streamable http"],
    kicker: "Learn",
    sibling: "Tool, resource, and prompt",
    h1: "What is an MCP server",
    lead: "An MCP server is a small program. It hands tools, resources, and prompts to an AI client using the Model Context Protocol. The model inside the client decides whether to call something; the server is what actually does it.",
    hProblem: "The problem it solves",
    pProblem1: "A model cannot reach your repository, database, or internal API by itself. Products used to invent a plugin format each. MCP turns that into one JSON-RPC conversation: the client asks “which tools do you have?”, the server answers with a list; the client says “call this, with these arguments”, and the server returns a result.",
    pProblem2: "So the short answer to “what is an MCP server?” is: a program that speaks this protocol. It is not the chat window, and it is not the model weights.",
    hShake: "One normal handshake",
    pShake1: "Over HTTP the order is fixed. The client sends initialize with the protocol version it supports. The server may return an mcp-session-id header. The client then sends notifications/initialized, which is a notification and has no id. Only then come tools/list and the real tools/call.",
    pShake2: "stdio has no URL. The order is the same; the messages travel on standard input and output. Claude or Cursor on the desktop starts the command for you.",
    hInside: "What is usually inside",
    inside: [
      "Tool: a function the model can call, with a name, a description, and an inputSchema.",
      "Resource: data with an address. The client decides whether to put it in context.",
      "Prompt: a template the user starts, often a slash command.",
    ],
    pInside: "The difference is who decides to use them, not what the file looks like.",
    hConfig: "What the config looks like",
    pConfig1: "A local server needs a command and arguments. A remote server needs an http or https URL. Claude Desktop and Cursor put them under mcpServers. VS Code puts them under servers and sets type. Keep secrets in environment variables, not in a file you commit.",
    pConfig2before: "The",
    pConfig2mid: "can generate those three configs, check an existing JSON file, or write curl for an HTTP server. When a tool returns too much, the",
    pConfig2after: "shows whether it will hit a client limit.",
    faqTitle: "FAQ",
    next: "Read next",
    links: [
      ["/mcp/", "Inspect tools, curl, and config"],
      ["/learn/mcp-tool-vs-resource-vs-prompt/", "Tool, resource, and prompt"],
      ["/tool-result-size/", "MCP token counter"],
    ],
    faq: [
      { q: "Is an MCP server the model?", a: "No. The model writes the text. An MCP server is a program beside it that lists tools, runs calls, and serves resources or prompts. A client such as Claude or Cursor connects to the server first, then decides whether to use a tool." },
      { q: "How is it different from a Claude Skill?", a: "A Skill is a SKILL.md that tells the model when to follow a procedure. An MCP server is a live program that can query a database, call an API, or read a file. They can exist together: the Skill describes the workflow, the server provides tools that can actually be called." },
      { q: "Local command or a URL?", a: "A server on your own machine usually uses stdio: the client starts a command and exchanges JSON-RPC on stdin and stdout. A server hosted elsewhere uses Streamable HTTP: POST to a URL. Old SSE URLs still show up; new servers should prefer HTTP." },
      { q: "How do I know the server is up?", a: "Send initialize, then notifications/initialized, then tools/list. The MCP test page on this site can check a tool list you paste and generate those curl commands. It will not contact the server for you." },
    ],
  },
  zh: {
    title: "MCP Server 是什么？用一次握手讲清楚",
    description: "MCP Server 是什么：一个按 Model Context Protocol 向 AI 客户端提供工具、资源和提示的程序。说明它和模型的区别、stdio 与 HTTP 两种接法，以及怎么在本地检查。",
    keywords: ["mcp server 是什么", "什么是 MCP server", "MCP 服务器", "Model Context Protocol"],
    kicker: "学习",
    sibling: "工具、资源与提示",
    h1: "MCP Server 是什么",
    lead: "MCP server 是一个小服务。它按 Model Context Protocol 把工具、资源和提示交给 AI 客户端。客户端里的模型决定要不要调用；server 负责真的去做。",
    hProblem: "它解决的问题",
    pProblem1: "模型本身连不上你的仓库、数据库或内部 API。以前每家产品都写一套自己的插件格式。MCP 把这件事收成一种 JSON-RPC：客户端问「你有哪些工具」，server 回答一份列表；客户端说「调用这个，参数是这些」，server 返回结果。",
    pProblem2: "所以「MCP server 是什么」的短答案是：一个实现了这套协议的程序。它不是聊天窗口，也不是模型权重。",
    hShake: "一次正常的握手",
    pShake1: "HTTP 上的顺序是固定的。客户端先 initialize，带上自己支持的协议版本。服务器在响应头里可能给一个 mcp-session-id。客户端接着发 notifications/initialized，这是通知，没有 id。然后才是 tools/list，以及真正的 tools/call。",
    pShake2: "stdio 没有网址，顺序一样，只是消息走标准输入输出。桌面上的 Claude 或 Cursor 会替你启动命令。",
    hInside: "里面通常有什么",
    inside: [
      "Tool：模型可以调用的函数，带名字、描述和 inputSchema。",
      "Resource：有地址的数据，由客户端决定要不要塞进上下文。",
      "Prompt：用户主动点的模板，常见是斜杠命令。",
    ],
    pInside: "三者的差别是「谁决定使用」，不是文件长什么样。",
    hConfig: "配置长什么样",
    pConfig1: "本地 server 需要一条命令和参数。远程 server 需要一个 http 或 https 地址。Claude Desktop 和 Cursor 把它们写在 mcpServers 里；VS Code 写在 servers 里，并带上 type。密钥放在环境变量，不要写进会提交的文件。",
    pConfig2before: "可以用",
    pConfig2mid: "生成这三份配置、检查一份已有的 JSON，或给 HTTP server 生成 curl。工具返回太大时，用",
    pConfig2after: "看它会不会顶到客户端的上限。",
    faqTitle: "常见问题",
    next: "接着可以看",
    links: [
      ["/mcp/", "MCP 工具检查、curl 和配置生成"],
      ["/learn/mcp-tool-vs-resource-vs-prompt/", "工具、资源与提示"],
      ["/tool-result-size/", "MCP token 计数"],
    ],
    faq: [
      { q: "MCP Server 是模型吗？", a: "不是。模型负责生成文字。MCP server 是旁边的一个程序，负责列出工具、执行调用、提供资源或提示。Claude、Cursor 这类客户端先连接 server，再决定要不要用里面的工具。" },
      { q: "它和 Claude Skill 有什么区别？", a: "Skill 是一份 SKILL.md 说明，告诉模型何时启用一套步骤。MCP server 是活的程序，能查数据库、调 API、读文件。两者可以同时存在：Skill 写流程，server 提供真正能调用的工具。" },
      { q: "本地命令和网址，用哪个？", a: "跑在你自己机器上的 server 通常用 stdio：客户端启动一条命令，通过标准输入输出收发 JSON-RPC。装在别处的 server 用 Streamable HTTP：对一个 URL 发 POST。旧的 SSE 地址还能见到，新的 server 应优先 HTTP。" },
      { q: "怎样确认 server 是通的？", a: "先 initialize，再发 notifications/initialized，然后 tools/list。本站的 MCP 测试页可以检查你粘贴的工具列表，并生成这几条 curl，但不会替你访问服务器。" },
    ],
  },
} as const;

export function whatMeta(locale: Locale) {
  const c = copy[locale];
  return pageMeta({ title: c.title, description: c.description, path: PATH, locale, type: "article", keywords: [...c.keywords] });
}

export function WhatMcpPage({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "TechArticle", headline: c.h1, description: c.description, url: `${SITE}${localePath(locale, PATH)}`, inLanguage: locale === "zh" ? "zh-Hans" : "en", dateModified: "2026-11-05", about: "Model Context Protocol" },
      faqJsonLd([...c.faq]),
    ],
  };
  return (
    <I18nProvider locale={locale}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main lang={locale === "zh" ? "zh-Hans" : "en"}>
        <article className="mx-auto max-w-[760px] px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
          <p className="text-[13px] text-muted-foreground">
            {c.kicker} · <Link className={textLink} href={localePath(locale, "/learn/mcp-tool-vs-resource-vs-prompt/")}>{c.sibling}</Link>
          </p>
          <h1 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[44px]">{c.h1}</h1>
          <p className="mt-4 text-[18px] leading-relaxed text-muted-foreground">{c.lead}</p>
          <div className="prose-article">
            <h2>{c.hProblem}</h2>
            <p>{c.pProblem1}</p>
            <p>{c.pProblem2}</p>
            <h2>{c.hShake}</h2>
            <p>{c.pShake1}</p>
            <p>{c.pShake2}</p>
            <h2>{c.hInside}</h2>
            <ul>{c.inside.map((item) => <li key={item}>{item}</li>)}</ul>
            <p>{c.pInside} <Link href={localePath(locale, "/learn/mcp-tool-vs-resource-vs-prompt/")}>{c.sibling}</Link></p>
            <h2>{c.hConfig}</h2>
            <p>{c.pConfig1}</p>
            <p>
              {c.pConfig2before} <Link href={localePath(locale, "/mcp/")}>{locale === "zh" ? "MCP 测试页" : "MCP test page"}</Link> {c.pConfig2mid} <Link href={localePath(locale, "/tool-result-size/")}>{locale === "zh" ? "token 计数" : "token counter"}</Link> {c.pConfig2after}
            </p>
          </div>
          <h2 className="mb-2 mt-12 text-[24px] font-semibold tracking-[-0.02em]">{c.faqTitle}</h2>
          <Faq items={[...c.faq]} />
          <div className="mt-10 rounded-2xl border p-5 text-[14px]">
            <div className="font-medium">{c.next}</div>
            <ul className="mt-2 space-y-1.5">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={localePath(locale, href)} className={`inline-flex items-center gap-1 ${textLink}`}>
                    {label}
                    <ArrowUpRight className="size-3.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </main>
      <SiteFooter locale={locale} />
    </I18nProvider>
  );
}
