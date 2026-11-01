import { parseSfDictionary } from "./sf";

/** IETF aipref vocabulary labels (draft-ietf-aipref-vocab). */
export const AIPREF_LABELS = { "train-ai": "AI Training", "ai-use": "AI Use", search: "Search" } as const;
export type AiprefLabel = keyof typeof AIPREF_LABELS;
export type Pref = "allow" | "disallow" | "unknown";
export type PrefSet = Record<AiprefLabel, Pref>;

export interface AiprefParse {
  ok: boolean;
  prefs: PrefSet;
  error?: string;
  unknownKeys: string[];
  duplicateKeys: string[];
  /** Known keys whose value is not the token y or n. */
  badValues: { key: string; shown: string }[];
}

export const UNKNOWN: PrefSet = { "train-ai": "unknown", "ai-use": "unknown", search: "unknown" };

export function parseAipref(value: string): AiprefParse {
  const res = parseSfDictionary(value);
  if (!res.ok) return { ok: false, prefs: { ...UNKNOWN }, error: res.error, unknownKeys: [], duplicateKeys: [], badValues: [] };
  const seen = new Map<string, number>();
  for (const m of res.members) seen.set(m.key, (seen.get(m.key) ?? 0) + 1);
  const last = new Map(res.members.map((m) => [m.key, m]));
  const prefs: PrefSet = { ...UNKNOWN };
  const badValues: AiprefParse["badValues"] = [];
  for (const k of Object.keys(AIPREF_LABELS) as AiprefLabel[]) {
    const m = last.get(k);
    if (!m) continue;
    if (m.value.type === "token" && (m.value.value === "y" || m.value.value === "n")) prefs[k] = m.value.value === "y" ? "allow" : "disallow";
    else badValues.push({ key: k, shown: m.value.type === "boolean" ? (m.value.value ? "(no value)" : "?0") : m.value.type === "string" ? `"${m.value.value}"` : String(m.value.value) });
  }
  return {
    ok: true,
    prefs,
    unknownKeys: [...last.keys()].filter((k) => !(k in AIPREF_LABELS)),
    duplicateKeys: [...seen].filter(([, n]) => n > 1).map(([k]) => k),
    badValues,
  };
}

/** draft-ietf-aipref-vocab 5.1: any disallow wins, then any allow, else unknown. */
export function combinePrefs(list: PrefSet[]): PrefSet {
  const out: PrefSet = { ...UNKNOWN };
  for (const k of Object.keys(AIPREF_LABELS) as AiprefLabel[]) {
    const vals = list.map((p) => p[k]);
    out[k] = vals.includes("disallow") ? "disallow" : vals.includes("allow") ? "allow" : "unknown";
  }
  return out;
}

export function serializePrefs(p: Partial<Record<AiprefLabel, "y" | "n">>): string {
  return (Object.keys(AIPREF_LABELS) as AiprefLabel[]).filter((k) => p[k]).map((k) => `${k}=${p[k]}`).join(", ");
}
