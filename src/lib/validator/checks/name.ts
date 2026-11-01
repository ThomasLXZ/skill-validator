import type { Check, Issue } from "../types";
import { keyLine } from "../parse";
import { ANTHROPIC_OVERVIEW_URL, BEST_PRACTICES_URL, NAME_MAX, RESERVED_NAME_WORDS, SPEC_URL, VAGUE_NAMES } from "../spec";

export function suggestName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, NAME_MAX)
    .replace(/-$/, "");
}

export const nameCheck: Check = ({ parsed, bundle, options }) => {
  const fm = parsed.frontmatter;
  if (!fm) return [];
  const issues: Issue[] = [];
  const line = keyLine(parsed, "name");
  const base = { category: "name" as const, file: "SKILL.md", line };

  if (!("name" in fm) || fm.name === null || fm.name === undefined || fm.name === "") {
    issues.push({
      ...base,
      rule: "NAME_MISSING",
      // Claude Code falls back to the directory name; the spec and API require it.
      severity: options.target === "claude-code" ? "warning" : "error",
      message: "Missing required field: name.",
      fix: `Add name: ${bundle.rootDir ? suggestName(bundle.rootDir) : "your-skill-name"} (lowercase letters, numbers, hyphens).`,
      ref: SPEC_URL,
    });
    return issues;
  }
  if (typeof fm.name !== "string") {
    issues.push({ ...base, rule: "NAME_TYPE", severity: "error", message: `name must be a string, got ${typeof fm.name}.`, fix: "Quote the value: name: \"my-skill\"", ref: SPEC_URL });
    return issues;
  }
  const name = fm.name.trim();
  const suggestion = suggestName(name);
  const fixFmt = suggestion && suggestion !== name ? `Use: name: ${suggestion}` : undefined;

  if (name.length > NAME_MAX) {
    issues.push({ ...base, rule: "NAME_TOO_LONG", severity: "error", message: `name is ${name.length} characters; the maximum is ${NAME_MAX}.`, fix: fixFmt ?? "Shorten the name.", ref: SPEC_URL });
  }
  if (/<\/?[a-z][^>]*>/i.test(name)) {
    issues.push({ ...base, rule: "NAME_XML", severity: "error", message: "name cannot contain XML tags.", fix: fixFmt, ref: ANTHROPIC_OVERVIEW_URL });
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    const why = /[A-Z]/.test(name) ? "uppercase letters" : /[\s_]/.test(name) ? "spaces or underscores" : "characters other than a-z, 0-9 and -";
    issues.push({ ...base, rule: "NAME_CHARSET", severity: "error", message: `name "${name}" contains ${why}. Only lowercase letters, numbers and hyphens are allowed.`, fix: fixFmt, ref: SPEC_URL });
  }
  if (name.startsWith("-") || name.endsWith("-")) {
    issues.push({ ...base, rule: "NAME_HYPHEN_EDGE", severity: "error", message: "name must not start or end with a hyphen.", fix: fixFmt, ref: SPEC_URL });
  }
  if (name.includes("--")) {
    issues.push({ ...base, rule: "NAME_DOUBLE_HYPHEN", severity: "error", message: "name must not contain consecutive hyphens (--).", fix: fixFmt, ref: SPEC_URL });
  }
  const reserved = RESERVED_NAME_WORDS.filter((w) => name.toLowerCase().includes(w));
  if (reserved.length) {
    issues.push({
      ...base,
      rule: "NAME_RESERVED_WORD",
      severity: "error",
      message: `name contains the reserved word "${reserved[0]}". Anthropic rejects names containing "anthropic" or "claude".`,
      fix: `Describe the capability instead, e.g. "${name.replace(/-?(claude|anthropic)-?/gi, "-").replace(/^-|-$/g, "") || "processing-pdfs"}".`,
      ref: ANTHROPIC_OVERVIEW_URL,
    });
  }
  if (bundle.rootDir && bundle.rootDir !== name) {
    issues.push({
      ...base,
      rule: "NAME_DIR_MISMATCH",
      severity: "warning",
      message: `name "${name}" does not match the skill folder name "${bundle.rootDir}". The spec requires them to match.`,
      fix: `Rename the folder to "${name}" or set name: ${suggestName(bundle.rootDir)}.`,
      ref: SPEC_URL,
    });
  }
  if (VAGUE_NAMES.includes(name)) {
    issues.push({
      ...base,
      rule: "NAME_VAGUE",
      severity: "warning",
      message: `name "${name}" is too generic to tell skills apart.`,
      fix: "Name the activity, preferably in gerund form: processing-pdfs, analyzing-spreadsheets, writing-release-notes.",
      ref: BEST_PRACTICES_URL,
    });
  }
  return issues;
};
