import { sortFindings, type Finding } from "../common/finding";

/** Sources for the schema linter and the OpenAI strict subset. */
export const REF = {
  draft07: "https://json-schema.org/draft-07/json-schema-validation.html",
  core07: "https://json-schema.org/draft-07/json-schema-core.html",
  openai: "https://developers.openai.com/api/docs/guides/structured-outputs",
} as const;

export type Draft = "draft-07" | "draft-04" | "2019-09" | "2020-12" | "unknown" | "unspecified";

export interface EnumStat {
  path: string;
  count: number;
  types: string[];
}

export interface SchemaReport {
  ok: boolean;
  draft: Draft;
  /** Set when the pasted value was an API wrapper and the inner schema was checked. */
  wrapper: WrapperKind;
  findings: Finding[];
  enums: EnumStat[];
}

export interface InstanceReport {
  ok: boolean;
  /** True when both documents parsed and the instance has no validation errors. Format mismatches are warnings. */
  findings: Finding[];
}

export interface StrictStats {
  properties: number;
  maxDepth: number;
  enumValues: number;
  stringChars: number;
}

export interface StrictReport {
  ok: boolean;
  name?: string;
  strict?: boolean;
  wrapper: WrapperKind;
  /** Pretty JSON the caller can paste into `response_format`. */
  responseFormat: string;
  stats: StrictStats;
  findings: Finding[];
}

export type WrapperKind = "schema" | "wrapper" | "json_schema" | "chat" | "responses" | "function";

export interface Unwrapped {
  schema: unknown;
  name?: string;
  strict?: boolean;
  kind: WrapperKind;
}

const SIMPLE_TYPES = ["string", "number", "integer", "boolean", "object", "array", "null"];

/** Keywords OpenAI's Structured Outputs guide lists as not supported (non-fine-tune). */
const OPENAI_BANNED = [
  "allOf", "oneOf", "not", "if", "then", "else",
  "dependentRequired", "dependentSchemas", "patternProperties",
  "unevaluatedProperties", "unevaluatedItems", "contains", "propertyNames", "dependencies", "prefixItems",
];

const OPENAI_FORMATS = ["date-time", "time", "date", "duration", "email", "hostname", "ipv4", "ipv6", "uuid"];

const OPENAI_LIMITS = { properties: 5000, depth: 10, enums: 1000, enumStringChars: 15_000, enumStringCount: 250, strings: 120_000 };

function finding(rule: string, severity: Finding["severity"], message: string, fix?: string, ref?: string): Finding {
  return { rule, severity, message, fix, ref };
}

function okOf(findings: Finding[]): boolean {
  return !findings.some((f) => f.severity === "error");
}

export function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`).join(",")}}`;
}

export function resolvePointer(root: unknown, ref: string): unknown {
  if (ref === "#") return root;
  if (!ref.startsWith("#/")) return undefined;
  let cur: unknown = root;
  for (const raw of ref.slice(2).split("/")) {
    const key = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    if (cur === null || typeof cur !== "object") return undefined;
    if (Array.isArray(cur)) {
      const i = Number(key);
      if (!Number.isInteger(i) || String(i) !== key || i < 0 || i >= cur.length) return undefined;
      cur = cur[i];
    } else {
      const o = cur as Record<string, unknown>;
      if (!Object.prototype.hasOwnProperty.call(o, key)) return undefined;
      cur = o[key];
    }
  }
  return cur;
}

export function detectDraft(schema: unknown): Draft {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) return "unspecified";
  const s = (schema as { $schema?: unknown }).$schema;
  if (typeof s !== "string" || !s.trim()) return "unspecified";
  if (/draft-07|draft\/07/.test(s)) return "draft-07";
  if (/draft-04|draft\/04/.test(s)) return "draft-04";
  if (s.includes("2019-09")) return "2019-09";
  if (s.includes("2020-12")) return "2020-12";
  return "unknown";
}

export function unwrapSchema(value: unknown): Unwrapped {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { schema: value, kind: "schema" };
  const o = value as Record<string, unknown>;
  const text = o.text as { format?: { type?: string; schema?: unknown; name?: unknown; strict?: unknown } } | undefined;
  if (text?.format?.type === "json_schema" && text.format.schema && typeof text.format.schema === "object") {
    return { schema: text.format.schema, name: str(text.format.name), strict: bool(text.format.strict), kind: "responses" };
  }
  const rf = o.response_format as { type?: string; json_schema?: { schema?: unknown; name?: unknown; strict?: unknown } } | undefined;
  if (rf?.type === "json_schema" && rf.json_schema?.schema && typeof rf.json_schema.schema === "object") {
    return { schema: rf.json_schema.schema, name: str(rf.json_schema.name), strict: bool(rf.json_schema.strict), kind: "chat" };
  }
  const js = o.json_schema as { schema?: unknown; name?: unknown; strict?: unknown } | undefined;
  if (js?.schema && typeof js.schema === "object" && (o.type === "json_schema" || js.name !== undefined || js.strict !== undefined)) {
    return { schema: js.schema, name: str(js.name), strict: bool(js.strict), kind: "json_schema" };
  }
  if (
    o.schema && typeof o.schema === "object" &&
    (typeof o.name === "string" || typeof o.strict === "boolean") &&
    !("properties" in o) && !("type" in o) && !("$schema" in o)
  ) {
    return { schema: o.schema, name: str(o.name), strict: bool(o.strict), kind: "wrapper" };
  }
  if (o.parameters && typeof o.parameters === "object" && typeof o.name === "string" && !("properties" in o)) {
    return { schema: o.parameters, name: o.name, strict: bool(o.strict), kind: "function" };
  }
  return { schema: value, kind: "schema" };
}

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}
function bool(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}

