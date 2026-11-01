import type { Check, CheckContext, Issue, Report, Severity, SkillBundle, ValidateOptions } from "./types";
import { parseSkillMd } from "./parse";
import { frontmatterCheck } from "./checks/frontmatter";
import { nameCheck } from "./checks/name";
import { descriptionCheck } from "./checks/description";
import { bodyCheck, estimateTokens } from "./checks/body";
import { referencesCheck } from "./checks/references";
import { structureCheck } from "./checks/structure";
import { securityCheck } from "./checks/security";

export * from "./types";
export * from "./bundle";
export { parseSkillMd } from "./parse";

/** Order matters: references populates ctx.referenced, structure consumes it. */
export const CHECKS: Check[] = [
  frontmatterCheck, nameCheck, descriptionCheck, bodyCheck, referencesCheck, structureCheck, securityCheck,
];

export const PENALTY: Record<Severity, number> = { error: 20, warning: 7, tip: 2 };
const SEVERITY_ORDER: Record<Severity, number> = { error: 0, warning: 1, tip: 2 };

export function scoreIssues(issues: Issue[]): number {
  let s = 100;
  for (const i of issues) s -= PENALTY[i.severity];
  // tips alone never drop a skill below 85; any error caps it at 59 (F/D range)
  const hasError = issues.some((i) => i.severity === "error");
  const onlyTips = issues.every((i) => i.severity === "tip");
  if (onlyTips) s = Math.max(s, 85);
  if (hasError) s = Math.min(s, 59);
  return Math.max(0, Math.min(100, Math.round(s)));
}

function grade(score: number): Report["grade"] {
  return score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
}

/** Run all Layer-1 static checks. Pure, synchronous, no network. */
export function validateSkill(bundle: SkillBundle, opts: ValidateOptions = {}): Report {
  const options: Required<ValidateOptions> = { target: opts.target ?? "portable" };
  const issues: Issue[] = [...bundle.loadIssues];
  const raw = bundle.skillMd;
  const { parsed, issues: parseIssues } = raw !== undefined
    ? parseSkillMd(raw)
    : { parsed: { hasFrontmatter: false, body: "", bodyStartLine: 1 }, issues: [] as Issue[] };
  issues.push(...parseIssues);

  const ctx: CheckContext = { bundle, parsed, options, referenced: new Set() };
  if (raw !== undefined) for (const c of CHECKS) issues.push(...c(ctx));

  issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  const counts = { error: 0, warning: 0, tip: 0 } as Record<Severity, number>;
  for (const i of issues) counts[i.severity]++;
  const score = scoreIssues(issues);
  const desc = typeof parsed.frontmatter?.description === "string" ? parsed.frontmatter.description.trim() : "";
  return {
    score,
    grade: grade(score),
    passed: counts.error === 0,
    counts,
    issues,
    parsed,
    target: options.target,
    stats: {
      bodyLines: parsed.body ? parsed.body.split("\n").length : 0,
      bodyChars: parsed.body.length,
      approxBodyTokens: estimateTokens(parsed.body),
      descriptionChars: desc.length,
      fileCount: bundle.files.size,
      referencedFiles: [...ctx.referenced].sort(),
    },
  };
}
