import Link from "next/link";
import Logo from "./Logo";
import { NAV_GROUPS, UI, navItems } from "@/lib/i18n/nav";
import { localePath, type Locale } from "@/lib/i18n/routing";

export default function SiteFooter({ locale = "en", children }: { locale?: Locale; children?: React.ReactNode }) {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-4 py-10 text-[13px] text-muted-foreground sm:px-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 font-medium text-foreground">
            <Logo />
            {UI.brand}
          </div>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            {NAV_GROUPS.map((group) => (
              <div key={group.id}>
                <div className="text-[11px] font-medium uppercase tracking-[0.08em]">{group.label[locale]}</div>
                <ul className="mt-2 space-y-1.5">
                  {navItems(group.id).map((item) => (
                    <li key={item.href}>
                      <Link className="hover:text-foreground" href={localePath(locale, item.href)}>{item.label[locale]}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-[420px] leading-relaxed lg:text-right">
          {children ?? <p>{UI.footer[locale]}</p>}
        </div>
      </div>
    </footer>
  );
}
