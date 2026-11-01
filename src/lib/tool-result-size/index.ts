import { sortFindings, type Finding } from "../common/finding";

export const REF = {
  claudeCodeMcp: "https://code.claude.com/docs/en/mcp",
  tools: "https://modelcontextprotocol.io/specification/2026-07-28/server/tools",
  pagination: "https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/pagination",
  tokenCounting: "https://docs.claude.com/en/docs/build-with-claude/token-counting",
} as const;

/** Limits documented for Claude Code at code.claude.com/docs/en/mcp. */
export const LIMITS = {
  warnTokens: 10_000,
  defaultMaxTokens: 25_000,
  textCharsToFile: 50_000,
  hardCeilingChars: 500_000,
  errorTruncateAboveChars: 11_000,
  errorKeepChars: 5_000,
} as const;

export interface SizeStats {
  chars: number;
  bytes: number;
  lines: number;
  approxTokens: number;
  cjkChars: number;
}

export interface JsonInsight {
  valid: boolean;
  error?: string;
  minifiedChars?: number;
  largestArrays: { path: string; length: number }[];
  longStrings: { path: string; length: number; base64: boolean }[];
  nullish: number;
  maxDepth: number;
  mcp?: {
    blocks: Record<string, number>;
    isError: boolean;
    hasStructured: boolean;
    duplicatedStructured: boolean;
    /** Characters of text the model would see (text blocks). */
    textChars: number;
    imageBase64Chars: number;
  };
}

export interface SizeReport {
  stats: SizeStats;
  /** Stats of what a client counts as the result text (MCP text blocks, else the whole input). */
  counted: SizeStats;
  kind: "empty" | "text" | "json" | "mcp";
  json?: JsonInsight;
  findings: Finding[];
}

const CJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/u;

/**
 * Rough token estimate. Not a real tokenizer: about one token per CJK
 * character, about 4 characters per token for English prose and about 3
 * for JSON or code, which tokenizes denser.
 */
export function estimateTokens(text: string, dense = false): number {
  let cjk = 0, other = 0;
  for (const ch of text) CJK.test(ch) ? cjk++ : other++;
  return Math.ceil(cjk + other / (dense ? 3 : 4));
}

export function sizeStats(text: string, dense = false): SizeStats {
  let cjk = 0, chars = 0;
  for (const ch of text) { chars++; if (CJK.test(ch)) cjk++; }
  return {
    chars,
    bytes: new TextEncoder().encode(text).length,
    lines: text ? text.split(/\r\n|\r|\n/).length : 0,
    approxTokens: estimateTokens(text, dense),
    cjkChars: cjk,
  };
}

const BASE64 = /^(data:[^;]+;base64,)?[A-Za-z0-9+/=\r\n]+$/;

function walk(v: unknown, path: string, depth: number, j: JsonInsight) {
  j.maxDepth = Math.max(j.maxDepth, depth);
  if (v === null || v === "") { j.nullish++; return; }
  if (Array.isArray(v)) {
    j.largestArrays.push({ path: path || "$", length: v.length });
    if (v.length === 0) j.nullish++;
    v.forEach((x, i) => walk(x, `${path}[${i}]`, depth + 1, j));
    return;
  }
  if (typeof v === "object") {
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) walk(x, path ? `${path}.${k}` : k, depth + 1, j);
    return;
  }
  if (typeof v === "string" && v.length >= 1000) j.longStrings.push({ path: path || "$", length: v.length, base64: v.length > 200 && BASE64.test(v.slice(0, 4000)) });
}

function inspectJson(text: string): JsonInsight {
  const j: JsonInsight = { valid: false, largestArrays: [], longStrings: [], nullish: 0, maxDepth: 0 };
  let v: unknown;
  try { v = JSON.parse(text); } catch (e) { j.error = (e as Error).message; return j; }
  j.valid = true;
  j.minifiedChars = [...JSON.stringify(v)].length;
  walk(v, "", 0, j);
  j.largestArrays = j.largestArrays.filter((a) => a.length > 0).sort((a, b) => b.length - a.length).slice(0, 5);
  j.longStrings.sort((a, b) => b.length - a.length).splice(5);

  const o = v as Record<string, unknown>;
  if (o && typeof o === "object" && !Array.isArray(o)) {
    const r = (o.result && typeof o.result === "object" && Array.isArray((o.result as Record<string, unknown>).content) ? o.result : o) as Record<string, unknown>;
    if (Array.isArray(r.content) && r.content.every((b) => b && typeof b === "object" && typeof (b as { type?: unknown }).type === "string")) {
      const blocks: Record<string, number> = {};
      let textChars = 0, img = 0;
      const texts: string[] = [];
      for (const b of r.content as Record<string, unknown>[]) {
        const t = String(b.type);
        blocks[t] = (blocks[t] ?? 0) + 1;
        if (t === "text" && typeof b.text === "string") { textChars += [...b.text].length; texts.push(b.text); }
        if ((t === "image" || t === "audio") && typeof b.data === "string") img += b.data.length;
      }
      let dup = false;
      if (r.structuredContent !== undefined) {
        const s = JSON.stringify(r.structuredContent);
        dup = texts.some((t) => { try { return JSON.stringify(JSON.parse(t)) === s; } catch { return false; } });
      }
      j.mcp = { blocks, isError: r.isError === true, hasStructured: r.structuredContent !== undefined, duplicatedStructured: dup, textChars, imageBase64Chars: img };
    }
  }
  return j;
}

