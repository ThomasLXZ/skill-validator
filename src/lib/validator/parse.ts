import { parseDocument } from "yaml";
import type { Issue, ParsedSkill } from "./types";
import { SPEC_URL, CLAUDE_CODE_SKILLS_URL } from "./spec";

/**
 * Split SKILL.md into YAML frontmatter + markdown body.
 * Mirrors the official quick_validate.py: content must start with "---",
 * frontmatter ends at the next line that is exactly "---".
 */
export function parseSkillMd(raw: string): { parsed: ParsedSkill; issues: Issue[] } {
  const issues: Issue[] = [];
  let text = raw;
  if (text.charCodeAt(0) === 0xfeff) {
    issues.push({
      rule: "FM_BOM",
      severity: "warning",
      category: "frontmatter",
      file: "SKILL.md",
      line: 1,
      message: "SKILL.md starts with a UTF-8 byte-order mark (BOM).",
      fix: "Re-save the file as UTF-8 without BOM; some loaders then fail to see the frontmatter.",
    });
    text = text.slice(1);
  }
  text = text.replace(/\r\n?/g, "\n");
  const lines = text.split("\n");

  if (lines[0]?.trim() !== "---") {
    const leading = lines.findIndex((l) => l.trim() !== "");
    const startsLater = leading > 0 && lines[leading].trim() === "---";
    issues.push({
      rule: "FM_MISSING",
      severity: "error",
      category: "frontmatter",
      file: "SKILL.md",
      line: 1,
      message: startsLater
        ? "Frontmatter must begin on the very first line; blank lines were found before the opening ---."
        : "No YAML frontmatter found. SKILL.md must start with a --- block containing name and description.",
      fix: "Start the file with:\n---\nname: your-skill-name\ndescription: What it does. Use when ...\n---",
      ref: CLAUDE_CODE_SKILLS_URL,
    });
    return { parsed: { hasFrontmatter: false, body: text, bodyStartLine: 1 }, issues };
  }

  const end = lines.findIndex((l, i) => i > 0 && l.trimEnd() === "---");
  if (end === -1) {
    issues.push({
      rule: "FM_UNCLOSED",
      severity: "error",
      category: "frontmatter",
      file: "SKILL.md",
      line: 1,
      message: "Frontmatter is opened with --- but never closed.",
      fix: "Add a closing --- line after the last frontmatter field.",
      ref: SPEC_URL,
    });
    return { parsed: { hasFrontmatter: false, body: text, bodyStartLine: 1 }, issues };
  }

  const fmRaw = lines.slice(1, end).join("\n");
  const body = lines.slice(end + 1).join("\n");
  const parsed: ParsedSkill = {
    hasFrontmatter: true,
    frontmatterRaw: fmRaw,
    body,
    bodyStartLine: end + 2,
  };

  const doc = parseDocument(fmRaw, { prettyErrors: false, uniqueKeys: false });
  if (doc.errors.length) {
    const e = doc.errors[0];
    const line = e.linePos?.[0]?.line;
    issues.push({
      rule: "FM_YAML_INVALID",
      severity: "error",
      category: "frontmatter",
      file: "SKILL.md",
      line: line ? line + 1 : 2,
      message: `Frontmatter is not valid YAML: ${e.message.split("\n")[0]}`,
      fix: "Quote values that contain ': ' or start with special characters, e.g. description: \"Does X: Y. Use when ...\". Or use a folded block (description: >-).",
      ref: SPEC_URL,
    });
    return { parsed, issues };
  }
  // duplicate keys
  const seen = new Set<string>();
  const contents = doc.contents as { items?: Array<{ key?: { value?: unknown } }> } | null;
  for (const item of contents?.items ?? []) {
    const k = String(item.key?.value ?? "");
    if (seen.has(k)) {
      issues.push({
        rule: "FM_DUPLICATE_KEY",
        severity: "error",
        category: "frontmatter",
        file: "SKILL.md",
        message: `Frontmatter key "${k}" appears more than once.`,
        fix: "Keep a single definition of each key.",
      });
    }
    seen.add(k);
  }

  const data = doc.toJS();
  if (data === null || data === undefined) {
    parsed.frontmatter = {};
  } else if (typeof data !== "object" || Array.isArray(data)) {
    issues.push({
      rule: "FM_NOT_MAPPING",
      severity: "error",
      category: "frontmatter",
      file: "SKILL.md",
      message: "Frontmatter must be a YAML mapping (key: value pairs).",
      fix: "Use `name: ...` and `description: ...` lines between the --- markers.",
    });
  } else {
    parsed.frontmatter = data as Record<string, unknown>;
  }
  return { parsed, issues };
}

/** Find the 1-based line of a top-level frontmatter key in SKILL.md. */
export function keyLine(parsed: ParsedSkill, key: string): number | undefined {
  if (!parsed.frontmatterRaw) return undefined;
  const idx = parsed.frontmatterRaw
    .split("\n")
    .findIndex((l) => l.startsWith(`${key}:`));
  return idx === -1 ? undefined : idx + 2;
}
