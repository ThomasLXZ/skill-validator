import { describe, expect, it } from "vitest";
import { checkRobots } from "@/lib/robots-ai/check";
import { parseAipref, combinePrefs } from "@/lib/robots-ai/aipref";
import { splitContentUsage, isAllowed, parseRobots } from "@/lib/robots-ai/parse";
import { generateRobots, defaultOptions, presetAccess } from "@/lib/robots-ai/generate";
import { checkLlmsTxt } from "@/lib/robots-ai/llms";

const rules = (r: ReturnType<typeof checkRobots>) => r.findings.map((f) => f.rule);
const status = (r: ReturnType<typeof checkRobots>, t: string) => r.crawlers.find((c) => c.crawler.token === t)!;

describe("robots.txt parsing (RFC 9309)", () => {
  it("uses longest match and lets Allow win ties", () => {
    const g = parseRobots("User-agent: *\nDisallow: /a\nAllow: /a/b\nDisallow: /x\nAllow: /x").groups[0].rules;
    expect(isAllowed(g, "/a/c").allowed).toBe(false);
    expect(isAllowed(g, "/a/b/c").allowed).toBe(true);
    expect(isAllowed(g, "/x").allowed).toBe(true);
  });
  it("supports * and $ in patterns", () => {
    const g = parseRobots("User-agent: *\nDisallow: /*.pdf$").groups[0].rules;
    expect(isAllowed(g, "/docs/a.pdf").allowed).toBe(false);
    expect(isAllowed(g, "/docs/a.pdf?x=1").allowed).toBe(true);
  });
  it("groups consecutive user-agent lines and matches tokens case-insensitively", () => {
    const r = checkRobots("User-agent: gptbot\nUser-agent: CLAUDEBOT\nDisallow: /\n\nUser-agent: *\nAllow: /");
    expect(status(r, "GPTBot")).toMatchObject({ status: "blocked", via: "own" });
    expect(status(r, "ClaudeBot").status).toBe("blocked");
    expect(status(r, "OAI-SearchBot")).toMatchObject({ status: "allowed", via: "wildcard" });
  });
  it("reports partial access", () => {
    const r = checkRobots("User-agent: GPTBot\nDisallow: /private/");
    expect(status(r, "GPTBot").status).toBe("partial");
    expect(status(r, "ClaudeBot").via).toBe("none");
  });
});

describe("AI crawler findings", () => {
  it("flags inconsistent training opt-outs", () => {
    expect(rules(checkRobots("User-agent: GPTBot\nDisallow: /"))).toContain("AI_TRAINING_INCONSISTENT");
  });
  it("warns that * Disallow: / also blocks search engines", () => {
    expect(rules(checkRobots("User-agent: *\nDisallow: /"))).toContain("ROBOTS_WILDCARD_BLOCKS_ALL");
  });
  it("notes legacy tokens and user-initiated agents", () => {
    const r = rules(checkRobots("User-agent: anthropic-ai\nUser-agent: ChatGPT-User\nDisallow: /"));
    expect(r).toContain("ROBOTS_LEGACY_TOKEN");
    expect(r).toContain("ROBOTS_USER_AGENT_MAY_IGNORE");
  });
  it("catches typos, missing colons and rules outside groups", () => {
    const r = rules(checkRobots("Disallow: /x\nUser-agent: *\nDissallow: /\nnonsense line"));
    expect(r).toEqual(expect.arrayContaining(["ROBOTS_RULE_OUTSIDE_GROUP", "ROBOTS_TYPO", "ROBOTS_MISSING_COLON"]));
  });
  it("flags blocked AI search crawlers as a tip", () => {
    expect(rules(checkRobots("User-agent: OAI-SearchBot\nDisallow: /"))).toContain("AI_SEARCH_BLOCKED");
  });
});

describe("IETF aipref vocabulary", () => {
  it("parses y/n tokens and treats everything else as unknown", () => {
    expect(parseAipref("train-ai=n, search=y").prefs).toEqual({ "train-ai": "disallow", "ai-use": "unknown", search: "allow" });
    const p = parseAipref('train-ai=y, train-ai, search=n, search="n"');
    expect(p.prefs).toEqual({ "train-ai": "unknown", "ai-use": "unknown", search: "unknown" });
    expect(p.duplicateKeys).toEqual(["train-ai", "search"]);
  });
  it("fails the whole dictionary on uppercase keys", () => {
    const p = parseAipref("Train-AI=n");
    expect(p.ok).toBe(false);
    expect(p.prefs["train-ai"]).toBe("unknown");
  });
  it("ignores parameters and unknown labels", () => {
    const p = parseAipref("train-ai;allow=n, train-ai=y, foo=n");
    expect(p.prefs["train-ai"]).toBe("allow");
    expect(p.unknownKeys).toEqual(["foo"]);
  });
  it("combines statements with disallow winning", () => {
    const a = parseAipref("train-ai=y, search=y").prefs, b = parseAipref("train-ai=n").prefs;
    expect(combinePrefs([a, b])).toEqual({ "train-ai": "disallow", "ai-use": "unknown", search: "allow" });
  });
});

