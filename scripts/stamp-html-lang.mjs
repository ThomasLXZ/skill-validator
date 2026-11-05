import fs from "node:fs";
import path from "node:path";

const root = path.resolve("out/zh");
if (!fs.existsSync(root)) process.exit(0);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".html")) {
      const html = fs.readFileSync(full, "utf8");
      const next = html.replace('<html lang="en"', '<html lang="zh-Hans"');
      if (next !== html) fs.writeFileSync(full, next);
    }
  }
}

walk(root);
