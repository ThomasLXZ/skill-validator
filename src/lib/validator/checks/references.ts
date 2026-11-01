import type { Check, CheckContext, Issue } from "../types";
import { BEST_PRACTICES_URL, REFERENCE_TOC_LINES, SPEC_URL } from "../spec";
import { proseLines } from "./body";

export interface RefHit {
  target: string;
  line: number; // 0-based within the text
  kind: "link" | "inline";
}

const FILE_LIKE = /^(?:\.{1,2}\/)?[\w.-]+(?:\/[\w.-]+)*\.[a-z0-9]{1,6}$/i;
const DIR_PREFIX = /^(?:scripts|references?|assets|templates|examples|docs|resources|lib|bin|data)\//;

/** Extract relative file references from markdown text. */
export function extractRefs(text: string): { refs: RefHit[]; urls: RefHit[]; anchors: RefHit[] } {
  const refs: RefHit[] = [];
  const urls: RefHit[] = [];
  const anchors: RefHit[] = [];
  const lines = text.split("\n");
  let fence = false;
  lines.forEach((line, i) => {
    const isFenceMarker = /^\s*(```|~~~)/.test(line);
    if (isFenceMarker) { fence = !fence; return; }
    // markdown links + images (only outside code fences)
    if (!fence) {
      for (const m of line.matchAll(/!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
        const t = m[1];
        if (/^[a-z][a-z0-9+.-]*:/i.test(t)) { if (/^https?:/i.test(t)) urls.push({ target: t, line: i, kind: "link" }); continue; }
        if (t.startsWith("#")) { anchors.push({ target: t.slice(1), line: i, kind: "link" }); continue; }
        refs.push({ target: t, line: i, kind: "link" });
      }
    }
    // inline code / bare paths that look like bundle files, e.g. `scripts/fill.py`, python scripts/x.py, FORMS.md
    const scan = fence ? line : line.replace(/\[[^\]]*\]\([^)]*\)/g, " ");
    for (const m of scan.matchAll(/(?:^|[\s`'"(])((?:\.\/|\/|~\/)?(?:[\w.-]+\/)*[\w.-]+\.[A-Za-z0-9]{1,6})(?=$|[\s`'"),:;!?]|\.(?:\s|$))/g)) {
      const t = m[1];
      if (/^(?:\/|~\/)[\w.-]+\/.+/.test(t)) { refs.push({ target: t, line: i, kind: "inline" }); continue; }
      if (!FILE_LIKE.test(t)) continue;
      const clean = t.replace(/^\.\//, "");
      const isDirPath = DIR_PREFIX.test(clean);
      const isTopMd = /^[\w-]+\.md$/i.test(clean) && clean !== "SKILL.md";
      // In code fences only trust explicit skill-dir paths.
      if (fence ? !isDirPath : !(isDirPath || isTopMd)) continue;
      if (/^\d+(\.\d+)+$/.test(clean)) continue;
      refs.push({ target: t, line: i, kind: "inline" });
    }
  });
  return { refs, urls, anchors };
}

/** Resolve a reference relative to the skill root (or relative to `from`'s directory). */
export function resolveRef(target: string, from = "SKILL.md"): { path: string; escapes: boolean; absolute: boolean } {
  let t = target.split("#")[0].split("?")[0];
  try { t = decodeURIComponent(t); } catch { /* keep raw */ }
  const absolute = t.startsWith("/") || /^[A-Za-z]:[\\/]/.test(t) || t.startsWith("~");
  const baseDir = from.includes("/") ? from.slice(0, from.lastIndexOf("/") + 1) : "";
  const parts = (baseDir + t.replace(/^\.\//, "")).split("/");
  const out: string[] = [];
  let escapes = false;
  for (const p of parts) {
    if (p === "" || p === ".") continue;
    if (p === "..") { if (out.length) out.pop(); else escapes = true; continue; }
    out.push(p);
  }
  return { path: out.join("/"), escapes, absolute };
}

function slugify(h: string): string {
  return h.trim().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
}

function fileExists(ctx: CheckContext, p: string): boolean {
  if (ctx.bundle.files.has(p)) return true;
  const dir = p.replace(/\/$/, "") + "/";
  for (const k of ctx.bundle.files.keys()) if (k.startsWith(dir)) return true;
  return false;
}

function caseMatch(ctx: CheckContext, p: string): string | undefined {
  const low = p.toLowerCase();
  for (const k of ctx.bundle.files.keys()) if (k.toLowerCase() === low) return k;
  return undefined;
}

export const referencesCheck: Check = (ctx) => {
  const { parsed, bundle } = ctx;
  const issues: Issue[] = [];
  const bodyOffset = parsed.bodyStartLine;
  const { refs, urls, anchors } = extractRefs(parsed.body);
  const unverifiable = new Set<string>();
  const seen = new Set<string>();

  for (const r of refs) {
    const res = resolveRef(r.target);
    const line = bodyOffset + r.line;
    if (res.absolute) {
      issues.push({ rule: "REF_ABSOLUTE_PATH", severity: "warning", category: "references", file: "SKILL.md", line, message: `Absolute path "${r.target}" won't exist on other machines.`, fix: "Reference bundled files with paths relative to the skill root, e.g. references/guide.md.", ref: SPEC_URL });
      continue;
    }
    if (res.escapes) {
      issues.push({ rule: "REF_OUTSIDE_SKILL", severity: "warning", category: "references", file: "SKILL.md", line, message: `"${r.target}" points outside the skill folder; it won't be packaged with the skill.`, fix: "Copy the file into the skill directory and reference it relatively.", ref: SPEC_URL });
      continue;
    }
    if (!res.path || seen.has(res.path)) continue;
    seen.add(res.path);
    ctx.referenced.add(res.path);
    if (bundle.mode === "paste") { unverifiable.add(res.path); continue; }
    if (!fileExists(ctx, res.path)) {
      const cm = caseMatch(ctx, res.path);
      issues.push({
        rule: cm ? "REF_CASE_MISMATCH" : "REF_MISSING_FILE",
        severity: r.kind === "link" || cm ? "error" : "warning",
        category: "references",
        file: "SKILL.md",
        line,
        message: cm
          ? `"${r.target}" not found, but "${cm}" exists. Paths are case-sensitive on Linux.`
          : `Referenced file "${res.path}" is not in the skill bundle${r.kind === "link" ? " (broken link)" : ""}.`,
        fix: cm ? `Change the reference to ${cm}.` : `Add ${res.path} to the skill folder or remove the reference.`,
        ref: SPEC_URL,
      });
    }
  }

  if (unverifiable.size) {
    issues.push({ rule: "REF_UNVERIFIED", severity: "tip", category: "references", file: "SKILL.md", message: `SKILL.md references ${unverifiable.size} file(s) that can't be checked in paste mode: ${[...unverifiable].slice(0, 6).join(", ")}${unverifiable.size > 6 ? ", ..." : ""}.`, fix: "Upload the skill as a .zip or folder to verify referenced files exist." });
  }

  // in-page anchors
  const headings = new Set(proseLines(parsed.body).filter((l) => /^#{1,6}\s/.test(l.text)).map((l) => slugify(l.text.replace(/^#+\s*/, ""))));
  for (const a of anchors) {
    if (!headings.has(a.target.toLowerCase())) {
      issues.push({ rule: "REF_BROKEN_ANCHOR", severity: "warning", category: "references", file: "SKILL.md", line: bodyOffset + a.line, message: `Link to "#${a.target}" has no matching heading.`, fix: "Fix the anchor or rename the heading." });
    }
  }
  // URLs
  for (const u of urls) {
    try {
      const url = new URL(u.target);
      if (url.protocol === "http:" && !/^(localhost|127\.|0\.0\.0\.0)/.test(url.hostname)) {
        issues.push({ rule: "REF_INSECURE_URL", severity: "tip", category: "references", file: "SKILL.md", line: bodyOffset + u.line, message: `Insecure http:// link: ${u.target}`, fix: "Use https://." });
      }
    } catch {
      issues.push({ rule: "REF_MALFORMED_URL", severity: "warning", category: "references", file: "SKILL.md", line: bodyOffset + u.line, message: `Malformed URL: ${u.target}`, fix: "Fix the link target." });
    }
  }

  if (bundle.mode === "paste") return issues;

  // One level deep: referenced markdown files should not chain to further files.
  for (const p of [...ctx.referenced]) {
    const f = bundle.files.get(p);
    if (!f?.text || !/\.(md|markdown)$/i.test(p)) continue;
    const sub = extractRefs(f.text);
    const nested: string[] = [];
    for (const r of sub.refs) {
      const res = resolveRef(r.target, p);
      if (res.absolute || res.escapes || !res.path) continue;
      if (!fileExists(ctx, res.path)) {
        if (r.kind === "link") {
          issues.push({ rule: "REF_MISSING_FILE", severity: "warning", category: "references", file: p, line: r.line + 1, message: `Broken link in ${p}: "${res.path}" is not in the bundle.`, fix: `Add ${res.path} or fix the link.` });
        }
        continue;
      }
      if (/\.(md|markdown)$/i.test(res.path) && !ctx.referenced.has(res.path)) nested.push(res.path);
    }
    for (const n of nested) ctx.referenced.add(n);
    if (nested.length) {
      issues.push({ rule: "REF_NESTED", severity: "tip", category: "references", file: p, message: `${p} links to ${nested.join(", ")}, which SKILL.md doesn't reference directly. Claude may only partially read nested references.`, fix: "Keep references one level deep: link every reference file directly from SKILL.md.", ref: BEST_PRACTICES_URL });
    }
    const lineCount = f.text.split("\n").length;
    if (lineCount > REFERENCE_TOC_LINES && !/^#{1,3}\s*(table of )?contents\b/im.test(f.text)) {
      issues.push({ rule: "REF_NO_TOC", severity: "tip", category: "references", file: p, message: `${p} is ${lineCount} lines without a table of contents.`, fix: "Add a ## Contents list at the top so Claude sees the full scope even on a partial read.", ref: BEST_PRACTICES_URL });
    }
  }
  return issues;
};
