// Light-mode screenshots of the new routes. Usage: npx serve out -l 3000 & ; node scripts/screenshot-new.mjs
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE ?? "http://localhost:3000";
const outDir = path.resolve("screenshots");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light" });
await ctx.addInitScript(() => { try { localStorage.setItem("theme", "light"); } catch {} });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

async function go(p, sel) {
  await page.goto(BASE + p, { waitUntil: "networkidle" });
  if (sel) await page.waitForSelector(sel);
  await page.waitForTimeout(500);
}
const toTool = (id) => page.evaluate((id) => window.scrollTo(0, document.getElementById(id).getBoundingClientRect().top + window.scrollY - 72), id);
const shot = (name, opts = {}) => page.screenshot({ path: path.join(outDir, `new-${name}.png`), ...opts });

await go("/", ".cm-editor"); await shot("home");
await go("/agents-md/", ".cm-editor"); await shot("agents-md");
await toTool("agents-md-tool"); await shot("agents-md-check");
await page.getByRole("tab", { name: "Generate" }).click(); await page.waitForTimeout(300); await shot("agents-md-builder");
await go("/robots-ai/", ".cm-editor"); await shot("robots-ai");
await toTool("robots-ai-tool"); await shot("robots-ai-check");
await page.getByRole("tab", { name: "Generate" }).click(); await page.waitForTimeout(300); await shot("robots-ai-generator");
await page.getByRole("tab", { name: "llms.txt" }).click(); await page.waitForSelector(".cm-editor"); await page.waitForTimeout(400); await shot("robots-ai-llms");
await go("/tool-result-size/", ".cm-editor"); await shot("tool-result-size");
await toTool("tool-result-size-tool"); await shot("tool-result-size-tool");
await go("/cursor-rules/", ".cm-editor"); await shot("cursor-rules");
await toTool("cursor-rules-tool");
await page.getByRole("tab", { name: "Build a rule" }).click(); await page.waitForTimeout(300); await shot("cursor-rules-builder");
await go("/learn/mcp-tool-vs-resource-vs-prompt/"); await shot("learn-mcp");
await shot("learn-mcp-full", { fullPage: true });

// mobile check
await page.setViewportSize({ width: 390, height: 844 });
await go("/robots-ai/", ".cm-editor"); await shot("robots-ai-mobile");

console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no console errors");
await browser.close();
