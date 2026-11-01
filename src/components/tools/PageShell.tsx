import { Check } from "lucide-react";
import SiteHeader from "../SiteHeader";
import SiteFooter from "../SiteFooter";

/** Hero + tool + content sections, shared by every tool page. */
export function ToolPage({ eyebrow, title, lead, bullets, tool, children, jsonLd }: {
  eyebrow: string; title: string; lead: React.ReactNode; bullets: string[]; tool: React.ReactNode; children?: React.ReactNode; jsonLd?: object;
}) {
  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <SiteHeader />
      <main>
        <section className="hero relative">
          <div className="hero-grid pointer-events-none absolute inset-x-0 top-0 h-[420px]" aria-hidden />
          <div className="relative mx-auto max-w-[1240px] px-4 pb-8 pt-12 sm:px-6 sm:pt-16">
            <div className="max-w-[860px]">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-[12.5px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-ok" aria-hidden />
                {eyebrow}
              </p>
              <h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[48px]">{title}</h1>
              <p className="lead mt-4 max-w-[680px] text-[16.5px] leading-relaxed text-muted-foreground sm:text-[17.5px]">{lead}</p>
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-muted-foreground">
                {bullets.map((t) => (
                  <li key={t} className="flex items-center gap-2"><Check className="size-4 text-ok" aria-hidden />{t}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="relative mx-auto max-w-[1240px] px-4 pb-16 sm:px-6">{tool}</div>
        </section>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

export function ContentSection({ title, intro, children, muted, id }: { title: string; intro?: React.ReactNode; children?: React.ReactNode; muted?: boolean; id?: string }) {
  return (
    <section id={id} className={muted ? "border-t bg-subtle" : "border-t"}>
      <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6">
        <div className="max-w-[680px]">
          <h2 className="text-[26px] font-semibold tracking-[-0.025em] sm:text-[30px]">{title}</h2>
          {intro ? <div className="mt-3 text-[16px] leading-relaxed text-muted-foreground">{intro}</div> : null}
        </div>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}

export function Sources({ items }: { items: { label: string; href: string; note?: string; status?: string }[] }) {
  return (
    <ul className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2">
      {items.map((s) => (
        <li key={s.href} className="bg-background p-5">
          <div className="flex items-start justify-between gap-3">
            <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-[14.5px] font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">{s.label}</a>
            {s.status && <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">{s.status}</span>}
          </div>
          {s.note && <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{s.note}</p>}
        </li>
      ))}
    </ul>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y border-y">
      {items.map((f) => (
        <details key={f.q} className="group">
          <summary className="flex cursor-pointer items-start justify-between gap-6 py-5 text-[15.5px] font-medium">
            {f.q}
            <span className="chev mt-0.5 grid size-5 shrink-0 place-items-center text-muted-foreground transition-transform" aria-hidden>
              <svg viewBox="0 0 16 16" className="size-4"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </span>
          </summary>
          <p className="-mt-1 pb-5 pr-10 text-[15px] leading-relaxed text-muted-foreground">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return { "@type": "FAQPage", mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
}
