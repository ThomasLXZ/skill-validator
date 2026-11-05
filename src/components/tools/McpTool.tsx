"use client";

import { useMemo, useState } from "react";
import { Hammer, ListTree, Terminal } from "lucide-react";
import { buildMcpCurl, generateMcpConfig, inspectMcpTools, sampleFromSchema, validateMcpConfig } from "@/lib/mcp";
import {
  CopyButtons, Editor, Field, FindingsList, GhostButton, inputCls, LocalNote, PaneHeader, SectionTitle, SeverityCounts,
  Segmented, Tabs, ToolCard, Toolbar,
} from "./ui";
import { cn } from "@/lib/cn";

type Tab = "inspect" | "curl" | "config";

const SAMPLE_TOOLS = `{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "search_docs",
        "description": "Search product documentation by keyword.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "q": { "type": "string", "description": "Query" },
            "limit": { "type": "integer" }
          },
          "required": ["q"]
        }
      },
      { "name": "search docs", "description": "" }
    ]
  }
}`;

const SAMPLE_CONFIG = `{
  "mcpServers": {
    "docs": { "command": "npx", "args": ["-y", "@example/docs-mcp"] },
    "legacy": { "type": "sse", "url": "http://127.0.0.1:3000/sse" }
  }
}`;

export default function McpTool() {
  const [tab, setTab] = useState<Tab>("inspect");
  const [toolsText, setToolsText] = useState(SAMPLE_TOOLS);
  const [url, setUrl] = useState("http://127.0.0.1:8080/mcp");
  const [auth, setAuth] = useState(false);
  const [toolName, setToolName] = useState("search_docs");
  const [toolArgs, setToolArgs] = useState('{\n  "q": ""\n}');
  const [genMode, setGenMode] = useState<"build" | "check">("build");
  const [name, setName] = useState("docs");
  const [transport, setTransport] = useState<"stdio" | "http">("stdio");
  const [command, setCommand] = useState("npx");
  const [args, setArgs] = useState("-y @example/docs-mcp");
  const [env, setEnv] = useState("DOCS_TOKEN=");
  const [remote, setRemote] = useState("https://example.com/mcp");
  const [configText, setConfigText] = useState(SAMPLE_CONFIG);

  const inspected = useMemo(() => inspectMcpTools(toolsText), [toolsText]);
  const argsError = useMemo(() => {
    if (!toolArgs.trim()) return "";
    try { JSON.parse(toolArgs); return ""; } catch (e) { return (e as Error).message; }
  }, [toolArgs]);
  const curls = useMemo(() => {
    let toolArguments: unknown = {};
    if (toolArgs.trim()) {
      try { toolArguments = JSON.parse(toolArgs); } catch { toolArguments = {}; }
    }
    return buildMcpCurl({ url, auth, toolName: toolName.trim() || undefined, toolArguments });
  }, [url, auth, toolName, toolArgs]);
  const generated = useMemo(
    () => generateMcpConfig({ name, transport, command, args, env, url: remote }),
    [name, transport, command, args, env, remote],
  );
  const checked = useMemo(() => validateMcpConfig(configText), [configText]);

  const useTool = (n: string, schema: unknown) => {
    setToolName(n);
    setToolArgs(JSON.stringify(sampleFromSchema(schema), null, 2));
    setTab("curl");
  };

  return (
    <ToolCard id="mcp-tool">
      <Toolbar>
        <Tabs<Tab>
          label="MCP mode"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "inspect", label: "Inspector", Icon: ListTree },
            { id: "curl", label: "Test curl", Icon: Terminal },
            { id: "config", label: "Config", Icon: Hammer },
          ]}
        />
        <span className="hidden text-[12.5px] text-muted-foreground md:block">Runs locally. Curl is copied, not sent.</span>
      </Toolbar>

      {tab === "inspect" && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div className="flex min-h-[420px] flex-col border-b lg:h-[680px] lg:border-b-0 lg:border-r">
            <PaneHeader title="tools/list JSON">
              <GhostButton onClick={() => setToolsText(SAMPLE_TOOLS)}>Example</GhostButton>
              <GhostButton onClick={() => setToolsText("")}>Clear</GhostButton>
            </PaneHeader>
            <div className="h-[420px] min-h-0 flex-1 lg:h-auto">
              <Editor language="plain" value={toolsText} onChange={setToolsText} diagnostics={[]} ariaLabel="MCP tools JSON" placeholderText='{"tools":[{"name":"ping","description":"Health check","inputSchema":{"type":"object","properties":{}}}]}' />
            </div>
          </div>
          <div className="output min-h-[320px] p-4 sm:p-5 lg:h-[680px] lg:overflow-y-auto" aria-live="polite">
            <SeverityCounts findings={inspected.findings} />
            <div className="mt-3"><FindingsList findings={inspected.findings} empty="Tool list matches the checks on this page." /></div>
            {inspected.tools.length > 0 && (
              <>
                <SectionTitle count={inspected.tools.length}>Tools</SectionTitle>
                <ul className="flex flex-col gap-2">
                  {inspected.tools.map((t, i) => (
                    <li key={`${t.name}-${i}`} className="rounded-xl border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <code className="font-mono text-[13px] font-medium">{t.name || "(unnamed)"}</code>
                        <GhostButton onClick={() => useTool(t.name, t.inputSchema)}>curl</GhostButton>
                      </div>
                      {t.description && <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{t.description}</p>}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {tab === "curl" && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="space-y-4 border-b p-4 sm:p-5 lg:h-[680px] lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <Field label="Server URL" hint="Streamable HTTP endpoint. Nothing is requested from this page.">
              <input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} spellCheck={false} aria-label="MCP server URL" />
            </Field>
            <Field label="Tool name" hint="Optional. Adds a tools/call step.">
              <input className={inputCls} value={toolName} onChange={(e) => setToolName(e.target.value)} spellCheck={false} />
            </Field>
            <Field label="Tool arguments" hint="JSON object. The inspector can fill this from inputSchema.">
              <textarea className={cn(inputCls, "min-h-[120px] font-mono text-[12.5px]")} value={toolArgs} onChange={(e) => setToolArgs(e.target.value)} spellCheck={false} />
            </Field>
            {argsError && <p className="text-[12.5px] text-error">Arguments are not valid JSON ({argsError}). The call step sends {"{}"} until this parses.</p>}
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={auth} onChange={(e) => setAuth(e.target.checked)} className="size-3.5 accent-current" />
              Add <code className="font-mono text-[12px]">Authorization: Bearer $MCP_TOKEN</code>
            </label>
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">The token stays in your shell. This page never asks you to paste it.</p>
            {curls.findings.length > 0 && <FindingsList findings={curls.findings} />}
          </div>
          <div className="min-h-[360px] lg:h-[680px] lg:overflow-y-auto">
            {curls.steps.map((s) => (
              <section key={s.id} className="border-b last:border-b-0">
                <PaneHeader title={<span className="font-mono text-[12.5px]">{s.title}</span>}>
                  <CopyButtons text={s.curl} filename={`${s.id}.sh`} />
                </PaneHeader>
                <p className="px-4 pt-3 text-[12.5px] leading-relaxed text-muted-foreground">{s.note}</p>
                <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed">{s.curl}</pre>
              </section>
            ))}
          </div>
        </div>
      )}

      {tab === "config" && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-4 border-b p-4 sm:p-5 lg:h-[680px] lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <Segmented<"build" | "check"> options={[{ id: "build", label: "Generate" }, { id: "check", label: "Check JSON" }]} value={genMode} onChange={setGenMode} />
            {genMode === "build" ? (
              <>
                <Field label="Server name">
                  <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Transport">
                  <Segmented<"stdio" | "http"> options={[{ id: "stdio", label: "stdio" }, { id: "http", label: "HTTP" }]} value={transport} onChange={setTransport} />
                </Field>
                {transport === "stdio" ? (
                  <>
                    <Field label="Command"><input className={cn(inputCls, "font-mono")} value={command} onChange={(e) => setCommand(e.target.value)} /></Field>
                    <Field label="Arguments" hint="Split on whitespace."><input className={cn(inputCls, "font-mono")} value={args} onChange={(e) => setArgs(e.target.value)} /></Field>
                    <Field label="Environment" hint="One KEY=value per line. Leave the value empty to fill it in locally.">
                      <textarea className={cn(inputCls, "min-h-[72px] font-mono text-[12.5px]")} value={env} onChange={(e) => setEnv(e.target.value)} />
                    </Field>
                  </>
                ) : (
                  <Field label="URL"><input className={cn(inputCls, "font-mono")} value={remote} onChange={(e) => setRemote(e.target.value)} spellCheck={false} /></Field>
                )}
                {generated.findings.length > 0 && <FindingsList findings={generated.findings} />}
              </>
            ) : (
              <textarea aria-label="MCP config JSON" className={cn(inputCls, "min-h-[280px] font-mono text-[12.5px]")} value={configText} onChange={(e) => setConfigText(e.target.value)} spellCheck={false} />
            )}
          </div>
          <div className="min-h-[360px] lg:h-[680px] lg:overflow-y-auto">
            {genMode === "build" ? (
              <>
                <ConfigBlock title="Claude Desktop and Cursor — mcpServers" filename="mcp.json" text={generated.claude} note="Same mcpServers shape. Claude Desktop reads claude_desktop_config.json; Cursor reads ~/.cursor/mcp.json or the project .cursor/mcp.json." />
                <ConfigBlock title="VS Code — servers" filename="mcp.json" text={generated.vscode} note="Project file .vscode/mcp.json. The key is servers, and each entry has type stdio or http." />
              </>
            ) : (
              <div className="p-4 sm:p-5">
                <SeverityCounts findings={checked.findings} />
                <div className="mt-3"><FindingsList findings={checked.findings} empty="Config has a command or url for every server." /></div>
                {checked.servers.length > 0 && (
                  <ul className="mt-4 divide-y rounded-xl border text-[13px]">
                    {checked.servers.map((s) => (
                      <li key={s.name} className="flex items-center justify-between px-3 py-2">
                        <span className="font-medium">{s.name}</span>
                        <code className="font-mono text-[12px] text-muted-foreground">{s.transport}</code>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <LocalNote>Checked locally. Curl is generated for you to run; this page does not call the server.</LocalNote>
    </ToolCard>
  );
}

function ConfigBlock({ title, text, filename, note }: { title: string; text: string; filename: string; note: string }) {
  return (
    <section className="border-b last:border-b-0">
      <PaneHeader title={title}><CopyButtons text={text} filename={filename} /></PaneHeader>
      <p className="px-4 pt-3 text-[12.5px] leading-relaxed text-muted-foreground">{note}</p>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed">{text}</pre>
    </section>
  );
}
