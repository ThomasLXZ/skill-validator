import { describe, expect, it } from "vitest";
import { checkSampling, classifyModel } from "@/lib/claude-sampling";

const rules = (text: string) => checkSampling(text).findings.map((f) => f.rule);
const body = (extra: Record<string, unknown>) => JSON.stringify({ max_tokens: 256, messages: [{ role: "user", content: "hi" }], ...extra });

describe("model class", () => {
  it("follows the documented watermark and post-4.6 sampling split", () => {
    expect(classifyModel("claude-sonnet-4-6")).toBe("watermark-sensitive");
    expect(classifyModel("claude-opus-4-6")).toBe("watermark-sensitive");
    expect(classifyModel("claude-opus-4-5")).toBe("other");
    expect(classifyModel("claude-sonnet-5")).toBe("sampling-locked");
    expect(classifyModel("claude-opus-4-7")).toBe("sampling-locked");
    expect(classifyModel("claude-fable-5")).toBe("sampling-locked");
    expect(classifyModel(undefined)).toBe("unspecified");
  });
});

describe("text watermark sampling", () => {
  it("is quiet aside from the omit note when sampling keys are absent", () => {
    expect(rules(body({ model: "claude-sonnet-4-6" }))).toEqual(["WM_OMITTED"]);
  });
  it("warns on non-default sampling for Sonnet 4.6 and Opus 4.6", () => {
    expect(rules(body({ model: "claude-sonnet-4-6", temperature: 0 }))).toContain("WM_NON_DEFAULT");
    expect(rules(body({ model: "claude-opus-4-6", top_k: 40 }))).toContain("WM_NON_DEFAULT");
  });
  it("treats an explicit default as omit-the-key, not as a non-default value", () => {
    const ids = rules(body({ model: "claude-sonnet-4-6", temperature: 1 }));
    expect(ids).toContain("WM_EXPLICIT_DEFAULT");
    expect(ids).not.toContain("WM_NON_DEFAULT");
  });
  it("warns when the model id is missing and sampling is set", () => {
    expect(rules(body({ temperature: 0.2 }))).toContain("WM_MODEL_UNKNOWN");
  });
  it("only tips on other model ids", () => {
    const ids = rules(body({ model: "claude-opus-4-5", temperature: 0 }));
    expect(ids).toContain("WM_OTHER_MODEL");
    expect(ids).not.toContain("WM_NON_DEFAULT");
  });
  it("rejects sampling the API reference says newer models refuse", () => {
    expect(rules(body({ model: "claude-sonnet-5", temperature: 0.2 }))).toContain("SAMP_REJECTED");
    expect(rules(body({ model: "claude-sonnet-5", top_p: 0.5 }))).toContain("SAMP_REJECTED");
    expect(rules(body({ model: "claude-sonnet-5", top_k: 10 }))).toContain("SAMP_REJECTED");
    const compat = rules(body({ model: "claude-sonnet-5", temperature: 1 }));
    expect(compat).toContain("SAMP_TEMP_COMPAT");
    expect(compat).not.toContain("SAMP_REJECTED");
  });
  it("rejects a non-JSON body", () => {
    expect(rules("temperature=0")).toContain("SAMP_JSON");
  });
});
