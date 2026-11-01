import fs from "node:fs";
import path from "node:path";
import { bundleFromEntries, isTextPath } from "@/lib/validator";

export const FIXTURES = path.resolve(__dirname, "../fixtures");

/** Load a fixture folder the same way the browser folder upload does. */
export function loadFixture(rel: string) {
  const root = path.join(FIXTURES, rel);
  const dirName = path.basename(root);
  const entries: Array<{ path: string; size: number; text?: string }> = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else {
        const relPath = `${dirName}/${path.relative(root, full).split(path.sep).join("/")}`;
        const buf = fs.readFileSync(full);
        entries.push({ path: relPath, size: buf.length, text: isTextPath(relPath) ? buf.toString("utf8") : undefined });
      }
    }
  };
  walk(root);
  return bundleFromEntries(entries, "folder");
}

export const rules = (r: { issues: Array<{ rule: string }> }) => r.issues.map((i) => i.rule);
