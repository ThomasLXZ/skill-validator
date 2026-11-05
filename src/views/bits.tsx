export const textLink = "underline decoration-border underline-offset-4 hover:decoration-foreground";

export function InfoGrid({ items, cols = "lg:grid-cols-3" }: { items: { t: string; d: string }[]; cols?: string }) {
  return (
    <div className={`grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 ${cols}`}>
      {items.map((item) => (
        <div key={item.t} className="bg-background p-5">
          <h3 className="text-[15px] font-medium">{item.t}</h3>
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{item.d}</p>
        </div>
      ))}
    </div>
  );
}