function valueType(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v === "number") return Number.isInteger(v) ? "integer" : "number";
  if (typeof v === "string" || typeof v === "boolean") return typeof v;
  if (typeof v === "object") return "object";
  return "unknown";
}

function typeAllows(declared: string[], v: unknown): boolean {
  const vt = valueType(v);
  return declared.some((d) => d === vt || (d === "number" && vt === "integer"));
}

function declaredTypes(schema: Record<string, unknown>): string[] | undefined {
  if (!("type" in schema)) return undefined;
  if (typeof schema.type === "string") return [schema.type];
  if (Array.isArray(schema.type) && schema.type.every((t) => typeof t === "string")) return schema.type as string[];
  return undefined;
}

function isPureRef(s: Record<string, unknown>): boolean {
  const keys = Object.keys(s).filter((k) => !["description", "title", "$schema", "$id", "$comment"].includes(k));
  return keys.length === 1 && keys[0] === "$ref";
}

function isObjectSchema(s: Record<string, unknown>): boolean {
  if (isPureRef(s)) return false;
  const t = declaredTypes(s);
  if (t?.includes("object")) return true;
  return "properties" in s || "additionalProperties" in s || "required" in s || "patternProperties" in s;
}

function parseJson(text: string, what: string): { value?: unknown; error?: Finding } {
  if (!text.trim()) return { error: finding("SCHEMA_EMPTY", "error", `Paste ${what}.`) };
  try {
    return { value: JSON.parse(text) };
  } catch (e) {
    return { error: finding("SCHEMA_JSON", "error", `${what} is not valid JSON (${(e as Error).message}).`) };
  }
}

export function checkSchema(text: string): SchemaReport {
  const parsed = parseJson(text, "a JSON Schema");
  if (parsed.error || parsed.value === undefined) {
    return { ok: false, draft: "unspecified", wrapper: "schema", findings: parsed.error ? [parsed.error] : [], enums: [] };
  }
  const unwrapped = unwrapSchema(parsed.value);
  const findings: Finding[] = [];
  const enums: EnumStat[] = [];
  if (unwrapped.kind !== "schema") {
    findings.push(finding("SCHEMA_UNWRAPPED", "tip", "Checked the inner schema from an API wrapper (name / strict / schema, response_format, or a function parameters object)."));
  }
  const schema = unwrapped.schema;
  const draft = detectDraft(schema);
  if (draft === "unspecified") {
    findings.push(finding(
      "SCHEMA_DRAFT_UNSPECIFIED",
      "tip",
      "No $schema keyword. This checker assumes draft-07, which is the dialect most “validate JSON Schema online” tools default to.",
      'Add "$schema": "http://json-schema.org/draft-07/schema#".',
      REF.core07,
    ));
  } else if (draft === "unknown") {
    findings.push(finding("SCHEMA_DRAFT_UNKNOWN", "warning", "$schema is set, but not to draft-04, draft-07, 2019-09, or 2020-12. Keyword checks below follow draft-07."));
  } else if (draft === "2019-09" || draft === "2020-12") {
    findings.push(finding("SCHEMA_DRAFT_LATER", "tip", `Dialect is ${draft}. Tuple items and exclusiveMinimum changed after draft-07; those are called out when they show up.`, undefined, REF.core07));
  }
  if (typeof schema === "boolean") {
    findings.push(finding("SCHEMA_BOOLEAN", "tip", schema ? "Boolean schema `true` allows every instance." : "Boolean schema `false` rejects every instance.", undefined, REF.core07));
    return { ok: okOf(findings), draft, wrapper: unwrapped.kind, findings: sortFindings(findings), enums };
  }
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    findings.push(finding("SCHEMA_NOT_OBJECT", "error", "A JSON Schema document must be an object or a boolean.", undefined, REF.core07));
    return { ok: false, draft, wrapper: unwrapped.kind, findings, enums };
  }
  lintSchema(schema, "#", schema, draft, findings, enums, new Set(), new Set());
  return { ok: okOf(findings), draft, wrapper: unwrapped.kind, findings: sortFindings(findings), enums };
}

