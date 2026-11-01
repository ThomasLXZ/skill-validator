import { editDistance, sortFindings, type Finding } from "../common/finding";

export const REF = {
  rules: "https://cursor.com/docs/rules",
  help: "https://cursor.com/help/customization/rules",
} as const;

export type RuleType = "always" | "intelligent" | "files" | "manual";
export const RULE_TYPE_LABEL: Record<RuleType, string> = {
  always: "Always Apply",
  intelligent: "Apply Intelligently",
  files: "Apply to Specific Files",
  manual: "Apply Manually",
};
export const RULE_TYPE_HELP: Record<RuleType, string> = {
  always: "Added to every Agent chat.",
  intelligent: "The Agent reads the description and decides whether the rule is relevant.",
  files: "Attached when files matching the globs are in the conversation.",
  manual: "Only used when someone @-mentions the rule.",
};

export interface FrontmatterField { key: string; raw: string; line: number }

export interface CursorRuleReport {
  mode: "mdc" | "legacy";
  type?: RuleType;
  fields: Record<string, FrontmatterField>;
  description?: string;
  globs: string[];
  alwaysApply?: boolean;
  bodyLines: number;
  findings: Finding[];
}

const KNOWN = ["description", "globs", "alwaysApply"];

function unquote(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  return t;
}

export interface ValidateOptions {
  /** File name or path, e.g. ".cursor/rules/react.mdc" or ".cursorrules". */
  filename?: string;
}

