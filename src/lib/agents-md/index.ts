import { sortFindings, type Finding } from "../common/finding";

/** Official / primary sources used by this tool. */
export const REF = {
  site: "https://agents.md/",
  codex: "https://developers.openai.com/codex/guides/agents-md",
  codexBest: "https://developers.openai.com/codex/learn/best-practices",
  foundation: "https://agents.md/",
} as const;

/** Codex default for combined project docs (verified: OpenAI Codex AGENTS.md guide). */
export const CODEX_DEFAULT_MAX_BYTES = 32 * 1024;

/**
 * Recommended section headings from agents.md ("Popular choices") and
 * OpenAI Codex best-practices. Matching is case-insensitive substring on heading text.
 * These are convention, not a formal schema — AGENTS.md has no required fields.
 */
export const RECOMMENDED_SECTIONS: { id: string; label: string; patterns: RegExp[]; source: "agents.md" | "codex" }[] = [
  { id: "overview", label: "Project overview", patterns: [/overview/, /about (the )?project/, /repository expectations/, /repo(sitory)? layout/, /project (summary|description)/], source: "agents.md" },
  { id: "build", label: "Build and test commands", patterns: [/build/, /setup/, /install/, /dev(elopment)? environment/, /how to run/, /commands?/], source: "agents.md" },
  { id: "style", label: "Code style guidelines", patterns: [/code style/, /style guide/, /conventions?/, /coding standards?/], source: "agents.md" },
  { id: "testing", label: "Testing instructions", patterns: [/test(ing)?/, /verification/, /done means/, /how to verify/], source: "agents.md" },
  { id: "security", label: "Security considerations", patterns: [/security/, /secrets?/, /do[- ]?not/, /never (commit|push|log)/], source: "agents.md" },
  { id: "pr", label: "PR / commit guidelines", patterns: [/pull request/, /\bpr\b/, /commit message/, /code review/], source: "codex" },
];

export type Grade = "A" | "B" | "C" | "D" | "F";

export interface Heading {
  level: number;
  text: string;
  line: number;
}

export interface AgentsMdReport {
  filename: string;
  bytes: number;
  lines: number;
  /** Rough estimate: ceil(chars / 4). Not a real tokenizer. */
  estimatedTokens: number;
  headings: Heading[];
  presentSections: string[];
  missingSections: string[];
  hasCodeFence: boolean;
  score: number;
  grade: Grade;
  findings: Finding[];
}

export interface ValidateOptions {
  /** Path or basename, e.g. "AGENTS.md" or "packages/api/AGENTS.md". */
  filename?: string;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function parseHeadings(lines: string[]): Heading[] {
  const out: Heading[] = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*```/.test(l)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{1,6})\s+(.+?)\s*$/.exec(l);
    if (m) out.push({ level: m[1].length, text: m[2].replace(/#+\s*$/, "").trim(), line: i + 1 });
  }
  return out;
}

function matchSections(headings: Heading[], bodyLower: string): { present: string[]; missing: string[] } {
  const present: string[] = [];
  const missing: string[] = [];
  for (const s of RECOMMENDED_SECTIONS) {
    const inHeading = headings.some((h) => s.patterns.some((p) => p.test(h.text.toLowerCase())));
    // Also accept content cues for build/test when there is no matching heading
    // (agents.md allows any headings). Only count as present via heading match
    // for scoring clarity; content-only is a softer tip elsewhere.
    if (inHeading) present.push(s.id);
    else missing.push(s.id);
  }
  void bodyLower;
  return { present, missing };
}

function unclosedFence(lines: string[]): number | undefined {
  let open = false;
  let openLine = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*```/.test(lines[i])) {
      if (!open) {
        open = true;
        openLine = i + 1;
      } else open = false;
    }
  }
  return open ? openLine : undefined;
}

