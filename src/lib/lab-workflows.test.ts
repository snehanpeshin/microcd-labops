import { describe, expect, it } from "vitest";
import { canTransitionExperiment, isOverdue, signedInventoryDelta } from "./lab-workflows";

describe("laboratory workflows", () => {
  it("allows controlled experiment transitions", () => {
    expect(canTransitionExperiment("running","completed")).toBe(true);
    expect(canTransitionExperiment("draft","approved")).toBe(false);
    expect(canTransitionExperiment("approved","running")).toBe(false);
  });

  it("normalizes inventory-consuming adjustments", () => {
    expect(signedInventoryDelta("receipt",5)).toBe(5);
    expect(signedInventoryDelta("use",5)).toBe(-5);
    expect(signedInventoryDelta("disposal",-2)).toBe(-2);
    expect(() => signedInventoryDelta("use",0)).toThrow();
  });

  it("does not mark completed tasks overdue", () => {
    const today = new Date("2026-08-10T12:00:00Z");
    expect(isOverdue("2026-08-09","To do",today)).toBe(true);
    expect(isOverdue("2026-08-09","Completed",today)).toBe(false);
  });
});
