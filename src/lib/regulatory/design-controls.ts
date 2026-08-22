import type { EvidenceLink, RegulatoryProfileInput, RegulatoryRequirement, RequirementStatus } from "./types";

export interface DesignControlArtifact {
  id: string;
  stage: string;
  primaryQualityFile: string;
  artifact: string;
  requirementCategories: string[];
  status: RequirementStatus;
  evidence: EvidenceLink[];
}

export interface TraceabilityRow {
  id: string;
  sourceRequirement: string;
  designControlTarget: string;
  status: RequirementStatus;
  evidence: EvidenceLink[];
  nextAction: string;
}

type ArtifactDefinition = Omit<DesignControlArtifact, "status" | "evidence"> & {
  applies?: (profile: RegulatoryProfileInput) => boolean;
};

const stages: ArtifactDefinition[] = [
  { id:"ddp",stage:"1. Design Planning",primaryQualityFile:"DHF / DDF initiation",artifact:"Design & Development Plan (DDP)",requirementCategories:["design_inputs"] },
  { id:"rmp",stage:"1. Design Planning",primaryQualityFile:"DHF / DDF initiation",artifact:"Risk Management Plan (RMP)",requirementCategories:["risk_management"] },
  { id:"regulatory_strategy",stage:"1. Design Planning",primaryQualityFile:"DHF / DDF initiation",artifact:"Regulatory Strategy & Pathway Document",requirementCategories:["intended_use","labeling"] },
  { id:"mrd",stage:"2. User Needs",primaryQualityFile:"DHF / DDF core",artifact:"Market Requirements Document (MRD)",requirementCategories:["design_inputs"] },
  { id:"intended_use",stage:"2. User Needs",primaryQualityFile:"DHF / DDF core",artifact:"Intended Use / Indications for Use Statement",requirementCategories:["intended_use"] },
  { id:"human_factors_plan",stage:"2. User Needs",primaryQualityFile:"DHF / DDF core",artifact:"Human Factors & Usability Engineering Plan",requirementCategories:["human_factors","validation"],applies:(profile)=>profile.isPatientFacing||profile.drivesClinicalDecisions },
  { id:"system_srs",stage:"3. Design Inputs",primaryQualityFile:"DHF / DDF core",artifact:"Product / System Requirements Specification (SRS)",requirementCategories:["design_inputs"] },
  { id:"software_srs",stage:"3. Design Inputs",primaryQualityFile:"DHF / DDF core",artifact:"Software Requirements Specification (SRS)",requirementCategories:["software_verification"],applies:(profile)=>profile.deviceType!=="hardware"||profile.isSaMD||profile.hasAI },
  { id:"pha",stage:"3. Design Inputs",primaryQualityFile:"DHF / DDF core",artifact:"Preliminary Hazard Analysis (PHA / uFMEA)",requirementCategories:["risk_management"] },
  { id:"dmr_index",stage:"4. Design Outputs",primaryQualityFile:"DHF → DMR transition",artifact:"Device Master Record (DMR) Index",requirementCategories:["design_outputs","manufacturing"] },
  { id:"cad_bom",stage:"4. Design Outputs",primaryQualityFile:"DHF → DMR transition",artifact:"CAD Drawings, Schematics & Bill of Materials",requirementCategories:["design_outputs"],applies:(profile)=>profile.deviceType!=="software" },
  { id:"software_architecture",stage:"4. Design Outputs",primaryQualityFile:"DHF → DMR transition",artifact:"Software Architecture & Source Code Documentation",requirementCategories:["design_outputs","software_verification"],applies:(profile)=>profile.deviceType!=="hardware"||profile.isSaMD||profile.hasAI },
  { id:"manufacturing_instructions",stage:"4. Design Outputs",primaryQualityFile:"DHF → DMR transition",artifact:"Manufacturing & Assembly Instructions",requirementCategories:["manufacturing","design_outputs"],applies:(profile)=>profile.deviceType!=="software" },
  { id:"rtm",stage:"5. Design Verification",primaryQualityFile:"DHF / DDF core",artifact:"Requirements Traceability Matrix (RTM)",requirementCategories:["design_inputs","design_outputs","verification"] },
  { id:"verification_reports",stage:"5. Design Verification",primaryQualityFile:"DHF / DDF core",artifact:"Verification Protocols & Test Reports",requirementCategories:["verification"] },
  { id:"biocompatibility",stage:"5. Design Verification",primaryQualityFile:"DHF / DDF core",artifact:"Biocompatibility Report",requirementCategories:["biocompatibility"],applies:(profile)=>profile.isPatientFacing },
  { id:"electrical_safety",stage:"5. Design Verification",primaryQualityFile:"DHF / DDF core",artifact:"Electrical Safety / EMC Report",requirementCategories:["electrical_safety"],applies:(profile)=>profile.deviceType!=="software" },
  { id:"validation_reports",stage:"6. Design Validation",primaryQualityFile:"DHF / DDF core",artifact:"Validation Protocols & Clinical Trial Reports",requirementCategories:["validation","clinical_performance"] },
  { id:"human_factors_report",stage:"6. Design Validation",primaryQualityFile:"DHF / DDF core",artifact:"Human Factors Summative Report",requirementCategories:["human_factors","validation"],applies:(profile)=>profile.isPatientFacing||profile.drivesClinicalDecisions },
  { id:"final_rmr",stage:"6. Design Validation",primaryQualityFile:"DHF / DDF core",artifact:"Final Risk Management Report (RMR)",requirementCategories:["risk_management","validation"] },
  { id:"submission",stage:"7. Design Transfer",primaryQualityFile:"DMR / DHR activation",artifact:"Technical File / Premarket Submission Package",requirementCategories:["intended_use","labeling","verification","validation"] },
  { id:"process_validation",stage:"7. Design Transfer",primaryQualityFile:"DMR / DHR activation",artifact:"Process Validation (IQ / OQ / PQ) Protocols",requirementCategories:["manufacturing","validation"],applies:(profile)=>profile.deviceType!=="software" },
  { id:"dhr_template",stage:"7. Design Transfer",primaryQualityFile:"DMR / DHR activation",artifact:"Device History Record (DHR) Template",requirementCategories:["manufacturing"],applies:(profile)=>profile.deviceType!=="software" },
];

