import Link from "next/link";
import Logo from "./Logo";
import { NAV } from "@/lib/site";

export default function SiteFooter({ children }: { children?: React.ReactNode }) {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-4 py-10 text-[13px] text-muted-foreground sm:px-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2.5 font-medium text-foreground">
            <Logo />
            Skill Validator
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
            {NAV.map((n) => (
              <li key={n.href}><Link className="hover:text-foreground" href={n.href}>{n.label}</Link></li>
            ))}
          </ul>
        </div>
        <div className="max-w-[640px] leading-relaxed md:text-right">
          {children ?? <p>Free developer tools for AI agents. Everything runs in your browser; nothing you paste is uploaded.</p>}
        </div>
      </div>
    </footer>
  );
}
