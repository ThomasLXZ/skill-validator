import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { LOCALES, ROUTES, localePath } from "@/lib/i18n/routing";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-11-05");
  return ROUTES.flatMap((r) => {
    const languages = {
      en: `${SITE}${localePath("en", r.path)}`,
      "zh-Hans": `${SITE}${localePath("zh", r.path)}`,
      "x-default": `${SITE}${localePath("en", r.path)}`,
    };
    return LOCALES.map((locale) => ({
      url: `${SITE}${localePath(locale, r.path)}`,
      lastModified,
      changeFrequency: r.changeFrequency,
      priority: locale === "en" ? r.priority : Math.round(r.priority * 0.9 * 10) / 10,
      alternates: { languages },
    }));
  });
}
