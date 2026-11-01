import { sortFindings, type Finding } from "../common/finding";
import { SRC } from "./sources";

export interface LlmsReport {
  findings: Finding[];
  title?: string;
  summary?: string;
  sections: { name: string; links: number; line: number }[];
  linkCount: number;
}

const LINK_ITEM = /^\s*[-*+]\s+\[([^\]]+)\]\(([^)\s]+)\)(\s*:\s*.*)?\s*$/;

/** Checks the structure from llmstxt.org: H1, optional blockquote, then H2 file lists. */
export function checkLlmsTxt(text: string): LlmsReport {
  const f: Finding[] = [];
  const lines = text.replace(/^\uFEFF/, "").split(/\r\n|\r|\n/);
  const rep: LlmsReport = { findings: f, sections: [], linkCount: 0 };
  if (!text.trim()) return rep;

  let inFence = false;
  let sawH1 = false, sawH2 = false, firstContent = true;
  let cur: LlmsReport["sections"][number] | null = null;
  lines.forEach((raw, i) => {
    const line = i + 1;
    if (/^\s*(```|~~~)/.test(raw)) inFence = !inFence;
    if (inFence || !raw.trim()) return;
    const h = /^(#{1,6})\s+(.*)$/.exec(raw);
    if (firstContent) {
      firstContent = false;
      if (!h || h[1] !== "#")
        f.push({ rule: "LLMS_NO_H1", severity: "error", line, message: "llms.txt must start with an H1 naming the project or site. It is the only required section.", fix: "Add `# Your Project` as the first line.", ref: SRC.llmstxt });
    }
    if (h) {
      const level = h[1].length;
      if (level === 1) {
        if (sawH1) f.push({ rule: "LLMS_MULTIPLE_H1", severity: "warning", line, message: "More than one H1. The format has a single H1 title.", ref: SRC.llmstxt });
        else rep.title = h[2].trim();
        sawH1 = true;
      } else if (level === 2) {
        sawH2 = true;
        cur = { name: h[2].trim(), links: 0, line };
        rep.sections.push(cur);
      } else if (!sawH2) {
        f.push({ rule: "LLMS_HEADING_BEFORE_SECTIONS", severity: "warning", line, message: `H${level} heading before the first H2. The format allows any Markdown there except headings.`, ref: SRC.llmstxt });
      }
      return;
    }
    if (/^\s*>/.test(raw) && sawH1 && !sawH2 && rep.summary === undefined) { rep.summary = raw.replace(/^\s*>\s?/, "").trim(); return; }
    if (cur && /^\s*[-*+]\s+/.test(raw)) {
      const m = LINK_ITEM.exec(raw);
      if (!m) f.push({ rule: "LLMS_BAD_LIST_ITEM", severity: "warning", line, message: "File-list items need a Markdown link first: `- [name](url): optional notes`.", ref: SRC.llmstxt });
      else { cur.links++; rep.linkCount++; }
    }
  });

  if (sawH1 && rep.summary === undefined)
    f.push({ rule: "LLMS_NO_SUMMARY", severity: "tip", message: "Add a `> blockquote` summary under the H1. It tells agents what the project is before they read any links.", ref: SRC.llmstxt });
  if (!rep.sections.length)
    f.push({ rule: "LLMS_NO_SECTIONS", severity: "tip", message: "No `## ` sections with file lists. Without links, agents have nowhere to go for detail.", ref: SRC.llmstxt });
  for (const s of rep.sections)
    if (!s.links) f.push({ rule: "LLMS_EMPTY_SECTION", severity: "tip", line: s.line, message: `Section "${s.name}" has no \`- [name](url)\` links.`, ref: SRC.llmstxt });
  rep.findings = sortFindings(f);
  return rep;
}
