"use client";

import { Moon, Sun } from "lucide-react";
import { UI } from "@/lib/i18n/nav";
import { useLocale } from "@/lib/i18n/context";

export default function ThemeToggle() {
  const locale = useLocale();
  const toggle = () => {
    const dark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch {}
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={UI.theme[locale]}
      className="theme-toggle grid size-8 place-items-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Sun className="hidden size-4 dark:block" aria-hidden />
      <Moon className="size-4 dark:hidden" aria-hidden />
    </button>
  );
}
