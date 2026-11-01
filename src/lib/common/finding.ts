/** Shared, framework-agnostic finding type used by the extra tools. */
export type Severity = "error" | "warning" | "tip";

export interface Finding {
  /** Stable rule id, e.g. "CU_UPPERCASE_KEY". */
  rule: string;
  severity: Severity;
  message: string;
  fix?: string;
  /** 1-based line in the pasted input. */
  line?: number;
  /** Source that justifies the rule. */
  ref?: string;
}

export function countFindings(f: Finding[]): Record<Severity, number> {
  const c: Record<Severity, number> = { error: 0, warning: 0, tip: 0 };
  for (const x of f) c[x.severity]++;
  return c;
}

const ORDER: Record<Severity, number> = { error: 0, warning: 1, tip: 2 };
export function sortFindings(f: Finding[]): Finding[] {
  return [...f].sort((a, b) => ORDER[a.severity] - ORDER[b.severity] || (a.line ?? 1e9) - (b.line ?? 1e9));
}

/** Levenshtein distance, small inputs only (typo suggestions). */
export function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