export function validateCursorRule(text: string, opts: ValidateOptions = {}): CursorRuleReport {
  const f: Finding[] = [];
  const name = (opts.filename ?? "").trim();
  const base = name.split(/[\\/]/).pop() ?? "";
  const legacy = base === ".cursorrules";
  const rep: CursorRuleReport = { mode: legacy ? "legacy" : "mdc", fields: {}, globs: [], bodyLines: 0, findings: f };
  const lines = text.replace(/^\uFEFF/, "").split(/\r\n|\r|\n/);

  if (!text.trim()) {
    f.push({ rule: "RULE_EMPTY", severity: "error", line: 1, message: "The file is empty, so the rule does nothing." });
    rep.findings = sortFindings(f);
    return rep;
  }

  if (legacy) {
    f.push({ rule: "LEGACY_CURSORRULES", severity: "warning", line: 1, message: "`.cursorrules` is the legacy format. Cursor still reads it but says it will be deprecated.", fix: "Create a rule in `.cursor/rules/` (the Build tab does this), paste this content, set it to Always Apply, then delete `.cursorrules`.", ref: REF.help });
    rep.bodyLines = lines.length;
    bodyChecks(lines, 1, rep, f);
    rep.findings = sortFindings(f);
    return rep;
  }

  if (base) {
    if (/\.md$/i.test(base) && !/\.mdc$/i.test(base))
      f.push({ rule: "RULE_WRONG_EXTENSION", severity: "error", message: `\`${base}\` ends in .md. Cursor only reads \`.mdc\` files in \`.cursor/rules/\`, so this rule is ignored.`, fix: `Rename it to \`${base.replace(/\.md$/i, ".mdc")}\`.`, ref: REF.rules });
    else if (!/\.mdc$/i.test(base))
      f.push({ rule: "RULE_WRONG_EXTENSION", severity: "error", message: `\`${base}\` is not an \`.mdc\` file, so Cursor will not load it as a rule.`, fix: "Project rules live in `.cursor/rules/` with the `.mdc` extension.", ref: REF.rules });
    if (name.includes("/") && !/(^|\/)\.cursor\/rules\//.test(name.replace(/\\/g, "/")))
      f.push({ rule: "RULE_WRONG_FOLDER", severity: "warning", message: "Project rules belong in `.cursor/rules/` (subfolders are fine).", ref: REF.rules });
  }

  // --- frontmatter ---
  let bodyStart = 0;
  if (lines[0].trim() !== "---") {
    f.push({ rule: "RULE_NO_FRONTMATTER", severity: "warning", line: 1, message: "No `---` frontmatter block. Frontmatter is what tells Cursor when to apply the rule.", fix: "Start the file with:\n---\ndescription: ...\nglobs:\nalwaysApply: false\n---", ref: REF.rules });
  } else {
    const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
    if (end === -1) {
      f.push({ rule: "RULE_UNCLOSED_FRONTMATTER", severity: "error", line: 1, message: "The frontmatter starts with `---` but never closes, so the whole file is read as frontmatter.", fix: "Add a closing `---` line after the last field.", ref: REF.rules });
      bodyStart = lines.length;
    } else {
      bodyStart = end + 1;
      for (let i = 1; i < end; i++) {
        const raw = lines[i];
        if (!raw.trim() || raw.trim().startsWith("#")) continue;
        const m = /^([A-Za-z_][\w-]*)\s*:(.*)$/.exec(raw);
        if (!m) {
          if (/^\s+-\s/.test(raw) && rep.fields.globs) {
            rep.fields.globs.raw += "\n" + raw;
            continue;
          }
          f.push({ rule: "RULE_FRONTMATTER_SYNTAX", severity: "error", line: i + 1, message: "This frontmatter line is not `key: value`.", ref: REF.rules });
          continue;
        }
        const [, key, val] = m;
        if (rep.fields[key]) f.push({ rule: "RULE_DUPLICATE_KEY", severity: "warning", line: i + 1, message: `\`${key}\` is set twice. Only one value will be used.` });
        rep.fields[key] = { key, raw: val.trim(), line: i + 1 };
        if (!KNOWN.includes(key)) {
          const near = KNOWN.find((k) => k.toLowerCase() === key.toLowerCase().replace(/[_-]/g, "") || editDistance(k.toLowerCase(), key.toLowerCase()) <= 2);
          f.push(near
            ? { rule: "RULE_KEY_TYPO", severity: "error", line: i + 1, message: `\`${key}\` is not a Cursor rule field. Did you mean \`${near}\`?`, fix: `Rename it to \`${near}\`. Field names are case-sensitive.`, ref: REF.rules }
            : { rule: "RULE_UNKNOWN_KEY", severity: "warning", line: i + 1, message: `\`${key}\` is not one of the documented fields (description, globs, alwaysApply), so Cursor ignores it.`, ref: REF.rules });
        }
      }
    }
  }

  const { description: d, globs: g, alwaysApply: a } = rep.fields;
  if (d) rep.description = unquote(d.raw) || undefined;
  if (a) {
    const v = unquote(a.raw).toLowerCase();
    if (v === "true" || v === "false") {
      rep.alwaysApply = v === "true";
      if (a.raw !== "true" && a.raw !== "false")
        f.push({ rule: "RULE_ALWAYS_APPLY_FORMAT", severity: "tip", line: a.line, message: "Write `alwaysApply` as a bare `true` or `false`, without quotes or capitals.", ref: REF.rules });
    } else if (v) {
      f.push({ rule: "RULE_ALWAYS_APPLY_NOT_BOOLEAN", severity: "error", line: a.line, message: `alwaysApply must be \`true\` or \`false\`, not \`${a.raw}\`.`, ref: REF.rules });
    }
  }
  if (g) {
    let raw = g.raw;
    const listForm = raw.includes("\n") || /^\[.*\]$/.test(raw.trim());
    if (listForm) {
      f.push({ rule: "RULE_GLOBS_LIST", severity: "warning", line: g.line, message: "`globs` is written as a YAML list. Cursor's docs show globs as one comma-separated string.", fix: `Write it as: globs: ${listToGlobs(raw).join(", ")}`, ref: REF.rules });
      rep.globs = listToGlobs(raw);
    } else {
      raw = unquote(raw);
      rep.globs = raw ? raw.split(",").map((s) => s.trim()) : [];
      if (rep.globs.some((s) => !s)) {
        f.push({ rule: "RULE_GLOBS_EMPTY_ITEM", severity: "warning", line: g.line, message: "`globs` has an empty entry (two commas in a row or a trailing comma)." });
        rep.globs = rep.globs.filter(Boolean);
      }
      if (/^\*/.test(g.raw.trim()))
        f.push({ rule: "RULE_GLOBS_YAML_ALIAS", severity: "tip", line: g.line, message: "Strict YAML reads a value starting with `*` as an alias, so YAML linters and other tools may fail on this line. This is a portability note, not a Cursor error." });
    }
    for (const p of rep.globs) {
      if (p.startsWith("/")) f.push({ rule: "RULE_GLOB_ABSOLUTE", severity: "warning", line: g.line, message: `\`${p}\` starts with /. Globs are relative to the project root.`, fix: `Use \`${p.replace(/^\/+/, "")}\`.`, ref: REF.rules });
      else if (p.startsWith("./")) f.push({ rule: "RULE_GLOB_DOT_SLASH", severity: "tip", line: g.line, message: `\`${p}\` starts with ./. Cursor's examples use plain relative paths such as \`src/**/*.ts\`.`, ref: REF.rules });
      if (p.includes("\\")) f.push({ rule: "RULE_GLOB_BACKSLASH", severity: "warning", line: g.line, message: `\`${p}\` uses backslashes. Use forward slashes in globs.` });
      if (/^\*\.[\w{},]+$/.test(p)) f.push({ rule: "RULE_GLOB_ROOT_ONLY", severity: "tip", line: g.line, message: `\`${p}\` only matches files in the project root. Use \`**/${p}\` to match in every folder.`, ref: REF.rules });
    }
  }

  // --- type, per the table in cursor.com/docs/rules ---
  if (rep.alwaysApply === true) {
    rep.type = "always";
    if (rep.globs.length) f.push({ rule: "RULE_ALWAYS_WITH_GLOBS", severity: "warning", line: g?.line, message: "alwaysApply is true, so the globs are ignored and this rule goes into every chat.", fix: "To attach the rule only for matching files, set `alwaysApply: false`.", ref: REF.rules });
  } else if (rep.globs.length) {
    rep.type = "files";
  } else if (rep.description) {
    rep.type = "intelligent";
  } else if (lines[0].trim() === "---") {
    rep.type = "manual";
    f.push({ rule: "RULE_MANUAL_ONLY", severity: "tip", line: 1, message: "No description, no globs and alwaysApply is not true, so this rule only runs when someone types @rule-name.", fix: "Add a `description` that says when to use it, so the Agent can pick it up on its own.", ref: REF.rules });
  }
  if (!a && lines[0].trim() === "---" && rep.type !== "manual")
    f.push({ rule: "RULE_ALWAYS_APPLY_MISSING", severity: "tip", line: 1, message: "Set `alwaysApply` explicitly. Every example in Cursor's docs includes it.", ref: REF.rules });
  if (rep.type === "intelligent" && rep.description && rep.description.length < 25)
    f.push({ rule: "RULE_DESCRIPTION_VAGUE", severity: "warning", line: d?.line, message: "The Agent decides whether to use this rule from its description alone, and this one is very short.", fix: "Say what the rule covers and when it applies, e.g. \"Conventions for writing React components with hooks and Tailwind\".", ref: REF.rules });
  if (d && !rep.description && rep.alwaysApply !== true && !rep.globs.length)
    f.push({ rule: "RULE_DESCRIPTION_EMPTY", severity: "warning", line: d.line, message: "`description` is empty. Apply Intelligently rules need a description for the Agent to judge relevance.", ref: REF.rules });

  rep.bodyLines = Math.max(0, lines.length - bodyStart);
  bodyChecks(lines, bodyStart + 1, rep, f);
  rep.findings = sortFindings(f);
  return rep;
}

function listToGlobs(raw: string): string[] {
  const t = raw.trim();
  if (t.startsWith("[")) return t.slice(1, -1).split(",").map((s) => unquote(s)).filter(Boolean);
  return t.split("\n").map((l) => unquote(l.replace(/^\s*-\s*/, ""))).filter(Boolean);
}

function bodyChecks(lines: string[], startLine: number, rep: CursorRuleReport, f: Finding[]) {
  const body = lines.slice(startLine - 1);
  const nonEmpty = body.filter((l) => l.trim()).length;
  if (!nonEmpty) f.push({ rule: "RULE_EMPTY_BODY", severity: "error", line: startLine > lines.length ? lines.length : startLine, message: "The rule has no content after the frontmatter, so there is nothing for the Agent to follow." });
  if (body.length > 500)
    f.push({ rule: "RULE_TOO_LONG", severity: "warning", line: startLine + 500, message: `${body.length} lines. Cursor recommends keeping rules under 500 lines.`, fix: "Split it into several focused rules, and reference files with @filename instead of pasting them.", ref: REF.rules });
  const bigFence = (() => { let open = -1, n = 0; for (let i = 0; i < body.length; i++) { if (/^\s*```/.test(body[i])) { if (open === -1) open = i; else { n = Math.max(n, i - open); open = -1; } } } return n; })();
  if (bigFence > 80)
    f.push({ rule: "RULE_LARGE_CODE_BLOCK", severity: "tip", message: `A code block of ${bigFence} lines. Cursor suggests referencing files instead of copying their contents into rules.`, ref: REF.rules });
}

export interface BuildInput {
  type: RuleType;
  description: string;
  globs: string;
  body: string;
}

/** Produce an .mdc file matching Cursor's documented frontmatter for each rule type. */
export function buildMdc(b: BuildInput): string {
  const fm: string[] = ["---"];
  const desc = b.description.trim().replace(/\s+/g, " ");
  const globs = b.globs.split(",").map((s) => s.trim()).filter(Boolean).join(", ");
  // Mirrors the examples in cursor.com/docs/rules: only the fields each type needs.
  if (b.type === "always") fm.push("alwaysApply: true");
  if (b.type === "intelligent") fm.push(`description: ${desc}`, "alwaysApply: false");
  if (b.type === "files") fm.push(`globs: ${globs}`, "alwaysApply: false");
  if (b.type === "manual") fm.push("alwaysApply: false");
  fm.push("---");
  return fm.join("\n") + "\n" + (b.body.trim() ? "\n" + b.body.trim() + "\n" : "");
}

export function slugify(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 60) || "my-rule";
}
