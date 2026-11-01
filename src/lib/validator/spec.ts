/** Constants taken from the official specs. See README "Spec sources". */
export const SPEC_URL = "https://agentskills.io/specification";
export const ANTHROPIC_OVERVIEW_URL =
  "https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview";
export const BEST_PRACTICES_URL =
  "https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices";
export const CLAUDE_CODE_SKILLS_URL = "https://code.claude.com/docs/en/skills";
export const QUICK_VALIDATE_URL =
  "https://github.com/anthropics/skills/blob/main/skills/skill-creator/scripts/quick_validate.py";

export const NAME_MAX = 64;
export const DESCRIPTION_MAX = 1024;
export const COMPATIBILITY_MAX = 500;
/** Claude Code truncates description + when_to_use in the listing at this length. */
export const CLAUDE_CODE_LISTING_MAX = 1536;
export const BODY_MAX_LINES = 500;
export const BODY_MAX_TOKENS = 5000;
export const REFERENCE_TOC_LINES = 100;

export const RESERVED_NAME_WORDS = ["anthropic", "claude"];

/** Fields allowed by the Agent Skills spec / claude.ai upload / Skills API. */
export const PORTABLE_KEYS = [
  "name",
  "description",
  "license",
  "compatibility",
  "metadata",
  "allowed-tools",
] as const;

/** Extra fields accepted by Claude Code only. */
export const CLAUDE_CODE_KEYS = [
  "when_to_use",
  "argument-hint",
  "arguments",
  "disable-model-invocation",
  "user-invocable",
  "disallowed-tools",
  "model",
  "effort",
  "context",
  "agent",
  "background",
  "hooks",
  "paths",
  "shell",
] as const;

export const VAGUE_NAMES = [
  "helper", "helpers", "utils", "util", "utility", "tools", "tool",
  "documents", "docs", "data", "files", "misc", "stuff", "skill", "my-skill", "test",
];
