"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { LOCALE_HTML, stripLocale } from "@/lib/i18n/routing";

/** Keep <html lang> aligned with the URL after client-side navigations. */
export default function HtmlLang() {
  const pathname = usePathname();
  useEffect(() => {
    document.documentElement.lang = LOCALE_HTML[stripLocale(pathname ?? "/").locale];
  }, [pathname]);
  return null;
}
