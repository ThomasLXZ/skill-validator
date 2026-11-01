"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { EditorState, StateEffect, StateField } from "@codemirror/state";
import {
  Decoration, EditorView, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers, placeholder,
  type DecorationSet,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { markdown } from "@codemirror/lang-markdown";
import { lintGutter, setDiagnostics, type Diagnostic } from "@codemirror/lint";
import { tags as t } from "@lezer/highlight";

export interface LineDiagnostic {
  line: number;
  severity: "error" | "warning" | "info";
  message: string;
}

export interface CodeEditorHandle {
  jumpTo(line: number): void;
}

const highlight = HighlightStyle.define([
  { tag: [t.heading1, t.heading2, t.heading3, t.heading4], color: "var(--foreground)", fontWeight: "600" },
  { tag: t.heading, color: "var(--foreground)", fontWeight: "600" },
  { tag: t.processingInstruction, color: "var(--muted-foreground)" },
  { tag: t.meta, color: "var(--muted-foreground)" },
  { tag: [t.link, t.url], color: "var(--tip)" },
  { tag: t.monospace, color: "var(--accent)" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strong, fontWeight: "600" },
  { tag: t.list, color: "var(--muted-foreground)" },
  { tag: t.quote, color: "var(--muted-foreground)" },
  { tag: t.contentSeparator, color: "var(--muted-foreground)" },
]);

/* Frontmatter keys get their own color: they are what the validator cares about most. */
const fmKey = Decoration.mark({ attributes: { style: "color: var(--accent)" } });
const fmFence = Decoration.mark({ attributes: { style: "color: var(--muted-foreground)" } });
function frontmatterDecos(state: EditorState): DecorationSet {
  const doc = state.doc;
  if (doc.lines < 1 || doc.line(1).text.trim() !== "---") return Decoration.none;
  const ranges = [fmFence.range(doc.line(1).from, doc.line(1).to)];
  for (let n = 2; n <= doc.lines; n++) {
    const l = doc.line(n);
    if (l.text.trim() === "---") { if (l.to > l.from) ranges.push(fmFence.range(l.from, l.to)); break; }
    const m = /^(\s*[\w.-]+)\s*:/.exec(l.text);
    if (m && m[1].length) ranges.push(fmKey.range(l.from, l.from + m[1].length));
  }
  return Decoration.set(ranges, true);
}
const frontmatterField = StateField.define<DecorationSet>({
  create: frontmatterDecos,
  update: (v, tr) => (tr.docChanged ? frontmatterDecos(tr.state) : v),
  provide: (f) => EditorView.decorations.from(f),
});

const flashEffect = StateEffect.define<number | null>();
const flashField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(v, tr) {
    v = v.map(tr.changes);
    for (const e of tr.effects) if (e.is(flashEffect)) {
      v = e.value == null ? Decoration.none : Decoration.set([Decoration.line({ class: "cm-flash-line" }).range(e.value)]);
    }
    return v;
  },
  provide: (f) => EditorView.decorations.from(f),
});

function toDiagnostics(state: EditorState, items: LineDiagnostic[]): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const d of items) {
    if (d.line < 1 || d.line > state.doc.lines) continue;
    const l = state.doc.line(d.line);
    const lead = l.text.length - l.text.trimStart().length;
    out.push({ from: l.from + lead, to: Math.max(l.to, l.from + lead), severity: d.severity, message: d.message });
  }
  return out;
}

interface Props {
  value: string;
  onChange(v: string): void;
  diagnostics: LineDiagnostic[];
  ariaLabel: string;
  placeholderText?: string;
  /** "plain" turns off Markdown highlighting and frontmatter decorations (robots.txt, JSON). */
  language?: "markdown" | "plain";
}

const CodeEditor = forwardRef<CodeEditorHandle, Props>(function CodeEditor(
  { value, onChange, diagnostics, ariaLabel, placeholderText, language = "markdown" }, ref,
) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!host.current) return;
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(), lintGutter(), highlightActiveLineGutter(), highlightActiveLine(), history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          ...(language === "markdown" ? [markdown({ extensions: [{ remove: ["SetextHeading"] }] }), syntaxHighlighting(highlight), frontmatterField] : []), flashField,
          EditorView.lineWrapping,
          placeholder(placeholderText ?? ""),
          EditorView.contentAttributes.of({ "aria-label": ariaLabel, spellcheck: "false" }),
          EditorView.updateListener.of((u) => { if (u.docChanged) onChangeRef.current(u.state.doc.toString()); }),
        ],
      }),
    });
    view.current = v;
    return () => { v.destroy(); view.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // external value changes (example buttons, clear)
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
  }, [value]);

  useEffect(() => {
    const v = view.current;
    if (v) v.dispatch(setDiagnostics(v.state, toDiagnostics(v.state, diagnostics)));
  }, [diagnostics, value]);

  useImperativeHandle(ref, () => ({
    jumpTo(line: number) {
      const v = view.current;
      if (!v || line < 1 || line > v.state.doc.lines) return;
      const l = v.state.doc.line(line);
      v.dispatch({ selection: { anchor: l.from }, effects: [EditorView.scrollIntoView(l.from, { y: "center" }), flashEffect.of(null)] });
      v.dispatch({ effects: flashEffect.of(l.from) });
      v.focus();
    },
  }), []);

  return <div ref={host} className="h-full min-h-0 overflow-hidden" />;
});

export default CodeEditor;
