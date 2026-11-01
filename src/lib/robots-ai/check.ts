import { editDistance, sortFindings, type Finding } from "../common/finding";
import { AI_CRAWLERS, POLICY_TOKEN, type AiCrawler } from "./crawlers";
import { parseAipref, UNKNOWN, type PrefSet } from "./aipref";
import { groupsFor, isAllowed, parseRobots, pathMatches, wildcardGroups, type ParsedRobots, type RobotsGroup, type RobotsRule } from "./parse";
import { SRC } from "./sources";

export type AccessStatus = "allowed" | "partial" | "blocked";

export interface CrawlerResult {
  crawler: AiCrawler;
  status: AccessStatus;
  /** "own" = a group names this token, "wildcard" = falls back to `User-agent: *`, "none" = no group applies. */
  via: "own" | "wildcard" | "none";
  line?: number;
  /** Content-Usage preferences that apply at "/" for this crawler (attach draft). */
  rootPrefs: PrefSet;
}

export interface ContentUsageEntry {
  line: number;
  agents: string[];
  path: string;
  raw: string;
  prefs: PrefSet;
  ok: boolean;
}

export interface PolicyTokenResult {
  present: boolean;
  /** Preference at "/" for AI training under draft-kelley: allowed path = in favor. */
  root?: "against" | "in favor";
  exceptions: { path: string; kind: "allow" | "disallow"; line: number }[];
  line?: number;
}

export interface RobotsReport {
  findings: Finding[];
  crawlers: CrawlerResult[];
  contentUsage: ContentUsageEntry[];
  policyToken: PolicyTokenResult;
  contentSignal: { line: number; value: string }[];
  sitemaps: string[];
  groupCount: number;
  empty: boolean;
}

const KNOWN_KEYS = ["user-agent", "allow", "disallow", "sitemap", "crawl-delay", "host", "content-usage", "content-signal", "clean-param", "request-rate", "visit-time"];

function rulesOf(groups: RobotsGroup[]): RobotsRule[] {
  return groups.flatMap((g) => g.rules);
}

/** Groups that apply to a token per RFC 9309: exact groups, else `*`. */
export function effectiveGroups(p: ParsedRobots, token: string): { groups: RobotsGroup[]; via: CrawlerResult["via"] } {
  const own = groupsFor(p, token);
  if (own.length) return { groups: own, via: "own" };
  const wild = wildcardGroups(p);
  if (wild.length) return { groups: wild, via: "wildcard" };
  return { groups: [], via: "none" };
}

/** draft-ietf-aipref-attach: longest matching Content-Usage rule, only on crawlable paths. */
export function contentUsageAt(rules: RobotsRule[], path: string): PrefSet {
  if (!isAllowed(rules, path).allowed) return { ...UNKNOWN };
  let best: RobotsRule | undefined;
  for (const r of rules) {
    if (r.kind !== "content-usage") continue;
    const pat = r.path || "/";
    if (!pathMatches(pat, path)) continue;
    if (!best || pat.length >= (best.path || "/").length) best = r;
  }
  return best ? parseAipref(best.value ?? "").prefs : { ...UNKNOWN };
}

function accessStatus(rules: RobotsRule[]): AccessStatus {
  const root = isAllowed(rules, "/").allowed;
  const blocks = rules.filter((r) => r.kind === "disallow" && r.path);
  const allows = rules.filter((r) => r.kind === "allow" && r.path && r.path !== "/");
  if (!root) return allows.length ? "partial" : "blocked";
  return blocks.length ? "partial" : "allowed";
}

