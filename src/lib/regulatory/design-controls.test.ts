import { describe,expect,it } from "vitest";
import { generateDesignControlMatrix,generateTraceabilityMatrix } from "./design-controls";
import { generateRequirements } from "./requirements";
import type { RegulatoryProfileInput,RegulatoryRequirement } from "./types";

const profile:RegulatoryProfileInput={productName:"Test device",intendedUse:"Test",intendedUser:"Clinician",targetPopulation:"Adults",clinicalEnvironment:"Clinic",markets:["US"],deviceType:"combination",isIVD:true,isSaMD:false,hasAI:false,isConnected:true,isPatientFacing:false,isDiagnostic:true,isTherapeutic:false,isMonitoring:false,drivesClinicalDecisions:true,failureImpact:"incorrect_diagnosis",predicateAvailability:"yes"};
const requirements=generateRequirements(profile).map((item,index):RegulatoryRequirement=>({...item,id:`req-${index}`,status:index===0?"evidence_linked":"missing",updatedAt:"2026-08-22T00:00:00Z",evidence:index===0?[{id:"e-1",requirementId:"req-0",evidenceType:"report",evidenceId:"report-1",label:"Intended use report",href:"/report",notes:"",linkedAt:"2026-08-22T00:00:00Z",available:true}]:[]}));

describe("design control matrices",()=>{
  it("generates all seven development stages",()=>{expect(new Set(generateDesignControlMatrix(profile,requirements).map((row)=>row.stage)).size).toBe(7);});
  it("includes conditional software and human-factors artifacts",()=>{const names=generateDesignControlMatrix(profile,requirements).map((row)=>row.artifact);expect(names).toContain("Software Requirements Specification (SRS)");expect(names).toContain("Human Factors Summative Report");});
  it("excludes patient-contact evidence when the profile is not patient-facing",()=>{expect(generateDesignControlMatrix(profile,requirements).some((row)=>row.id==="biocompatibility")).toBe(false);});
  it("creates stable RTM identifiers and next actions",()=>{const rows=generateTraceabilityMatrix(requirements);expect(rows[0].id).toBe("RTM-001");expect(rows[1].nextAction).toContain("Create and link");});
});
