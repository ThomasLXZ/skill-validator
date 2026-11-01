import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import fs from "node:fs";
import path from "node:path";
import { bundleFromText, bundleFromZip, validateSkill, parseSkillMd } from "@/lib/validator";
import { suggestName } from "@/lib/validator/checks/name";
import { hasTriggerClause } from "@/lib/validator/checks/description";
import { extractRefs, resolveRef } from "@/lib/validator/checks/references";
import { canSimulate } from "@/lib/trigger-sim/types";
import { FIXTURES, loadFixture, rules } from "./helpers";

const md = (fm: string, body = "# Title\n\n## Steps\n\n1. Do the thing carefully and report results back to the user.\n") =>
  `---\n${fm}\n---\n${body}`;
const GOOD_DESC = "description: Extracts text and tables from PDF files and merges documents. Use when the user mentions PDFs or forms.";

describe("good fixtures", () => {
  it("processing-pdfs (folder) has no errors or warnings and scores A", () => {
    const r = validateSkill(loadFixture("good/processing-pdfs"));
    expect(r.issues.filter((i) => i.severity !== "tip")).toEqual([]);
    expect(r.passed).toBe(true);
    expect(r.grade).toBe("A");
    expect(r.stats.referencedFiles).toEqual(expect.arrayContaining(["references/FORMS.md", "scripts/fill_form.py"]));
  });
  it("writing-commit-messages (paste) scores 100", () => {
    const text = fs.readFileSync(path.join(FIXTURES, "good/writing-commit-messages/SKILL.md"), "utf8");
    const r = validateSkill(bundleFromText(text));
    expect(r.issues).toEqual([]);
    expect(r.score).toBe(100);
  });
});

describe("bad fixtures", () => {
  it("no-frontmatter", () => {
    const r = validateSkill(loadFixture("bad/no-frontmatter"));
    expect(rules(r)).toContain("FM_MISSING");
    expect(r.passed).toBe(false);
    expect(r.score).toBeLessThan(60);
  });
  it("bad-name: charset, double hyphen, edge hyphen, reserved word, dir mismatch", () => {
    const r = validateSkill(loadFixture("bad/bad-name"));
    expect(rules(r)).toEqual(expect.arrayContaining(["NAME_CHARSET", "NAME_DOUBLE_HYPHEN", "NAME_HYPHEN_EDGE", "NAME_RESERVED_WORD", "NAME_DIR_MISMATCH"]));
    const charset = r.issues.find((i) => i.rule === "NAME_CHARSET")!;
    expect(charset.fix).toContain("claude-pdf-helper");
  });
  it("vague-description: short, no when, first person, time-sensitive, windows path", () => {
    const r = validateSkill(loadFixture("bad/vague-description"));
    expect(rules(r)).toEqual(expect.arrayContaining(["DESC_TOO_SHORT", "DESC_NO_WHEN", "DESC_POINT_OF_VIEW", "BODY_TIME_SENSITIVE", "BODY_WINDOWS_PATH"]));
    expect(r.passed).toBe(true); // warnings only
    expect(r.score).toBeLessThan(80);
  });
  it("missing-references: broken links, case mismatch, absolute path, anchor, orphan script", () => {
    const r = validateSkill(loadFixture("bad/missing-references"));
    const ids = rules(r);
    expect(ids).toEqual(expect.arrayContaining(["REF_MISSING_FILE", "REF_CASE_MISMATCH", "REF_ABSOLUTE_PATH", "REF_BROKEN_ANCHOR", "SCRIPT_UNREFERENCED"]));
    const missing = r.issues.filter((i) => i.rule === "REF_MISSING_FILE").map((i) => i.message).join("\n");
    expect(missing).toContain("scripts/analyze.py");
    expect(missing).toContain("reference/api.md");
    expect(missing).toContain("EXAMPLES.md");
    expect(r.passed).toBe(false);
  });
  it("invalid-yaml: unquoted colon", () => {
    const r = validateSkill(loadFixture("bad/invalid-yaml"));
    expect(rules(r)).toContain("FM_YAML_INVALID");
  });
  it("unknown-keys: portable vs claude-code target", () => {
    const b = loadFixture("bad/unknown-keys");
    const p = validateSkill(b, { target: "portable" });
    expect(rules(p)).toEqual(expect.arrayContaining(["FM_UNKNOWN_KEY", "FM_CLAUDE_CODE_ONLY_KEY"]));
    expect(p.passed).toBe(false);
    const typo = p.issues.find((i) => i.message.includes("allowed_tools"))!;
    expect(typo.fix).toContain("allowed-tools");
    const cc = validateSkill(b, { target: "claude-code" });
    expect(rules(cc)).not.toContain("FM_CLAUDE_CODE_ONLY_KEY");
    expect(cc.passed).toBe(true);
  });
  it("leaky-secrets: key, .env, junk, curl|bash, shebang, network", () => {
    const r = validateSkill(loadFixture("bad/leaky-secrets"));
    expect(rules(r)).toEqual(expect.arrayContaining(["SEC_SECRET", "STRUCT_ENV_FILE", "STRUCT_JUNK_FILES", "SEC_DANGEROUS_COMMAND", "SCRIPT_NO_SHEBANG", "SCRIPT_NETWORK"]));
    expect(r.score).toBeLessThan(50);
  });
  it("folder-mismatch", () => {
    const r = validateSkill(loadFixture("bad/folder-mismatch"));
    expect(rules(r)).toEqual(["NAME_DIR_MISMATCH"]);
  });
});

