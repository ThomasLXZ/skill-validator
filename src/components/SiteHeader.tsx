"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { NAV } from "@/lib/site";
import { cn } from "@/lib/cn";

export default function SiteHeader() {
  const path = usePathname() ?? "/";
  const norm = path.endsWith("/") ? path : path + "/";
  return (
    <header className="site-header sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-[1240px] items-center gap-4 px-4 sm:px-6" aria-label="Main">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-[14px] font-semibold tracking-tight">
          <Logo />
          <span className="hidden sm:inline">Skill Validator</span>
        </Link>
        <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
        <ul className="no-scrollbar -mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto text-[13px]">
          {NAV.map((n) => {
            const active = n.href === "/" ? norm === "/" : norm.startsWith(n.href);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block whitespace-nowrap rounded-md px-2.5 py-1.5 transition-colors",
                    active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="hidden md:inline">{n.label}</span>
                  <span className="md:hidden">{n.short}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <ThemeToggle />
      </nav>
    </header>
  );
}
