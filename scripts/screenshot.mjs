// Headless screenshots of the locally served static export.
// Usage: npm run build && npx serve out -l 3000 & ; npm run screenshot   (PREFIX=after- by default)
import { chromium } from "playwright";
import JSZip from "jszip";
import fs from "node:fs";
import path from "node:path";

const URL = process.env.URL ?? "http://localhost:3000/";
const PREFIX = process.env.PREFIX ?? "after-";
const outDir = path.resolve("screenshots");
fs.mkdirSync(outDir, { recursive: true });
const shot = (p, name, opts = {}) => p.screenshot({ path: path.join(outDir, `${PREFIX}${name}.png`), ...opts });

async function zipFixture(rel) {
  const root = path.resolve("fixtures", rel);
  const zip = new JSZip();
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else zip.file(`${path.basename(root)}/${path.relative(root, full)}`, fs.readFileSync(full));
    }
  };
  walk(root);
  const file = path.join("/tmp", `${path.basename(root)}.zip`);
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer" }));
  return file;
}

async function open(browser, { width = 1440, height = 1000, scheme = "light" } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, colorScheme: scheme });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector(".scorecard");
  await page.waitForSelector(".cm-editor");
  await page.waitForTimeout(700); // score ring transition
  return page;
}
const toTool = (p) => p.evaluate(() => window.scrollTo(0, document.querySelector("#validator").getBoundingClientRect().top + window.scrollY - 72));

const browser = await chromium.launch();

let page = await open(browser);
await shot(page, "landing-full", { fullPage: true });
await shot(page, "hero");
await toTool(page); await page.waitForTimeout(150);
await shot(page, "bad-example");
console.log("score (bad paste):", await page.textContent(".score .num"));

await page.click("text=Good example");
await page.waitForTimeout(800);
await shot(page, "good-example");
console.log("score (good paste):", await page.textContent(".score .num"));

await page.click("text=Upload .zip");
await page.setInputFiles('input[type="file"][accept]', await zipFixture("bad/missing-references"));
await page.waitForSelector(".scorecard");
await page.waitForTimeout(800);
await shot(page, "zip-missing-references");
console.log("score (zip missing-references):", await page.textContent(".score .num"));
await page.context().close();

page = await open(browser, { scheme: "dark" });
await shot(page, "dark-landing-full", { fullPage: true });
await toTool(page); await page.waitForTimeout(150);
await shot(page, "dark-bad-example");
await page.context().close();

page = await open(browser, { width: 390, height: 844 });
await shot(page, "mobile");
await shot(page, "mobile-full", { fullPage: true });
await page.context().close();

await browser.close();
console.log("saved to", outDir);
