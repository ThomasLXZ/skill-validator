# Claude Skill Validator (Layer 1: static checks)

A static-exportable Next.js (App Router, TypeScript) tool that validates Claude Agent Skills
(`SKILL.md` + bundled files) **entirely in the browser**. No LLM and no server.

- Inputs: paste `SKILL.md`, upload a `.zip`, or pick a folder (`webkitdirectory`)
- Output: score 0–100 + grade, and a list of errors, warnings, and tips. Each one has a fix suggestion, the file:line location, and a link to the spec
- Targets: **portable** (claude.ai / Skills API / agentskills.io, strict keys) or **Claude Code** (allows the extension keys)

## Run

```bash
npm install
npm test               # vitest unit tests (fixtures/ good + bad skills)
npm run dev            # http://localhost:3000
npm run build          # static export -> out/
npx serve out -l 3000  # serve the export
npm run screenshot     # Playwright screenshots -> screenshots/after-*.png (PREFIX env to rename; needs server on :3000)
```

Set `NEXT_PUBLIC_SITE_URL` at build time for canonical, sitemap, and robots URLs.

## Checks (rule ids)

| Area | Rules |
|---|---|
| Structure | STRUCT_NO_SKILL_MD, STRUCT_SKILL_MD_CASE, STRUCT_MULTIPLE_SKILLS, STRUCT_ZIP_NO_FOLDER, STRUCT_JUNK_FILES, STRUCT_ENV_FILE, STRUCT_README, STRUCT_BACKSLASH_PATH |
| Frontmatter | FM_MISSING (must start on line 1), FM_UNCLOSED, FM_BOM, FM_YAML_INVALID, FM_DUPLICATE_KEY, FM_NOT_MAPPING, FM_UNKNOWN_KEY (with "did you mean"), FM_CLAUDE_CODE_ONLY_KEY, FM_COMPATIBILITY_TYPE/TOO_LONG (≤500), FM_METADATA_TYPE/VALUES, FM_ALLOWED_TOOLS_TYPE/LIST, FM_LICENSE_TYPE |
| name | NAME_MISSING, NAME_TYPE, NAME_TOO_LONG (≤64), NAME_CHARSET ([a-z0-9-]), NAME_HYPHEN_EDGE, NAME_DOUBLE_HYPHEN, NAME_XML, NAME_RESERVED_WORD (claude/anthropic), NAME_DIR_MISMATCH, NAME_VAGUE |
| description | DESC_MISSING, DESC_TYPE, DESC_EMPTY, DESC_TOO_LONG (≤1024), DESC_ANGLE_BRACKETS, DESC_PLACEHOLDER, DESC_TOO_SHORT, DESC_NO_WHEN ("Use when…" trigger), DESC_VAGUE, DESC_POINT_OF_VIEW (third person), DESC_LISTING_TRUNCATED (Claude Code 1,536 chars), DESC_LONG |
| Body | BODY_EMPTY, BODY_TOO_MANY_LINES (500), BODY_TOO_MANY_TOKENS (~5k), BODY_TOO_SHORT, BODY_NO_HEADINGS, BODY_TIME_SENSITIVE, BODY_WINDOWS_PATH, BODY_MCP_UNQUALIFIED |
| References | REF_MISSING_FILE, REF_CASE_MISMATCH, REF_ABSOLUTE_PATH, REF_OUTSIDE_SKILL, REF_BROKEN_ANCHOR, REF_MALFORMED_URL, REF_INSECURE_URL, REF_NESTED (one level deep), REF_NO_TOC (>100 lines), REF_UNVERIFIED (paste mode), REF_ORPHAN_DOCS |
| Scripts | SCRIPT_UNREFERENCED, SCRIPT_NO_SHEBANG, SCRIPT_UNDOCUMENTED_DEPS (non-stdlib Python imports), SCRIPT_NETWORK |
| Security | SEC_SECRET (Anthropic/OpenAI/AWS/GitHub/Slack/Google keys, private keys), SEC_DANGEROUS_COMMAND (curl \| sh, rm -rf /), SEC_PROMPT_INJECTION |

Scoring: start at 100. Each error costs 20, each warning 7, each tip 2. Any error caps the score at 59 ("invalid"). If there are only tips, the score never drops below 85.

## Architecture

```
src/lib/validator/      pure TS core, no DOM / React (unit-tested)
  spec.ts               limits, allowed keys, source URLs
  parse.ts              frontmatter + YAML parsing
  bundle.ts             paste / zip (jszip) / folder -> SkillBundle
  checks/*.ts           independent check modules
  index.ts              validateSkill(bundle, { target }) -> Report
src/lib/trigger-sim/    Layer 2 boundary (interface only, not implemented)
src/components/         client UI (Tailwind v4, Geist, CodeMirror 6 editor with inline lint, light/dark)
src/app/                landing page (SEO metadata, JSON-LD FAQ), robots, sitemap
fixtures/good|bad/      sample skills used by tests
```

**Layer 2 (trigger simulation)** lives behind `TriggerSimulator` in `src/lib/trigger-sim/types.ts`.
It consumes a Layer-1 `Report`, gated by `canSimulate(report)`, and it will run server-side with a cheap model.
Layer 1 never imports it.

## Spec sources

- Agent Skills specification: https://agentskills.io/specification
- Anthropic – Agent Skills overview: https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview
- Anthropic – Skill authoring best practices: https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices
- Claude Code – Skills: https://code.claude.com/docs/en/skills
- anthropics/skills `quick_validate.py`: https://github.com/anthropics/skills/blob/main/skills/skill-creator/scripts/quick_validate.py

Not affiliated with Anthropic.
