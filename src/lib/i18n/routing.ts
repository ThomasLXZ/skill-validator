/** Locale paths for a static export.
 *
 * English stays on the existing URLs (`/`, `/robots-ai/`, …) so current
 * canonicals keep working without a Worker redirect. Simplified Chinese is
 * the same path under `/zh/`, with the same trailing slash Next already emits.
 * `x-default` and `en` hreflang point at the unprefixed URL.
 */

export const LOCALES = ["en", "zh"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_HTML: Record<Locale, string> = {
  en: "en",
  zh: "zh-Hans",
};

export const ROUTES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/agents-md/", priority: 0.9, changeFrequency: "weekly" },
  { path: "/json-schema/", priority: 0.9, changeFrequency: "weekly" },
  { path: "/mcp/", priority: 0.9, changeFrequency: "weekly" },
  { path: "/text-watermark/", priority: 0.8, changeFrequency: "monthly" },
  { path: "/robots-ai/", priority: 0.8, changeFrequency: "weekly" },
  { path: "/tool-result-size/", priority: 0.8, changeFrequency: "monthly" },
  { path: "/cursor-rules/", priority: 0.8, changeFrequency: "monthly" },
  { path: "/learn/mcp-tool-vs-resource-vs-prompt/", priority: 0.7, changeFrequency: "monthly" },
  { path: "/learn/mcp-server-shi-shenme/", priority: 0.7, changeFrequency: "monthly" },
];

/** Always a leading slash and a trailing slash, except the root which is `/`. */
export function normalizePath(path: string): string {
  if (!path || path === "/") return "/";
  let p = path.startsWith("/") ? path : `/${path}`;
  if (p.length > 1 && p.endsWith("/")) p = p.replace(/\/+$/, "/");
  if (!p.endsWith("/")) p += "/";
  return p;
}

export function localePath(locale: Locale, path: string): string {
  const p = stripLocale(path).path;
  if (locale === "en") return p;
  return p === "/" ? "/zh/" : `/zh${p}`;
}

export function stripLocale(pathname: string): { locale: Locale; path: string } {
  const p = normalizePath(pathname);
  if (p === "/zh/") return { locale: "zh", path: "/" };
  if (p.startsWith("/zh/")) return { locale: "zh", path: normalizePath(p.slice(3)) };
  return { locale: "en", path: p };
}

export function switchLocalePath(pathname: string, locale: Locale): string {
  return localePath(locale, stripLocale(pathname).path);
}

/** Exact match for `/`. Prefix match for everything else, after the locale is stripped. */
export function isNavActive(currentPath: string, href: string): boolean {
  const current = normalizePath(currentPath);
  const target = normalizePath(href);
  if (target === "/") return current === "/";
  return current === target || current.startsWith(target);
}
