import { describe, expect, it } from "vitest";
import { evaluateCriterion, passRate, percentChange, summarize } from "./calculations";
describe("engineering calculations", () => {
  it("calculates transparent sample statistics", () => { expect(summarize([10, 12, 14])).toEqual({ count: 3, mean: 12, median: 12, standardDeviation: 2, minimum: 10, maximum: 14 }); });
  it("ignores non-finite values", () => { expect(summarize([1, Number.NaN, 3]).count).toBe(2); });
  it("rejects an empty dataset", () => { expect(() => summarize([])).toThrow(/numeric/); });
  it("evaluates all supported criterion operators", () => { expect(evaluateCriterion(5, { operator: "between", minimum: 4, maximum: 6 })).toBe(true); expect(evaluateCriterion(7, { operator: "<=", maximum: 6 })).toBe(false); expect(evaluateCriterion(7, { operator: ">=", minimum: 7 })).toBe(true); expect(evaluateCriterion(7, { operator: "=", target: 7 })).toBe(true); });
  it("computes pass rate and percent change", () => { expect(passRate([true, false, true, true])).toBe(75); expect(percentChange(10, 12)).toBe(20); });
});