describe("Content-Usage in robots.txt (draft-ietf-aipref-attach)", () => {
  it("splits an optional path from the preference", () => {
    expect(splitContentUsage("/ai-ok/ train-ai=y")).toEqual({ path: "/ai-ok/", pref: "train-ai=y" });
    expect(splitContentUsage("train-ai=n")).toEqual({ path: "", pref: "train-ai=n" });
  });
  it("evaluates the draft's own example", () => {
    const r = checkRobots("User-Agent: *\nAllow: /\nContent-Usage: train-ai=n\nContent-Usage: /ai-ok/ train-ai=y\n\nUser-Agent: ExampleBot\nAllow: /\nContent-Usage: train-ai=y");
    expect(r.contentUsage).toHaveLength(3);
    expect(r.contentUsage[1]).toMatchObject({ path: "/ai-ok/", prefs: { "train-ai": "allow" } });
    expect(status(r, "GPTBot").rootPrefs["train-ai"]).toBe("disallow");
    expect(r.findings.filter((f) => f.rule.startsWith("CU_"))).toEqual([]);
  });
  it("reports uppercase keys, unknown labels, bad values and empty values", () => {
    const r = rules(checkRobots("User-agent: *\nAllow: /\nContent-Usage: Train-AI=n\nContent-Usage: ai-train=no\nContent-Usage: train-ai=yes\nContent-Usage: /x/"));
    expect(r).toEqual(expect.arrayContaining(["CU_UPPERCASE_KEY", "CU_UNKNOWN_LABEL", "CU_BAD_VALUE", "CU_EMPTY"]));
  });
  it("notes that preferences on disallowed paths do nothing", () => {
    expect(rules(checkRobots("User-agent: *\nDisallow: /private/\nContent-Usage: /private/ train-ai=n"))).toContain("CU_PATH_DISALLOWED");
  });
});

describe("__usage_ai-training policy token (draft-kelley)", () => {
  it("reads Figure 1 of the draft as against, with an exception", () => {
    const r = checkRobots("User-Agent: __usage_ai-training\nDisallow: /\nAllow: /press-kit/");
    expect(r.policyToken).toMatchObject({ present: true, root: "against" });
    expect(r.policyToken.exceptions).toEqual([{ path: "/press-kit/", kind: "allow", line: 3 }]);
    expect(rules(r)).not.toContain("PT_PARTIAL_GROUP");
  });
  it("warns that a partial group implies a preference in favor elsewhere", () => {
    expect(rules(checkRobots("User-Agent: __usage_ai-training\nDisallow: /blog/"))).toContain("PT_PARTIAL_GROUP");
  });
  it("is never matched by User-agent: *", () => {
    const r = checkRobots("User-agent: *\nDisallow: /");
    expect(r.policyToken.present).toBe(false);
    expect(rules(r)).toContain("PT_WILDCARD_NOT_A_PREFERENCE");
  });
});

describe("robots.txt generator", () => {
  it("blocks training crawlers and keeps search crawlers open by default", () => {
    const txt = generateRobots({ ...defaultOptions(), sitemap: "https://example.com/sitemap.xml" });
    const r = checkRobots(txt);
    expect(status(r, "GPTBot").status).toBe("blocked");
    expect(status(r, "Google-Extended").status).toBe("blocked");
    expect(status(r, "OAI-SearchBot").status).toBe("allowed");
    expect(r.policyToken.root).toBe("against");
    expect(r.sitemaps).toEqual(["https://example.com/sitemap.xml"]);
    expect(r.findings.filter((f) => f.severity !== "tip")).toEqual([]);
  });
  it("can block every AI crawler and omit drafts", () => {
    const txt = generateRobots({ access: presetAccess("block-all-ai"), contentUsage: {}, policyToken: "none", policyTokenAllow: [], sitemap: "" });
    expect(txt).not.toContain("Content-Usage");
    expect(txt).not.toContain("__usage_ai-training");
    expect(status(checkRobots(txt), "PerplexityBot").status).toBe("blocked");
  });
});

describe("llms.txt", () => {
  it("accepts the llmstxt.org example", () => {
    const r = checkLlmsTxt("# Title\n\n> Optional description goes here\n\nOptional details go here\n\n## Section name\n\n- [Link title](https://link_url): Optional link details\n\n## Optional\n\n- [Link title](https://link_url)\n");
    expect(r.findings).toEqual([]);
    expect(r.title).toBe("Title");
    expect(r.linkCount).toBe(2);
  });
  it("requires an H1 and well-formed list items", () => {
    const r = checkLlmsTxt("## Docs\n- Getting started: https://x.dev\n### Sub");
    expect(r.findings.map((f) => f.rule)).toEqual(expect.arrayContaining(["LLMS_NO_H1", "LLMS_BAD_LIST_ITEM"]));
  });
});
