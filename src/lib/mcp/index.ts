import { sortFindings, type Finding } from "../common/finding";

/**
 * Browser-side MCP helpers: tool-list checks, a Streamable HTTP curl script,
 * and client config snippets. Nothing here opens a network connection.
 * Protocol version 2025-06-18 is the handshake string Streamable HTTP servers expect.
 */
export const MCP_PROTOCOL = "2025-06-18";

export const REF = {
  tools: "https://modelcontextprotocol.io/specification/2025-06-18/server/tools",
  transports: "https://modelcontextprotocol.io/specification/2025-06-18/basic/transports",
  lifecycle: "https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle",
  specOverview: "https://modelcontextprotocol.io/specification/2026-07-28/server",
} as const;

const TOOL_NAME = /^[a-zA-Z0-9_-]{1,64}$/;

export interface McpTool {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
}

export interface InspectReport {
  ok: boolean;
  tools: McpTool[];
  findings: Finding[];
}

export interface CurlStep {
  id: string;
  title: string;
  note: string;
  curl: string;
}

export interface McpGenInput {
  name: string;
  transport: "stdio" | "http";
  command: string;
  args: string;
  env: string;
  url: string;
}

export interface GeneratedConfig {
  claude: string;
  cursor: string;
  vscode: string;
  findings: Finding[];
}

function finding(rule: string, severity: Finding["severity"], message: string, fix?: string, ref?: string): Finding {
  return { rule, severity, message, fix, ref };
}

export function shSingle(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

export function parseArgs(text: string): string[] {
  return text.trim() ? text.trim().split(/\s+/) : [];
}

export function parseEnvLines(text: string): { env: Record<string, string>; findings: Finding[] } {
  const env: Record<string, string> = {};
  const findings: Finding[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) {
      findings.push(finding("MCP_ENV_LINE", "warning", `Env line "${line}" is not KEY=value.`));
      continue;
    }
    env[line.slice(0, eq).trim()] = line.slice(eq + 1);
  }
  return { env, findings };
}

function isHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function inspectMcpTools(text: string): InspectReport {
  if (!text.trim()) {
    return { ok: false, tools: [], findings: [finding("MCP_EMPTY", "error", "Paste a tools/list result, a tools array, or one tool object.")] };
  }
  let value: unknown;
  try { value = JSON.parse(text); } catch (e) {
    return { ok: false, tools: [], findings: [finding("MCP_JSON", "error", `Not valid JSON (${(e as Error).message}).`)] };
  }
  const findings: Finding[] = [];
  const list = extractList(value, findings);
  if (!list) return { ok: false, tools: [], findings };
  const tools: McpTool[] = [];
  const names = new Map<string, number>();
  list.forEach((item, i) => {
    const path = `tools[${i}]`;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      findings.push(finding("MCP_TOOL_SHAPE", "error", `${path} is not an object.`));
      return;
    }
    const t = item as Record<string, unknown>;
    const name = typeof t.name === "string" ? t.name : "";
    if (!name) findings.push(finding("MCP_TOOL_NAME", "error", `${path} is missing a name.`, undefined, REF.tools));
    else if (!TOOL_NAME.test(name)) {
      findings.push(finding("MCP_TOOL_NAME", "warning", `${path} name "${name}" should match ${TOOL_NAME.source} (1–64 letters, numbers, underscores, hyphens).`, "Rename the tool. Spaces and dots surprise clients.", REF.tools));
    }
    if (name) names.set(name, (names.get(name) ?? 0) + 1);
    if (typeof t.description !== "string" || !t.description.trim()) {
      findings.push(finding("MCP_TOOL_DESCRIPTION", "tip", `${path} (${name || "unnamed"}) has no description. Models choose tools from the description.`, undefined, REF.tools));
    }
    let inputSchema: Record<string, unknown> | undefined;
    if (t.inputSchema === undefined) {
      findings.push(finding("MCP_INPUT_SCHEMA", "warning", `${path} (${name || "unnamed"}) has no inputSchema.`, "Use a JSON Schema object, usually { \"type\": \"object\", \"properties\": {}, \"additionalProperties\": false }.", REF.tools));
    } else if (!t.inputSchema || typeof t.inputSchema !== "object" || Array.isArray(t.inputSchema)) {
      findings.push(finding("MCP_INPUT_SCHEMA", "error", `${path} inputSchema must be a JSON Schema object.`, undefined, REF.tools));
    } else {
      inputSchema = t.inputSchema as Record<string, unknown>;
      if (inputSchema.type !== undefined && inputSchema.type !== "object") {
        findings.push(finding("MCP_INPUT_SCHEMA_TYPE", "warning", `${path} inputSchema.type is ${JSON.stringify(inputSchema.type)}. Tool arguments are an object.`, undefined, REF.tools));
      }
      const props = inputSchema.properties;
      if (Array.isArray(inputSchema.required) && props && typeof props === "object" && !Array.isArray(props)) {
        for (const r of inputSchema.required) {
          if (typeof r === "string" && !Object.prototype.hasOwnProperty.call(props, r)) {
            findings.push(finding("MCP_REQUIRED_UNKNOWN", "warning", `${path} required argument "${r}" is not in inputSchema.properties.`));
          }
        }
      }
    }
    if (t.annotations !== undefined && (typeof t.annotations !== "object" || t.annotations === null || Array.isArray(t.annotations))) {
      findings.push(finding("MCP_ANNOTATIONS", "warning", `${path} annotations should be an object.`, undefined, REF.tools));
    }
    tools.push({ name, description: typeof t.description === "string" ? t.description : "", inputSchema });
  });
  for (const [name, n] of names) {
    if (n > 1) findings.push(finding("MCP_TOOL_DUPLICATE", "error", `Tool name "${name}" appears ${n} times.`));
  }
  if (!tools.length && !findings.some((f) => f.rule === "MCP_NO_TOOLS")) {
    findings.push(finding("MCP_NO_TOOLS", "warning", "The tool list is empty."));
  }
  return { ok: !findings.some((f) => f.severity === "error"), tools, findings: sortFindings(findings) };
}

