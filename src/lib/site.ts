import type { Metadata } from "next";
import { localePath, type Locale } from "./i18n/routing";

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
export const SITE_NAME = "Skill Validator";

/** Per-page metadata. `path` is the unprefixed route (`/robots-ai/`). Canonical and hreflang follow the locale. */
export function pageMeta(o: { title: string; description: string; path: string; locale?: Locale; keywords?: string[]; type?: "website" | "article" }): Metadata {
  const locale: Locale = o.locale ?? "en";
  const canonical = localePath(locale, o.path);
  const en = localePath("en", o.path);
  const zh = localePath("zh", o.path);
  return {
    title: o.title,
    description: o.description,
    keywords: o.keywords,
    alternates: {
      canonical,
      languages: { en, "zh-Hans": zh, "x-default": en },
    },
    openGraph: {
      type: o.type ?? "website",
      url: canonical,
      title: o.title,
      description: o.description,
      siteName: SITE_NAME,
      locale: locale === "zh" ? "zh_CN" : "en_US",
      alternateLocale: locale === "zh" ? ["en_US"] : ["zh_CN"],
    },
    twitter: { card: "summary_large_image", title: o.title, description: o.description },
  };
}
