import { FileCode2 } from "lucide-react";

export default function Code({ children, title }: { children: string; title: string }) {
  return (
    <figure className="snippet overflow-hidden rounded-xl border bg-editor">
      <figcaption className="flex items-center gap-2 border-b px-4 py-2.5 text-[13px] font-medium">
        <FileCode2 className="size-3.5 text-muted-foreground" aria-hidden />
        {title}
      </figcaption>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-muted-foreground"><code>{children}</code></pre>
    </figure>
  );
}