function lintSchema(
  schema: unknown,
  path: string,
  root: unknown,
  draft: Draft,
  findings: Finding[],
  enums: EnumStat[],
  seen: Set<object>,
  stack: Set<object>,
) {
  if (typeof schema === "boolean") return;
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    findings.push(finding("SCHEMA_NOT_OBJECT", "error", `${path} should be a schema object or boolean.`));
    return;
  }
  if (stack.has(schema)) {
    findings.push(finding("SCHEMA_REF_CYCLE", "error", `${path} $ref cycle.`));
    return;
  }
  if (seen.has(schema)) return;
  seen.add(schema);
  stack.add(schema);
  const s = schema as Record<string, unknown>;

  const types = "type" in s ? declaredTypes(s) : undefined;
  if ("type" in s && !types) {
    findings.push(finding("SCHEMA_KEYWORD_TYPE", "error", `${path} \`type\` must be a string or an array of strings.`, undefined, REF.core07));
  } else if (types) {
    for (const t of types) {
      if (!SIMPLE_TYPES.includes(t)) findings.push(finding("SCHEMA_TYPE_UNKNOWN", "warning", `${path} type "${t}" is not a JSON Schema simple type.`));
    }
  }

  if ("enum" in s) {
    if (!Array.isArray(s.enum)) {
      findings.push(finding("SCHEMA_KEYWORD_TYPE", "error", `${path} \`enum\` must be an array.`, undefined, REF.draft07));
    } else {
      if (s.enum.length === 0) findings.push(finding("SCHEMA_ENUM_EMPTY", "error", `${path} \`enum\` must contain at least one value.`, undefined, REF.draft07));
      const keys = s.enum.map(stableStringify);
      if (new Set(keys).size !== keys.length) {
        findings.push(finding("SCHEMA_ENUM_DUPLICATE", "warning", `${path} \`enum\` repeats a value. Draft-07 says enum elements should be unique.`, undefined, REF.draft07));
      }
      const typeNames = [...new Set(s.enum.map(valueType))];
      enums.push({ path, count: s.enum.length, types: typeNames });
      if (types && s.enum.some((v) => !typeAllows(types, v))) {
        findings.push(finding("SCHEMA_ENUM_TYPE", "warning", `${path} \`enum\` contains a value that does not match \`type\` (${types.join(" | ")}).`, "Drop the mismatched value or widen type."));
      }
    }
  }

  if ("required" in s) {
    if (!Array.isArray(s.required) || s.required.some((x) => typeof x !== "string")) {
      findings.push(finding("SCHEMA_KEYWORD_TYPE", "error", `${path} \`required\` must be an array of strings.`, undefined, REF.draft07));
    } else if (s.properties && typeof s.properties === "object" && !Array.isArray(s.properties)) {
      for (const r of s.required) {
        if (!Object.prototype.hasOwnProperty.call(s.properties, r)) {
          findings.push(finding("SCHEMA_REQUIRED_UNKNOWN", "warning", `${path} required property "${r}" is not listed in properties.`));
        }
      }
    }
  }

  if ("properties" in s) {
    if (!s.properties || typeof s.properties !== "object" || Array.isArray(s.properties)) {
      findings.push(finding("SCHEMA_KEYWORD_TYPE", "error", `${path} \`properties\` must be an object.`, undefined, REF.core07));
    } else {
      for (const [k, v] of Object.entries(s.properties as Record<string, unknown>)) {
        lintSchema(v, `${path}/properties/${k}`, root, draft, findings, enums, seen, stack);
      }
    }
  }

  if ("items" in s) {
    if (Array.isArray(s.items)) {
      if (draft === "2019-09" || draft === "2020-12") {
        findings.push(finding("SCHEMA_ITEMS_TUPLE", "warning", `${path} uses an array for \`items\` (tuple). ${draft} uses prefixItems instead.`));
      }
      s.items.forEach((it, i) => lintSchema(it, `${path}/items/${i}`, root, draft, findings, enums, seen, stack));
    } else {
      lintSchema(s.items, `${path}/items`, root, draft, findings, enums, seen, stack);
    }
  }
  if ("additionalItems" in s && typeof s.additionalItems !== "boolean") {
    lintSchema(s.additionalItems, `${path}/additionalItems`, root, draft, findings, enums, seen, stack);
  }
  if ("additionalProperties" in s && typeof s.additionalProperties !== "boolean") {
    lintSchema(s.additionalProperties, `${path}/additionalProperties`, root, draft, findings, enums, seen, stack);
  }

  for (const key of ["allOf", "anyOf", "oneOf"] as const) {
    if (!(key in s)) continue;
    if (!Array.isArray(s[key]) || (s[key] as unknown[]).length === 0) {
      findings.push(finding("SCHEMA_COMBINATOR", "error", `${path} \`${key}\` must be a non-empty array of schemas.`));
    } else {
      (s[key] as unknown[]).forEach((sub, i) => lintSchema(sub, `${path}/${key}/${i}`, root, draft, findings, enums, seen, stack));
    }
  }
  if ("not" in s) lintSchema(s.not, `${path}/not`, root, draft, findings, enums, seen, stack);

  if ("pattern" in s) {
    if (typeof s.pattern !== "string") findings.push(finding("SCHEMA_KEYWORD_TYPE", "error", `${path} \`pattern\` must be a string.`));
    else {
      try { new RegExp(s.pattern); } catch (e) {
        findings.push(finding("SCHEMA_PATTERN", "error", `${path} \`pattern\` is not a valid regular expression (${(e as Error).message}).`));
      }
    }
  }

  for (const k of ["multipleOf", "maximum", "minimum", "minLength", "maxLength", "minItems", "maxItems", "minProperties", "maxProperties"]) {
    if (k in s && typeof s[k] !== "number") findings.push(finding("SCHEMA_KEYWORD_TYPE", "error", `${path} \`${k}\` must be a number.`));
  }
  if (typeof s.minLength === "number" && typeof s.maxLength === "number" && s.minLength > s.maxLength) {
    findings.push(finding("SCHEMA_BOUNDS", "error", `${path} minLength is greater than maxLength.`));
  }
  if (typeof s.minimum === "number" && typeof s.maximum === "number" && s.minimum > s.maximum) {
    findings.push(finding("SCHEMA_BOUNDS", "error", `${path} minimum is greater than maximum.`));
  }
  if (typeof s.minItems === "number" && typeof s.maxItems === "number" && s.minItems > s.maxItems) {
    findings.push(finding("SCHEMA_BOUNDS", "error", `${path} minItems is greater than maxItems.`));
  }

  for (const k of ["exclusiveMinimum", "exclusiveMaximum"] as const) {
    if (!(k in s)) continue;
    const numeric = typeof s[k] === "number";
    const boolean = typeof s[k] === "boolean";
    if (draft === "draft-04") {
      if (!boolean) findings.push(finding("SCHEMA_EXCLUSIVE_TYPE", "warning", `${path} draft-04 \`${k}\` is a boolean used together with ${k.replace("exclusive", "").toLowerCase()}.`, undefined, REF.draft07));
    } else if (draft === "draft-07" || draft === "unspecified" || draft === "unknown") {
      if (!numeric) findings.push(finding("SCHEMA_EXCLUSIVE_TYPE", "warning", `${path} draft-07 \`${k}\` is a number, not a boolean. Boolean exclusiveMinimum is draft-04.`, undefined, REF.draft07));
    }
  }

  if ("$ref" in s) {
    if (typeof s.$ref !== "string" || !s.$ref) {
      findings.push(finding("SCHEMA_KEYWORD_TYPE", "error", `${path} \`$ref\` must be a string.`));
    } else if (!s.$ref.startsWith("#")) {
      findings.push(finding("SCHEMA_REF_EXTERNAL", "warning", `${path} $ref "${s.$ref}" points outside this document. This checker only resolves local #/ pointers.`, undefined, REF.core07));
    } else {
      const target = resolvePointer(root, s.$ref);
      if (target === undefined) findings.push(finding("SCHEMA_REF_UNRESOLVED", "error", `${path} $ref "${s.$ref}" does not resolve in this document.`));
      else lintSchema(target, `${path} → ${s.$ref}`, root, draft, findings, enums, seen, stack);
      const siblings = Object.keys(s).filter((k) => !["$ref", "description", "title", "$schema", "$id", "$comment"].includes(k));
      if (siblings.length && (draft === "draft-07" || draft === "draft-04" || draft === "unspecified")) {
        findings.push(finding("SCHEMA_REF_SIBLING", "tip", `${path} has keywords next to $ref (${siblings.join(", ")}). Draft-07 ignores siblings of $ref.`, "Move the other keywords into the referenced schema, or use a draft that applies adjacent keywords.", REF.core07));
      }
    }
  }

  for (const key of ["$defs", "definitions"] as const) {
    if (!(key in s)) continue;
    const bag = s[key];
    if (!bag || typeof bag !== "object" || Array.isArray(bag)) {
      findings.push(finding("SCHEMA_KEYWORD_TYPE", "error", `${path} \`${key}\` must be an object.`));
    } else {
      for (const [k, v] of Object.entries(bag as Record<string, unknown>)) {
        lintSchema(v, `${path}/${key}/${k}`, root, draft, findings, enums, seen, stack);
      }
    }
  }

  stack.delete(schema);
}

