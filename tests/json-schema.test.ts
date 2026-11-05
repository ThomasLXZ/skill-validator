import { describe, expect, it } from "vitest";
import { checkInstance, checkSchema, checkStructuredOutput } from "@/lib/json-schema";

const rules = (findings: { rule: string }[]) => findings.map((f) => f.rule);

const DRAFT7 = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    status: { type: "string", enum: ["ok", "error"] },
    count: { type: "integer", minimum: 0 },
  },
  required: ["status"],
  additionalProperties: false,
};

describe("schema lint", () => {
  it("recognises draft-07 and a valid enum", () => {
    const r = checkSchema(JSON.stringify(DRAFT7));
    expect(r.draft).toBe("draft-07");
    expect(r.ok).toBe(true);
    expect(r.enums[0]).toMatchObject({ path: "#/properties/status", count: 2 });
    expect(rules(r.findings)).not.toContain("SCHEMA_DRAFT_UNSPECIFIED");
  });
  it("assumes draft-07 when $schema is missing", () => {
    const { $schema: _s, ...rest } = DRAFT7;
    const r = checkSchema(JSON.stringify(rest));
    expect(r.draft).toBe("unspecified");
    expect(rules(r.findings)).toContain("SCHEMA_DRAFT_UNSPECIFIED");
  });
  it("flags empty, duplicate, and type-mismatched enums", () => {
    expect(rules(checkSchema(JSON.stringify({ type: "string", enum: [] })).findings)).toContain("SCHEMA_ENUM_EMPTY");
    expect(rules(checkSchema(JSON.stringify({ type: "string", enum: ["ok", "ok"] })).findings)).toContain("SCHEMA_ENUM_DUPLICATE");
    expect(rules(checkSchema(JSON.stringify({ type: "string", enum: ["ok", 1] })).findings)).toContain("SCHEMA_ENUM_TYPE");
  });
  it("flags draft-04 boolean exclusiveMinimum on a draft-07 schema", () => {
    const r = checkSchema(JSON.stringify({ $schema: "http://json-schema.org/draft-07/schema#", type: "number", minimum: 0, exclusiveMinimum: true }));
    expect(rules(r.findings)).toContain("SCHEMA_EXCLUSIVE_TYPE");
  });
  it("flags a bad pattern and a dangling $ref", () => {
    const r = checkSchema(JSON.stringify({ type: "string", pattern: "(", $ref: "#/definitions/missing" }));
    expect(rules(r.findings)).toEqual(expect.arrayContaining(["SCHEMA_PATTERN", "SCHEMA_REF_UNRESOLVED"]));
  });
});

describe("instance validation", () => {
  const schema = JSON.stringify(DRAFT7);
  it("accepts a matching object", () => {
    const r = checkInstance(schema, JSON.stringify({ status: "ok", count: 1 }));
    expect(r.ok).toBe(true);
    expect(r.findings.filter((f) => f.severity === "error")).toEqual([]);
  });
  it("reports enum, required, additional properties, type, and minimum", () => {
    const r = checkInstance(schema, JSON.stringify({ status: "nope", count: 1.5, extra: true }));
    expect(rules(r.findings)).toEqual(expect.arrayContaining(["INSTANCE_ENUM", "INSTANCE_TYPE", "INSTANCE_ADDITIONAL"]));
    const missing = checkInstance(schema, JSON.stringify({ count: -1 }));
    expect(rules(missing.findings)).toEqual(expect.arrayContaining(["INSTANCE_REQUIRED", "INSTANCE_MINIMUM"]));
  });
  it("follows a local $ref", () => {
    const schema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      $ref: "#/definitions/wrap",
      definitions: { wrap: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
    };
    expect(checkInstance(JSON.stringify(schema), JSON.stringify({ id: "a" })).ok).toBe(true);
    expect(rules(checkInstance(JSON.stringify(schema), JSON.stringify({})).findings)).toContain("INSTANCE_REQUIRED");
  });
  it("warns on format and does not fail the instance for that alone", () => {
    const r = checkInstance(JSON.stringify({ type: "string", format: "email" }), JSON.stringify("not-an-email"));
    expect(r.ok).toBe(true);
    expect(rules(r.findings)).toContain("INSTANCE_FORMAT");
  });
});

describe("OpenAI structured outputs", () => {
  it("accepts a closed object with every property required", () => {
    const schema = {
      type: "object",
      properties: {
        city: { type: "string", pattern: "^[A-Z]" },
        unit: { type: ["string", "null"], enum: ["C", "F"] },
      },
      required: ["city", "unit"],
      additionalProperties: false,
    };
    const r = checkStructuredOutput(JSON.stringify(schema));
    expect(r.ok).toBe(true);
    expect(rules(r.findings)).not.toContain("SO_UNSUPPORTED");
    expect(JSON.parse(r.responseFormat).json_schema).toMatchObject({ name: "output", strict: true });
  });
  it("rejects a wrapper that is not closed or fully required", () => {
    const r = checkStructuredOutput(JSON.stringify({
      name: "weather",
      strict: true,
      schema: { type: "object", properties: { city: { type: "string" }, unit: { type: "string", enum: ["C", "F"] } }, required: ["city"] },
    }));
    expect(r.wrapper).toBe("wrapper");
    expect(rules(r.findings)).toEqual(expect.arrayContaining(["SO_ADDITIONAL_PROPERTIES", "SO_REQUIRED_MISSING"]));
  });
  it("rejects root anyOf and allOf, and warns on an unsupported format", () => {
    expect(rules(checkStructuredOutput(JSON.stringify({ anyOf: [{ type: "object" }] })).findings)).toContain("SO_ROOT_ANYOF");
    expect(rules(checkStructuredOutput(JSON.stringify({
      type: "object", additionalProperties: false, properties: { a: { allOf: [{ type: "string" }] } }, required: ["a"],
    })).findings)).toContain("SO_UNSUPPORTED");
    const fmt = checkStructuredOutput(JSON.stringify({
      type: "object", additionalProperties: false, properties: { site: { type: "string", format: "uri" } }, required: ["site"],
    }));
    expect(fmt.ok).toBe(true);
    expect(rules(fmt.findings)).toContain("SO_FORMAT");
  });
  it("flags nesting past 10 object levels", () => {
    let schema: Record<string, unknown> = { type: "object", properties: { leaf: { type: "string" } }, required: ["leaf"], additionalProperties: false };
    for (let i = 0; i < 10; i++) schema = { type: "object", properties: { child: schema }, required: ["child"], additionalProperties: false };
    expect(rules(checkStructuredOutput(JSON.stringify(schema)).findings)).toContain("SO_DEPTH");
  });
  it("warns when strict is false and rejects a bad name", () => {
    const r = checkStructuredOutput(JSON.stringify({
      name: "has space",
      strict: false,
      schema: { type: "object", additionalProperties: false, properties: {}, required: [] },
    }));
    expect(rules(r.findings)).toEqual(expect.arrayContaining(["SO_NAME", "SO_STRICT_OFF"]));
  });
});
