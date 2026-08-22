import { describe, expect, it } from "vitest";
import { deriveRequirementStatus, summarizeCoverage, uniqueEvidenceLinks } from "./readiness";

describe("regulatory evidence readiness",()=>{
  it("moves requirements through missing, partial, linked, and needs-review states",()=>{expect(deriveRequirementStatus([],1)).toBe("missing");expect(deriveRequirementStatus([{available:true}],2)).toBe("partial");expect(deriveRequirementStatus([{available:true},{available:true}],2)).toBe("evidence_linked");expect(deriveRequirementStatus([{available:false}],1)).toBe("needs_review");});
  it("retains partial status when a deleted or unavailable source remains linked",()=>{expect(deriveRequirementStatus([{available:true},{available:false}],1)).toBe("partial");});
  it("deduplicates evidence by type and source id",()=>{const links=uniqueEvidenceLinks([{evidenceType:"report",evidenceId:"1",label:"A"},{evidenceType:"report",evidenceId:"1",label:"duplicate"},{evidenceType:"experiment",evidenceId:"1",label:"different type"}]);expect(links).toHaveLength(2);expect(links.map((item)=>item.label)).toEqual(["A","different type"]);});
  it("calculates weighted coverage without overstating partial evidence",()=>{expect(summarizeCoverage([{status:"evidence_linked"},{status:"partial"},{status:"missing"},{status:"needs_review"}])).toEqual({total:4,supported:1,partial:2,missing:1,notAssessed:0,percentage:50});});
});
