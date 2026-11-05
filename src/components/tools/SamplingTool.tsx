"use client";

import { useMemo, useState } from "react";
import { Droplets } from "lucide-react";
import { checkSampling, type ModelClass } from "@/lib/claude-sampling";
import { Editor, FindingsList, GhostButton, LocalNote, PaneHeader, SeverityCounts, Stat, ToolCard, Toolbar } from "./ui";

const EXAMPLES: { id: string; label: string; body: Record<string, unknown> }[] = [
  { id: "omit", label: "Omitted", body: { model: "claude-sonnet-4-6", max_tokens: 512, messages: [{ role: "user", content: "Summarise the notes." }] } },
  { id: "temp", label: "temperature 0", body: { model: "claude-sonnet-4-6", max_tokens: 512, temperature: 0, messages: [{ role: "user", content: "Extract the fields." }] } },
  { id: "default", label: "temperature 1", body: { model: "claude-opus-4-6", max_tokens: 512, temperature: 1, messages: [{ role: "user", content: "Draft a reply." }] } },
  { id: "new", label: "Sonnet 5", body: { model: "claude-sonnet-5", max_tokens: 512, temperature: 0.2, top_k: 40, messages: [{ role: "user", content: "Hi" }] } },
];

const CLASS_LABEL: Record<ModelClass, string> = {
  "watermark-sensitive": "4.6 watermark",
  "sampling-locked": "Sampling locked",
  other: "Other model",
  unspecified: "No model",
};

export default function SamplingTool() {
  const [text, setText] = useState(() => JSON.stringify(EXAMPLES[1].body, null, 2));
  const report = useMemo(() => checkSampling(text), [text]);
  const shown = report.findings.filter((f) => f.rule !== "WM_OMITTED");
  const tone = report.modelClass === "watermark-sensitive" && shown.some((f) => f.rule === "WM_NON_DEFAULT")
    ? "warning"
    : report.findings.some((f) => f.severity === "error")
      ? "error"
      : "ok";

  return (
    <ToolCard id="text-watermark-tool">
      <Toolbar>
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <Droplets className="size-4 text-muted-foreground" aria-hidden />
          Messages API request
        </div>
        <span className="hidden text-[12.5px] text-muted-foreground sm:block">Checks sampling keys. Does not detect a watermark in text.</span>
      </Toolbar>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="flex min-h-[420px] flex-col border-b lg:h-[620px] lg:border-b-0 lg:border-r">
          <PaneHeader title="Request JSON">
            {EXAMPLES.map((e) => (
              <GhostButton key={e.id} onClick={() => setText(JSON.stringify(e.body, null, 2))}>{e.label}</GhostButton>
            ))}
          </PaneHeader>
          <div className="h-[420px] min-h-0 flex-1 lg:h-auto">
            <Editor language="plain" value={text} onChange={setText} diagnostics={[]} ariaLabel="Claude request JSON" placeholderText='{"model":"claude-sonnet-4-6","max_tokens":512,"messages":[]}' />
          </div>
        </div>
        <div className="output min-h-[280px] p-4 sm:p-5 lg:h-[620px] lg:overflow-y-auto" aria-live="polite">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Model class" value={CLASS_LABEL[report.modelClass]} sub={report.model || "model not set"} tone={tone} />
            <Stat label="Sampling keys" value={report.present.length ? report.present.join(", ") : "omitted"} sub="temperature, top_p, top_k" tone={report.present.length ? "warning" : "ok"} />
          </div>
          <div className="mt-4"><SeverityCounts findings={shown} /></div>
          <div className="mt-3">
            <FindingsList
              findings={shown}
              empty="temperature, top_p, and top_k are omitted. That matches the text-watermark guidance to leave sampling unset."
            />
          </div>
        </div>
      </div>
      <LocalNote />
    </ToolCard>
  );
}
