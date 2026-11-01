import type { Check, Issue } from "../types";
import { ANTHROPIC_OVERVIEW_URL } from "../spec";

const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/\bsk-ant-[A-Za-z0-9_-]{20,}/, "Anthropic API key"],
  [/\bsk-(?:proj-)?[A-Za-z0-9]{32,}/, "OpenAI-style API key"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key"],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}\b/, "GitHub token"],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}/, "Slack token"],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, "Google API key"],
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, "private key"],
];
const DANGEROUS = /\b(?:curl|wget)\b[^\n|]*\|\s*(?:sudo\s+)?(?:ba|z)?sh\b|\brm\s+-rf\s+(?:\/|~|\$HOME)(?:\s|$)/;
const INJECTION = /\b(?:ignore (?:all )?(?:previous|prior|above) instructions|disregard (?:the )?system prompt|exfiltrate|send (?:the )?(?:api key|credentials|secrets) to)\b/i;

export const securityCheck: Check = ({ bundle }) => {
  const issues: Issue[] = [];
  for (const [path, f] of bundle.files) {
    if (!f.text) continue;
    const lines = f.text.split("\n");
    for (const [re, label] of SECRET_PATTERNS) {
      const idx = lines.findIndex((l) => re.test(l));
      if (idx !== -1) {
        issues.push({ rule: "SEC_SECRET", severity: "error", category: "security", file: path, line: idx + 1, message: `Possible ${label} hard-coded in ${path}.`, fix: "Remove it, rotate the key, and read secrets from environment variables at runtime." });
      }
    }
    const d = lines.findIndex((l) => DANGEROUS.test(l));
    if (d !== -1) {
      issues.push({ rule: "SEC_DANGEROUS_COMMAND", severity: "warning", category: "security", file: path, line: d + 1, message: `Risky shell pattern in ${path}: "${lines[d].trim().slice(0, 80)}".`, fix: "Avoid piping remote scripts into a shell or broad rm -rf; pin versions and bundle what you need.", ref: ANTHROPIC_OVERVIEW_URL });
    }
    const inj = lines.findIndex((l) => INJECTION.test(l));
    if (inj !== -1) {
      issues.push({ rule: "SEC_PROMPT_INJECTION", severity: "warning", category: "security", file: path, line: inj + 1, message: `Text in ${path} looks like a prompt-injection or exfiltration instruction.`, fix: "Remove it. Users are told to audit skills for instructions that don't match the stated purpose.", ref: ANTHROPIC_OVERVIEW_URL });
    }
  }
  return issues;
};