const SECRET_PATTERNS: { rule: string; re: RegExp; message: string }[] = [
  { rule: "AGENTS_SECRET_KEY", re: /\b(?:sk|pk|rk|ak)[-_](?:live|test|proj)[-_][A-Za-z0-9]{16,}\b|\b(?:api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*['\"]?[A-Za-z0-9_\-]{20,}/i, message: "Looks like a hard-coded secret. Agents.md is committed and loaded into agent context — use placeholders and point to env vars instead." },
  { rule: "AGENTS_PRIVATE_KEY", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, message: "A private key block appears in AGENTS.md. Remove it; never put credentials in agent instruction files." },
];

/** Informational tips that should not drag the score (interop notes, etc.). */
const SCORE_IGNORE = new Set([
  "AGENTS_CLAUDE_CODE_IMPORT",
  "AGENTS_NESTED",
  "AGENTS_OVERRIDE_NOTE",
  "AGENTS_MISSING_OPTIONAL_SECTIONS",
]);

function scoreFrom(f: Finding[], presentCount: number, recommendedCount: number): { score: number; grade: Grade } {
  let score = 100;
  for (const x of f) {
    if (SCORE_IGNORE.has(x.rule)) continue;
    if (x.severity === "error") score -= 25;
    else if (x.severity === "warning") score -= 8;
    else score -= 2;
  }
  // Soft bonus for covering popular sections (convention, not schema).
  const coverage = presentCount / Math.max(recommendedCount, 1);
  score = Math.round(score * (0.7 + 0.3 * coverage));
  score = Math.max(0, Math.min(100, score));
  const grade: Grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";
  return { score, grade };
}

export function validateAgentsMd(text: string, opts: ValidateOptions = {}): AgentsMdReport {
  const f: Finding[] = [];
  const rawName = (opts.filename ?? "AGENTS.md").trim() || "AGENTS.md";
  const normalized = rawName.replace(/\\/g, "/");
  const base = normalized.split("/").pop() ?? "AGENTS.md";
  const lines = text.replace(/^\uFEFF/, "").split(/\r\n|\r|\n/);
  const bytes = new TextEncoder().encode(text).length;
  const estimatedTokens = estimateTokens(text);

  const report: AgentsMdReport = {
    filename: normalized,
    bytes,
    lines: lines.length,
    estimatedTokens,
    headings: [],
    presentSections: [],
    missingSections: [],
    hasCodeFence: false,
    score: 0,
    grade: "F",
    findings: f,
  };

  if (!text.trim()) {
    f.push({
      rule: "AGENTS_EMPTY",
      severity: "error",
      line: 1,
      message: "The file is empty. Codex and other agents skip empty AGENTS.md files.",
      fix: "Add project overview, build/test commands, and the conventions an agent cannot infer from the code.",
      ref: REF.site,
    });
    report.findings = sortFindings(f);
    return report;
  }

  // --- filename / placement (convention) ---
  if (/^agent\.md$/i.test(base) || /^agents\.markdown$/i.test(base)) {
    f.push({
      rule: "AGENTS_FILENAME_VARIANT",
      severity: "warning",
      line: 1,
      message: `\`${base}\` is not the standard name. The open format and Codex look for \`AGENTS.md\`.`,
      fix: "Rename to AGENTS.md. agents.md FAQ suggests: mv AGENT.md AGENTS.md && ln -s AGENTS.md AGENT.md for compatibility.",
      ref: REF.site,
    });
  } else if (base !== "AGENTS.md" && base !== "AGENTS.override.md") {
    if (/^agents\.md$/i.test(base) && base !== "AGENTS.md") {
      f.push({
        rule: "AGENTS_FILENAME_CASE",
        severity: "warning",
        line: 1,
        message: `Filename is \`${base}\`. The documented name is \`AGENTS.md\` (all caps). Case-sensitive filesystems treat these as different files.`,
        fix: "Rename to AGENTS.md.",
        ref: REF.site,
      });
    } else if (!/^agents(\.override)?\.md$/i.test(base)) {
      f.push({
        rule: "AGENTS_UNEXPECTED_NAME",
        severity: "tip",
        line: 1,
        message: `\`${base}\` is not AGENTS.md. Codex can load alternate names only if you list them in project_doc_fallback_filenames.`,
        fix: "Prefer AGENTS.md at the repo root (or a package root for nested instructions).",
        ref: REF.codex,
      });
    }
  }

  if (base === "AGENTS.override.md") {
    f.push({
      rule: "AGENTS_OVERRIDE_NOTE",
      severity: "tip",
      line: 1,
      message: "AGENTS.override.md replaces AGENTS.md in the same directory (Codex discovery). Useful for temporary or package-specific overrides.",
      ref: REF.codex,
    });
  }

  // Nested path tip
  if (normalized.includes("/") && !/(^|\/)AGENTS(\.override)?\.md$/i.test(normalized)) {
    // already covered by unexpected name
  } else if (normalized.includes("/")) {
    f.push({
      rule: "AGENTS_NESTED",
      severity: "tip",
      line: 1,
      message: "Nested AGENTS.md detected. agents.md and Codex both say the closest file to the edited path wins / appears later in the merge.",
      ref: REF.site,
    });
  }

  const headings = parseHeadings(lines);
  report.headings = headings;
  const bodyLower = text.toLowerCase();
  const { present, missing } = matchSections(headings, bodyLower);
  report.presentSections = present;
  report.missingSections = missing;
  report.hasCodeFence = lines.some((l) => /^\s*```/.test(l));

  const fenceOpen = unclosedFence(lines);
  if (fenceOpen) {
    f.push({
      rule: "AGENTS_UNCLOSED_FENCE",
      severity: "error",
      line: fenceOpen,
      message: "A fenced code block starts here but never closes. Agents may mis-parse the rest of the file.",
      fix: "Add a closing ``` line.",
    });
  }

  // Size: verified Codex default 32 KiB combined
  if (bytes > CODEX_DEFAULT_MAX_BYTES) {
    f.push({
      rule: "AGENTS_OVER_CODEX_BYTES",
      severity: "warning",
      line: 1,
      message: `${bytes.toLocaleString("en-US")} bytes. Codex stops adding instruction files once the combined size reaches project_doc_max_bytes (32 KiB by default).`,
      fix: "Split guidance into nested AGENTS.md files closer to each package, or raise project_doc_max_bytes in ~/.codex/config.toml. Prefer short files that link out to task-specific docs.",
      ref: REF.codex,
    });
  } else if (bytes > CODEX_DEFAULT_MAX_BYTES * 0.75) {
    f.push({
      rule: "AGENTS_NEAR_CODEX_BYTES",
      severity: "tip",
      line: 1,
      message: `${bytes.toLocaleString("en-US")} bytes — approaching Codex's default 32 KiB combined cap for project docs.`,
      ref: REF.codex,
    });
  }

  // Line-count tip: keep concise (Codex best practices). 200-line figure from
  // secondary write-ups about Claude Code is NOT treated as a hard rule here.
  if (lines.length > 400) {
    f.push({
      rule: "AGENTS_VERY_LONG",
      severity: "warning",
      line: 1,
      message: `${lines.length} lines. OpenAI's Codex guidance says to keep AGENTS.md practical and short; move deep topic guides into linked Markdown files.`,
      fix: "Keep build/test/commands and non-negotiables here. Link to docs/ for architecture essays.",
      ref: REF.codexBest,
    });
  } else if (lines.length > 200) {
    f.push({
      rule: "AGENTS_LONG",
      severity: "tip",
      line: 1,
      message: `${lines.length} lines. A short, accurate AGENTS.md beats a long vague one (Codex best practices). Community write-ups also suggest keeping Claude Code context files around ~200 lines — treat that as a soft tip, not a formal limit.`,
      ref: REF.codexBest,
    });
  }

  // Recommended sections (convention only)
  const criticalIds = new Set(["overview", "build", "testing"]);
  const criticalMissing = missing.filter((id) => criticalIds.has(id));
  if (criticalMissing.length) {
    const labels = criticalMissing.map((id) => RECOMMENDED_SECTIONS.find((s) => s.id === id)!.label);
    f.push({
      rule: "AGENTS_MISSING_CORE_SECTIONS",
      severity: "warning",
      line: headings[0]?.line ?? 1,
      message: `No heading matched: ${labels.join(", ")}. agents.md lists these among popular choices; Codex best practices also call out build/test commands and "what done means".`,
      fix: "Add Markdown headings such as ## Setup commands, ## Testing instructions, ## Project overview. Any heading text is fine — there is no required schema.",
      ref: REF.site,
    });
  }
  const softMissing = missing.filter((id) => !criticalIds.has(id));
  if (softMissing.length && softMissing.length < RECOMMENDED_SECTIONS.length) {
    const labels = softMissing.map((id) => RECOMMENDED_SECTIONS.find((s) => s.id === id)!.label);
    f.push({
      rule: "AGENTS_MISSING_OPTIONAL_SECTIONS",
      severity: "tip",
      line: headings[0]?.line ?? 1,
      message: `Consider adding sections for: ${labels.join(", ")}. These are popular choices on agents.md / Codex docs, not required fields.`,
      ref: REF.site,
    });
  }

  if (!headings.length) {
    f.push({
      rule: "AGENTS_NO_HEADINGS",
      severity: "warning",
      line: 1,
      message: "No Markdown headings found. Headings make it easier for humans and agents to scan instructions.",
      fix: "Use ## Section titles for overview, commands, style, testing, security.",
      ref: REF.site,
    });
  }

  // Commands in fences — agents.md sample and Codex both show commands in fences
  const hasCommandCue = /(?:npm|pnpm|yarn|bun|make|cargo|go test|pytest|vitest|jest|docker|curl)\b/i.test(text);
  if ((present.includes("build") || present.includes("testing") || hasCommandCue) && !report.hasCodeFence) {
    f.push({
      rule: "AGENTS_COMMANDS_NOT_FENCED",
      severity: "tip",
      message: "Build/test guidance is easier for agents to copy when commands sit in fenced code blocks (as in the agents.md examples).",
      fix: "Wrap commands in ```bash ... ``` fences.",
      ref: REF.site,
    });
  }

  // Conflicting always/never on same short topic (heuristic tip)
  const always = [...text.matchAll(/\balways\s+([a-z][a-z0-9_-]*(?:\s+[a-z][a-z0-9_-]*){0,3})/gi)].map((m) => m[1].toLowerCase());
  const never = [...text.matchAll(/\bnever\s+([a-z][a-z0-9_-]*(?:\s+[a-z][a-z0-9_-]*){0,3})/gi)].map((m) => m[1].toLowerCase());
  for (const a of always) {
    const hit = never.find((n) => n === a || n.includes(a) || a.includes(n));
    if (hit) {
      f.push({
        rule: "AGENTS_CONFLICTING_ALWAYS_NEVER",
        severity: "tip",
        message: `Possible conflicting instructions: "always ${a}" and "never ${hit}". agents.md says the closest AGENTS.md wins and user chat prompts override everything — still worth clarifying.`,
        ref: REF.site,
      });
      break;
    }
  }

  // Claude Code interop tip (secondary ecosystem knowledge; phrased carefully)
  if (/\bclaude\b/i.test(text) && !/@AGENTS\.md/i.test(text)) {
    // only tip if they mention Claude without the import pattern — skip noise
  }
  if (!/@AGENTS\.md/i.test(text) && base === "AGENTS.md" && !normalized.includes("/")) {
    // Root AGENTS.md: tip once about Claude Code preferring CLAUDE.md
    f.push({
      rule: "AGENTS_CLAUDE_CODE_IMPORT",
      severity: "tip",
      line: 1,
      message: "Claude Code prefers CLAUDE.md when both exist. Teams that use Claude Code often keep a one-line CLAUDE.md that imports this file with `@AGENTS.md` so every agent shares one source.",
      fix: "Add a root CLAUDE.md containing: `@AGENTS.md`",
      // Not on agents.md itself — ecosystem practice. Link the open format hub.
      ref: REF.site,
    });
  }

  for (const s of SECRET_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (s.re.test(lines[i])) {
        f.push({ rule: s.rule, severity: "error", line: i + 1, message: s.message, fix: "Replace with a placeholder and document the env var name instead." });
        break;
      }
    }
  }

  // Vague-only body
  const nonEmpty = lines.filter((l) => l.trim() && !/^\s*#/.test(l)).length;
  if (nonEmpty < 3 && text.trim().length < 80) {
    f.push({
      rule: "AGENTS_TOO_THIN",
      severity: "warning",
      line: 1,
      message: "Very little guidance. Codex best practices recommend covering how to run the project, build/test/lint, conventions, and what \"done\" means.",
      ref: REF.codexBest,
    });
  }

  const { score, grade } = scoreFrom(f, present.length, RECOMMENDED_SECTIONS.length);
  report.score = score;
  report.grade = grade;
  report.findings = sortFindings(f);
  return report;
}

export interface BuildAgentsMdInput {
  projectName: string;
  overview: string;
  setupCommands: string;
  testCommands: string;
  codeStyle: string;
  security: string;
  prGuidelines: string;
  extra: string;
}

/** Build a conventional AGENTS.md matching agents.md popular sections + Codex tips. */
export function buildAgentsMd(b: BuildAgentsMdInput): string {
  const name = b.projectName.trim() || "this repository";
  const parts: string[] = [`# AGENTS.md`, "", `Instructions for AI coding agents working on ${name}.`, ""];

  const overview = b.overview.trim();
  if (overview) {
    parts.push("## Project overview", "", overview, "");
  }

  const setup = b.setupCommands.trim();
  if (setup) {
    parts.push("## Setup commands", "", "```bash", setup.replace(/\r\n/g, "\n"), "```", "");
  }

  const style = b.codeStyle.trim();
  if (style) {
    parts.push("## Code style", "", style, "");
  }

  const tests = b.testCommands.trim();
  if (tests) {
    parts.push("## Testing instructions", "", "```bash", tests.replace(/\r\n/g, "\n"), "```", "");
    parts.push("- Fix failing checks before finishing the task.", "- Add or update tests for code you change.", "");
  }

  const security = b.security.trim();
  if (security) {
    parts.push("## Security considerations", "", security, "");
  }

  const pr = b.prGuidelines.trim();
  if (pr) {
    parts.push("## Pull request guidelines", "", pr, "");
  }

  const extra = b.extra.trim();
  if (extra) {
    parts.push("## Extra instructions", "", extra, "");
  }

  return parts.join("\n").replace(/\n{3,}/g, "\n\n");
}