describe("rules (inline)", () => {
  it("name length > 64", () => {
    const r = validateSkill(bundleFromText(md(`name: ${"a".repeat(65)}\n${GOOD_DESC}`)));
    expect(rules(r)).toContain("NAME_TOO_LONG");
  });
  it("missing name / description", () => {
    const r = validateSkill(bundleFromText(md("license: MIT")));
    expect(rules(r)).toEqual(expect.arrayContaining(["NAME_MISSING", "DESC_MISSING"]));
    const cc = validateSkill(bundleFromText(md(GOOD_DESC)), { target: "claude-code" });
    expect(cc.issues.find((i) => i.rule === "NAME_MISSING")?.severity).toBe("warning");
  });
  it("description > 1024 and angle brackets", () => {
    const long = validateSkill(bundleFromText(md(`name: ok-skill\ndescription: Use when needed. ${"x ".repeat(600)}`)));
    expect(rules(long)).toContain("DESC_TOO_LONG");
    const ab = validateSkill(bundleFromText(md("name: ok-skill\ndescription: Converts <file> into JSON reports quickly. Use when the user has a file.")));
    expect(rules(ab)).toContain("DESC_ANGLE_BRACKETS");
  });
  it("compatibility > 500 and metadata types", () => {
    const r = validateSkill(bundleFromText(md(`name: ok-skill\n${GOOD_DESC}\ncompatibility: ${"y".repeat(501)}\nmetadata:\n  version: 1.0`)));
    expect(rules(r)).toEqual(expect.arrayContaining(["FM_COMPATIBILITY_TOO_LONG", "FM_METADATA_VALUES"]));
  });
  it("body > 500 lines", () => {
    const body = "# T\n" + Array.from({ length: 520 }, (_, i) => `- step ${i}`).join("\n");
    const r = validateSkill(bundleFromText(md(`name: ok-skill\n${GOOD_DESC}`, body)));
    expect(rules(r)).toContain("BODY_TOO_MANY_LINES");
  });
  it("frontmatter must start on line 1; unclosed", () => {
    expect(rules(validateSkill(bundleFromText("\n" + md("name: a\n" + GOOD_DESC))))).toContain("FM_MISSING");
    expect(rules(validateSkill(bundleFromText("---\nname: a\n")))).toContain("FM_UNCLOSED");
  });
  it("CRLF + BOM are handled", () => {
    const r = validateSkill(bundleFromText("\ufeff" + md(`name: ok-skill\n${GOOD_DESC}`).replace(/\n/g, "\r\n")));
    expect(rules(r)).toEqual(["FM_BOM"]);
  });
  it("paste mode marks references unverified", () => {
    const r = validateSkill(bundleFromText(md(`name: ok-skill\n${GOOD_DESC}`, "# T\n\n## Steps\n\nRun `python scripts/run.py` and read [guide](references/guide.md) before acting on it.\n")));
    expect(rules(r)).toEqual(["REF_UNVERIFIED"]);
    expect(r.score).toBeGreaterThanOrEqual(85);
  });
  it("zip upload: finds nested SKILL.md, warns on __MACOSX-free junk, detects mismatch", async () => {
    const zip = new JSZip();
    zip.file("processing-pdfs/SKILL.md", fs.readFileSync(path.join(FIXTURES, "good/processing-pdfs/SKILL.md")));
    zip.file("processing-pdfs/references/FORMS.md", "# Forms\n");
    zip.file("processing-pdfs/scripts/fill_form.py", "#!/usr/bin/env python3\nimport pypdf\n");
    zip.file("__MACOSX/processing-pdfs/._SKILL.md", "junk");
    const b = await bundleFromZip(await zip.generateAsync({ type: "uint8array" }));
    expect(b.rootDir).toBe("processing-pdfs");
    const r = validateSkill(b);
    expect(r.issues.filter((i) => i.severity !== "tip")).toEqual([]);
  });
  it("zip without SKILL.md / lowercase skill.md", async () => {
    const z1 = new JSZip(); z1.file("x/readme.md", "hi");
    expect(rules(validateSkill(await bundleFromZip(await z1.generateAsync({ type: "uint8array" }))))).toContain("STRUCT_NO_SKILL_MD");
    const z2 = new JSZip(); z2.file("x/skill.md", "hi");
    expect(rules(validateSkill(await bundleFromZip(await z2.generateAsync({ type: "uint8array" }))))).toContain("STRUCT_SKILL_MD_CASE");
  });
});

