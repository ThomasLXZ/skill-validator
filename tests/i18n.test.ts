import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { NAV_ITEMS } from "@/lib/i18n/nav";
import { isNavActive, localePath, normalizePath, stripLocale, switchLocalePath } from "@/lib/i18n/routing";
import { SITE } from "@/lib/site";

const CJK = /[\u3400-\u9fff]/;

describe("locale paths", () => {
  it("keeps English on the existing trailing-slash URLs", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("en", "/robots-ai")).toBe("/robots-ai/");
    expect(localePath("en", "/robots-ai/")).toBe("/robots-ai/");
    expect(localePath("en", "learn/mcp-server-shi-shenme")).toBe("/learn/mcp-server-shi-shenme/");
  });

  it("prefixes Simplified Chinese and keeps the trailing slash", () => {
    expect(localePath("zh", "/")).toBe("/zh/");
    expect(localePath("zh", "/zh/robots-ai/")).toBe("/zh/robots-ai/");
    expect(localePath("zh", "/robots-ai/")).toBe("/zh/robots-ai/");
    expect(localePath("zh", "/learn/mcp-tool-vs-resource-vs-prompt/")).toBe("/zh/learn/mcp-tool-vs-resource-vs-prompt/");
  });

  it("strips the locale prefix without treating other /zh paths as the home page", () => {
    expect(stripLocale("/")).toEqual({ locale: "en", path: "/" });
    expect(stripLocale("/robots-ai")).toEqual({ locale: "en", path: "/robots-ai/" });
    expect(stripLocale("/zh")).toEqual({ locale: "zh", path: "/" });
    expect(stripLocale("/zh/")).toEqual({ locale: "zh", path: "/" });
    expect(stripLocale("/zh/robots-ai/")).toEqual({ locale: "zh", path: "/robots-ai/" });
    expect(normalizePath("/mcp")).toBe("/mcp/");
  });

  it("switches locale while staying on the same page", () => {
    expect(switchLocalePath("/robots-ai/", "zh")).toBe("/zh/robots-ai/");
    expect(switchLocalePath("/zh/robots-ai/", "en")).toBe("/robots-ai/");
    expect(switchLocalePath("/zh/", "en")).toBe("/");
    expect(switchLocalePath("/", "zh")).toBe("/zh/");
  });

  it("marks the home item active only on the exact home path", () => {
    expect(isNavActive("/", "/")).toBe(true);
    expect(isNavActive("/agents-md/", "/")).toBe(false);
    expect(isNavActive("/learn/mcp-server-shi-shenme/", "/learn/mcp-server-shi-shenme/")).toBe(true);
    expect(isNavActive("/learn/mcp-server-shi-shenme/", "/learn/mcp-tool-vs-resource-vs-prompt/")).toBe(false);
  });
});

describe("navigation copy", () => {
  it("keeps English labels free of Chinese, including the MCP explainer", () => {
    for (const item of NAV_ITEMS) {
      expect(item.label.en, item.href).not.toMatch(CJK);
      expect(item.short.en, item.href).not.toMatch(CJK);
      expect(item.blurb.en, item.href).not.toMatch(CJK);
      expect(item.label.zh.length).toBeGreaterThan(0);
    }
    const what = NAV_ITEMS.find((item) => item.href === "/learn/mcp-server-shi-shenme/");
    expect(what?.label.en).toBe("What is an MCP server");
    expect(what?.label.zh).toBe("MCP 是什么");
  });

  it("groups tools and learn separately", () => {
    const tools = NAV_ITEMS.filter((item) => item.group === "tools").map((item) => item.href);
    const learn = NAV_ITEMS.filter((item) => item.group === "learn").map((item) => item.href);
    expect(tools).toContain("/");
    expect(tools).toContain("/robots-ai/");
    expect(tools).not.toContain("/learn/mcp-server-shi-shenme/");
    expect(learn).toEqual([
      "/learn/mcp-tool-vs-resource-vs-prompt/",
      "/learn/mcp-server-shi-shenme/",
    ]);
  });
});

describe("sitemap", () => {
  it("lists every route in both locales with hreflang", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain(`${SITE}/`);
    expect(urls).toContain(`${SITE}/zh/`);
    expect(urls).toContain(`${SITE}/robots-ai/`);
    expect(urls).toContain(`${SITE}/zh/robots-ai/`);
    expect(urls).toContain(`${SITE}/zh/learn/mcp-server-shi-shenme/`);
    expect(urls.filter((url) => url.includes("/zh/zh/"))).toEqual([]);

    const home = entries.find((entry) => entry.url === `${SITE}/zh/`);
    expect(home?.alternates?.languages).toMatchObject({
      en: `${SITE}/`,
      "zh-Hans": `${SITE}/zh/`,
      "x-default": `${SITE}/`,
    });
  });
});
