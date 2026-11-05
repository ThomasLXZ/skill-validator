import { sortFindings, type Finding } from "../common/finding";

/**
 * Checks a Claude Messages request's sampling fields against Anthropic's
 * text-watermark guidance. It does not inspect generated text and cannot
 * tell you whether a watermark is present.
 */
export const REF = {
  watermark: "https://platform.claude.com/docs/en/build-with-claude/text-watermark",
  marking: "https://support.claude.com/en/articles/16266773-how-claude-marks-ai-generated-content",
  sampling: "https://platform.claude.com/docs/en/api/cli/completions",
} as const;

export type ModelClass = "watermark-sensitive" | "sampling-locked" | "other" | "unspecified";

export interface SamplingReport {
  ok: boolean;
  model?: string;
  modelClass: ModelClass;
  temperature?: number;
  topP?: number;
  topK?: number;
  present: Array<"temperature" | "top_p" | "top_k">;
  findings: Finding[];
}

function finding(rule: string, severity: Finding["severity"], message: string, fix?: string, ref?: string): Finding {
  return { rule, severity, message, fix, ref };
}

/** Classify a model id using the documented watermark and sampling notes. */
export function classifyModel(model: string | undefined): ModelClass {
  if (!model?.trim()) return "unspecified";
  const m = model.toLowerCase();
  if (/opus-4-6|sonnet-4-6/.test(m)) return "watermark-sensitive";
  if (/fable|mythos/.test(m)) return "sampling-locked";
  if (/opus-4-([7-9]|\d{2,})/.test(m)) return "sampling-locked";
  if (/opus-([5-9]|\d{2,})/.test(m)) return "sampling-locked";
  if (/sonnet-([5-9]|\d{2,})/.test(m)) return "sampling-locked";
  if (/haiku-([5-9]|\d{2,})/.test(m)) return "sampling-locked";
  return "other";
}

function num(v: unknown, key: string, findings: Finding[]): number | undefined {
  if (v === undefined) return undefined;
  if (typeof v !== "number" || !Number.isFinite(v)) {
    findings.push(finding("SAMP_TYPE", "error", `\`${key}\` must be a number, got ${JSON.stringify(v)}.`));
    return undefined;
  }
  return v;
}

