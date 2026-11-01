import type { Check, Issue } from "../types";
import { BEST_PRACTICES_URL, BODY_MAX_LINES, BODY_MAX_TOKENS, SPEC_URL } from "../spec";

/** Rough token estimate (≈4 chars/token for English, ≈1.5 for CJK). */
export function estimateTokens(s: string): number {
  const cjk = (s.match(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/g) ?? []).length;
  return Math.ceil((s.length - cjk) / 4 + cjk / 1.5);
}

/** Lines of the body that are not inside fenced code blocks. */
export function proseLines(body: string): Array<{ text: string; idx: number }> {
  const out: Array<{ text: string; idx: number }> = [];
  let fence = false;
  body.split("\n").forEach((text, idx) => {
    if (/^\s*(```|~~~)/.test(text)) { fence = !fence; return; }
    if (!fence) out.push({ text, idx });
  });
  return out;
}

const TIME_SENSITIVE = /\b(?:before|after|until|as of|since)\s+(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?20\d\d\b/i;

export const bodyCheck: Check = ({ parsed }) => {
  if (!parsed.hasFrontmatter) return [];
  const issues: Issue[] = [];
  const body = parsed.body;
  const lines = body.split("\n");
  const trimmed = body.trim();
  const at = (idx: number) => parsed.bodyStartLine + idx;

  if (!trimmed) {
    issues.push({ rule: "BODY_EMPTY", severity: "warning", category: "body", file: "SKILL.md", message: "SKILL.md has no instructions after the frontmatter.", fix: "Add the steps, examples and edge cases Claude should follow once the skill is loaded.", ref: SPEC_URL });
    return issues;
  }
  const nonEmpty = lines.length;
  if (nonEmpty > BODY_MAX_LINES) {
    issues.push({ rule: "BODY_TOO_MANY_LINES", severity: "warning", category: "body", file: "SKILL.md", message: `SKILL.md body is ${nonEmpty} lines; keep it under ${BODY_MAX_LINES}.`, fix: "Move detailed reference material to references/*.md and link to it from SKILL.md (progressive disclosure).", ref: BEST_PRACTICES_URL });
  }
  const tokens = estimateTokens(body);
  if (tokens > BODY_MAX_TOKENS) {
    issues.push({ rule: "BODY_TOO_MANY_TOKENS", severity: "warning", category: "body", file: "SKILL.md", message: `SKILL.md body is ~${tokens} tokens; the recommendation is under ${BODY_MAX_TOKENS}.`, fix: "Split long sections into separate files loaded on demand.", ref: SPEC_URL });
  }
  if (trimmed.length < 60) {
    issues.push({ rule: "BODY_TOO_SHORT", severity: "tip", category: "body", file: "SKILL.md", message: "Body is very short. Is there enough guidance for Claude to act on?", fix: "Add concrete steps and at least one input/output example.", ref: SPEC_URL });
  }
  const prose = proseLines(body);
  if (!prose.some((l) => /^#{1,6}\s+\S/.test(l.text))) {
    issues.push({ rule: "BODY_NO_HEADINGS", severity: "tip", category: "body", file: "SKILL.md", message: "Body has no Markdown headings.", fix: "Structure it with sections like ## Instructions, ## Examples, ## Edge cases.", ref: SPEC_URL });
  }
  const ts = prose.find((l) => TIME_SENSITIVE.test(l.text));
  if (ts) {
    issues.push({ rule: "BODY_TIME_SENSITIVE", severity: "tip", category: "body", file: "SKILL.md", line: at(ts.idx), message: `Time-sensitive instruction: "${ts.text.trim().slice(0, 80)}".`, fix: "Describe the current method and move legacy info into an \"Old patterns\" section.", ref: BEST_PRACTICES_URL });
  }
  const winPath = prose.find((l) => /(?:^|[\s`(])(?:[A-Za-z]:\\|[\w.-]+\\[\w.-]+\.\w{1,5})/.test(l.text));
  if (winPath) {
    issues.push({ rule: "BODY_WINDOWS_PATH", severity: "warning", category: "body", file: "SKILL.md", line: at(winPath.idx), message: "Windows-style backslash path found. Skills run on Unix-like environments.", fix: "Use forward slashes: scripts/helper.py, not scripts\\helper.py.", ref: BEST_PRACTICES_URL });
  }
  const unqualifiedMcp = prose.find((l) => /\b(?:use|call)\s+the\s+`?[a-z]+_[a-z_]+`?\s+(?:mcp\s+)?tool\b/i.test(l.text) && !/\w+:\w+/.test(l.text));
  if (unqualifiedMcp) {
    issues.push({ rule: "BODY_MCP_UNQUALIFIED", severity: "tip", category: "body", file: "SKILL.md", line: at(unqualifiedMcp.idx), message: "Tool referenced without a server prefix. If this is an MCP tool, Claude may fail to find it.", fix: "Use the fully qualified form ServerName:tool_name, e.g. GitHub:create_issue.", ref: BEST_PRACTICES_URL });
  }
  return issues;
};
