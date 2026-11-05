"use client";

import { createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { stripLocale, type Locale } from "./routing";

const LocaleContext = createContext<Locale | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

/** Locale of the current page. The URL wins; the provider is the fallback for the first render. */
export function useLocale(): Locale {
  const fromPath = usePathLocale();
  const fromProvider = useContext(LocaleContext);
  return fromPath ?? fromProvider ?? "en";
}

export function usePathLocale(): Locale | null {
  const pathname = usePathname();
  if (!pathname) return null;
  return stripLocale(pathname).locale;
}