function matchesType(v: unknown, t: string): boolean {
  switch (t) {
    case "string": return typeof v === "string";
    case "number": return typeof v === "number" && Number.isFinite(v);
    case "integer": return typeof v === "number" && Number.isFinite(v) && Number.isInteger(v);
    case "boolean": return typeof v === "boolean";
    case "null": return v === null;
    case "array": return Array.isArray(v);
    case "object": return v !== null && typeof v === "object" && !Array.isArray(v);
    default: return true;
  }
}

function formatOk(format: string, value: string): boolean | null {
  switch (format) {
    case "email": return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case "date": {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const [y, m, d] = value.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
    }
    case "time": return /^\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(value);
    case "date-time": return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(value) && !Number.isNaN(Date.parse(value));
    case "uuid": return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    case "ipv4": return value.split(".").length === 4 && value.split(".").every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255);
    case "ipv6": return value.includes(":") && /^[0-9a-f:]+$/i.test(value);
    case "hostname": return /^(?=.{1,253}$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value);
    case "duration": return /^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?!$)(\d+H)?(\d+M)?(\d+(?:\.\d+)?S)?)?$/.test(value);
    case "uri":
    case "uri-reference":
    case "url":
      try { new URL(value); return true; } catch { return false; }
    default: return null;
  }
}

