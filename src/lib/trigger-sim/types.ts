/**
 * Layer 2 (NOT IMPLEMENTED YET): trigger simulation with a cheap model.
 *
 * Contract: given only a skill's name + description (what Claude sees before
 * loading a skill) and a set of user prompts labelled should/shouldn't trigger,
 * ask a model (DeepSeek / Gemini Flash / ...) whether it would load the skill,
 * then report precision/recall. Runs server-side (needs an API key), so it lives
 * outside the pure, client-side Layer-1 validator in ../validator.
 *
 * Results must be labelled "simulated, not an official Claude result".
 */
export interface TriggerCase {
  prompt: string;
  shouldTrigger: boolean;
}

export interface TriggerSimInput {
  name: string;
  description: string;
  cases: TriggerCase[];
  /** Optional distractor skills to simulate a crowded skill list. */
  distractors?: Array<{ name: string; description: string }>;
}

export interface TriggerCaseResult extends TriggerCase {
  triggered: boolean;
  rationale?: string;
}

export interface TriggerSimResult {
  model: string;
  precision: number;
  recall: number;
  accuracy: number;
  results: TriggerCaseResult[];
  simulated: true;
}

export interface TriggerSimulator {
  readonly id: string;
  simulate(input: TriggerSimInput, signal?: AbortSignal): Promise<TriggerSimResult>;
}

/** Layer 1 → Layer 2 hand-off: only run simulation on skills whose metadata is valid. */
export function canSimulate(report: { passed: boolean; parsed: { frontmatter?: Record<string, unknown> } }): boolean {
  const fm = report.parsed.frontmatter;
  return report.passed && typeof fm?.name === "string" && typeof fm?.description === "string";
}
