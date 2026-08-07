import { describe, expect, it } from "vitest";
import { searchTemplates } from "@/lib/documents/templates";
describe("template discovery",()=>{it("searches titles, tags, and domains",()=>{expect(searchTemplates("calibration")[0]?.title).toBe("Equipment Calibration Record");expect(searchTemplates("FDA 510(k)")).toHaveLength(1);expect(searchTemplates("protocol","Clinical operations").some(t=>t.title.includes("Clinical"))).toBe(true);});});
