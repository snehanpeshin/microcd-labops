export interface SummaryStatistics {
  count: number;
  mean: number;
  median: number;
  standardDeviation: number;
  minimum: number;
  maximum: number;
}

export function summarize(values: number[]): SummaryStatistics {
  const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) throw new Error("At least one numeric value is required");
  const mean = clean.reduce((sum, value) => sum + value, 0) / clean.length;
  const middle = Math.floor(clean.length / 2);
  const median = clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2;
  const variance = clean.length > 1 ? clean.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (clean.length - 1) : 0;
  return {
    count: clean.length,
    mean,
    median,
    standardDeviation: Math.sqrt(variance),
    minimum: clean[0],
    maximum: clean.at(-1) ?? clean[0],
  };
}

export function percentChange(previous: number, current: number) {
  if (previous === 0) throw new Error("Percent change is undefined when the baseline is zero");
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function passRate(outcomes: boolean[]) {
  return outcomes.length ? (outcomes.filter(Boolean).length / outcomes.length) * 100 : 0;
}

export function evaluateCriterion(value: number, rule: { operator: "between" | ">=" | "<=" | "="; minimum?: number; maximum?: number; target?: number }) {
  if (!Number.isFinite(value)) return false;
  if (rule.operator === "between") return rule.minimum !== undefined && rule.maximum !== undefined && value >= rule.minimum && value <= rule.maximum;
  if (rule.operator === ">=") return rule.minimum !== undefined && value >= rule.minimum;
  if (rule.operator === "<=") return rule.maximum !== undefined && value <= rule.maximum;
  return rule.target !== undefined && value === rule.target;
}