export function checkInstance(schemaText: string, instanceText: string): InstanceReport {
  const schemaParsed = parseJson(schemaText, "a JSON Schema");
  const instanceParsed = parseJson(instanceText, "a JSON instance");
  const findings: Finding[] = [];
  if (schemaParsed.error) findings.push(schemaParsed.error);
  if (instanceParsed.error) findings.push({ ...instanceParsed.error, rule: instanceParsed.error.rule === "SCHEMA_EMPTY" ? "INSTANCE_EMPTY" : "INSTANCE_JSON", message: instanceParsed.error.message.replace("a JSON Schema", "a JSON instance").replace("Schema", "Instance") });
  if (schemaParsed.error || instanceParsed.error || schemaParsed.value === undefined || instanceParsed.value === undefined) {
    return { ok: false, findings };
  }
  const unwrapped = unwrapSchema(schemaParsed.value);
  const schema = unwrapped.schema;
  const draft = detectDraft(schema);
  const skipped = new Set<string>();
  validate(instanceParsed.value, schema, "$", schema, draft, findings, new Set(), skipped);
  for (const k of skipped) {
    findings.push(finding("INSTANCE_KEYWORD_SKIPPED", "tip", `This checker does not evaluate \`${k}\`. A passing result only covers the keywords it implements (type, enum, const, object/array keywords, numeric and string bounds, pattern, allOf/anyOf/oneOf/not, local $ref).`));
  }
  return { ok: okOf(findings), findings: sortFindings(findings) };
}

