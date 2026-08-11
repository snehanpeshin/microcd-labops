import { describe, expect, it } from "vitest";
import { evaluateReadiness, type ReadinessInput } from "./readiness";

const ready: ReadinessInput = {
  protocol:{label:"PRO-014 v3",status:"Approved"},
  builds:[{code:"BLD-001",status:"Available",materials:[{label:"LOT-01 · Disc",inspectionStatus:"Passed",disposition:"Accepted",expiresAt:"2027-01-01"}]}],
  equipment:[{code:"EQ-01",status:"Available",nextCalibration:"2027-01-01"}],
  samples:[{code:"SMP-01",status:"Available",expirationDate:"2027-01-01"}],
  tasks:[],
};

describe("experiment readiness",()=>{
  it("returns ready when all execution evidence is current",()=>expect(evaluateReadiness(ready,new Date("2026-08-11T12:00:00Z")).status).toBe("ready"));
  it("blocks a failed incoming-inspection lot",()=>{
    const input=structuredClone(ready);input.builds[0].materials[0].inspectionStatus="Failed";
    const result=evaluateReadiness(input,new Date("2026-08-11T12:00:00Z"));
    expect(result.status).toBe("blocked");expect(result.checks.find((item)=>item.key==="materials")?.details[0]).toContain("Failed");
  });
  it("blocks overdue calibration",()=>{
    const input=structuredClone(ready);input.equipment[0].nextCalibration="2026-08-10";
    expect(evaluateReadiness(input,new Date("2026-08-11T12:00:00Z")).status).toBe("blocked");
  });
  it("flags an imminent material expiration as at risk",()=>{
    const input=structuredClone(ready);input.builds[0].materials[0].expiresAt="2026-08-20";
    expect(evaluateReadiness(input,new Date("2026-08-11T12:00:00Z")).status).toBe("at_risk");
  });
});
