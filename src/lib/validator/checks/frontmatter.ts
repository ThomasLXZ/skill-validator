import type { Check, Issue } from "../types";
import { keyLine } from "../parse";
import {
  CLAUDE_CODE_KEYS, CLAUDE_CODE_SKILLS_URL, COMPATIBILITY_MAX, PORTABLE_KEYS, SPEC_URL,
} from "../spec";

export const frontmatterCheck: Check = ({ parsed, options }) => {
  const fm = parsed.frontmatter;
  if (!fm) return [];
  const issues: Issue[] = [];
  const portable = new Set<string>(PORTABLE_KEYS);
  const cc = new Set<string>(CLAUDE_CODE_KEYS);

  for (const key of Object.keys(fm)) {
    if (portable.has(key)) continue;
    const line = keyLine(parsed, key);
    if (cc.has(key)) {
      if (options.target === "portable") {
        issues.push({
          rule: "FM_CLAUDE_CODE_ONLY_KEY",
          severity: "warning",
          category: "frontmatter",
          file: "SKILL.md",
          line,
          message: `"${key}" is a Claude Code-only field. Uploading to claude.ai or the Skills API fails with "Unexpected key(s) in SKILL.md frontmatter".`,
          fix: `Remove "${key}" if you distribute via claude.ai / API, or switch the target to "Claude Code" if the skill is only used there.`,
          ref: CLAUDE_CODE_SKILLS_URL,
        });
      }
      continue;
    }
    const near = [...portable, ...cc].find((k) => k.replace(/[-_]/g, "") === key.toLowerCase().replace(/[-_]/g, ""));
    issues.push({
      rule: "FM_UNKNOWN_KEY",
      severity: options.target === "portable" ? "error" : "warning",
      category: "frontmatter",
      file: "SKILL.md",
      line,
      message: `Unknown frontmatter key "${key}".${options.target === "portable" ? " claude.ai / Skills API uploads reject unexpected keys." : " Claude Code silently ignores it."}`,
      fix: near
        ? `Did you mean "${near}"? Field names must match exactly, hyphens included.`
        : `Move custom data under metadata: (e.g. metadata:\n  ${key}: ...).`,
      ref: SPEC_URL,
    });
  }

  if ("compatibility" in fm) {
    const c = fm.compatibility;
    if (typeof c !== "string" || !c.trim()) {
      issues.push({
        rule: "FM_COMPATIBILITY_TYPE",
        severity: "error",
        category: "frontmatter",
        file: "SKILL.md",
        line: keyLine(parsed, "compatibility"),
        message: "compatibility must be a non-empty string.",
        fix: "e.g. compatibility: Requires Python 3.11+ and network access. Or remove the field; most skills don't need it.",
        ref: SPEC_URL,
      });
    } else if (c.length > COMPATIBILITY_MAX) {
      issues.push({
        rule: "FM_COMPATIBILITY_TOO_LONG",
        severity: "error",
        category: "frontmatter",
        file: "SKILL.md",
        line: keyLine(parsed, "compatibility"),
        message: `compatibility is ${c.length} characters; the maximum is ${COMPATIBILITY_MAX}.`,
        fix: "Keep only hard environment requirements (product, packages, network).",
        ref: SPEC_URL,
      });
    }
  }

  if ("metadata" in fm) {
    const m = fm.metadata;
    if (m === null || typeof m !== "object" || Array.isArray(m)) {
      issues.push({
        rule: "FM_METADATA_TYPE",
        severity: "error",
        category: "frontmatter",
        file: "SKILL.md",
        line: keyLine(parsed, "metadata"),
        message: "metadata must be a key-value map.",
        fix: "metadata:\n  author: your-org\n  version: \"1.0\"",
        ref: SPEC_URL,
      });
    } else {
      const bad = Object.entries(m as Record<string, unknown>).filter(([, v]) => typeof v !== "string");
      if (bad.length) {
        issues.push({
          rule: "FM_METADATA_VALUES",
          severity: "warning",
          category: "frontmatter",
          file: "SKILL.md",
          line: keyLine(parsed, "metadata"),
          message: `metadata values should be strings (spec: map from string keys to string values). Non-string: ${bad.map(([k]) => k).join(", ")}.`,
          fix: 'Quote values, e.g. version: "1.0" instead of version: 1.0.',
          ref: SPEC_URL,
        });
      }
    }
  }

  if ("allowed-tools" in fm) {
    const t = fm["allowed-tools"];
    if (Array.isArray(t) && options.target === "portable") {
      issues.push({
        rule: "FM_ALLOWED_TOOLS_LIST",
        severity: "tip",
        category: "frontmatter",
        file: "SKILL.md",
        line: keyLine(parsed, "allowed-tools"),
        message: "The Agent Skills spec defines allowed-tools as a space-separated string; a YAML list works in Claude Code but may not elsewhere.",
        fix: "allowed-tools: Bash(git:*) Read",
        ref: SPEC_URL,
      });
    } else if (!Array.isArray(t) && typeof t !== "string") {
      issues.push({
        rule: "FM_ALLOWED_TOOLS_TYPE",
        severity: "error",
        category: "frontmatter",
        file: "SKILL.md",
        line: keyLine(parsed, "allowed-tools"),
        message: "allowed-tools must be a space-separated string of tool names.",
        fix: "allowed-tools: Bash(git:*) Read",
        ref: SPEC_URL,
      });
    }
  }

  if ("license" in fm && typeof fm.license !== "string") {
    issues.push({
      rule: "FM_LICENSE_TYPE",
      severity: "warning",
      category: "frontmatter",
      file: "SKILL.md",
      line: keyLine(parsed, "license"),
      message: "license should be a short string (license name or bundled license file).",
      fix: "license: Apache-2.0   or   license: Proprietary. LICENSE.txt has complete terms",
      ref: SPEC_URL,
    });
  }
  return issues;
};