const statusRank: Record<RequirementStatus,number> = { not_assessed:0,missing:1,needs_review:2,partial:3,evidence_linked:4 };

function combinedStatus(requirements:RegulatoryRequirement[]):RequirementStatus {
  if(!requirements.length)return "not_assessed";
  if(requirements.some((item)=>item.status==="missing"))return "missing";
  if(requirements.some((item)=>item.status==="needs_review"))return "needs_review";
  if(requirements.some((item)=>item.status==="partial"))return "partial";
  return requirements.every((item)=>item.status==="evidence_linked")?"evidence_linked":requirements.sort((a,b)=>statusRank[a.status]-statusRank[b.status])[0].status;
}

function uniqueEvidence(requirements:RegulatoryRequirement[]):EvidenceLink[] {
  const links=new Map<string,EvidenceLink>();
  for(const requirement of requirements)for(const link of requirement.evidence)links.set(link.id,link);
  return [...links.values()];
}

export function generateDesignControlMatrix(profile:RegulatoryProfileInput,requirements:RegulatoryRequirement[]):DesignControlArtifact[] {
  return stages.filter((item)=>item.applies?.(profile)??true).map((item)=>{
    const supporting=requirements.filter((requirement)=>item.requirementCategories.includes(requirement.category));
    return {id:item.id,stage:item.stage,primaryQualityFile:item.primaryQualityFile,artifact:item.artifact,requirementCategories:item.requirementCategories,status:combinedStatus(supporting),evidence:uniqueEvidence(supporting)};
  });
}

const targetByCategory:Record<string,string>={
  intended_use:"User needs → design inputs → validation and labeling",
  design_inputs:"Approved inputs → design outputs → verification",
  design_outputs:"Released outputs → verification → DMR",
  verification:"Design inputs/outputs → verification protocol and report",
  validation:"User needs/intended use → validation protocol and report",
  risk_management:"Hazard → control → control verification → residual risk",
  manufacturing:"Released design → process controls → DMR/DHR",
  labeling:"Intended use and risk controls → controlled labeling",
  analytical_performance:"Performance claim → analytical protocol and report",
  clinical_performance:"Clinical claim → clinical protocol and report",
  shelf_life:"Storage claim → stability protocol and report",
  software_verification:"Software requirement → architecture/code → test evidence",
  cybersecurity:"Threat → security control → security verification",
  human_factors:"Use-related risk → user-interface control → usability validation",
  electrical_safety:"Safety requirement → test method → safety/EMC report",
  biocompatibility:"Patient-contact characterization → biological evaluation evidence",
};

export function generateTraceabilityMatrix(requirements:RegulatoryRequirement[]):TraceabilityRow[] {
  return requirements.filter((item)=>item.status!=="not_assessed").map((item,index)=>({
    id:`RTM-${String(index+1).padStart(3,"0")}`,
    sourceRequirement:item.title,
    designControlTarget:targetByCategory[item.category]??"Requirement → implementation → objective evidence",
    status:item.status,
    evidence:item.evidence,
    nextAction:item.status==="evidence_linked"?"Confirm linked evidence adequacy and approval state.":item.evidence.length?`Add or review evidence until at least ${item.minimumEvidenceCount} applicable record(s) support this requirement.`:"Create and link objective evidence for this requirement.",
  }));
}