export function analyzeToolResult(text: string, opts: { isError?: boolean } = {}): SizeReport {
  const f: Finding[] = [];
  if (!text.trim()) {
    const z = sizeStats("");
    return { stats: z, counted: z, kind: "empty", findings: [] };
  }
  const looksJson = /^\s*[[{]/.test(text);
  const json = looksJson ? inspectJson(text) : undefined;
  const stats = sizeStats(text, !!json?.valid);
  let counted = stats;
  let kind: SizeReport["kind"] = json?.valid ? "json" : "text";
  let isError = !!opts.isError;

  if (json?.mcp) {
    kind = "mcp";
    isError = isError || json.mcp.isError;
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const r = (parsed.result ?? parsed) as { content: { type: string; text?: string }[] };
    const joined = r.content.filter((b) => b.type === "text" && typeof b.text === "string").map((b) => b.text!).join("\n");
    counted = sizeStats(joined, /^\s*[[{]/.test(joined));
  }
  if (json && !json.valid)
    f.push({ rule: "JSON_INVALID", severity: "tip", message: `This looks like JSON but does not parse (${json.error}). Sizes are measured as plain text.` });

  const c = counted;
  if (c.chars > LIMITS.hardCeilingChars)
    f.push({ rule: "OVER_HARD_CEILING", severity: "error", message: `${c.chars.toLocaleString("en-US")} characters is above Claude Code's hard ceiling of 500,000 characters for text results, even with \`anthropic/maxResultSizeChars\`.`, fix: "Paginate or return a resource link instead of the full content.", ref: REF.claudeCodeMcp });
  else if (c.chars > LIMITS.textCharsToFile)
    f.push({ rule: "OVER_TEXT_CHAR_LIMIT", severity: "warning", message: `${c.chars.toLocaleString("en-US")} characters is above 50,000. Claude Code saves text results this large to a file and gives the model a file path instead of the content.`, fix: "Return less, or declare `_meta[\"anthropic/maxResultSizeChars\"]` on the tool in tools/list (up to 500,000) if the model really needs it inline.", ref: REF.claudeCodeMcp });

  if (c.approxTokens > LIMITS.defaultMaxTokens)
    f.push({ rule: "OVER_DEFAULT_TOKEN_LIMIT", severity: "warning", message: `About ${c.approxTokens.toLocaleString("en-US")} tokens (estimate) is over Claude Code's default limit of 25,000 tokens for MCP output.`, fix: "Users can raise it with MAX_MCP_OUTPUT_TOKENS, but most won't. Paginate or trim the result.", ref: REF.claudeCodeMcp });
  else if (c.approxTokens > LIMITS.warnTokens)
    f.push({ rule: "OVER_WARNING_TOKENS", severity: "tip", message: `About ${c.approxTokens.toLocaleString("en-US")} tokens (estimate). Claude Code shows a warning above 10,000 tokens of MCP output.`, ref: REF.claudeCodeMcp });

  if (isError && c.chars > LIMITS.errorTruncateAboveChars)
    f.push({ rule: "ERROR_RESULT_TRUNCATED", severity: "warning", message: `Error results (\`isError: true\`) over about 11,000 characters keep only the first and last 5,000 characters in Claude Code. The middle ${Math.max(0, c.chars - 10_000).toLocaleString("en-US")} characters are dropped.`, fix: "Put the important part of the error message at the start, and leave stack traces and dumps out.", ref: REF.claudeCodeMcp });

  if (json?.valid) {
    const saved = stats.chars - (json.minifiedChars ?? stats.chars);
    if (saved > 200 && saved / stats.chars > 0.1)
      f.push({ rule: "JSON_PRETTY_PRINTED", severity: "tip", message: `Whitespace is ${Math.round((saved / stats.chars) * 100)}% of this JSON. Minifying saves about ${saved.toLocaleString("en-US")} characters.`, fix: "Serialize with `JSON.stringify(value)` instead of `JSON.stringify(value, null, 2)`." });
    const big = json.largestArrays.find((a) => a.length > 50);
    if (big)
      f.push({ rule: "JSON_LARGE_ARRAY", severity: "tip", message: `\`${big.path}\` has ${big.length.toLocaleString("en-US")} items. Long lists are the most common cause of oversized results.`, fix: "Add `limit` and `cursor` arguments and return a `nextCursor`, as MCP's own list methods do.", ref: REF.pagination });
    for (const s of json.longStrings.filter((s) => s.base64).slice(0, 2))
      f.push({ rule: "JSON_BASE64_BLOB", severity: "warning", message: `\`${s.path}\` holds ${s.length.toLocaleString("en-US")} characters of what looks like base64 data. As text, it costs tokens and tells the model nothing.`, fix: "Return a `resource_link` content block pointing at the file, or a proper `image` block if the model should see it.", ref: REF.tools });
    if (json.nullish >= 20)
      f.push({ rule: "JSON_NULLISH_FIELDS", severity: "tip", message: `${json.nullish} null, empty-string or empty-array values. Dropping them shrinks the result without losing information.` });
  }
  if (json?.mcp?.duplicatedStructured)
    f.push({ rule: "MCP_STRUCTURED_DUPLICATE", severity: "tip", message: "A text block repeats `structuredContent` as JSON. The MCP spec recommends this for backward compatibility, but it roughly doubles the size on the wire.", fix: "Keep it for compatibility. Shrink the structured object itself to make both smaller.", ref: REF.tools });
  if (!json?.mcp && kind === "text" && c.chars > LIMITS.textCharsToFile)
    f.push({ rule: "TEXT_TRUNCATE", severity: "tip", message: "For long text such as logs or files, return the first part plus a note like \"truncated, call again with offset=N\".", ref: REF.tools });

  return { stats, counted, kind, json, findings: sortFindings(f) };
}
