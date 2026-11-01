/**
 * Minimal Structured Field Dictionary parser (RFC 9651), enough for the
 * aipref vocabulary. Returns null on any parse failure.
 */
export type BareItem =
  | { type: "token"; value: string }
  | { type: "string"; value: string }
  | { type: "integer" | "decimal"; value: number }
  | { type: "boolean"; value: boolean }
  | { type: "bytes"; value: string };

export interface DictMember { key: string; value: BareItem; params: Record<string, BareItem> }

export interface SfParseResult { ok: true; members: DictMember[] }
export interface SfParseError { ok: false; error: string; at: number }

const TCHAR = /[!#$%&'*+\-.^_`|~0-9A-Za-z:/]/;

export function parseSfDictionary(input: string): SfParseResult | SfParseError {
  const s = input;
  let i = 0;
  const members: DictMember[] = [];
  const fail = (error: string): SfParseError => ({ ok: false, error, at: i });
  const sp = () => { while (s[i] === " ") i++; };
  const ows = () => { while (s[i] === " " || s[i] === "\t") i++; };

  const parseKey = (): string | null => {
    if (!/[a-z*]/.test(s[i] ?? "")) return null;
    let k = "";
    while (i < s.length && /[a-z0-9_\-.*]/.test(s[i])) k += s[i++];
    return k;
  };

  const parseBare = (): BareItem | null => {
    const c = s[i];
    if (c === undefined) return null;
    if (c === "-" || /[0-9]/.test(c)) {
      const m = /^-?[0-9]{1,15}(\.[0-9]{1,3})?/.exec(s.slice(i));
      if (!m) return null;
      i += m[0].length;
      return m[1] ? { type: "decimal", value: Number(m[0]) } : { type: "integer", value: Number(m[0]) };
    }
    if (c === '"') {
      i++;
      let v = "";
      while (i < s.length) {
        const ch = s[i++];
        if (ch === "\\") { const n = s[i++]; if (n !== '"' && n !== "\\") return null; v += n; continue; }
        if (ch === '"') return { type: "string", value: v };
        if (ch < " " || ch > "~") return null;
        v += ch;
      }
      return null;
    }
    if (c === "?") {
      const b = s[i + 1];
      if (b !== "0" && b !== "1") return null;
      i += 2;
      return { type: "boolean", value: b === "1" };
    }
    if (c === ":") {
      const end = s.indexOf(":", i + 1);
      if (end === -1) return null;
      const v = s.slice(i + 1, end);
      if (!/^[A-Za-z0-9+/=]*$/.test(v)) return null;
      i = end + 1;
      return { type: "bytes", value: v };
    }
    if (/[A-Za-z*]/.test(c)) {
      let v = "";
      while (i < s.length && TCHAR.test(s[i])) v += s[i++];
      return { type: "token", value: v };
    }
    return null;
  };

  const parseParams = (): Record<string, BareItem> | null => {
    const params: Record<string, BareItem> = {};
    while (s[i] === ";") {
      i++;
      sp();
      const k = parseKey();
      if (k === null) return null;
      let v: BareItem = { type: "boolean", value: true };
      if (s[i] === "=") { i++; const b = parseBare(); if (!b) return null; v = b; }
      params[k] = v;
    }
    return params;
  };

  sp();
  if (i >= s.length) return { ok: true, members };
  while (i < s.length) {
    const key = parseKey();
    if (key === null) return fail("Expected a lowercase key");
    let value: BareItem = { type: "boolean", value: true };
    if (s[i] === "=") {
      i++;
      if (s[i] === "(") return fail("Inner lists are not used by the aipref vocabulary");
      const b = parseBare();
      if (!b) return fail("Invalid value");
      value = b;
    }
    const params = parseParams();
    if (!params) return fail("Invalid parameter");
    members.push({ key, value, params });
    ows();
    if (i >= s.length) break;
    if (s[i] !== ",") return fail("Expected a comma between entries");
    i++;
    ows();
    if (i >= s.length) return fail("Trailing comma");
  }
  return { ok: true, members };
}