function extractList(value: unknown, findings: Finding[]): unknown[] | undefined {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") {
    findings.push(finding("MCP_NO_TOOLS", "error", "Expected a tools array, a tools/list result, or one tool object."));
    return;
  }
  const o = value as Record<string, unknown>;
  if (Array.isArray(o.tools)) return o.tools;
  const result = o.result;
  if (result && typeof result === "object" && Array.isArray((result as { tools?: unknown }).tools)) return (result as { tools: unknown[] }).tools;
  if (typeof o.name === "string") return [value];
  findings.push(finding("MCP_NO_TOOLS", "error", "No tools array found. Paste a tools/list JSON-RPC result, { \"tools\": [...] }, or a single tool."));
  return;
}

/** Fill a dummy arguments object from an inputSchema so a curl example is runnable. */
export function sampleFromSchema(schema: unknown): unknown {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) return {};
  const s = schema as Record<string, unknown>;
  if (Array.isArray(s.enum) && s.enum.length) return s.enum[0];
  if (Array.isArray(s.anyOf) && s.anyOf.length) return sampleFromSchema(s.anyOf[0]);
  const type = s.type;
  const types = Array.isArray(type) ? type : type ? [type] : [];
  const prefer = types.find((t) => t !== "null") ?? types[0];
  if (prefer === "object" || s.properties) {
    const props = s.properties && typeof s.properties === "object" && !Array.isArray(s.properties) ? s.properties as Record<string, unknown> : {};
    const req = Array.isArray(s.required) ? s.required.filter((x): x is string => typeof x === "string") : Object.keys(props);
    const o: Record<string, unknown> = {};
    for (const k of req) o[k] = sampleFromSchema(props[k]);
    return o;
  }
  if (prefer === "string") return "";
  if (prefer === "integer" || prefer === "number") return 0;
  if (prefer === "boolean") return false;
  if (prefer === "array") return [];
  if (prefer === "null") return null;
  return {};
}