function validate(
  instance: unknown,
  schema: unknown,
  path: string,
  root: unknown,
  draft: Draft,
  findings: Finding[],
  stack: Set<object>,
  skipped: Set<string>,
) {
  if (schema === true) return;
  if (schema === false) {
    findings.push(finding("INSTANCE_FALSE", "error", `${path} is rejected by boolean schema false.`));
    return;
  }
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) return;
  if (stack.has(schema)) {
    findings.push(finding("INSTANCE_REF_CYCLE", "error", `${path} ran into a $ref cycle.`));
    return;
  }
  stack.add(schema);
  const s = schema as Record<string, unknown>;

  if (typeof s.$ref === "string") {
    const target = s.$ref.startsWith("#") ? resolvePointer(root, s.$ref) : undefined;
    if (target === undefined) findings.push(finding("INSTANCE_REF", "error", `${path} $ref "${s.$ref}" could not be resolved locally.`));
    else validate(instance, target, path, root, draft, findings, stack, skipped);
    const ignoreSiblings = draft === "draft-07" || draft === "draft-04" || draft === "unspecified" || draft === "unknown";
    if (ignoreSiblings) { stack.delete(schema); return; }
  }

  const types = declaredTypes(s);
  if (types && !types.some((t) => matchesType(instance, t))) {
    findings.push(finding("INSTANCE_TYPE", "error", `${path} is ${valueType(instance)}, schema type is ${types.join(" | ")}.`));
  }
  if (Array.isArray(s.enum) && !s.enum.some((v) => stableStringify(v) === stableStringify(instance))) {
    const shown = s.enum.slice(0, 8).map((v) => JSON.stringify(v)).join(", ");
    findings.push(finding("INSTANCE_ENUM", "error", `${path} is ${JSON.stringify(instance)}, not in enum [${shown}${s.enum.length > 8 ? ", …" : ""}].`));
  }
  if ("const" in s && stableStringify(s.const) !== stableStringify(instance)) {
    findings.push(finding("INSTANCE_CONST", "error", `${path} must be ${JSON.stringify(s.const)}.`));
  }

  if (typeof instance === "string") {
    const chars = [...instance].length;
    if (typeof s.minLength === "number" && chars < s.minLength) findings.push(finding("INSTANCE_MIN_LENGTH", "error", `${path} is ${chars} characters; minLength is ${s.minLength}.`));
    if (typeof s.maxLength === "number" && chars > s.maxLength) findings.push(finding("INSTANCE_MAX_LENGTH", "error", `${path} is ${chars} characters; maxLength is ${s.maxLength}.`));
    if (typeof s.pattern === "string") {
      try {
        if (!new RegExp(s.pattern).test(instance)) findings.push(finding("INSTANCE_PATTERN", "error", `${path} does not match /${s.pattern}/.`));
      } catch { /* schema lint reports the bad pattern */ }
    }
    if (typeof s.format === "string") {
      const fmt = formatOk(s.format, instance);
      if (fmt === false) findings.push(finding("INSTANCE_FORMAT", "warning", `${path} does not look like format "${s.format}". Format is reported as a warning.`));
    }
  }

  if (typeof instance === "number") {
    if (typeof s.multipleOf === "number" && s.multipleOf > 0) {
      const q = instance / s.multipleOf;
      if (Math.abs(q - Math.round(q)) > 1e-8) findings.push(finding("INSTANCE_MULTIPLE", "error", `${path} is not a multiple of ${s.multipleOf}.`));
    }
    if (typeof s.minimum === "number" && instance < s.minimum) findings.push(finding("INSTANCE_MINIMUM", "error", `${path} is ${instance}; minimum is ${s.minimum}.`));
    if (typeof s.maximum === "number" && instance > s.maximum) findings.push(finding("INSTANCE_MAXIMUM", "error", `${path} is ${instance}; maximum is ${s.maximum}.`));
    if (draft === "draft-04") {
      if (s.exclusiveMinimum === true && typeof s.minimum === "number" && instance <= s.minimum) findings.push(finding("INSTANCE_EXCLUSIVE_MIN", "error", `${path} must be greater than ${s.minimum}.`));
      if (s.exclusiveMaximum === true && typeof s.maximum === "number" && instance >= s.maximum) findings.push(finding("INSTANCE_EXCLUSIVE_MAX", "error", `${path} must be less than ${s.maximum}.`));
    } else {
      if (typeof s.exclusiveMinimum === "number" && instance <= s.exclusiveMinimum) findings.push(finding("INSTANCE_EXCLUSIVE_MIN", "error", `${path} must be greater than ${s.exclusiveMinimum}.`));
      if (typeof s.exclusiveMaximum === "number" && instance >= s.exclusiveMaximum) findings.push(finding("INSTANCE_EXCLUSIVE_MAX", "error", `${path} must be less than ${s.exclusiveMaximum}.`));
    }
  }

  if (Array.isArray(instance)) {
    if (typeof s.minItems === "number" && instance.length < s.minItems) findings.push(finding("INSTANCE_MIN_ITEMS", "error", `${path} has ${instance.length} items; minItems is ${s.minItems}.`));
    if (typeof s.maxItems === "number" && instance.length > s.maxItems) findings.push(finding("INSTANCE_MAX_ITEMS", "error", `${path} has ${instance.length} items; maxItems is ${s.maxItems}.`));
    if (s.uniqueItems === true) {
      const keys = instance.map(stableStringify);
      if (new Set(keys).size !== keys.length) findings.push(finding("INSTANCE_UNIQUE", "error", `${path} has duplicate items but uniqueItems is true.`));
    }
    if (Array.isArray(s.items)) {
      s.items.forEach((sub, i) => { if (i < instance.length) validate(instance[i], sub, `${path}[${i}]`, root, draft, findings, stack, skipped); });
      if (instance.length > s.items.length) {
        if (s.additionalItems === false) findings.push(finding("INSTANCE_ADDITIONAL_ITEMS", "error", `${path} has more items than the tuple schema allows.`));
        else if (s.additionalItems && typeof s.additionalItems === "object") {
          for (let i = s.items.length; i < instance.length; i++) validate(instance[i], s.additionalItems, `${path}[${i}]`, root, draft, findings, stack, skipped);
        }
      }
    } else if (s.items !== undefined) {
      instance.forEach((item, i) => validate(item, s.items, `${path}[${i}]`, root, draft, findings, stack, skipped));
    }
  }

  if (instance !== null && typeof instance === "object" && !Array.isArray(instance)) {
    const obj = instance as Record<string, unknown>;
    const props = s.properties && typeof s.properties === "object" && !Array.isArray(s.properties) ? s.properties as Record<string, unknown> : {};
    const keys = Object.keys(obj);
    if (Array.isArray(s.required)) {
      for (const r of s.required) if (typeof r === "string" && !Object.prototype.hasOwnProperty.call(obj, r)) {
        findings.push(finding("INSTANCE_REQUIRED", "error", `${path === "$" ? "$" : path} is missing required property "${r}".`));
      }
    }
    if (typeof s.minProperties === "number" && keys.length < s.minProperties) findings.push(finding("INSTANCE_MIN_PROPERTIES", "error", `${path} has ${keys.length} properties; minProperties is ${s.minProperties}.`));
    if (typeof s.maxProperties === "number" && keys.length > s.maxProperties) findings.push(finding("INSTANCE_MAX_PROPERTIES", "error", `${path} has ${keys.length} properties; maxProperties is ${s.maxProperties}.`));
    for (const k of keys) {
      const child = path === "$" ? `$.${k}` : `${path}.${k}`;
      if (Object.prototype.hasOwnProperty.call(props, k)) validate(obj[k], props[k], child, root, draft, findings, stack, skipped);
      else if (s.additionalProperties === false) findings.push(finding("INSTANCE_ADDITIONAL", "error", `${child} is not listed in properties and additionalProperties is false.`));
      else if (s.additionalProperties && typeof s.additionalProperties === "object") validate(obj[k], s.additionalProperties, child, root, draft, findings, stack, skipped);
    }
  }

  if (Array.isArray(s.allOf)) for (const sub of s.allOf) validate(instance, sub, path, root, draft, findings, new Set(stack), skipped);
  if (Array.isArray(s.anyOf)) {
    const passed = s.anyOf.some((sub) => okOf(collect(instance, sub, path, root, draft, new Set(stack), skipped).filter((f) => f.rule !== "INSTANCE_KEYWORD_SKIPPED")));
    if (!passed) findings.push(finding("INSTANCE_ANYOF", "error", `${path} matches none of the anyOf schemas.`));
  }
  if (Array.isArray(s.oneOf)) {
    const n = s.oneOf.filter((sub) => okOf(collect(instance, sub, path, root, draft, new Set(stack), skipped))).length;
    if (n !== 1) findings.push(finding("INSTANCE_ONEOF", "error", `${path} matches ${n} oneOf branches; exactly one is required.`));
  }
  if ("not" in s) {
    const inner = collect(instance, s.not, path, root, draft, new Set(stack), skipped);
    if (okOf(inner)) findings.push(finding("INSTANCE_NOT", "error", `${path} matches a schema that \`not\` forbids.`));
  }

  for (const k of ["patternProperties", "if", "then", "else", "dependentRequired", "dependentSchemas", "unevaluatedProperties", "unevaluatedItems", "contains", "propertyNames", "dependencies"]) {
    if (k in s) skipped.add(k);
  }
  stack.delete(schema);
}

function collect(instance: unknown, schema: unknown, path: string, root: unknown, draft: Draft, stack: Set<object>, skipped: Set<string>): Finding[] {
  const findings: Finding[] = [];
  validate(instance, schema, path, root, draft, findings, stack, skipped);
  return findings;
}