describe("helpers", () => {
  it("suggestName", () => {
    expect(suggestName("My PDF Helper!")).toBe("my-pdf-helper");
    expect(suggestName("--a__b--")).toBe("a-b");
  });
  it("hasTriggerClause", () => {
    expect(hasTriggerClause("Analyze spreadsheets. Use when analyzing .xlsx files.")).toBe(true);
    expect(hasTriggerClause("Generates commit messages when the user asks for help.")).toBe(true);
    expect(hasTriggerClause("Processes data")).toBe(false);
  });
  it("extractRefs ignores urls in refs, code-fence prose files, and versions", () => {
    const { refs, urls } = extractRefs("See [x](https://a.com) and `scripts/a.py`, v1.2.3, FORMS.md.\n```\nfoo.md\npython scripts/b.py\n```");
    expect(urls.map((u) => u.target)).toEqual(["https://a.com"]);
    expect(refs.map((r) => r.target).sort()).toEqual(["FORMS.md", "scripts/a.py", "scripts/b.py"]);
  });
  it("resolveRef", () => {
    expect(resolveRef("./references/a.md#x").path).toBe("references/a.md");
    expect(resolveRef("../b.md", "references/a.md").path).toBe("b.md");
    expect(resolveRef("../../x.md").escapes).toBe(true);
    expect(resolveRef("/etc/passwd").absolute).toBe(true);
  });
  it("parseSkillMd reports body start line", () => {
    const { parsed } = parseSkillMd("---\nname: a\ndescription: b\n---\nbody");
    expect(parsed.bodyStartLine).toBe(5);
    expect(parsed.frontmatter).toEqual({ name: "a", description: "b" });
  });
  it("layer-2 gate", () => {
    expect(canSimulate(validateSkill(loadFixture("good/processing-pdfs")))).toBe(true);
    expect(canSimulate(validateSkill(loadFixture("bad/no-frontmatter")))).toBe(false);
  });
});