export function buildMcpCurl(opts: { url: string; auth?: boolean; toolName?: string; toolArguments?: unknown; protocol?: string }): { steps: CurlStep[]; findings: Finding[] } {
  const protocol = opts.protocol?.trim() || MCP_PROTOCOL;
  const url = opts.url.trim();
  const findings: Finding[] = [];
  const target = url || "http://127.0.0.1:3000/mcp";
  if (!url) findings.push(finding("MCP_URL_DEFAULT", "warning", "No URL given. The curls use http://127.0.0.1:3000/mcp."));
  else if (!isHttpUrl(url)) findings.push(finding("MCP_URL", "error", `URL "${url}" must be an http or https URL.`));
  const headers = [
    "-H 'Content-Type: application/json'",
    "-H 'Accept: application/json, text/event-stream'",
    `-H 'MCP-Protocol-Version: ${protocol}'`,
  ];
  if (opts.auth) headers.push("-H 'Authorization: Bearer $MCP_TOKEN'");
  const session = "-H 'Mcp-Session-Id: $MCP_SESSION_ID'";
  const post = (body: unknown, withSession: boolean) => {
    const h = [...headers];
    if (withSession) h.push(session);
    return `curl -sS -D - ${shSingle(target)} \\\n  ${h.join(" \\\n  ")} \\\n  --data-raw ${shSingle(JSON.stringify(body))}`;
  };
  const steps: CurlStep[] = [
    {
      id: "initialize",
      title: "initialize",
      note: "First response headers may include mcp-session-id. Export it as MCP_SESSION_ID. Stateless servers omit it — drop the session header on the next calls if so.",
      curl: post({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: protocol, capabilities: {}, clientInfo: { name: "skill-validator", version: "0.1.0" } },
      }, false),
    },
    {
      id: "initialized",
      title: "notifications/initialized",
      note: "Notification, so there is no id and often no JSON body back. Send it after initialize.",
      curl: post({ jsonrpc: "2.0", method: "notifications/initialized" }, true),
    },
    {
      id: "tools-list",
      title: "tools/list",
      note: "Lists tools the server is offering. Paste the JSON here into the inspector.",
      curl: post({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, true),
    },
  ];
  if (opts.toolName?.trim()) {
    steps.push({
      id: "tools-call",
      title: `tools/call ${opts.toolName.trim()}`,
      note: "Arguments are a sample from the tool's inputSchema when the inspector built them. Replace the placeholders before you run it.",
      curl: post({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: opts.toolName.trim(), arguments: opts.toolArguments ?? {} },
      }, true),
    });
  }
  return { steps, findings };
}

export function generateMcpConfig(input: McpGenInput): GeneratedConfig {
  const findings: Finding[] = [];
  const name = input.name.trim();
  if (!name) findings.push(finding("MCP_NAME", "error", "Server name is required."));
  else if (!/^[A-Za-z0-9._-]+$/.test(name)) findings.push(finding("MCP_NAME", "warning", "Server name has characters some clients dislike. Prefer letters, numbers, dots, underscores, and hyphens."));
  const { env, findings: envFindings } = parseEnvLines(input.env);
  findings.push(...envFindings);
  const key = name || "server";
  let entry: Record<string, unknown>;
  let vscode: Record<string, unknown>;
  if (input.transport === "http") {
    const url = input.url.trim();
    if (!url) findings.push(finding("MCP_URL", "error", "HTTP transport needs a server URL."));
    else if (!isHttpUrl(url)) findings.push(finding("MCP_URL", "error", `URL "${url}" must start with http:// or https://.`));
    entry = { url: url || "https://example.com/mcp" };
    vscode = { type: "http", url: url || "https://example.com/mcp" };
  } else {
    const command = input.command.trim();
    if (!command) findings.push(finding("MCP_COMMAND", "error", "stdio transport needs a command, for example npx or uvx."));
    const args = parseArgs(input.args);
    entry = { command: command || "npx", ...(args.length ? { args } : {}), ...(Object.keys(env).length ? { env } : {}) };
    vscode = { type: "stdio", command: command || "npx", ...(args.length ? { args } : {}), ...(Object.keys(env).length ? { env } : {}) };
  }
  const claude = JSON.stringify({ mcpServers: { [key]: entry } }, null, 2);
  return {
    claude,
    cursor: claude,
    vscode: JSON.stringify({ servers: { [key]: vscode } }, null, 2),
    findings: sortFindings(findings),
  };
}