export function checkRobots(text: string): RobotsReport {
  const p = parseRobots(text);
  const f: Finding[] = [];
  const empty = !text.trim();

  // --- syntax ---
  for (const m of p.malformed)
    f.push({ rule: "ROBOTS_MISSING_COLON", severity: "warning", line: m.line, message: `Line ${m.line} has no colon, so crawlers ignore it.`, fix: "Write rules as `Field: value`, e.g. `Disallow: /private/`.", ref: SRC.rfc9309 });
  for (const o of p.orphanRules)
    f.push({ rule: "ROBOTS_RULE_OUTSIDE_GROUP", severity: "warning", line: o.line, message: `\`${o.key}\` appears before any User-agent line, so it applies to no crawler.`, fix: "Put a `User-agent:` line above it.", ref: o.key === "content-usage" ? SRC.attach : SRC.rfc9309 });
  for (const o of p.other) {
    if (KNOWN_KEYS.includes(o.key)) continue;
    const near = KNOWN_KEYS.find((k) => editDistance(k, o.key) <= 2);
    f.push(near
      ? { rule: "ROBOTS_TYPO", severity: "warning", line: o.line, message: `Unknown field \`${o.key}\`. Did you mean \`${near}\`?`, fix: `Rename it to \`${near}\`. Crawlers skip fields they don't know.`, ref: SRC.rfc9309 }
      : { rule: "ROBOTS_UNKNOWN_FIELD", severity: "tip", line: o.line, message: `\`${o.key}\` is not a field most crawlers understand. It will probably be ignored.`, ref: SRC.rfc9309 });
  }
  for (const g of p.groups) {
    g.agents.forEach((a, i) => {
      if (!a) f.push({ rule: "ROBOTS_EMPTY_USER_AGENT", severity: "warning", line: g.agentLines[i], message: "Empty `User-agent:` value. It matches no crawler.", ref: SRC.rfc9309 });
      else if (/[\/\s]/.test(a.trim()) && a.trim() !== "*")
        f.push({ rule: "ROBOTS_USER_AGENT_NOT_TOKEN", severity: "warning", line: g.agentLines[i], message: `\`${a}\` looks like a full user-agent string. RFC 9309 crawlers match only the product token.`, fix: `Use just the token, e.g. \`${a.trim().split(/[\/\s]/)[0]}\`.`, ref: SRC.rfc9309 });
    });
  }

  // --- per crawler ---
  const crawlers: CrawlerResult[] = AI_CRAWLERS.map((c) => {
    const { groups, via } = effectiveGroups(p, c.token);
    const rules = rulesOf(groups);
    const own = groupsFor(p, c.token);
    return { crawler: c, status: groups.length ? accessStatus(rules) : "allowed", via, line: own[0]?.agentLines[own[0].agents.findIndex((a) => a.trim().toLowerCase() === c.token.toLowerCase())], rootPrefs: contentUsageAt(rules, "/") };
  });

  for (const r of crawlers) {
    if (r.crawler.legacy && r.via === "own")
      f.push({ rule: "ROBOTS_LEGACY_TOKEN", severity: "tip", line: r.line, message: `\`${r.crawler.token}\` is not in ${r.crawler.owner}'s current crawler documentation.`, fix: r.crawler.note, ref: r.crawler.ref });
    if (r.crawler.mayIgnoreRobots && r.status !== "allowed")
      f.push({ rule: "ROBOTS_USER_AGENT_MAY_IGNORE", severity: "tip", line: r.line, message: `${r.crawler.token} fetches pages on behalf of a user. ${r.crawler.owner} says robots.txt may not apply to it.`, fix: "Use authentication or server-side blocking if this content must not be fetched.", ref: r.crawler.ref });
  }

  const training = crawlers.filter((r) => r.crawler.purpose === "training" && !r.crawler.legacy);
  const blockedT = training.filter((r) => r.status === "blocked");
  const openT = training.filter((r) => r.status === "allowed");
  if (blockedT.length && openT.length)
    f.push({ rule: "AI_TRAINING_INCONSISTENT", severity: "warning", message: `You block ${blockedT.length} AI training ${blockedT.length === 1 ? "crawler" : "crawlers"} but still allow ${openT.map((r) => r.crawler.token).join(", ")}.`, fix: "If you meant to opt out of AI training, add a group for each of these tokens with `Disallow: /`. The Generate tab builds this for you.", ref: SRC.rfc9309 });

  const searchBlocked = crawlers.filter((r) => r.crawler.purpose === "search" && r.status === "blocked");
  if (searchBlocked.length)
    f.push({ rule: "AI_SEARCH_BLOCKED", severity: "tip", message: `${searchBlocked.map((r) => r.crawler.token).join(", ")} ${searchBlocked.length === 1 ? "is" : "are"} blocked, so your pages can't be cited in those AI search products.`, fix: "To opt out of training but stay in AI search, block only the training crawlers (GPTBot, ClaudeBot, Google-Extended, ...) and allow OAI-SearchBot, Claude-SearchBot and PerplexityBot.", ref: SRC.openaiBots });

  const wild = rulesOf(wildcardGroups(p));
  if (wildcardGroups(p).length && !isAllowed(wild, "/").allowed && !wild.some((r) => r.kind === "allow" && r.path && r.path !== "/"))
    f.push({ rule: "ROBOTS_WILDCARD_BLOCKS_ALL", severity: "warning", line: wildcardGroups(p)[0].startLine, message: "`User-agent: *` with `Disallow: /` blocks every crawler without its own group, including search engines like Googlebot and Bingbot.", fix: "If you only want to block AI crawlers, name each one and keep `User-agent: *` with `Allow: /`.", ref: SRC.rfc9309 });

  // --- Content-Usage (draft-ietf-aipref-attach) ---
  const contentUsage: ContentUsageEntry[] = [];
  for (const g of p.groups) {
    for (const r of g.rules) {
      if (r.kind !== "content-usage") continue;
      const raw = r.value ?? "";
      const a = parseAipref(raw);
      contentUsage.push({ line: r.line, agents: g.agents, path: r.path || "/", raw, prefs: a.prefs, ok: a.ok });
      if (!raw) {
        f.push({ rule: "CU_EMPTY", severity: "error", line: r.line, message: "Content-Usage has no preference after the path.", fix: "Add a preference after a space, e.g. `Content-Usage: /blog/ train-ai=n`.", ref: SRC.attach });
        continue;
      }
      if (!a.ok) {
        const upper = /[A-Z]/.test(raw.split(/[=,;]/)[0] ?? "") || /(^|,\s*)[^=,]*[A-Z][^=,]*=/.test(raw);
        f.push(upper
          ? { rule: "CU_UPPERCASE_KEY", severity: "error", line: r.line, message: "Content-Usage keys are case-sensitive. An uppercase key makes the whole value fail to parse, so every preference becomes unknown.", fix: `Use lowercase: \`${raw.replace(/[A-Za-z-]+(?==)/g, (k) => k.toLowerCase())}\``, ref: SRC.vocab }
          : { rule: "CU_PARSE_ERROR", severity: "error", line: r.line, message: `Content-Usage value is not a valid Structured Fields dictionary (${a.error}). All preferences are unknown.`, fix: "Use the form `train-ai=n, search=y`.", ref: SRC.vocab });
        continue;
      }
      for (const k of a.unknownKeys) {
        const hint = k === "ai-train" || k === "ai-training" || k === "train_ai" || k === "training" ? " Cloudflare's Content-Signal uses `ai-train`, but the IETF label is `train-ai`." : "";
        f.push({ rule: "CU_UNKNOWN_LABEL", severity: "warning", line: r.line, message: `\`${k}\` is not an aipref label, so it is ignored.${hint}`, fix: "The vocabulary defines `train-ai`, `ai-use` and `search`.", ref: SRC.vocab });
      }
      for (const b of a.badValues)
        f.push({ rule: "CU_BAD_VALUE", severity: "warning", line: r.line, message: `\`${b.key}\` has the value ${b.shown}. Only the tokens \`y\` and \`n\` count; anything else means "unknown".`, fix: `Write \`${b.key}=y\` or \`${b.key}=n\`.`, ref: SRC.vocab });
      for (const k of a.duplicateKeys)
        f.push({ rule: "CU_DUPLICATE_KEY", severity: "warning", line: r.line, message: `\`${k}\` appears more than once. Only the last value counts.`, ref: SRC.vocab });
      if (r.path && !isAllowed(g.rules, r.path).allowed)
        f.push({ rule: "CU_PATH_DISALLOWED", severity: "tip", line: r.line, message: `${r.path} is disallowed in this group, so this Content-Usage rule has no effect. Preferences only apply to paths crawlers may fetch.`, ref: SRC.attach });
    }
  }

  // --- __usage_ai-training (draft-kelley) ---
  const tokenGroups = groupsFor(p, POLICY_TOKEN);
  const policyToken: PolicyTokenResult = { present: tokenGroups.length > 0, exceptions: [] };
  if (tokenGroups.length) {
    const rules = rulesOf(tokenGroups);
    policyToken.line = tokenGroups[0].startLine;
    policyToken.root = isAllowed(rules, "/").allowed ? "in favor" : "against";
    policyToken.exceptions = rules.filter((r) => (r.kind === "allow" || r.kind === "disallow") && r.path && r.path !== "/").map((r) => ({ path: r.path, kind: r.kind as "allow" | "disallow", line: r.line }));
    const allowRules = rules.filter((r) => r.kind !== "content-usage" && r.path);
    if (!allowRules.length)
      f.push({ rule: "PT_EMPTY_GROUP", severity: "warning", line: policyToken.line, message: `The \`${POLICY_TOKEN}\` group has no rules, which reads as a preference in favor of AI training on every path.`, fix: "To opt out of training, add `Disallow: /`.", ref: SRC.token });
    else if (policyToken.root === "in favor" && policyToken.exceptions.some((e) => e.kind === "disallow"))
      f.push({ rule: "PT_PARTIAL_GROUP", severity: "warning", line: policyToken.line, message: `This \`${POLICY_TOKEN}\` group only opts some paths out. Every other path reads as a preference in favor of AI training.`, fix: "If you want to opt out everywhere except a few paths, use `Disallow: /` plus `Allow:` lines for the exceptions.", ref: SRC.token });
    for (const g of tokenGroups)
      if (g.agents.length > 1)
        f.push({ rule: "PT_SHARED_GROUP", severity: "tip", line: g.startLine, message: `\`${POLICY_TOKEN}\` shares a group with ${g.agents.filter((a) => a.toLowerCase() !== POLICY_TOKEN).join(", ")}. Those crawlers get the same Allow/Disallow rules as crawl directives.`, fix: "Give the policy token its own group so training preferences and crawl access stay independent.", ref: SRC.token });
  } else if (wildcardGroups(p).length && !isAllowed(wild, "/").allowed) {
    f.push({ rule: "PT_WILDCARD_NOT_A_PREFERENCE", severity: "tip", message: `Under the draft shared-token proposal, \`User-agent: *\` never matches \`${POLICY_TOKEN}\`, so this file expresses no AI training preference through it.`, ref: SRC.token });
  }

  const contentSignal = p.other.filter((o) => o.key === "content-signal").map((o) => ({ line: o.line, value: o.value }));
  for (const c of contentSignal)
    f.push({ rule: "CONTENT_SIGNAL_NOT_IETF", severity: "tip", line: c.line, message: "`Content-Signal` is Cloudflare's format, not the IETF aipref one. It is fine to keep, but crawlers that implement the IETF drafts look for `Content-Usage` or the shared policy token.", ref: SRC.attach });

  if (!empty && !p.groups.length)
    f.push({ rule: "ROBOTS_NO_GROUPS", severity: "warning", message: "No `User-agent:` lines found, so nothing here applies to any crawler.", ref: SRC.rfc9309 });

  return {
    findings: sortFindings(f),
    crawlers,
    contentUsage,
    policyToken,
    contentSignal,
    sitemaps: p.other.filter((o) => o.key === "sitemap").map((o) => o.value),
    groupCount: p.groups.length,
    empty,
  };
}
