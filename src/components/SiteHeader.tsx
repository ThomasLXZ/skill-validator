"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, Menu, X } from "lucide-react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { cn } from "@/lib/cn";
import { NAV_GROUPS, NAV_ITEMS, UI, navItems, type NavGroupId, type NavItem } from "@/lib/i18n/nav";
import { isNavActive, localePath, stripLocale, switchLocalePath, type Locale } from "@/lib/i18n/routing";

type OpenMenu = NavGroupId | "mobile" | null;

export default function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const { locale, path } = stripLocale(pathname);
  const [open, setOpen] = useState<OpenMenu>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => { setOpen(null); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const remember = (next: Locale) => {
    try { localStorage.setItem("locale", next); } catch { /* private mode */ }
  };

  return (
    <header ref={rootRef} className="site-header sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-[1240px] items-center gap-2 px-4 sm:px-6" aria-label={UI.mainNav[locale]}>
        <Link href={localePath(locale, "/")} className="flex shrink-0 items-center gap-2 text-[14px] font-semibold tracking-tight">
          <Logo />
          <span className="hidden sm:inline">{UI.brand}</span>
        </Link>

        <div className="ml-1 hidden items-center gap-0.5 md:flex">
          {NAV_GROUPS.map((group) => (
            <DesktopMenu
              key={group.id}
              locale={locale}
              path={path}
              groupId={group.id}
              label={group.label[locale]}
              items={navItems(group.id)}
              open={open === group.id}
              onToggle={() => setOpen((cur) => (cur === group.id ? null : group.id))}
              onNavigate={() => setOpen(null)}
            />
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <LanguageSwitch locale={locale} pathname={pathname} onPick={remember} />
          <ThemeToggle />
          <button
            type="button"
            className="grid size-8 place-items-center rounded-md border text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            aria-expanded={open === "mobile"}
            aria-controls="mobile-nav"
            aria-label={open === "mobile" ? UI.closeMenu[locale] : UI.menu[locale]}
            onClick={() => setOpen((cur) => (cur === "mobile" ? null : "mobile"))}
          >
            {open === "mobile" ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
          </button>
        </div>
      </nav>

      {open === "mobile" && (
        <div id="mobile-nav" className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t bg-background md:hidden">
          <div className="mx-auto max-w-[1240px] px-3 py-2 sm:px-5">
            {NAV_GROUPS.map((group) => (
              <section key={group.id} className="py-2" aria-label={group.label[locale]}>
                <h2 className="px-2 pb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{group.label[locale]}</h2>
                <ul>
                  {navItems(group.id).map((item) => (
                    <li key={item.href}>
                      <NavLink locale={locale} path={path} item={item} onNavigate={() => setOpen(null)} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function DesktopMenu({ locale, path, groupId, label, items, open, onToggle, onNavigate }: {
  locale: Locale; path: string; groupId: NavGroupId; label: string; items: NavItem[]; open: boolean; onToggle(): void; onNavigate(): void;
}) {
  const panelId = useId();
  const active = items.find((item) => isNavActive(path, item.href));
  const wide = groupId === "tools";
  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
          active || open ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="true"
        onClick={onToggle}
      >
        {active && <span className="size-1.5 rounded-full bg-accent" aria-hidden />}
        <span>{label}</span>
        {active && <span className="hidden max-w-[11rem] truncate font-normal text-muted-foreground lg:inline"> · {active.short[locale]}</span>}
        <ChevronDown className={cn("size-3.5 opacity-60 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div
          id={panelId}
          role="menu"
          className={cn(
            "absolute left-0 top-[calc(100%+8px)] z-50 rounded-xl border bg-background p-1.5 shadow-[0_12px_40px_-16px_rgb(0_0_0/0.28)]",
            wide ? "w-[min(560px,calc(100vw-2rem))]" : "w-[min(340px,calc(100vw-2rem))]",
          )}
        >
          <ul className={cn(wide && "sm:grid sm:grid-cols-2")}>
            {items.map((item) => (
              <li key={item.href} role="none">
                <NavLink locale={locale} path={path} item={item} onNavigate={onNavigate} menu />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function NavLink({ locale, path, item, onNavigate, menu }: {
  locale: Locale; path: string; item: NavItem; onNavigate(): void; menu?: boolean;
}) {
  const active = isNavActive(path, item.href);
  return (
    <Link
      href={localePath(locale, item.href)}
      role={menu ? "menuitem" : undefined}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "flex items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
        active ? "bg-accent-soft text-foreground" : "hover:bg-muted",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-medium leading-5">{item.label[locale]}</span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">{item.blurb[locale]}</span>
      </span>
      {active && <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />}
    </Link>
  );
}

function LanguageSwitch({ locale, pathname, onPick }: { locale: Locale; pathname: string; onPick(locale: Locale): void }) {
  const options: { id: Locale; label: string; hrefLang: string }[] = [
    { id: "en", label: "EN", hrefLang: "en" },
    { id: "zh", label: "中文", hrefLang: "zh-Hans" },
  ];
  return (
    <div role="group" aria-label={UI.language[locale]} className="inline-flex rounded-md border bg-background p-0.5 text-[12px] font-medium">
      {options.map((option) => {
        const current = option.id === locale;
        return (
          <Link
            key={option.id}
            href={switchLocalePath(pathname, option.id)}
            hrefLang={option.hrefLang}
            lang={option.hrefLang}
            aria-current={current ? "true" : undefined}
            onClick={() => onPick(option.id)}
            className={cn(
              "rounded px-2 py-1 transition-colors",
              current ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
