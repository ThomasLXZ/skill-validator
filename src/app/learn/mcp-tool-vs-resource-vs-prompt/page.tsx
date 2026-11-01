import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Faq, faqJsonLd } from "@/components/tools/PageShell";
import { pageMeta, SITE } from "@/lib/site";

const SPEC = "https://modelcontextprotocol.io/specification/2026-07-28";
const L = { server: `${SPEC}/server`, tools: `${SPEC}/server/tools`, resources: `${SPEC}/server/resources`, prompts: `${SPEC}/server/prompts` };
const PATH = "/learn/mcp-tool-vs-resource-vs-prompt/";
const TITLE = "MCP Tool vs Resource vs Prompt: Which One Should You Use?";
const DESC = "Tools are model-controlled, resources are application-driven, prompts are user-controlled. A plain explanation of the three MCP server primitives, based on the 2026-07-28 spec, with a worked PDF converter example.";

export const metadata = pageMeta({
  title: TITLE, description: DESC, path: PATH, type: "article",
  keywords: ["MCP tool vs resource", "MCP prompt", "MCP resources", "model context protocol primitives", "MCP 工具 资源 提示"],
});

const ROWS = [
  { p: "Tool", who: "Model", what: "Functions the model can call to act or fetch information", m: "tools/list, tools/call", ex: "Search issues, send an email, convert a file", href: L.tools },
  { p: "Resource", who: "Application", what: "Data the client application chooses to load as context", m: "resources/list, resources/read, resources/templates/list", ex: "File contents, a database schema, git history", href: L.resources },
  { p: "Prompt", who: "User", what: "Templates the user picks, often as slash commands", m: "prompts/list, prompts/get", ex: "/review-pr, /summarize-meeting", href: L.prompts },
];

const FAQ = [
  { q: "Can the model read a resource by itself?", a: "The spec leaves this to the host application. Resources are application-driven: a client may show them in a picker, search them, or include them automatically based on heuristics or the model's selection. If you need the model to fetch data on its own in every client, expose a tool." },
  { q: "Can a tool return a resource?", a: "Yes. A tool result can include a resource_link content block with a URI the client can fetch or subscribe to, or an embedded resource with the contents inline." },
  { q: "Who writes a prompt's content?", a: "The server. User-controlled refers to who decides when the prompt is used, not who authors it. prompts/get returns messages the client adds to the conversation." },
  { q: "Should I make everything a tool?", a: "Many clients support tools best, so tools are the safe default for anything the model must do on its own. Add resources for data users or apps want to attach, and prompts for workflows users start by name." },
];

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

