/**
 * Core types for the Layer-1 (static, no-LLM) Claude Skill validator.
 * This module is framework-agnostic: no React, no DOM, no network.
 */

export type Severity = "error" | "warning" | "tip";

export type Category =
  | "structure"
  | "frontmatter"
  | "name"
  | "description"
  | "body"
  | "references"
  | "scripts"
  | "security";

export interface Issue {
  /** Stable rule id, e.g. "NAME_RESERVED_WORD". Used by UI, docs, tests. */
  rule: string;
  severity: Severity;
  category: Category;
  message: string;
  /** Actionable fix suggestion. */
  fix?: string;
  /** File path inside the bundle, relative to the skill root. */
  file?: string;
  /** 1-based line number in `file` when known. */
  line?: number;
  /** Source/spec link that justifies the rule. */
  ref?: string;
}

/** A file inside an uploaded skill. Text is decoded only for text-like files. */
export interface BundleFile {
  /** Path relative to the skill root, forward slashes, no leading "./". */
  path: string;
  size: number;
  text?: string;
}

/**
 * A normalized skill bundle. Built from a pasted SKILL.md, a .zip, or a folder.
 * `mode: "paste"` means we only have SKILL.md and cannot verify files on disk.
 */
export interface SkillBundle {
  mode: "paste" | "zip" | "folder";
  /** Directory name of the skill root, if known (used for name == dir check). */
  rootDir?: string;
  /** SKILL.md content (undefined if not found in archive). */
  skillMd?: string;
  /** All files, keyed by path relative to the skill root. */
  files: Map<string, BundleFile>;
  /** Structural problems detected while normalizing (e.g. no SKILL.md). */
  loadIssues: Issue[];
}

export type Target = "portable" | "claude-code";

export interface ValidateOptions {
  /**
   * "portable": Agent Skills spec + claude.ai upload / Skills API rules (strict keys).
   * "claude-code": also accept Claude Code frontmatter extensions.
   */
  target?: Target;
}

export interface ParsedSkill {
  hasFrontmatter: boolean;
  frontmatterRaw?: string;
  frontmatter?: Record<string, unknown>;
  body: string;
  /** 1-based line where the body starts in SKILL.md. */
  bodyStartLine: number;
}

export interface ReportStats {
  bodyLines: number;
  bodyChars: number;
  approxBodyTokens: number;
  descriptionChars: number;
  fileCount: number;
  referencedFiles: string[];
}

export interface Report {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  passed: boolean; // no errors
  counts: Record<Severity, number>;
  issues: Issue[];
  parsed: ParsedSkill;
  stats: ReportStats;
  target: Target;
}

export interface CheckContext {
  bundle: SkillBundle;
  parsed: ParsedSkill;
  options: Required<ValidateOptions>;
  /** Populated by the references check, consumed by later checks. */
  referenced: Set<string>;
}

export type Check = (ctx: CheckContext) => Issue[];
