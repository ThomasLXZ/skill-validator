"use client";

import { useMemo, useRef, useState } from "react";
import { Braces, FlaskConical, ShieldCheck } from "lucide-react";
import { checkInstance, checkSchema, checkStructuredOutput } from "@/lib/json-schema";
import { chrome } from "@/lib/i18n/chrome";
import { useLocale } from "@/lib/i18n/context";
import {
  CopyButtons, Editor, FindingsList, GhostButton, LocalNote, PaneHeader, SectionTitle, SeverityCounts, Stat,
  Tabs, toDiagnostics, ToolCard, Toolbar, type CodeEditorHandle,
} from "./ui";

type Tab = "schema" | "instance" | "openai";

const DRAFT7 = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "status": { "type": "string", "enum": ["ok", "error"] },
    "count": { "type": "integer", "minimum": 0 }
  },
  "required": ["status"],
  "additionalProperties": false
}`;

const BAD_ENUM = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "string",
  "enum": ["ok", "ok", 1],
  "exclusiveMinimum": true,
  "minimum": 0
}`;

const OPENAI = `{
  "name": "weather",
  "strict": true,
  "schema": {
    "type": "object",
    "properties": {
      "city": { "type": "string" },
      "unit": { "type": "string", "enum": ["C", "F"] }
    },
    "required": ["city"]
  }
}`;

const INSTANCE_OK = `{
  "status": "ok",
  "count": 2
}`;

const INSTANCE_BAD = `{
  "status": "nope",
  "count": -1,
  "extra": true
}`;

export default function SchemaTool() {
  const labels = chrome(useLocale()).schema;
  const [tab, setTab] = useState<Tab>("schema");
  const [schema, setSchema] = useState(DRAFT7);
  const [instance, setInstance] = useState(INSTANCE_BAD);
  const editor = useRef<CodeEditorHandle>(null);
  const lint = useMemo(() => checkSchema(schema), [schema]);
  const data = useMemo(() => checkInstance(schema, instance), [schema, instance]);
  const strict = useMemo(() => checkStructuredOutput(schema), [schema]);
  const findings = tab === "instance" ? data.findings : tab === "openai" ? strict.findings : lint.findings;
  const diags = useMemo(() => toDiagnostics(findings), [findings]);

  return (
    <ToolCard id="json-schema-tool">
      <Toolbar>
        <Tabs<Tab>
          label="Schema mode"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "schema", label: labels.schema, Icon: Braces },
            { id: "instance", label: labels.playground, Icon: FlaskConical },
            { id: "openai", label: labels.openai, Icon: ShieldCheck },
          ]}
        />
        <span className="hidden text-[12.5px] text-muted-foreground md:block">Draft-07 keyword checks, then strict structured output</span>
      </Toolbar>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="flex min-h-[420px] flex-col border-b lg:h-[680px] lg:border-b-0 lg:border-r">
          <PaneHeader icon={<Braces className="size-3.5 text-muted-foreground" aria-hidden />} title="JSON Schema">
            <GhostButton onClick={() => { setSchema(DRAFT7); setInstance(INSTANCE_OK); }}>Draft-07</GhostButton>
            <GhostButton onClick={() => setSchema(BAD_ENUM)}>Enum</GhostButton>
            <GhostButton onClick={() => { setSchema(OPENAI); setTab("openai"); }}>OpenAI</GhostButton>
            <GhostButton onClick={() => setSchema("")}>Clear</GhostButton>
          </PaneHeader>
          <div className="h-[420px] min-h-0 flex-1 lg:h-auto">
            <Editor ref={editor} language="plain" value={schema} onChange={setSchema} diagnostics={diags} ariaLabel="JSON Schema" placeholderText='{"$schema":"http://json-schema.org/draft-07/schema#","type":"object"}' />
          </div>
        </div>
        <div className="output min-h-[320px] p-4 sm:p-5 lg:h-[680px] lg:overflow-y-auto" aria-live="polite">
          {tab === "instance" && (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[13px] font-medium">JSON instance</h3>
                <div className="flex gap-1">
                  <GhostButton onClick={() => setInstance(INSTANCE_OK)}>Valid</GhostButton>
                  <GhostButton onClick={() => setInstance(INSTANCE_BAD)}>Invalid</GhostButton>
                </div>
              </div>
              <textarea
                aria-label="JSON instance"
                value={instance}
                onChange={(e) => setInstance(e.target.value)}
                spellCheck={false}
                className="mb-4 h-36 w-full resize-y rounded-xl border bg-editor p-3 font-mono text-[12.5px] leading-relaxed outline-none focus:border-foreground/40"
              />
            </>
          )}
          {tab === "schema" && (
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Stat label="Dialect" value={lint.draft} />
              <Stat label="Enums" value={lint.enums.length} sub={lint.enums.reduce((n, e) => n + e.count, 0) ? `${lint.enums.reduce((n, e) => n + e.count, 0)} values` : "none"} />
              <Stat label="Schema errors" value={lint.findings.filter((f) => f.severity === "error").length} tone={lint.ok ? "ok" : "error"} />
            </div>
          )}
          {tab === "openai" && (
            <>
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Properties" value={strict.stats.properties} sub="limit 5,000" tone={strict.stats.properties > 5000 ? "error" : undefined} />
                <Stat label="Depth" value={strict.stats.maxDepth || "—"} sub="limit 10" tone={strict.stats.maxDepth > 10 ? "error" : undefined} />
                <Stat label="Enum values" value={strict.stats.enumValues} sub="limit 1,000" tone={strict.stats.enumValues > 1000 ? "error" : undefined} />
                <Stat label="Strict" value={strict.strict === false ? "false" : "true"} tone={strict.strict === false ? "warning" : "ok"} />
              </div>
              {strict.responseFormat && (
                <>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <SectionTitle>response_format</SectionTitle>
                    <CopyButtons text={strict.responseFormat} filename="response-format.json" />
                  </div>
                  <pre className="mb-4 max-h-48 overflow-auto rounded-xl border bg-editor p-3 font-mono text-[12px] leading-relaxed">{strict.responseFormat}</pre>
                </>
              )}
            </>
          )}
          <SeverityCounts findings={findings} />
          <div className="mt-3">
            <FindingsList
              findings={findings}
              onJump={(l) => editor.current?.jumpTo(l)}
              empty={tab === "instance" ? "Instance matches the schema." : tab === "openai" ? "Schema fits the documented Structured Outputs subset." : "Schema looks consistent for the detected dialect."}
            />
          </div>
          {tab === "schema" && lint.enums.length > 0 && (
            <>
              <SectionTitle count={lint.enums.length}>Enums</SectionTitle>
              <ul className="divide-y rounded-xl border text-[12.5px]">
                {lint.enums.map((e) => (
                  <li key={e.path} className="flex items-center justify-between gap-3 px-3 py-1.5">
                    <code className="truncate font-mono">{e.path}</code>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{e.count} · {e.types.join(", ")}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
      <LocalNote />
    </ToolCard>
  );
}
