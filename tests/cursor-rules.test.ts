import { describe, expect, it } from "vitest";
import { buildMdc, slugify, validateCursorRule, type RuleType } from "@/lib/cursor-rules";

const v = (t: string, filename = ".cursor/rules/x.mdc") => validateCursorRule(t, { filename });
const rules = (t: string, filename?: string) => v(t, filename).findings.map((f) => f.rule);

describe("rule type (cursor.com/docs/rules table)", () => {
  it.each<[string, RuleType]>([
    ["---\nalwaysApply: true\n---\n- rule", "always"],
    ["---\nglobs: src/components/**/*.tsx\nalwaysApply: false\n---\n- rule", "files"],
    ["---\ndescription: RPC service conventions and patterns for the backend\nalwaysApply: false\n---\n- rule", "intelligent"],
    ["---\nalwaysApply: false\n---\n- rule", "manual"],
  ])("%s", (text, type) => {
    const r = v(text);
    expect(r.type).toBe(type);
    expect(r.findings.filter((f) => f.severity === "error")).toEqual([]);
  });
});

describe("frontmatter checks", () => {
  it("catches field typos and non-boolean alwaysApply", () => {
    expect(rules("---\nglob: *.ts\nalwaysApply: yes\n---\nbody")).toEqual(expect.arrayContaining(["RULE_KEY_TYPO", "RULE_ALWAYS_APPLY_NOT_BOOLEAN"]));
    expect(rules("---\nalways_apply: true\n---\nbody")).toContain("RULE_KEY_TYPO");
  });
  it("warns about YAML list globs and parses them", () => {
    const r = v('---\nglobs: ["src/**/*.ts", "lib/**"]\nalwaysApply: false\n---\nbody');
    expect(r.globs).toEqual(["src/**/*.ts", "lib/**"]);
    expect(r.findings.map((f) => f.rule)).toContain("RULE_GLOBS_LIST");
    const r2 = v("---\nglobs:\n  - a/**\n  - b/**\nalwaysApply: false\n---\nbody");
    expect(r2.globs).toEqual(["a/**", "b/**"]);
  });
  it("gives glob tips", () => {
    expect(rules("---\nglobs: *.ts, /src/**, \nalwaysApply: false\n---\nbody")).toEqual(
      expect.arrayContaining(["RULE_GLOB_ROOT_ONLY", "RULE_GLOB_ABSOLUTE", "RULE_GLOBS_EMPTY_ITEM", "RULE_GLOBS_YAML_ALIAS"]),
    );
  });
  it("warns when alwaysApply makes globs pointless", () => {
    expect(rules("---\nglobs: src/**\nalwaysApply: true\n---\nbody")).toContain("RULE_ALWAYS_WITH_GLOBS");
  });
  it("handles missing or unclosed frontmatter and empty bodies", () => {
    expect(rules("just text")).toContain("RULE_NO_FRONTMATTER");
    expect(rules("---\nalwaysApply: true\nbody")).toContain("RULE_UNCLOSED_FRONTMATTER");
    expect(rules("---\nalwaysApply: true\n---\n\n")).toContain("RULE_EMPTY_BODY");
  });
  it("flags vague descriptions and long rules", () => {
    expect(rules("---\ndescription: React\nalwaysApply: false\n---\nbody")).toContain("RULE_DESCRIPTION_VAGUE");
    expect(rules("---\nalwaysApply: true\n---\n" + "- x\n".repeat(600))).toContain("RULE_TOO_LONG");
  });
});

describe("file names", () => {
  it("rejects .md files in .cursor/rules", () => {
    expect(rules("---\nalwaysApply: true\n---\nbody", ".cursor/rules/a.md")).toContain("RULE_WRONG_EXTENSION");
  });
  it("treats .cursorrules as legacy", () => {
    const r = v("Use TypeScript.", ".cursorrules");
    expect(r.mode).toBe("legacy");
    expect(r.findings.map((f) => f.rule)).toEqual(["LEGACY_CURSORRULES"]);
  });
});

describe("builder", () => {
  it.each<RuleType>(["always", "intelligent", "files", "manual"])("round-trips %s", (type) => {
    const out = buildMdc({ type, description: "Conventions for writing React components with hooks", globs: "src/**/*.tsx, src/**/*.ts", body: "- Use named exports" });
    const r = validateCursorRule(out, { filename: ".cursor/rules/react.mdc" });
    expect(r.type).toBe(type);
    expect(r.findings.filter((f) => f.severity !== "tip")).toEqual([]);
  });
  it("slugifies names", () => {
    expect(slugify("React Components!")).toBe("react-components");
  });
});
