import { describe, expect, it } from "vitest";
import { assessUSProfile, FDA_RULESET_VERSION } from "./rules";
import { generateRequirements } from "./requirements";
import { profileBasicsSchema } from "./validation";
import type { RegulatoryProfileInput } from "./types";

const base:RegulatoryProfileInput={productName:"Troponin diagnostic",intendedUse:"Measure cardiac troponin I to aid clinical assessment.",intendedUser:"Clinical laboratory professional",targetPopulation:"Adults with suspected myocardial injury",clinicalEnvironment:"Clinical laboratory",markets:["US"],deviceType:"combination",isIVD:true,isSaMD:false,hasAI:false,isConnected:false,isPatientFacing:false,isDiagnostic:true,isTherapeutic:false,isMonitoring:false,drivesClinicalDecisions:true,failureImpact:"incorrect_diagnosis",predicateAvailability:"yes"};

describe("deterministic FDA decision-support rules",()=>{
  it("returns a possible Class II / 510(k) pathway for a US diagnostic with a candidate predicate",()=>{const result=assessUSProfile(base);expect(result.ruleId).toBe("FDA-PATH-001");expect(result.possibleClassification).toBe("Potential Class II");expect(result.possiblePathway).toBe("Possible 510(k) pathway");});
  it("escalates the highest-risk answer to possible Class III / PMA reasoning",()=>{const result=assessUSProfile({...base,failureImpact:"death"});expect(result.ruleId).toBe("FDA-PATH-003");expect(result.possibleClassification).toBe("Potential Class III");expect(result.possiblePathway).toBe("Possible PMA pathway");});
  it("returns possible De Novo reasoning when no predicate is available",()=>{const result=assessUSProfile({...base,predicateAvailability:"no"});expect(result.ruleId).toBe("FDA-PATH-002");expect(result.possiblePathway).toBe("Possible De Novo pathway");});
  it("applies software and cybersecurity evidence requirements for SaMD",()=>{const profile={...base,deviceType:"software" as const,isIVD:false,isSaMD:true,isConnected:true};const categories=generateRequirements(profile).map((item)=>item.category);expect(categories).toContain("software_verification");expect(categories).toContain("cybersecurity");expect(categories).not.toContain("electrical_safety");});
  it("marks incomplete intended use as insufficient information",()=>{const result=assessUSProfile({...base,intendedUse:""});expect(result.ruleId).toBe("FDA-INCOMPLETE-001");expect(result.confidence).toBe("insufficient_information");});
  it("is repeatable for the same inputs and records the ruleset version",()=>{const first=assessUSProfile(base),second=assessUSProfile(structuredClone(base));expect(first).toEqual(second);expect(first.ruleVersion).toBe(FDA_RULESET_VERSION);});
  it("rejects an incomplete wizard basics payload",()=>{expect(profileBasicsSchema.safeParse({projectId:crypto.randomUUID(),productName:"X",intendedUse:"short",intendedUser:"",targetPopulation:"",clinicalEnvironment:""}).success).toBe(false);});
});
