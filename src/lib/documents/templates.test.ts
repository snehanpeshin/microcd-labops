import { describe, expect, it } from "vitest";
import { searchTemplates } from "@/lib/documents/templates";

describe("template discovery", () => {
  it("searches titles, tags, sections, and domains", () => {
    expect(searchTemplates("calibration")[0]?.title).toBe("Equipment Calibration and Maintenance Record");
    expect(searchTemplates("FDA 510(k)").some((template) => template.title === "510(k) eSTAR Readiness Index")).toBe(true);
    expect(searchTemplates("protocol", "Clinical and human subjects").some((template) => template.title.includes("Clinical"))).toBe(true);
    expect(searchTemplates("residual risk").some((template) => template.title.includes("Risk"))).toBe(true);
  });
});
