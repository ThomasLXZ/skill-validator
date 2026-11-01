import type { Check, Issue } from "../types";
import { BEST_PRACTICES_URL, SPEC_URL } from "../spec";

const JUNK = [
  { re: /(^|\/)\.DS_Store$/, label: ".DS_Store" },
  { re: /(^|\/)Thumbs\.db$/i, label: "Thumbs.db" },
  { re: /(^|\/)__pycache__\//, label: "__pycache__/" },
  { re: /\.pyc$/, label: "*.pyc" },
  { re: /(^|\/)node_modules\//, label: "node_modules/" },
  { re: /(^|\/)\.git\//, label: ".git/" },
  { re: /(^|\/)\.venv\/|(^|\/)venv\//, label: "virtualenv" },
];
const SCRIPT_EXT = /\.(py|sh|bash|js|mjs|cjs|ts|rb|ps1)$/i;
const IGNORE_ORPHAN = /^(LICENSE|LICENSE\.\w+|LICENCE.*|NOTICE.*|CHANGELOG.*|\.gitignore)$/i;

/** Structure + scripts checks. Only meaningful for zip/folder uploads. */
export const structureCheck: Check = (ctx) => {
  const { bundle } = ctx;
  if (bundle.mode === "paste") return [];
  const issues: Issue[] = [];
  const paths = [...bundle.files.keys()];

  for (const j of JUNK) {
    const hits = paths.filter((p) => j.re.test(p));
    if (hits.length) {
      issues.push({ rule: "STRUCT_JUNK_FILES", severity: "warning", category: "structure", file: hits[0], message: `Bundle contains ${j.label} (${hits.length} file${hits.length > 1 ? "s" : ""}). These bloat the upload and leak local state.`, fix: `Exclude them when zipping, e.g. zip -r skill.zip skill/ -x "*${j.label.replace("/", "")}*".` });
    }
  }
  const envs = paths.filter((p) => /(^|\/)\.env(\.|$)/.test(p) && !/\.example$|\.sample$/.test(p));
  if (envs.length) {
    issues.push({ rule: "STRUCT_ENV_FILE", severity: "error", category: "security", file: envs[0], message: `Bundle contains ${envs[0]}, which usually holds secrets.`, fix: "Remove it; ship a .env.example with placeholder values instead." });
  }
  if (paths.some((p) => /^readme\.md$/i.test(p))) {
    issues.push({ rule: "STRUCT_README", severity: "tip", category: "structure", file: "README.md", message: "README.md inside the skill is not read by Claude; SKILL.md is the entry point.", fix: "Move anything Claude needs into SKILL.md or a referenced file; keep human docs outside the skill folder.", ref: BEST_PRACTICES_URL });
  }
  const backslash = paths.find((p) => p.includes("\\"));
  if (backslash) {
    issues.push({ rule: "STRUCT_BACKSLASH_PATH", severity: "warning", category: "structure", file: backslash, message: "File path contains a backslash (zip created on Windows?).", fix: "Re-create the zip with forward-slash paths." });
  }

  // scripts
  const scripts = paths.filter((p) => SCRIPT_EXT.test(p));
  for (const s of scripts) {
    const f = bundle.files.get(s);
    if (!f?.text) continue;
    if (/\.(sh|bash)$/i.test(s) && !f.text.startsWith("#!")) {
      issues.push({ rule: "SCRIPT_NO_SHEBANG", severity: "tip", category: "scripts", file: s, line: 1, message: `${s} has no shebang line.`, fix: "Start with #!/usr/bin/env bash (and chmod +x before zipping)." });
    }
    if (/\b(?:requests\.(?:get|post)|urllib\.request|fetch\(|axios|curl |wget )/.test(f.text)) {
      issues.push({ rule: "SCRIPT_NETWORK", severity: "tip", category: "scripts", file: s, message: `${s} makes network calls. Skills on the Claude API run with no network access.`, fix: "Document the requirement in compatibility: or make the script work offline.", ref: "https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview" });
    }
    if (/\.py$/.test(s)) {
      const imports = [...f.text.matchAll(/^\s*(?:import|from)\s+([a-zA-Z_][\w]*)/gm)].map((m) => m[1]);
      const thirdParty = imports.filter((m) => !PY_STDLIB.has(m) && !paths.some((p) => p.endsWith(`${m}.py`) || p.includes(`/${m}/`)));
      const skill = bundle.skillMd ?? "";
      const undocumented = [...new Set(thirdParty)].filter((m) => !new RegExp(`\\b${m}\\b`, "i").test(skill));
      if (undocumented.length) {
        issues.push({ rule: "SCRIPT_UNDOCUMENTED_DEPS", severity: "tip", category: "scripts", file: s, message: `${s} imports ${undocumented.join(", ")}, not mentioned in SKILL.md.`, fix: `List required packages, e.g. "Install: pip install ${undocumented.join(" ")}".`, ref: BEST_PRACTICES_URL });
      }
    }
  }

  // orphan files: present but never referenced from SKILL.md
  const orphans = paths.filter((p) => p !== "SKILL.md" && !IGNORE_ORPHAN.test(p) && !/^readme\.md$/i.test(p) && !JUNK.some((j) => j.re.test(p)) && !isReferenced(ctx.referenced, p));
  const orphanScripts = orphans.filter((p) => SCRIPT_EXT.test(p));
  const orphanDocs = orphans.filter((p) => /\.(md|markdown|txt)$/i.test(p));
  if (orphanScripts.length) {
    issues.push({ rule: "SCRIPT_UNREFERENCED", severity: "warning", category: "scripts", file: orphanScripts[0], message: `${orphanScripts.length} script(s) are never mentioned in SKILL.md: ${orphanScripts.slice(0, 5).join(", ")}. Claude won't know they exist.`, fix: "Say when to run each script and whether to execute or read it, e.g. \"Run `python scripts/x.py input.pdf`\".", ref: BEST_PRACTICES_URL });
  }
  if (orphanDocs.length) {
    issues.push({ rule: "REF_ORPHAN_DOCS", severity: "tip", category: "references", file: orphanDocs[0], message: `${orphanDocs.length} doc file(s) are not linked from SKILL.md: ${orphanDocs.slice(0, 5).join(", ")}.`, fix: "Link them from SKILL.md with a one-line note on when to read each, or delete them.", ref: SPEC_URL });
  }
  return issues;
};

function isReferenced(refs: Set<string>, p: string): boolean {
  if (refs.has(p)) return true;
  for (const r of refs) if (p.startsWith(r.replace(/\/?$/, "/"))) return true;
  return false;
}

const PY_STDLIB = new Set("abc argparse array ast asyncio base64 binascii bisect builtins bz2 calendar cmath codecs collections colorsys concurrent configparser contextlib copy csv ctypes dataclasses datetime decimal difflib dis email enum errno fnmatch fractions ftplib functools gc getopt getpass gettext glob gzip hashlib heapq hmac html http imaplib importlib inspect io ipaddress itertools json keyword locale logging lzma math mimetypes multiprocessing numbers operator os pathlib pickle platform pprint queue random re readline secrets select shlex shutil signal smtplib socket sqlite3 ssl stat statistics string struct subprocess sys tarfile tempfile textwrap threading time timeit tkinter token tokenize traceback types typing unicodedata unittest urllib uuid venv warnings weakref xml zipfile zlib zoneinfo __future__".split(" "));
