import type { Check, Issue } from "../types";
import { keyLine } from "../parse";
import {
  ANTHROPIC_OVERVIEW_URL, BEST_PRACTICES_URL, CLAUDE_CODE_LISTING_MAX, CLAUDE_CODE_SKILLS_URL,
  DESCRIPTION_MAX, SPEC_URL,
} from "../spec";

/** Phrases that signal the "when to use" half of a description. */
export const TRIGGER_PATTERNS: RegExp[] = [
  /\buse (?:this |it )?(?:skill )?(?:when|whenever|for|if|to|before|after)\b/i,
  /\b(?:when|whenever|if) (?:the )?(?:user|you|working|asked|handling|dealing|creating|editing|reviewing|writing|reading|someone|a user|claude)\b/i,
  /\b(?:triggers?|invoke|activate)(?:d|s)? (?:on|when|for|by)\b/i,
  /\bwhen (?:\w+ ){0,3}(?:mentions?|asks?|needs?|wants?|requests?|provides?|uploads?)\b/i,
  /\bfor (?:tasks|requests|questions) (?:that|involving|about|like)\b/i,
  /\bapplies (?:to|when)\b/i,
];

const VAGUE_PATTERNS: Array<[RegExp, string]> = [
  [/^\s*(?:helps?|assists?) (?:with|you)\b/i, "starts with a generic \"helps with\""],
  [/\b(?:does|do) (?:stuff|things)\b/i, "\"does stuff/things\""],
  [/\bvarious (?:things|tasks|stuff)\b/i, "\"various tasks\""],
  [/\b(?:general|generic) (?:purpose|helper|utility)\b/i, "\"general purpose\""],
  [/\b(?:etc\.?|and more|and so on)\s*$/i, "ends with \"etc.\" instead of concrete triggers"],
  [/^\s*(?:a |an |the )?(?:skill|tool|helper|utility)(?: for| that)?\s*\.?\s*$/i, "says nothing concrete"],
];

const PERSON_PATTERNS: Array<[RegExp, string]> = [
  [/\bI (?:can|will|am|help|'ll|'m)\b/, "first person (\"I can...\")"],
  [/\b(?:we|We) (?:can|will|help)\b/, "first person plural (\"we can...\")"],
  [/^\s*You (?:can|should|will|may)\b/, "second person (\"You can...\")"],
  [/\byou can use this\b/i, "second person (\"you can use this\")"],
];

export function hasTriggerClause(desc: string): boolean {
  return TRIGGER_PATTERNS.some((r) => r.test(desc));
}

export const descriptionCheck: Check = ({ parsed, options }) => {
  const fm = parsed.frontmatter;
  if (!fm) return [];
  const issues: Issue[] = [];
  const line = keyLine(parsed, "description");
  const base = { category: "description" as const, file: "SKILL.md", line };
  const template = "description: <What it does, with key terms>. Use when <situations, file types, phrases the user says>.".replace(/[<>]/g, "");

  if (!("description" in fm) || fm.description === null || fm.description === undefined) {
    issues.push({ ...base, rule: "DESC_MISSING", severity: "error", message: "Missing required field: description. Claude decides whether to load a skill from its description alone.", fix: template, ref: SPEC_URL });
    return issues;
  }
  if (typeof fm.description !== "string") {
    issues.push({ ...base, rule: "DESC_TYPE", severity: "error", message: `description must be a string, got ${Array.isArray(fm.description) ? "list" : typeof fm.description}.`, fix: "Write the description as one string (use description: >- for multi-line).", ref: SPEC_URL });
    return issues;
  }
  const d = fm.description.trim();
  if (!d) {
    issues.push({ ...base, rule: "DESC_EMPTY", severity: "error", message: "description is empty.", fix: template, ref: SPEC_URL });
    return issues;
  }
  if (d.length > DESCRIPTION_MAX) {
    issues.push({ ...base, rule: "DESC_TOO_LONG", severity: "error", message: `description is ${d.length} characters; the maximum is ${DESCRIPTION_MAX}.`, fix: "Keep what + when; move details into the SKILL.md body.", ref: SPEC_URL });
  }
  if (/[<>]/.test(d)) {
    issues.push({ ...base, rule: "DESC_ANGLE_BRACKETS", severity: "error", message: "description contains < or >. Anthropic disallows XML tags here and the official validator rejects angle brackets.", fix: "Replace placeholders like <file> with plain words, e.g. \"a file path\".", ref: ANTHROPIC_OVERVIEW_URL });
  }
  const words = d.split(/\s+/).filter(Boolean).length;
  if (d.length < 40 || words < 8) {
    issues.push({ ...base, rule: "DESC_TOO_SHORT", severity: "warning", message: `description is very short (${d.length} chars, ${words} words). Claude picks among 100+ skills using this text.`, fix: "Name the concrete actions and the trigger contexts, e.g. \"Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs or forms.\"", ref: BEST_PRACTICES_URL });
  }
  if (!hasTriggerClause(d)) {
    issues.push({ ...base, rule: "DESC_NO_WHEN", severity: "warning", message: "description doesn't say when to use the skill (no \"Use when...\" clause).", fix: "Append a trigger sentence: \"Use when the user asks to ..., mentions ..., or works with .xyz files.\"", ref: BEST_PRACTICES_URL });
  }
  for (const [re, label] of VAGUE_PATTERNS) {
    if (re.test(d)) {
      issues.push({ ...base, rule: "DESC_VAGUE", severity: "warning", message: `description is vague: ${label}.`, fix: "Replace generic wording with specific verbs and nouns (formats, tools, domains) the user would actually mention.", ref: BEST_PRACTICES_URL });
      break;
    }
  }
  for (const [re, label] of PERSON_PATTERNS) {
    if (re.test(d)) {
      issues.push({ ...base, rule: "DESC_POINT_OF_VIEW", severity: "warning", message: `description uses ${label}. It is injected into the system prompt, so write it in third person.`, fix: "\"Processes Excel files and generates reports\" instead of \"I can help you process Excel files\".", ref: BEST_PRACTICES_URL });
      break;
    }
  }
  if (/\b(?:TODO|TBD|FIXME|lorem ipsum)\b/i.test(d)) {
    issues.push({ ...base, rule: "DESC_PLACEHOLDER", severity: "error", message: "description still contains placeholder text (TODO/TBD/lorem ipsum).", fix: template });
  }
  if (options.target === "claude-code") {
    const wtu = typeof fm.when_to_use === "string" ? fm.when_to_use : "";
    const total = d.length + wtu.length;
    if (total > CLAUDE_CODE_LISTING_MAX) {
      issues.push({ ...base, rule: "DESC_LISTING_TRUNCATED", severity: "warning", message: `description + when_to_use is ${total} chars; Claude Code truncates the skill listing at ${CLAUDE_CODE_LISTING_MAX}.`, fix: "Put the key use case first and trim the rest.", ref: CLAUDE_CODE_SKILLS_URL });
    }
  }
  if (d.length > 600 && d.length <= DESCRIPTION_MAX) {
    issues.push({ ...base, rule: "DESC_LONG", severity: "tip", message: `description is ${d.length} chars. Metadata of every installed skill is always in context (~100 tokens recommended).`, fix: "Aim for 1-3 sentences: what it does + when to use it.", ref: SPEC_URL });
  }
  return issues;
};
