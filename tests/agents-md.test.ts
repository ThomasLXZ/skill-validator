import { describe, expect, it } from "vitest";
import { buildAgentsMd, CODEX_DEFAULT_MAX_BYTES, validateAgentsMd } from "@/lib/agents-md";

const v = (t: string, filename = "AGENTS.md") => validateAgentsMd(t, { filename });
const rules = (t: string, filename?: string) => v(t, filename).findings.map((f) => f.rule);

describe("empty and thin files", () => {
  it("errors on empty", () => {
    expect(rules("")).toContain("AGENTS_EMPTY");
    expect(v("").score).toBe(0);
  });
  it("warns when too thin", () => {
    expect(rules("# Hi\n\nok\n")).toEqual(expect.arrayContaining(["AGENTS_TOO_THIN", "AGENTS_MISSING_CORE_SECTIONS"]));
  });
});

describe("filename conventions", () => {
  it("flags AGENT.md / wrong case", () => {
    expect(rules("# x\n\n## Setup commands\n```\npnpm i\n```\n", "agent.md")).toContain("AGENTS_FILENAME_VARIANT");
    expect(rules("# x\n\n## Overview\ny\n## Build\n```\na\n```\n## Testing\nb\n", "agents.md")).toContain("AGENTS_FILENAME_CASE");
  });
  it("notes override and nested paths", () => {
    expect(rules("## Overview\nA project.\n\n## Setup commands\n```bash\npnpm i\n```\n\n## Testing instructions\n```bash\npnpm t\n```\n", "packages/api/AGENTS.override.md")).toEqual(
      expect.arrayContaining(["AGENTS_OVERRIDE_NOTE", "AGENTS_NESTED"]),
    );
  });
});

describe("structure and size", () => {
  it("detects unclosed fences", () => {
    expect(rules("# A\n\n```bash\npnpm i\n")).toContain("AGENTS_UNCLOSED_FENCE");
  });
  it("warns past Codex default byte cap", () => {
    const big = "# Overview\n\n" + "x".repeat(CODEX_DEFAULT_MAX_BYTES);
    expect(rules(big)).toContain("AGENTS_OVER_CODEX_BYTES");
  });
  it("recognizes popular section headings", () => {
    const text = `# AGENTS.md

## Project overview
Demo app.

## Setup commands
\`\`\`bash
pnpm install
\`\`\`

## Code style
- Strict TypeScript

## Testing instructions
\`\`\`bash
pnpm test
\`\`\`

## Security considerations
- Never commit .env

## Pull request guidelines
- Keep PRs small
`;
    const r = v(text);
    expect(r.presentSections).toEqual(expect.arrayContaining(["overview", "build", "style", "testing", "security", "pr"]));
    expect(r.missingSections).toEqual([]);
    expect(r.findings.filter((f) => f.severity === "error")).toEqual([]);
    expect(r.score).toBeGreaterThanOrEqual(75);
  });
});

describe("conflict heuristic", () => {
  it("tips on always/never clash", () => {
    const t = `## Overview
App

## Setup commands
\`\`\`bash
pnpm i
\`\`\`

## Testing instructions
\`\`\`bash
pnpm t
\`\`\`

Always use npm.
Never use npm for anything.
`;
    expect(rules(t)).toContain("AGENTS_CONFLICTING_ALWAYS_NEVER");
  });
});

describe("secrets", () => {
  it("flags private keys", () => {
    expect(rules("## Overview\nx\n\n-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----\n")).toContain("AGENTS_PRIVATE_KEY");
  });
});

describe("builder", () => {
  it("emits expected headings and round-trips cleanly", () => {
    const out = buildAgentsMd({
      projectName: "demo",
      overview: "A demo TypeScript app.",
      setupCommands: "pnpm install\npnpm dev",
      testCommands: "pnpm test",
      codeStyle: "- Strict mode",
      security: "- Never commit `.env`",
      prGuidelines: "- Run tests before PR",
      extra: "Prefer pnpm.",
    });
    expect(out).toContain("# AGENTS.md");
    expect(out).toContain("## Project overview");
    expect(out).toContain("## Setup commands");
    expect(out).toContain("```bash");
    expect(out).toContain("pnpm install");
    expect(out).toContain("## Testing instructions");
    expect(out).toContain("## Code style");
    expect(out).toContain("## Security considerations");
    expect(out).toContain("## Pull request guidelines");
    expect(out).toContain("## Extra instructions");
    const r = validateAgentsMd(out, { filename: "AGENTS.md" });
    expect(r.presentSections.length).toBeGreaterThanOrEqual(5);
    expect(r.findings.filter((f) => f.severity === "error")).toEqual([]);
  });
});
