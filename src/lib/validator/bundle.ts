import type { BundleFile, Issue, SkillBundle } from "./types";

const TEXT_EXT = /\.(md|markdown|txt|py|js|mjs|cjs|ts|tsx|jsx|sh|bash|zsh|ps1|rb|go|rs|java|json|ya?ml|toml|ini|cfg|csv|tsv|xml|html?|css|sql|r|lua|php|pl|env|gitignore)$/i;
const MAX_TEXT_BYTES = 2 * 1024 * 1024;

export function isTextPath(p: string): boolean {
  const base = p.split("/").pop() ?? p;
  return TEXT_EXT.test(base) || !base.includes(".") || base.startsWith(".");
}

export function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "");
}

/** Bundle from a pasted SKILL.md (no other files available). */
export function bundleFromText(skillMd: string, rootDir?: string): SkillBundle {
  const files = new Map<string, BundleFile>();
  files.set("SKILL.md", { path: "SKILL.md", size: skillMd.length, text: skillMd });
  return { mode: "paste", rootDir, skillMd, files, loadIssues: [] };
}

/**
 * Bundle from a flat list of (path, content) entries, as produced by a zip or
 * a folder upload. Locates SKILL.md, re-roots paths to the skill directory.
 */
export function bundleFromEntries(
  entries: Array<{ path: string; size: number; text?: string }>,
  mode: "zip" | "folder",
): SkillBundle {
  const loadIssues: Issue[] = [];
  const all = entries
    .map((e) => ({ ...e, path: normalizePath(e.path) }))
    .filter((e) => e.path && !e.path.endsWith("/") && !e.path.startsWith("__MACOSX/"));

  const skillMds = all
    .filter((e) => (e.path.split("/").pop() ?? "") === "SKILL.md")
    .sort((a, b) => a.path.split("/").length - b.path.split("/").length);
  const wrongCase = all.filter((e) => /^skill\.md$/i.test(e.path.split("/").pop() ?? "") && !e.path.endsWith("SKILL.md"));

  if (skillMds.length === 0) {
    if (wrongCase.length) {
      loadIssues.push({
        rule: "STRUCT_SKILL_MD_CASE",
        severity: "error",
        category: "structure",
        file: wrongCase[0].path,
        message: `Found "${wrongCase[0].path}" but the file must be named exactly SKILL.md (uppercase).`,
        fix: "Rename the file to SKILL.md.",
      });
    } else {
      loadIssues.push({
        rule: "STRUCT_NO_SKILL_MD",
        severity: "error",
        category: "structure",
        message: "No SKILL.md found in the upload. Every skill is a directory containing a SKILL.md file.",
        fix: "Add SKILL.md at the root of your skill folder (my-skill/SKILL.md) and zip the folder.",
      });
    }
    const files = new Map<string, BundleFile>();
    for (const e of all) files.set(e.path, e);
    return { mode, files, loadIssues };
  }

  const primary = skillMds[0];
  const prefix = primary.path.slice(0, primary.path.length - "SKILL.md".length); // "" or "dir/.../"
  if (skillMds.length > 1) {
    loadIssues.push({
      rule: "STRUCT_MULTIPLE_SKILLS",
      severity: "warning",
      category: "structure",
      message: `Found ${skillMds.length} SKILL.md files (${skillMds.map((s) => s.path).join(", ")}). Only "${primary.path}" was validated.`,
      fix: "Upload one skill per zip, or validate each skill folder separately.",
    });
  }
  const rootDir = prefix ? prefix.replace(/\/$/, "").split("/").pop() : undefined;
  const files = new Map<string, BundleFile>();
  for (const e of all) {
    if (!e.path.startsWith(prefix)) continue;
    const rel = e.path.slice(prefix.length);
    files.set(rel, { path: rel, size: e.size, text: e.text });
  }
  if (mode === "zip" && !prefix) {
    loadIssues.push({
      rule: "STRUCT_ZIP_NO_FOLDER",
      severity: "tip",
      category: "structure",
      message: "SKILL.md sits at the zip root. claude.ai expects the zip to contain the skill folder (my-skill/SKILL.md).",
      fix: "Zip the folder itself, not its contents: `zip -r my-skill.zip my-skill/`.",
      ref: "https://support.claude.com/en/articles/12512198-creating-custom-skills",
    });
  }
  return { mode, rootDir, skillMd: primary.text ?? "", files, loadIssues };
}

/** Browser/Node: read a .zip (ArrayBuffer/Uint8Array/Blob) into a bundle. */
export async function bundleFromZip(data: ArrayBuffer | Uint8Array | Blob): Promise<SkillBundle> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(data);
  const entries: Array<{ path: string; size: number; text?: string }> = [];
  const tasks: Promise<void>[] = [];
  zip.forEach((path, file) => {
    if (file.dir) return;
    tasks.push(
      (async () => {
        const bytes = await file.async("uint8array");
        const entry: { path: string; size: number; text?: string } = { path, size: bytes.length };
        if (isTextPath(path) && bytes.length <= MAX_TEXT_BYTES) {
          entry.text = new TextDecoder("utf-8").decode(bytes);
        }
        entries.push(entry);
      })(),
    );
  });
  await Promise.all(tasks);
  return bundleFromEntries(entries, "zip");
}

/** Browser: read files from <input webkitdirectory> into a bundle. */
export async function bundleFromFileList(list: FileList | File[]): Promise<SkillBundle> {
  const arr = Array.from(list);
  const entries = await Promise.all(
    arr.map(async (f) => {
      const path = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
      const entry: { path: string; size: number; text?: string } = { path, size: f.size };
      if (isTextPath(path) && f.size <= MAX_TEXT_BYTES) entry.text = await f.text();
      return entry;
    }),
  );
  return bundleFromEntries(entries, "folder");
}
