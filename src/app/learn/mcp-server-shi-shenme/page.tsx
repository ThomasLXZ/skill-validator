import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Faq, faqJsonLd } from "@/components/tools/PageShell";
import { pageMeta, SITE } from "@/lib/site";

const PATH = "/learn/mcp-server-shi-shenme/";
const TITLE = "MCP Server 是什么？用一次握手讲清楚";
const DESC = "MCP Server 是什么：一个按 Model Context Protocol 向 AI 客户端提供工具、资源和提示的程序。说明它和模型的区别、stdio 与 HTTP 两种接法，以及怎么在本地检查。";

export const metadata = pageMeta({
  title: TITLE,
  description: DESC,
  path: PATH,
  type: "article",
  keywords: ["mcp server 是什么", "mcp server 是什麼", "什么是 MCP server", "MCP 服务器", "Model Context Protocol"],
});

const FAQ = [
  { q: "MCP Server 是模型吗？", a: "不是。模型负责生成文字。MCP server 是旁边的一个程序，负责列出工具、执行调用、提供资源或提示。Claude、Cursor 这类客户端先连接 server，再决定要不要用里面的工具。" },
  { q: "它和 Claude Skill 有什么区别？", a: "Skill 是一份 SKILL.md 说明，告诉模型何时启用一套步骤。MCP server 是活的程序，能查数据库、调 API、读文件。两者可以同时存在：Skill 写流程，server 提供真正能调用的工具。" },
  { q: "本地命令和网址，用哪个？", a: "跑在你自己机器上的 server 通常用 stdio：客户端启动一条命令，通过标准输入输出收发 JSON-RPC。装在别处的 server 用 Streamable HTTP：对一个 URL 发 POST。旧的 SSE 地址还能见到，新的 server 应优先 HTTP。" },
  { q: "怎样确认 server 是通的？", a: "先 initialize，再发 notifications/initialized，然后 tools/list。本站的 MCP 测试页可以检查你粘贴的工具列表，并生成这几条 curl，但不会替你访问服务器。" },
];

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: "MCP Server 是什么",
        description: DESC,
        url: `${SITE}${PATH}`,
        inLanguage: "zh-CN",
        dateModified: "2026-11-05",
        about: "Model Context Protocol",
      },
      faqJsonLd(FAQ),
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main>
        <article className="mx-auto max-w-[760px] px-4 pb-20 pt-12 sm:px-6 sm:pt-16" lang="zh-CN">
          <p className="text-[13px] text-muted-foreground">
            Learn · <Link href="/learn/mcp-tool-vs-resource-vs-prompt/">Tool、Resource、Prompt</Link>
          </p>
          <h1 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[44px]">MCP Server 是什么</h1>
          <p className="mt-4 text-[18px] leading-relaxed text-muted-foreground">
            MCP server 是一个小服务。它按 Model Context Protocol 把<strong className="font-medium text-foreground">工具、资源和提示</strong>交给 AI 客户端。客户端里的模型决定要不要调用；server 负责真的去做。
          </p>

          <div className="prose-article">
            <h2>它解决的问题</h2>
            <p>模型本身连不上你的仓库、数据库或内部 API。以前每家产品都写一套自己的插件格式。MCP 把这件事收成一种 JSON-RPC：客户端问「你有哪些工具」，server 回答一份列表；客户端说「调用这个，参数是这些」，server 返回结果。</p>
            <p>所以「MCP server 是什么」的短答案是：<strong>一个实现了这套协议的程序</strong>。它不是聊天窗口，也不是模型权重。</p>

            <h2>一次正常的握手</h2>
            <p>HTTP 上的顺序是固定的。客户端先 <code>initialize</code>，带上自己支持的协议版本。服务器在响应头里可能给一个 <code>mcp-session-id</code>。客户端接着发 <code>notifications/initialized</code>，这是通知，没有 id。然后才是 <code>tools/list</code>，以及真正的 <code>tools/call</code>。</p>
            <p>stdio 没有网址，顺序一样，只是消息走标准输入输出。桌面上的 Claude 或 Cursor 会替你启动命令。</p>

            <h2>里面通常有什么</h2>
            <ul>
              <li><strong>Tool</strong>：模型可以调用的函数，带名字、描述和 <code>inputSchema</code>。</li>
              <li><strong>Resource</strong>：有地址的数据，由客户端决定要不要塞进上下文。</li>
              <li><strong>Prompt</strong>：用户主动点的模板，常见是斜杠命令。</li>
            </ul>
            <p>三者的差别是「谁决定使用」，不是文件长什么样。英文对照在 <Link href="/learn/mcp-tool-vs-resource-vs-prompt/">tool vs resource vs prompt</Link>。</p>

            <h2>配置长什么样</h2>
            <p>本地 server 需要一条命令和参数。远程 server 需要一个 http 或 https 地址。Claude Desktop 和 Cursor 把它们写在 <code>mcpServers</code> 里；VS Code 写在 <code>servers</code> 里，并带上 <code>type</code>。密钥放在环境变量，不要写进会提交的文件。</p>
            <p>可以用 <Link href="/mcp/">MCP 测试页</Link> 生成这三份配置、检查一份已有的 JSON，或给 HTTP server 生成 curl。工具返回太大时，用 <Link href="/tool-result-size/">token 计数</Link> 看它会不会顶到客户端的上限。</p>
          </div>

          <div className="mt-8 rounded-2xl border bg-subtle p-5" lang="en">
            <div className="text-[13px] font-medium">In English</div>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
              An MCP server is a program that exposes tools, resources, and prompts over the Model Context Protocol. The model does not live inside it. Local servers usually speak stdio; remote servers speak Streamable HTTP: initialize, notifications/initialized, then tools/list.
            </p>
          </div>

          <h2 className="mb-2 mt-12 text-[24px] font-semibold tracking-[-0.02em]">常见问题</h2>
          <Faq items={FAQ} />

          <div className="mt-10 rounded-2xl border p-5 text-[14px]">
            <div className="font-medium">接着可以看</div>
            <ul className="mt-2 space-y-1.5">
              {[
                ["/mcp/", "MCP 工具检查、curl 和配置生成"],
                ["/learn/mcp-tool-vs-resource-vs-prompt/", "Tool、Resource、Prompt"],
                ["/tool-result-size/", "MCP token 计数"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="inline-flex items-center gap-1 underline decoration-border underline-offset-4 hover:decoration-foreground">
                    {label}
                    <ArrowUpRight className="size-3.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
