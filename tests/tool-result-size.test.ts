import { describe, expect, it } from "vitest";
import { analyzeToolResult, estimateTokens, sizeStats } from "@/lib/tool-result-size";

const rules = (t: string, o?: { isError?: boolean }) => analyzeToolResult(t, o).findings.map((f) => f.rule);

describe("size stats", () => {
  it("counts characters, UTF-8 bytes and lines", () => {
    const s = sizeStats("héllo\n世界");
    expect(s).toMatchObject({ chars: 8, bytes: 13, lines: 2, cjkChars: 2 });
  });
  it("estimates CJK at about one token per character", () => {
    expect(estimateTokens("中文测试")).toBe(4);
    expect(estimateTokens("a".repeat(400))).toBe(100);
    expect(estimateTokens("a".repeat(300), true)).toBe(100);
  });
});

describe("limits (Claude Code MCP docs)", () => {
  it("is quiet for small results", () => {
    expect(rules("hello world")).toEqual([]);
  });
  it("warns above 10k estimated tokens and 25k tokens", () => {
    expect(rules("word ".repeat(9_000))).toContain("OVER_WARNING_TOKENS");
    expect(rules("word ".repeat(21_000))).toContain("OVER_DEFAULT_TOKEN_LIMIT");
  });
  it("flags text over 50,000 and 500,000 characters", () => {
    expect(rules("x".repeat(50_001))).toContain("OVER_TEXT_CHAR_LIMIT");
    expect(rules("x".repeat(500_001))).toContain("OVER_HARD_CEILING");
  });
  it("flags long error results that get truncated", () => {
    expect(rules("e".repeat(12_000), { isError: true })).toContain("ERROR_RESULT_TRUNCATED");
    expect(rules("e".repeat(12_000))).not.toContain("ERROR_RESULT_TRUNCATED");
  });
});

describe("JSON and MCP results", () => {
  it("detects pretty-printing, large arrays and nulls", () => {
    const v = { items: Array.from({ length: 120 }, (_, i) => ({ id: i, note: null, tags: [] })) };
    const r = rules(JSON.stringify(v, null, 2));
    expect(r).toEqual(expect.arrayContaining(["JSON_PRETTY_PRINTED", "JSON_LARGE_ARRAY", "JSON_NULLISH_FIELDS"]));
  });
  it("detects base64 blobs", () => {
    expect(rules(JSON.stringify({ file: "QUJD".repeat(2000) }))).toContain("JSON_BASE64_BLOB");
  });
  it("reads an MCP CallToolResult and counts only text blocks", () => {
    const res = { content: [{ type: "text", text: "abcd".repeat(10) }, { type: "image", data: "AAAA".repeat(100), mimeType: "image/png" }], isError: false };
    const r = analyzeToolResult(JSON.stringify(res));
    expect(r.kind).toBe("mcp");
    expect(r.counted.chars).toBe(40);
    expect(r.json?.mcp?.blocks).toEqual({ text: 1, image: 1 });
  });
  it("accepts a JSON-RPC envelope, isError, and structuredContent duplication", () => {
    const sc = { temperature: 22.5 };
    const res = { jsonrpc: "2.0", id: 1, result: { content: [{ type: "text", text: JSON.stringify(sc) }], structuredContent: sc, isError: true } };
    const r = analyzeToolResult(JSON.stringify(res));
    expect(r.json?.mcp).toMatchObject({ isError: true, duplicatedStructured: true });
    expect(r.findings.map((f) => f.rule)).toContain("MCP_STRUCTURED_DUPLICATE");
  });
  it("treats broken JSON as text", () => {
    const r = analyzeToolResult("{ not json");
    expect(r.kind).toBe("text");
    expect(r.findings.map((f) => f.rule)).toContain("JSON_INVALID");
  });
});