export default function Page() {
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "TechArticle", headline: TITLE, description: DESC, url: `${SITE}${PATH}`, inLanguage: "en", dateModified: "2026-10-31", about: "Model Context Protocol", citation: [L.server, L.tools, L.resources, L.prompts] },
    faqJsonLd(FAQ),
  ] };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main>
        <article className="mx-auto max-w-[760px] px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
          <p className="text-[13px] text-muted-foreground">
            Learn · Based on the <Ext href={L.server}>MCP spec, version 2026-07-28</Ext>
          </p>
          <h1 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[44px]">MCP tool vs resource vs prompt</h1>
          <p className="mt-4 text-[18px] leading-relaxed text-muted-foreground">
            An MCP server can offer three kinds of things. The difference is not what they contain but <strong className="text-foreground">who decides to use them</strong>: the model, the application, or the user.
          </p>

          <div className="mt-8 overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[640px] text-left text-[14px]">
              <thead className="bg-subtle text-[12.5px] text-muted-foreground">
                <tr><th className="px-4 py-2.5 font-medium">Primitive</th><th className="px-4 py-2.5 font-medium">Controlled by</th><th className="px-4 py-2.5 font-medium">What it is</th><th className="px-4 py-2.5 font-medium">Methods</th></tr>
              </thead>
              <tbody className="divide-y">
                {ROWS.map((r) => (
                  <tr key={r.p} className="align-top">
                    <td className="px-4 py-3 font-medium"><a className="underline decoration-border underline-offset-4 hover:decoration-foreground" href={r.href} target="_blank" rel="noopener noreferrer">{r.p}</a></td>
                    <td className="px-4 py-3">{r.who}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.what}<div className="mt-1 text-[12.5px]">e.g. {r.ex}</div></td>
                    <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">{r.m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[12.5px] text-muted-foreground">Control column from the spec&apos;s <Ext href={L.server}>server overview</Ext>.</p>

          <div className="mt-8 rounded-2xl border bg-subtle p-5" lang="zh-CN">
            <div className="text-[13px] font-medium">中文速览</div>
            <ul className="mt-2 space-y-1.5 text-[14.5px] leading-relaxed text-muted-foreground">
              <li><strong className="text-foreground">Tool（工具）</strong>：由模型决定何时调用，用来执行操作或获取信息，例如搜索、发邮件、转换文件。</li>
              <li><strong className="text-foreground">Resource（资源）</strong>：由客户端应用决定如何加入上下文的数据，例如文件内容、数据库结构。</li>
              <li><strong className="text-foreground">Prompt（提示）</strong>：由用户主动选择的模板，通常是斜杠命令，例如 /review-pr。</li>
              <li>拿不准时：模型需要自己做的事用 Tool；给人或应用挑选的数据用 Resource；用户按名字启动的流程用 Prompt。</li>
            </ul>
          </div>

          <div className="prose-article mt-10">
            <h2 id="tools">Tools: the model decides</h2>
            <p>The <Ext href={L.tools}>tools spec</Ext> calls tools <strong>model-controlled</strong>: the model discovers them with <code>tools/list</code> and calls them with <code>tools/call</code> when it thinks they help. Each tool has a name, a description, an <code>inputSchema</code>, and optionally an <code>outputSchema</code> and <code>annotations</code>.</p>
            <p>Because tools can do things, the spec says there <strong>should</strong> always be a human in the loop able to deny a call. A result carries <code>content</code> blocks (text, image, audio, <code>resource_link</code>, embedded resources), optional <code>structuredContent</code>, and <code>isError</code> for failures the model should see.</p>

            <h2 id="resources">Resources: the application decides</h2>
            <p><Ext href={L.resources}>Resources</Ext> are <strong>application-driven</strong>. Each one has a URI. The client lists them with <code>resources/list</code>, reads them with <code>resources/read</code>, and discovers parameterized ones through <code>resources/templates/list</code>. The app might show them in a picker, let users search them, or include them automatically.</p>
            <p>In this spec version, clients watch a resource for changes with <code>subscriptions/listen</code> and receive <code>notifications/resources/updated</code>.</p>

            <h2 id="prompts">Prompts: the user decides</h2>
            <p><Ext href={L.prompts}>Prompts</Ext> are <strong>user-controlled</strong>: they are meant for the user to select, typically as slash commands. The server still writes the content. <code>prompts/list</code> returns names and arguments; <code>prompts/get</code> fills in the arguments and returns messages for the conversation.</p>

            <h2 id="choose">Which one should you use?</h2>
            <ul>
              <li><strong>The model must do it on its own</strong> (look something up, change something): a tool.</li>
              <li><strong>It&apos;s data someone wants to attach</strong> and it has a stable address: a resource.</li>
              <li><strong>A person starts it by name</strong> as a repeatable workflow: a prompt.</li>
              <li><strong>Large outputs:</strong> a tool can return a <code>resource_link</code> instead of the full content, so the result stays small. Check yours with the <Link href="/tool-result-size/">tool result size checker</Link>.</li>
            </ul>
          </div>

          <section className="pdf-example mt-10 overflow-hidden rounded-2xl border">
            <div className="flex items-center gap-2 border-b bg-subtle px-4 py-2.5 text-[13px] font-medium">
              <FileText className="size-4 text-muted-foreground" aria-hidden />
              Example: a PDF converter MCP server
            </div>
            <div className="grid gap-px bg-border sm:grid-cols-3">
              {[
                { k: "Tool", n: "convert_pdf", d: "Takes a PDF path and output format. The model calls it when a user asks to convert a file. Returns a short summary and a resource_link to the output." },
                { k: "Resource", n: "pdf://{name}/text", d: "A resource template for converted text. The app can let the user attach a converted document without calling the tool again." },
                { k: "Prompt", n: "/summarize-pdf", d: "Takes a file argument and returns messages asking for a structured summary. The user starts it from the slash menu." },
              ].map((x) => (
                <div key={x.k} className="bg-background p-4">
                  <div className="text-[12px] font-medium text-muted-foreground">{x.k}</div>
                  <div className="mt-1 font-mono text-[13px] font-medium">{x.n}</div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{x.d}</p>
                </div>
              ))}
            </div>
            <pre className="overflow-x-auto border-t bg-editor p-4 font-mono text-[12.5px] leading-relaxed">{`// tools/call result from convert_pdf
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
}`}</pre>
            <p className="border-t px-4 py-2.5 text-[12px] text-muted-foreground">Illustrative design, not a published server. Names like <code className="font-mono">pdf://</code> are examples.</p>
          </section>

          <h2 className="mb-2 mt-12 text-[24px] font-semibold tracking-[-0.02em]">FAQ</h2>
          <Faq items={FAQ} />

          <div className="mt-10 rounded-2xl border p-5 text-[14px]">
            <div className="font-medium">Spec references (2026-07-28)</div>
            <ul className="mt-2 space-y-1.5">
              {[["Server features overview", L.server], ["Tools", L.tools], ["Resources", L.resources], ["Prompts", L.prompts]].map(([t, h]) => (
                <li key={h}><a href={h} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline decoration-border underline-offset-4 hover:decoration-foreground">{t}<ArrowUpRight className="size-3.5" aria-hidden /></a></li>
              ))}
            </ul>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
