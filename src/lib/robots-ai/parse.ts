/**
 * Minimal RFC 9309 robots.txt parser that keeps line numbers.
 * Also records the draft `Content-Usage` rule (draft-ietf-aipref-attach).
 */
export type RuleKind = "allow" | "disallow" | "content-usage";

export interface RobotsRule {
  kind: RuleKind;
  /** Path pattern. For content-usage, "" means the rule has no path (applies to "/"). */
  path: string;
  /** Raw preference text for content-usage. */
  value?: string;
  line: number;
}

export interface RobotsGroup {
  /** As written. */
  agents: string[];
  agentLines: number[];
  rules: RobotsRule[];
  startLine: number;
}

export interface RobotsLine {
  line: number;
  key: string;
  value: string;
  raw: string;
}

export interface ParsedRobots {
  groups: RobotsGroup[];
  /** Lines that did not belong to a group or were not group rules. */
  other: RobotsLine[];
  /** Rules that appeared before any User-agent line. */
  orphanRules: RobotsLine[];
  /** Non-empty, non-comment lines without a colon. */
  malformed: { line: number; raw: string }[];
}

const GROUP_RULES = new Set(["allow", "disallow", "content-usage"]);

export function stripComment(s: string): string {
  const i = s.indexOf("#");
  return i === -1 ? s : s.slice(0, i);
}

export function parseRobots(text: string): ParsedRobots {
  const out: ParsedRobots = { groups: [], other: [], orphanRules: [], malformed: [] };
  const lines = text.replace(/^\uFEFF/, "").split(/\r\n|\r|\n/);
  let cur: RobotsGroup | null = null;
  let lastWasAgent = false;

  lines.forEach((raw, i) => {
    const line = i + 1;
    const body = stripComment(raw).trim();
    if (!body) return;
    const c = body.indexOf(":");
    if (c === -1) { out.malformed.push({ line, raw }); return; }
    const key = body.slice(0, c).trim().toLowerCase();
    const value = body.slice(c + 1).trim();

    if (key === "user-agent") {
      if (!cur || !lastWasAgent) {
        cur = { agents: [], agentLines: [], rules: [], startLine: line };
        out.groups.push(cur);
      }
      cur.agents.push(value);
      cur.agentLines.push(line);
      lastWasAgent = true;
      return;
    }
    lastWasAgent = false;

    if (GROUP_RULES.has(key)) {
      if (!cur) { out.orphanRules.push({ line, key, value, raw }); return; }
      if (key === "content-usage") {
        const { path, pref } = splitContentUsage(value);
        cur.rules.push({ kind: "content-usage", path, value: pref, line });
      } else {
        cur.rules.push({ kind: key as RuleKind, path: value, line });
      }
      return;
    }
    out.other.push({ line, key, value, raw });
  });
  return out;
}

/**
 * draft-ietf-aipref-attach: if the value starts with "/", the path runs to the
 * first space or tab and the rest is the usage preference. Otherwise the whole
 * value is the preference.
 */
export function splitContentUsage(value: string): { path: string; pref: string } {
  if (value.startsWith("/")) {
    const m = /^(\S+)[ \t]+(.*)$/.exec(value);
    if (!m) return { path: value, pref: "" };
    return { path: m[1], pref: m[2].trim() };
  }
  return { path: "", pref: value };
}

/** RFC 9309 product-token match, case-insensitive. */
export function agentMatches(written: string, token: string): boolean {
  return written.trim().toLowerCase() === token.toLowerCase();
}

/** All groups that name `token` exactly (merged per RFC 9309), or null. */
export function groupsFor(p: ParsedRobots, token: string): RobotsGroup[] {
  return p.groups.filter((g) => g.agents.some((a) => agentMatches(a, token)));
}

export function wildcardGroups(p: ParsedRobots): RobotsGroup[] {
  return p.groups.filter((g) => g.agents.some((a) => a.trim() === "*"));
}

/** Convert an RFC 9309 path pattern (with * and $) to a RegExp. */
function patternToRegex(pattern: string): RegExp {
  let src = "";
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  for (const ch of body) src += ch === "*" ? ".*" : ch.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("^" + src + (anchored ? "$" : ""));
}

export function pathMatches(pattern: string, path: string): boolean {
  if (!pattern) return false;
  return patternToRegex(pattern).test(path);
}

/** Longest-match decision for allow/disallow. Allow wins ties. No match = allowed. */
export function isAllowed(rules: RobotsRule[], path: string): { allowed: boolean; rule?: RobotsRule } {
  let best: RobotsRule | undefined;
  for (const r of rules) {
    if (r.kind === "content-usage" || !r.path) continue;
    if (!pathMatches(r.path, path)) continue;
    if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.kind === "allow" && best.kind === "disallow")) best = r;
  }
  return { allowed: !best || best.kind === "allow", rule: best };
}
