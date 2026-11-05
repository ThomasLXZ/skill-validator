import Link from "next/link";
import McpTool from "@/components/tools/McpTool";
import { ContentSection, Faq, faqJsonLd, Sources, ToolPage } from "@/components/tools/PageShell";
import { MCP_PROTOCOL, REF } from "@/lib/mcp";
import { localePath, type Locale } from "@/lib/i18n/routing";
import { pageMeta, SITE } from "@/lib/site";
import { InfoGrid, textLink } from "./bits";

const PATH = "/mcp/";

const copy = {
  en: {
    title: "MCP Server Test Suite: Tool Inspector, curl, and Config Generator",
    description: "MCP server test suite in the browser: inspect a tools/list payload, generate Streamable HTTP curl for initialize and tools/call, and build or check an MCP config for Claude Desktop, Cursor, and VS Code.",
    keywords: ["mcp server test suite", "mcp test curl", "web mcp tool inspector", "mcp config generator", "mcp tool inspector", "mcp.json generator"],
    eyebrow: "MCP server test suite",
    h1: "Inspect tools, write curl, generate config",
    bullets: ["Tool list checks", `curl for ${MCP_PROTOCOL}`, "Claude, Cursor, VS Code"],
    appName: "MCP Server Test Suite",
    checksTitle: "What the inspector checks",
    checksIntro: "These are static checks on the JSON a server already returned. They are not a substitute for the client’s own handshake.",
    cards: [
      ["Tool name", "Letters, numbers, underscores, and hyphens, 1–64 characters. Duplicates are an error."],
      ["Description", "A missing description is a tip. Models pick a tool from that text."],
      ["inputSchema", "Should be a JSON Schema object. required entries should exist on properties."],
      ["initialize", "The curl opens a session, then sends notifications/initialized before tools/list."],
      ["tools/call", "Pick a tool in the inspector to fill a sample arguments object from its schema."],
      ["Config shape", "mcpServers for Claude Desktop and Cursor. servers with type for VS Code. SSE is flagged as the older transport."],
    ],
    sourcesTitle: "Sources",
    faqTitle: "FAQ",
    faq: [
      { q: "Does this page call my MCP server?", a: "No. The inspector checks JSON you paste. The curl tab writes commands you run in a terminal, which is what actually reaches the server. Browsers block most cross-origin MCP calls, and a local stdio server has no HTTP port." },
      { q: "Which protocol version is in the curl?", a: `initialize sends protocolVersion ${MCP_PROTOCOL}, and the MCP-Protocol-Version header matches it. That is the Streamable HTTP handshake current servers expect. Copy mcp-session-id from the initialize response into MCP_SESSION_ID. If the server is stateless and omits the header, drop Mcp-Session-Id on the later calls.` },
      { q: "Where do the generated configs go?", a: "Claude Desktop uses mcpServers in claude_desktop_config.json. Cursor uses the same mcpServers object in ~/.cursor/mcp.json or .cursor/mcp.json. VS Code uses servers in .vscode/mcp.json with type stdio or http. Confirm the path in the client you are using; the shapes change between versions." },
      { q: "How is this different from the token counter?", a: "This page checks names, input schemas, and the handshake. When a tool result is large, use the MCP token counter to estimate tokens against Claude Code’s limits." },
    ],
    sources: [
      { label: "MCP transports (2025-06-18)", href: REF.transports, note: "Streamable HTTP, Accept header, and Mcp-Session-Id." },
      { label: "MCP lifecycle", href: REF.lifecycle, note: "initialize, then notifications/initialized." },
      { label: "MCP tools", href: REF.tools, note: "tools/list, tools/call, name, description, inputSchema." },
    ],
  },
  zh: {
    title: "MCP Server 测试：工具检查、curl 与配置生成",
    description: "在浏览器里测试 MCP server。检查一份 tools/list，为 initialize 和 tools/call 生成 Streamable HTTP curl，并为 Claude Desktop、Cursor、VS Code 生成或检查 MCP 配置。",
    keywords: ["mcp server 测试", "mcp curl", "mcp 工具检查", "mcp 配置生成", "mcp.json"],
    eyebrow: "MCP server 测试套件",
    h1: "检查工具、写 curl、生成配置",
    bullets: ["检查工具列表", `${MCP_PROTOCOL} 的 curl`, "Claude、Cursor、VS Code"],
    appName: "MCP Server 测试套件",
    checksTitle: "检查器会看什么",
    checksIntro: "这些检查只看服务器已经返回的 JSON，不会替客户端完成握手。",
    cards: [
      ["工具名", "只能用字母、数字、下划线和连字符，长度 1–64。名字重复算错误。"],
      ["描述", "缺少描述时只给提示。模型挑选工具，看的就是这段文字。"],
      ["inputSchema", "应当是一个 JSON Schema 对象。required 里的名字，应当出现在 properties 里。"],
      ["initialize", "这条 curl 会先建立会话，再发送 notifications/initialized，然后才是 tools/list。"],
      ["tools/call", "在检查器里点一个工具，就会按它的 schema 填一份示例参数。"],
      ["配置长什么样", "Claude Desktop 和 Cursor 用 mcpServers。VS Code 用带 type 的 servers。如果还在用 SSE，会被标成较旧的传输。"],
    ],
    sourcesTitle: "来源",
    faqTitle: "常见问题",
    faq: [
      { q: "这个页面会调用我的 MCP server 吗？", a: "不会。检查器只看你粘贴的 JSON。curl 标签生成的是命令，要你在终端里运行，请求才真正到达服务器。浏览器会拦截大多数跨域 MCP 调用；本地的 stdio server 也没有 HTTP 端口。" },
      { q: "curl 里用的是哪个协议版本？", a: `initialize 发送 protocolVersion ${MCP_PROTOCOL}，请求头 MCP-Protocol-Version 与它一致。这是当前服务器期望的 Streamable HTTP 握手。把 initialize 响应里的 mcp-session-id 抄进 MCP_SESSION_ID。如果服务器无状态、不返回这个头，后面的调用就去掉 Mcp-Session-Id。` },
      { q: "生成的配置放在哪里？", a: "Claude Desktop 把 mcpServers 写在 claude_desktop_config.json。Cursor 用同一个 mcpServers 对象，放在 ~/.cursor/mcp.json 或 .cursor/mcp.json。VS Code 写在 .vscode/mcp.json 的 servers 里，并带上 type，取值为 stdio 或 http。路径以你正在用的客户端为准，不同版本可能不一样。" },
      { q: "它和 token 计数有什么不同？", a: "这一页检查名字、输入 schema 和握手。工具结果很大时，改用 MCP token 计数，对照 Claude Code 的上限。" },
    ],
    sources: [
      { label: "MCP 传输（2025-06-18）", href: REF.transports, note: "Streamable HTTP、Accept 头和 Mcp-Session-Id。" },
      { label: "MCP 生命周期", href: REF.lifecycle, note: "先 initialize，再 notifications/initialized。" },
      { label: "MCP 工具", href: REF.tools, note: "tools/list、tools/call、name、description、inputSchema。" },
    ],
  },
} as const;

