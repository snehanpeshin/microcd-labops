import { describe, expect, it } from "vitest";
import { evaluateCriterion, parseNumericValue, passRate, percentChange, summarize } from "./calculations";
describe("engineering calculations", () => {
  it("calculates transparent sample statistics", () => { expect(summarize([10, 12, 14])).toEqual({ count: 3, mean: 12, median: 12, standardDeviation: 2, minimum: 10, maximum: 14 }); });
  it("ignores non-finite values", () => { expect(summarize([1, Number.NaN, 3]).count).toBe(2); });
  it("rejects an empty dataset", () => { expect(() => summarize([])).toThrow(/numeric/); });
  it("evaluates all supported criterion operators", () => { expect(evaluateCriterion(5, { operator: "between", minimum: 4, maximum: 6 })).toBe(true); expect(evaluateCriterion(7, { operator: "<=", maximum: 6 })).toBe(false); expect(evaluateCriterion(7, { operator: ">=", minimum: 7 })).toBe(true); expect(evaluateCriterion(7, { operator: "=", target: 7 })).toBe(true); });
  it("uses a documented tolerance for floating-point equality", () => { expect(evaluateCriterion(0.1 + 0.2, { operator: "=", target: 0.3 })).toBe(true); expect(evaluateCriterion(10.05, { operator: "=", target: 10, tolerance: 0.1 })).toBe(true); expect(evaluateCriterion(10.2, { operator: "=", target: 10, tolerance: 0.1 })).toBe(false); });
  it("rejects malformed equality rules", () => { expect(evaluateCriterion(1, { operator: "=" })).toBe(false); expect(evaluateCriterion(1, { operator: "=", target: 1, tolerance: -1 })).toBe(false); });
  it("does not mutate input values while summarizing", () => { const values = [3, 1, 2]; summarize(values); expect(values).toEqual([3, 1, 2]); });
  it("does not interpret blank measurement cells as zero", () => { expect(parseNumericValue("")).toBeNull(); expect(parseNumericValue("  ")).toBeNull(); expect(parseNumericValue("0")).toBe(0); expect(parseNumericValue(" 1.25 ")).toBe(1.25); expect(parseNumericValue("NA")).toBeNull(); });
  it("computes pass rate and percent change", () => { expect(passRate([true, false, true, true])).toBe(75); expect(percentChange(10, 12)).toBe(20); });
});