export interface ConfigServer {
  name: string;
  transport: "stdio" | "http" | "sse" | "unknown";
}

export interface ConfigReport {
  ok: boolean;
  servers: ConfigServer[];
  findings: Finding[];
}

export function validateMcpConfig(text: string): ConfigReport {
  if (!text.trim()) return { ok: false, servers: [], findings: [finding("MCP_EMPTY", "error", "Paste an MCP config JSON.")] };
  let value: unknown;
  try { value = JSON.parse(text); } catch (e) {
    return { ok: false, servers: [], findings: [finding("MCP_JSON", "error", `Not valid JSON (${(e as Error).message}).`)] };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, servers: [], findings: [finding("MCP_CONFIG_SHAPE", "error", "Config must be a JSON object.")] };
  }
  const o = value as Record<string, unknown>;
  const bag = (o.mcpServers && typeof o.mcpServers === "object" ? o.mcpServers : null)
    ?? (o.servers && typeof o.servers === "object" ? o.servers : null);
  const keyName = o.mcpServers ? "mcpServers" : o.servers ? "servers" : "";
  if (!bag || Array.isArray(bag)) {
    return { ok: false, servers: [], findings: [finding("MCP_CONFIG_SHAPE", "error", "Expected mcpServers (Claude Desktop, Cursor) or servers (VS Code).", "Use { \"mcpServers\": { \"name\": { \"command\": \"npx\", \"args\": [] } } }.")] };
  }
  const findings: Finding[] = [];
  const servers: ConfigServer[] = [];
  for (const [name, raw] of Object.entries(bag as Record<string, unknown>)) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      findings.push(finding("MCP_SERVER_SHAPE", "error", `${keyName}.${name} must be an object.`));
      continue;
    }
    const s = raw as Record<string, unknown>;
    const hasCommand = typeof s.command === "string" && s.command.trim();
    const hasUrl = typeof s.url === "string" && s.url.trim();
    let transport: ConfigServer["transport"] = "unknown";
    if (s.type === "sse" || (typeof s.url === "string" && /\/sse\/?$/.test(s.url))) transport = "sse";
    else if (hasUrl) transport = "http";
    else if (hasCommand) transport = "stdio";
    if (!hasCommand && !hasUrl) findings.push(finding("MCP_SERVER_TRANSPORT", "error", `${name} needs a command (stdio) or a url (HTTP).`));
    if (hasUrl && !isHttpUrl(String(s.url))) findings.push(finding("MCP_URL", "error", `${name} url "${String(s.url)}" must be http or https.`));
    if (s.args !== undefined && (!Array.isArray(s.args) || s.args.some((a) => typeof a !== "string"))) {
      findings.push(finding("MCP_ARGS", "error", `${name} args must be an array of strings.`));
    }
    if (s.env !== undefined) {
      if (!s.env || typeof s.env !== "object" || Array.isArray(s.env)) findings.push(finding("MCP_ENV", "error", `${name} env must be an object of strings.`));
      else for (const [k, v] of Object.entries(s.env as Record<string, unknown>)) {
        if (typeof v !== "string") findings.push(finding("MCP_ENV", "error", `${name} env.${k} must be a string.`));
      }
    }
    if (transport === "sse" || s.type === "sse") {
      findings.push(finding("MCP_SSE_LEGACY", "warning", `${name} uses the older SSE transport. New servers should use Streamable HTTP (a url the client POSTs JSON-RPC to).`, undefined, REF.transports));
    }
    if (s.type !== undefined && !["stdio", "http", "sse"].includes(String(s.type))) {
      findings.push(finding("MCP_TYPE", "warning", `${name} type "${String(s.type)}" is not stdio, http, or sse.`));
    }
    servers.push({ name, transport });
  }
  if (!servers.length) findings.push(finding("MCP_NO_SERVERS", "warning", `${keyName} is empty.`));
  return { ok: !findings.some((f) => f.severity === "error"), servers, findings: sortFindings(findings) };
}