export function safeSchemaName(name: string | undefined): string {
  const cleaned = (name ?? "output").trim().replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 64);
  return cleaned || "output";
}

export function checkStructuredOutput(text: string): StrictReport {
  const parsed = parseJson(text, "a JSON Schema");
  const baseStats: StrictStats = { properties: 0, maxDepth: 0, enumValues: 0, stringChars: 0 };
  if (parsed.error || parsed.value === undefined) {
    return { ok: false, wrapper: "schema", responseFormat: "", stats: baseStats, findings: parsed.error ? [parsed.error] : [] };
  }
  const unwrapped = unwrapSchema(parsed.value);
  const report = strictWalk(unwrapped.schema);
  const findings = [...report.findings];
  if (unwrapped.kind !== "schema") {
    findings.unshift(finding("SCHEMA_UNWRAPPED", "tip", "Read the schema from an API wrapper. Strict checks apply to the inner schema."));
  }
  if (unwrapped.name !== undefined && !/^[A-Za-z0-9_-]{1,64}$/.test(unwrapped.name)) {
    findings.push(finding("SO_NAME", "error", `Structured output name "${unwrapped.name}" must be 1–64 characters of letters, numbers, underscores, or hyphens.`, "Rename it, for example weather_reply.", REF.openai));
  }
  if (unwrapped.strict === false) {
    findings.push(finding("SO_STRICT_OFF", "warning", "strict is false, so the API will not guarantee schema adherence. Set strict: true for Structured Outputs.", undefined, REF.openai));
  }
  const name = safeSchemaName(unwrapped.name);
  const responseFormat = JSON.stringify({
    type: "json_schema",
    json_schema: { name, strict: true, schema: unwrapped.schema },
  }, null, 2);
  return {
    ok: okOf(findings),
    name: unwrapped.name,
    strict: unwrapped.strict,
    wrapper: unwrapped.kind,
    responseFormat,
    stats: report.stats,
    findings: sortFindings(findings),
  };
}