export function mcpMeta(locale: Locale) {
  const c = copy[locale];
  return pageMeta({ title: c.title, description: c.description, path: PATH, locale, keywords: [...c.keywords] });
}

export function McpPage({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const what = locale === "zh" ? "MCP 是什么" : "What is an MCP server";
  const counter = locale === "zh" ? "MCP token 计数" : "MCP token counter";
  return (
    <ToolPage
      locale={locale}
      eyebrow={c.eyebrow}
      title={c.h1}
      lead={<>{locale === "zh" ? "粘贴一份" : "Paste a"} <code className="font-mono text-[0.9em]">tools/list</code> {locale === "zh" ? "结果。可以生成 Streamable HTTP 测试脚本，或生成一份 MCP 配置。想先看白话说明，读" : "result, generate a Streamable HTTP test script, or build an MCP config. For a plain-language intro, read"}{" "}
        <Link className={textLink} href={localePath(locale, "/learn/mcp-server-shi-shenme/")}>{what}</Link>
        {locale === "zh" ? "。结果太大时，用" : ". Measure a result with the"}{" "}
        <Link className={textLink} href={localePath(locale, "/tool-result-size/")}>{counter}</Link>
        {locale === "zh" ? "估算。" : "."}
      </>}
      bullets={[...c.bullets]}
      tool={<McpTool />}
      jsonLd={{ "@context": "https://schema.org", "@graph": [
        { "@type": "WebApplication", name: c.appName, url: `${SITE}${localePath(locale, PATH)}`, inLanguage: locale === "zh" ? "zh-Hans" : "en", applicationCategory: "DeveloperApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: c.description },
        faqJsonLd([...c.faq]),
      ] }}
    >
      <ContentSection title={c.checksTitle} muted intro={c.checksIntro}>
        <InfoGrid items={c.cards.map(([t, d]) => ({ t, d }))} />
      </ContentSection>
      <ContentSection title={c.sourcesTitle}>
        <Sources items={c.sources.map((s) => ({ ...s }))} />
      </ContentSection>
      <ContentSection title={c.faqTitle} muted><Faq items={[...c.faq]} /></ContentSection>
    </ToolPage>
  );
}