export function checkSampling(text: string): SamplingReport {
  const base = (findings: Finding[], extra: Partial<SamplingReport> = {}): SamplingReport => ({
    ok: !findings.some((f) => f.severity === "error"),
    modelClass: extra.modelClass ?? "unspecified",
    present: extra.present ?? [],
    findings: sortFindings(findings),
    ...extra,
  });
  if (!text.trim()) {
    return base([finding("SAMP_EMPTY", "error", "Paste a Messages API request JSON (model plus any temperature, top_p, or top_k).")]);
  }
  let value: unknown;
  try { value = JSON.parse(text); } catch (e) {
    return base([finding("SAMP_JSON", "error", `Not valid JSON (${(e as Error).message}). Paste the request body, not a curl command.`)]);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return base([finding("SAMP_SHAPE", "error", "The request body should be a JSON object.")]);
  }
  const o = value as Record<string, unknown>;
  const findings: Finding[] = [];
  const model = typeof o.model === "string" ? o.model : undefined;
  if (o.model !== undefined && typeof o.model !== "string") findings.push(finding("SAMP_TYPE", "error", "`model` must be a string."));
  const temperature = num(o.temperature, "temperature", findings);
  const topP = num(o.top_p, "top_p", findings);
  const topK = num(o.top_k, "top_k", findings);
  const present: SamplingReport["present"] = [];
  if ("temperature" in o) present.push("temperature");
  if ("top_p" in o) present.push("top_p");
  if ("top_k" in o) present.push("top_k");
  const modelClass = classifyModel(model);

  if (present.includes("temperature") && present.includes("top_p")) {
    findings.push(finding("SAMP_BOTH", "tip", "The request sets both temperature and top_p. Anthropic's sampling guidance is to change one of them, not both."));
  }

  const nonDefault: string[] = [];
  if (temperature !== undefined && temperature !== 1) nonDefault.push(`temperature ${temperature}`);
  if (topP !== undefined && topP !== 1) nonDefault.push(`top_p ${topP}`);
  if (topK !== undefined) nonDefault.push(`top_k ${topK}`);
  const explicitDefault: string[] = [];
  if (temperature === 1) explicitDefault.push("temperature 1");
  if (topP === 1) explicitDefault.push("top_p 1");

  if (modelClass === "sampling-locked") {
    if (temperature !== undefined && temperature !== 1) {
      findings.push(finding("SAMP_REJECTED", "error", `${model} is in the generation released after Claude Opus 4.6. The API reference says temperature must be omitted or 1.0; other values are rejected.`, "Remove temperature, or set it to 1 only if a client library forces the field.", REF.sampling));
    } else if (temperature === 1) {
      findings.push(finding("SAMP_TEMP_COMPAT", "tip", "temperature 1.0 is accepted on newer models for compatibility. Omit it unless a library sets it for you.", undefined, REF.sampling));
    }
    if (topP !== undefined && topP < 0.99) {
      findings.push(finding("SAMP_REJECTED", "error", `${model} rejects top_p below 0.99. Models after Opus 4.6 only keep top_p for backwards compatibility at or above 0.99.`, "Remove top_p.", REF.sampling));
    } else if (topP !== undefined) {
      findings.push(finding("SAMP_TOP_P_COMPAT", "tip", "top_p at or above 0.99 is accepted for compatibility and otherwise deprecated. Omit it.", undefined, REF.sampling));
    }
    if (topK !== undefined) {
      findings.push(finding("SAMP_REJECTED", "error", `${model} rejects top_k. Models released after Claude Opus 4.6 do not accept the parameter.`, "Remove top_k.", REF.sampling));
    }
  }

  if (modelClass === "watermark-sensitive" && present.length) {
    if (nonDefault.length) {
      findings.push(finding(
        "WM_NON_DEFAULT",
        "warning",
        `${model} may not carry Anthropic's text watermark when sampling is non-default (${nonDefault.join(", ")}). The docs name Claude Sonnet 4.6 and Claude Opus 4.6.`,
        "If you rely on the watermark, omit temperature, top_p, and top_k entirely, including values a framework sets.",
        REF.watermark,
      ));
    }
    if (explicitDefault.length) {
      findings.push(finding(
        "WM_EXPLICIT_DEFAULT",
        "tip",
        `${explicitDefault.join(" and ")} is the usual default, but the text-watermark page says to omit the parameters rather than send them.`,
        "Delete the keys so the request does not set them.",
        REF.watermark,
      ));
    }
  }

  if (modelClass === "unspecified" && present.length) {
    findings.push(finding(
      "WM_MODEL_UNKNOWN",
      nonDefault.length ? "warning" : "tip",
      `No model id, and the request sets ${present.join(", ")}. On Claude Sonnet 4.6 and Opus 4.6 a non-default temperature, top_p, or top_k can drop the text watermark. Models after Opus 4.6 reject most non-default sampling values.`,
      "Add model, and omit temperature, top_p, and top_k if you need the watermark.",
      REF.watermark,
    ));
  }

  if (modelClass === "other" && present.length) {
    findings.push(finding(
      "WM_OTHER_MODEL",
      "tip",
      `${model} is not Claude Sonnet 4.6 or Opus 4.6, which are the models the text-watermark docs call out for sampling. Check the current model table before you rely on a mark.`,
      undefined,
      REF.marking,
    ));
  }

  if (!present.length && !findings.some((f) => f.severity === "error")) {
    findings.push(finding("WM_OMITTED", "tip", "temperature, top_p, and top_k are omitted. That matches the text-watermark guidance to leave sampling unset.", undefined, REF.watermark));
  }

  return base(findings, { model, modelClass, temperature, topP, topK, present });
}
