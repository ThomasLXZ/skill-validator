import { describe, expect, it } from "vitest";
import { buildMcpCurl, generateMcpConfig, inspectMcpTools, sampleFromSchema, validateMcpConfig } from "@/lib/mcp";

const rules = (findings: { rule: string }[]) => findings.map((f) => f.rule);

const TOOLS = {
  jsonrpc: "2.0",
  id: 2,
  result: {
    tools: [
      {
        name: "search_docs",
        description: "Search documentation by keyword.",
        inputSchema: { type: "object", properties: { q: { type: "string" } }, required: ["q"] },
      },
      { name: "search docs", description: "", inputSchema: { type: "string" } },
      { name: "search_docs", description: "duplicate" },
    ],
  },
};

describe("tool inspector", () => {
  it("reads a tools/list envelope and flags name, schema, and duplicates", () => {
    const r = inspectMcpTools(JSON.stringify(TOOLS));
    expect(r.tools.map((t) => t.name)).toEqual(["search_docs", "search docs", "search_docs"]);
    expect(rules(r.findings)).toEqual(expect.arrayContaining(["MCP_TOOL_NAME", "MCP_INPUT_SCHEMA_TYPE", "MCP_TOOL_DESCRIPTION", "MCP_INPUT_SCHEMA", "MCP_TOOL_DUPLICATE"]));
    expect(r.ok).toBe(false);
  });
  it("accepts one well-formed tool object", () => {
    const r = inspectMcpTools(JSON.stringify({
      name: "ping",
      description: "Health check.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
    }));
    expect(r.ok).toBe(true);
    expect(r.findings).toEqual([]);
  });
});

describe("curl suite", () => {
  it("builds initialize, initialized, tools/list, and tools/call without embedding a token", () => {
    const { steps } = buildMcpCurl({
      url: "http://127.0.0.1:8080/mcp",
      auth: true,
      toolName: "search_docs",
      toolArguments: { q: "" },
    });
    expect(steps.map((s) => s.id)).toEqual(["initialize", "initialized", "tools-list", "tools-call"]);
    expect(steps[0].curl).toContain("initialize");
    expect(steps[0].curl).not.toContain("Mcp-Session-Id");
    expect(steps[1].curl).toContain("notifications/initialized");
    expect(steps[1].curl).toContain("Mcp-Session-Id: $MCP_SESSION_ID");
    expect(steps[2].curl).toContain("tools/list");
    expect(steps[2].curl).toContain("Accept: application/json, text/event-stream");
    expect(steps[2].curl).toContain("MCP-Protocol-Version: 2025-06-18");
    expect(steps[3].curl).toContain("search_docs");
    expect(steps.every((s) => s.curl.includes("Authorization: Bearer $MCP_TOKEN"))).toBe(true);
    expect(steps.every((s) => !s.curl.includes("sk-"))).toBe(true);
  });
  it("samples required arguments from an input schema", () => {
    expect(sampleFromSchema({
      type: "object",
      properties: { q: { type: "string" }, n: { type: "integer" }, mode: { type: "string", enum: ["and", "or"] } },
      required: ["q", "mode"],
    })).toEqual({ q: "", mode: "and" });
  });
});

describe("config generator", () => {
  it("emits Claude/Cursor mcpServers and a VS Code servers block", () => {
    const g = generateMcpConfig({ name: "docs", transport: "stdio", command: "npx", args: "-y @example/docs-mcp", env: "DOCS_TOKEN=\n# comment", url: "" });
    expect(g.findings.map((f) => f.rule)).not.toContain("MCP_COMMAND");
    const claude = JSON.parse(g.claude);
    expect(claude.mcpServers.docs).toEqual({ command: "npx", args: ["-y", "@example/docs-mcp"], env: { DOCS_TOKEN: "" } });
    expect(JSON.parse(g.cursor)).toEqual(claude);
    expect(JSON.parse(g.vscode).servers.docs.type).toBe("stdio");
  });
  it("writes an HTTP url and rejects a bad one", () => {
    const g = generateMcpConfig({ name: "remote", transport: "http", command: "", args: "", env: "", url: "https://example.com/mcp" });
    expect(JSON.parse(g.claude).mcpServers.remote).toEqual({ url: "https://example.com/mcp" });
    expect(JSON.parse(g.vscode).servers.remote).toEqual({ type: "http", url: "https://example.com/mcp" });
    const bad = generateMcpConfig({ name: "remote", transport: "http", command: "", args: "", env: "", url: "ftp://example.com" });
    expect(rules(bad.findings)).toContain("MCP_URL");
  });
  it("checks a pasted config for transport, args, and legacy sse", () => {
    const bad = validateMcpConfig(JSON.stringify({ mcpServers: { bare: {}, typed: { command: "npx", args: "nope" }, old: { type: "sse", url: "http://127.0.0.1:3000/sse" } } }));
    expect(rules(bad.findings)).toEqual(expect.arrayContaining(["MCP_SERVER_TRANSPORT", "MCP_ARGS", "MCP_SSE_LEGACY"]));
    const good = validateMcpConfig(JSON.stringify({ servers: { docs: { type: "http", url: "https://example.com/mcp" } } }));
    expect(good.ok).toBe(true);
    expect(good.servers).toEqual([{ name: "docs", transport: "http" }]);
  });
});