function strictWalk(root: unknown): { findings: Finding[]; stats: StrictStats } {
  const findings: Finding[] = [];
  const stats: StrictStats = { properties: 0, maxDepth: 0, enumValues: 0, stringChars: 0 };
  if (!root || typeof root !== "object" || Array.isArray(root)) {
    findings.push(finding("SO_ROOT_TYPE", "error", "Structured Outputs needs a root object schema, not an array, boolean, or other JSON value.", undefined, REF.openai));
    return { findings, stats };
  }
  const top = root as Record<string, unknown>;
  if ("anyOf" in top) findings.push(finding("SO_ROOT_ANYOF", "error", "The root schema must be an object and must not be anyOf. Move the union under a property.", undefined, REF.openai));
  const topTypes = declaredTypes(top);
  if (topTypes && !topTypes.includes("object")) {
    findings.push(finding("SO_ROOT_TYPE", "error", `Root type is ${topTypes.join(" | ")}. Structured Outputs requires a root object.`, undefined, REF.openai));
  } else if (!topTypes && !top.properties && !top.$ref) {
    findings.push(finding("SO_ROOT_TYPE", "error", "Root schema has no type: \"object\". Structured Outputs requires an object at the root.", undefined, REF.openai));
  }

  const seen = new Set<object>();
  const walk = (node: unknown, path: string, depth: number) => {
    if (typeof node === "boolean") {
      findings.push(finding("SO_BOOLEAN", "error", `${path} is a boolean schema. Structured Outputs needs an explicit object schema.`, undefined, REF.openai));
      return;
    }
    if (!node || typeof node !== "object" || Array.isArray(node)) {
      findings.push(finding("SO_SCHEMA_NODE", "error", `${path} is not a schema object.`));
      return;
    }
    if (seen.has(node)) return;
    seen.add(node);
    stats.maxDepth = Math.max(stats.maxDepth, depth);
    const n = node as Record<string, unknown>;

    if (typeof n.$ref === "string") {
      if (!n.$ref.startsWith("#/")) findings.push(finding("SO_REF_EXTERNAL", "error", `${path} $ref "${n.$ref}" is not a local #/ pointer. Structured Outputs only allows in-document refs.`, undefined, REF.openai));
      else {
        const target = resolvePointer(root, n.$ref);
        if (target === undefined) findings.push(finding("SO_REF_UNRESOLVED", "error", `${path} $ref "${n.$ref}" does not resolve.`));
        else {
          const targetObject = !!target && typeof target === "object" && !Array.isArray(target) && isObjectSchema(target as Record<string, unknown>);
          walk(target, `${path} → ${n.$ref}`, isPureRef(n) && targetObject ? depth + 1 : depth);
        }
      }
    }

    for (const k of OPENAI_BANNED) {
      if (k in n) findings.push(finding("SO_UNSUPPORTED", "error", `${path} uses \`${k}\`, which Structured Outputs does not support. Use anyOf for unions.`, undefined, REF.openai));
    }
    if ("default" in n) findings.push(finding("SO_DEFAULT", "warning", `${path} sets \`default\`. Structured generation does not fill defaults; every required field is still produced.`, undefined, REF.openai));

    if ("type" in n) {
      const ts = Array.isArray(n.type) ? n.type : [n.type];
      for (const t of ts) {
        if (typeof t !== "string" || !SIMPLE_TYPES.includes(t)) {
          findings.push(finding("SO_TYPE", "error", `${path} type ${JSON.stringify(t)} is outside the Structured Outputs set (string, number, integer, boolean, object, array, null).`, undefined, REF.openai));
        }
      }
    }
    if (Array.isArray(n.enum)) {
      stats.enumValues += n.enum.length;
      let chars = 0;
      let strings = 0;
      for (const v of n.enum) if (typeof v === "string") { chars += v.length; strings++; stats.stringChars += v.length; }
      if (n.enum.length > OPENAI_LIMITS.enumStringCount && chars > OPENAI_LIMITS.enumStringChars) {
        findings.push(finding("SO_ENUM_STRINGS", "error", `${path} enum has ${n.enum.length} values and ${chars.toLocaleString("en-US")} string characters. Above 250 values, the total string length must stay within 15,000.`, undefined, REF.openai));
      }
    }
    if (typeof n.const === "string") stats.stringChars += n.const.length;
    if (typeof n.format === "string" && !OPENAI_FORMATS.includes(n.format)) {
      findings.push(finding("SO_FORMAT", "warning", `${path} format "${n.format}" is not in the documented Structured Outputs format list (${OPENAI_FORMATS.join(", ")}).`, undefined, REF.openai));
    }

    if (isObjectSchema(n)) {
      if (n.additionalProperties !== false) {
        findings.push(finding("SO_ADDITIONAL_PROPERTIES", "error", `${path} must set additionalProperties to false. A missing or non-false value is rejected in strict mode.`, "Add \"additionalProperties\": false to every object.", REF.openai));
      }
      const props = n.properties && typeof n.properties === "object" && !Array.isArray(n.properties) ? n.properties as Record<string, unknown> : null;
      if (props) {
        const keys = Object.keys(props);
        stats.properties += keys.length;
        for (const k of keys) stats.stringChars += k.length;
        const req = Array.isArray(n.required) ? n.required.filter((x): x is string => typeof x === "string") : null;
        if (!req) findings.push(finding("SO_REQUIRED", "error", `${path} must list every property in required. Optional fields are expressed as a nullable type, still required.`, undefined, REF.openai));
        else {
          for (const k of keys) if (!req.includes(k)) findings.push(finding("SO_REQUIRED_MISSING", "error", `${path} property "${k}" is not in required.`, `Add "${k}" to required, or type it as ["…", "null"] if it is optional.`, REF.openai));
          for (const r of req) if (!Object.prototype.hasOwnProperty.call(props, r)) findings.push(finding("SO_REQUIRED_UNKNOWN", "error", `${path} required entry "${r}" is not in properties.`, undefined, REF.openai));
        }
        for (const [k, v] of Object.entries(props)) {
          const childIsObject = !!v && typeof v === "object" && !Array.isArray(v) && isObjectSchema(v as Record<string, unknown>);
          walk(v, `${path}/properties/${k}`, childIsObject ? depth + 1 : depth);
        }
      }
    }

    if (Array.isArray(n.items)) findings.push(finding("SO_TUPLE_ITEMS", "error", `${path} uses tuple \`items\` (an array of schemas). Structured Outputs accepts a single items schema.`, undefined, REF.openai));
    else if (n.items && typeof n.items === "object") walk(n.items, `${path}/items`, depth);

    if (Array.isArray(n.anyOf)) n.anyOf.forEach((b, i) => walk(b, `${path}/anyOf/${i}`, depth));

    if (n.definitions && typeof n.definitions === "object") {
      findings.push(finding("SO_DEFINITIONS", "warning", `${path} uses \`definitions\` (draft-07). Structured Outputs documents \`$defs\` for local refs.`, "Rename definitions to $defs and point $ref at #/$defs/…", REF.openai));
    }
    for (const key of ["$defs", "definitions"] as const) {
      const bag = n[key];
      if (!bag || typeof bag !== "object" || Array.isArray(bag)) continue;
      for (const [k, v] of Object.entries(bag as Record<string, unknown>)) {
        stats.stringChars += k.length;
        walk(v, `${path}/${key}/${k}`, depth);
      }
    }
  };

  walk(root, "#", 1);
  if (stats.properties > OPENAI_LIMITS.properties) findings.push(finding("SO_PROPERTIES", "error", `${stats.properties.toLocaleString("en-US")} object properties exceeds the 5,000 property limit.`, undefined, REF.openai));
  if (stats.maxDepth > OPENAI_LIMITS.depth) findings.push(finding("SO_DEPTH", "error", `Schema object nesting is ${stats.maxDepth} levels. Structured Outputs allows up to 10.`, undefined, REF.openai));
  if (stats.enumValues > OPENAI_LIMITS.enums) findings.push(finding("SO_ENUM_TOTAL", "error", `${stats.enumValues.toLocaleString("en-US")} enum values exceeds the 1,000 value limit across the schema.`, undefined, REF.openai));
  if (stats.stringChars > OPENAI_LIMITS.strings) findings.push(finding("SO_STRING_BUDGET", "error", `Property names, definition names, enum strings, and const strings total ${stats.stringChars.toLocaleString("en-US")} characters, over the 120,000 limit.`, undefined, REF.openai));
  return { findings, stats };
}
