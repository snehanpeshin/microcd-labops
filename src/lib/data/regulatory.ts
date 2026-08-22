import type { WorkspaceIdentity } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { assessUSProfile } from "@/lib/regulatory/rules";
import { generateRequirements } from "@/lib/regulatory/requirements";
import { deriveRequirementStatus } from "@/lib/regulatory/readiness";
import type { EvidenceLink, EvidenceType, RegulatoryAssessmentResult, RegulatoryProfileInput, RegulatoryRequirement, RequirementStatus } from "@/lib/regulatory/types";
import type { RegulatoryReference } from "@/lib/regulatory/types";

export interface RegulatoryProfile extends RegulatoryProfileInput {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  wizardStep: number;
  completedAt?: string;
  updatedAt: string;
}

export interface RegulatoryAssessment extends RegulatoryAssessmentResult { id: string; createdAt: string; }
export interface EvidenceOption { evidenceType: EvidenceType; evidenceId: string; label: string; href: string; context: string; }
export interface RegulatoryReadinessReportSummary { id: string; reportNumber: string; version: number; createdAt: string; }
export interface RegulatoryReadinessReportSnapshot {
  title: "Regulatory Readiness Report";
  organization: string;
  generatedAt: string;
  generatedBy: string;
  profile: RegulatoryProfile;
  assessment: RegulatoryAssessment;
  requirements: RegulatoryRequirement[];
  coverage: { total:number; supported:number; partial:number; missing:number; notAssessed:number; percentage:number };
  nextActions: string[];
  references: RegulatoryReference[];
  disclaimer: string;
}
export interface RegulatoryReadinessReport extends RegulatoryReadinessReportSummary { snapshot: RegulatoryReadinessReportSnapshot; }

const demoInput: RegulatoryProfileInput = {
  productName: "Cardiac Troponin I Diagnostic System",
  intendedUse: "Quantitative measurement of cardiac troponin I in human whole blood to aid clinicians evaluating possible myocardial injury.",
  intendedUser: "Trained clinical laboratory and point-of-care professionals",
  targetPopulation: "Adults presenting with signs or symptoms consistent with possible myocardial injury",
  clinicalEnvironment: "Clinical laboratory and supervised near-patient care settings",
  markets: ["US"], deviceType: "combination", isIVD: true, isSaMD: false, hasAI: false, isConnected: true, isPatientFacing: false, isDiagnostic: true, isTherapeutic: false, isMonitoring: false, drivesClinicalDecisions: true, failureImpact: "incorrect_diagnosis", predicateAvailability: "yes",
};
const demoProfile: RegulatoryProfile = { id:"reg_profile_demo",projectId:"proj_centrifugal",projectCode:"MCD-001",projectName:"Centrifugal diagnostic cartridge",wizardStep:4,completedAt:"2026-08-12T14:00:00Z",updatedAt:"2026-08-12T14:00:00Z",...demoInput };
const demoAssessment: RegulatoryAssessment = { id:"reg_assessment_demo",createdAt:"2026-08-12T14:00:00Z",...assessUSProfile(demoInput) };
const demoLinked = new Set(["intended_use","design_inputs","verification","analytical_performance","risk_management"]);

const one = <T>(value:T|T[]|null|undefined):T|undefined => Array.isArray(value)?value[0]:value??undefined;
const title = (value:string) => value.split("_").map((part)=>part?part[0].toUpperCase()+part.slice(1):part).join(" ");

function mapProfile(row: Record<string, unknown>): RegulatoryProfile {
  const project=one(row.projects as {code:string;name:string}|{code:string;name:string}[]|null);
  return {
    id:String(row.id),projectId:String(row.project_id),projectCode:project?.code??"Project",projectName:project?.name??"Project",productName:String(row.product_name),intendedUse:String(row.intended_use),intendedUser:String(row.intended_user),targetPopulation:String(row.target_population),clinicalEnvironment:String(row.clinical_environment),markets:(row.markets as RegulatoryProfileInput["markets"])??["US"],deviceType:row.device_type as RegulatoryProfileInput["deviceType"],isIVD:Boolean(row.is_ivd),isSaMD:Boolean(row.is_samd),hasAI:Boolean(row.has_ai),isConnected:Boolean(row.is_connected),isPatientFacing:Boolean(row.is_patient_facing),isDiagnostic:Boolean(row.is_diagnostic),isTherapeutic:Boolean(row.is_therapeutic),isMonitoring:Boolean(row.is_monitoring),drivesClinicalDecisions:Boolean(row.drives_clinical_decisions),failureImpact:row.failure_impact as RegulatoryProfileInput["failureImpact"],predicateAvailability:row.predicate_availability as RegulatoryProfileInput["predicateAvailability"],wizardStep:Number(row.wizard_step),completedAt:row.completed_at?String(row.completed_at):undefined,updatedAt:String(row.updated_at),
  };
}

export async function listRegulatoryProfiles(identity:WorkspaceIdentity):Promise<RegulatoryProfile[]> {
  if(identity.demo)return [demoProfile];
  const result=await (await createClient()).from("regulatory_profiles").select("*,projects(code,name)").eq("organization_id",identity.organizationId).order("updated_at",{ascending:false});
  if(result.error)throw new Error("Regulatory profiles could not be loaded.");
  return (result.data as unknown as Record<string,unknown>[]).map(mapProfile);
}

export async function getRegulatoryProfile(identity:WorkspaceIdentity,id:string):Promise<RegulatoryProfile|null>{return (await listRegulatoryProfiles(identity)).find((item)=>item.id===id)??null;}

export async function getLatestRegulatoryAssessment(identity:WorkspaceIdentity,profileId:string):Promise<RegulatoryAssessment|null>{
  if(identity.demo)return profileId===demoProfile.id?demoAssessment:null;
  const result=await (await createClient()).from("regulatory_assessments").select("*").eq("organization_id",identity.organizationId).eq("profile_id",profileId).order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(result.error)throw new Error("Regulatory assessment could not be loaded.");if(!result.data)return null;const row=result.data;
  return {id:row.id,jurisdiction:"US",possibleDeviceStatus:row.possible_device_status,possibleClassification:row.possible_classification,possiblePathway:row.possible_pathway,confidence:row.confidence,ruleId:row.rule_id,ruleVersion:row.rule_version,evaluatedInputs:row.evaluated_inputs as RegulatoryProfileInput,reasoning:row.reasoning as string[],assumptions:row.assumptions as string[],confirmations:row.confirmations as string[],createdAt:row.created_at};
}

export async function listRegulatoryEvidenceOptions(identity:WorkspaceIdentity,projectId:string):Promise<EvidenceOption[]> {
  if(identity.demo)return [
    {evidenceType:"project",evidenceId:"00000000-0000-0000-0000-000000000001",label:"MCD-001 · Centrifugal diagnostic cartridge",href:"/app/projects",context:"Project artifact"},
    {evidenceType:"experiment",evidenceId:"00000000-0000-0000-0000-000000000002",label:"EXP-104 · LoD characterization",href:"/app/experiments/exp_flow",context:"Experiment and result"},
    {evidenceType:"report",evidenceId:"00000000-0000-0000-0000-000000000003",label:"ETR-2026-041 · Analytical performance summary",href:"/app/reports/rpt_flow",context:"Engineering report"},
  ];
  const supabase=await createClient();
  const [project,experiments,reports,protocols,packets,attachments]=await Promise.all([
    supabase.from("projects").select("id,code,name").eq("organization_id",identity.organizationId).eq("id",projectId).is("deleted_at",null).maybeSingle(),
    supabase.from("experiments").select("id,code,title").eq("organization_id",identity.organizationId).eq("project_id",projectId).is("deleted_at",null).limit(200),
    supabase.from("reports").select("id,number,title").eq("organization_id",identity.organizationId).eq("project_id",projectId).is("deleted_at",null).limit(200),
    supabase.from("protocols").select("id,code,name").eq("organization_id",identity.organizationId).is("deleted_at",null).limit(200),
    supabase.from("evidence_packets").select("id,packet_number,experiment:experiments!inner(project_id,code)").eq("organization_id",identity.organizationId).eq("experiment.project_id",projectId).limit(200),
    supabase.from("attachments").select("id,file_name,record_id,record_type").eq("organization_id",identity.organizationId).limit(250),
  ]);
  if(project.error||experiments.error||reports.error||protocols.error||packets.error||attachments.error)throw new Error("Available LabOps evidence could not be loaded.");
  const options:EvidenceOption[]=[];if(project.data)options.push({evidenceType:"project",evidenceId:project.data.id,label:`${project.data.code} · ${project.data.name}`,href:"/app/projects",context:"Project artifact"});
  for(const item of experiments.data??[])options.push({evidenceType:"experiment",evidenceId:item.id,label:`${item.code} · ${item.title}`,href:`/app/experiments/${item.id}`,context:"Experiment, run, and result"});
  for(const item of reports.data??[])options.push({evidenceType:"report",evidenceId:item.id,label:`${item.number} · ${item.title}`,href:`/app/reports/${item.id}`,context:"Engineering report"});
  for(const item of protocols.data??[])options.push({evidenceType:"protocol",evidenceId:item.id,label:`${item.code} · ${item.name}`,href:"/app/protocols",context:"Controlled protocol"});
  for(const item of packets.data??[]){const experiment=one(item.experiment as {code:string}|{code:string}[]|null);options.push({evidenceType:"evidence_packet",evidenceId:item.id,label:`${item.packet_number} · ${experiment?.code??"Experiment evidence"}`,href:`/app/evidence/${item.id}`,context:"Immutable evidence packet"});}
  const allowedRecordIds=new Set([projectId,...(experiments.data??[]).map((item)=>item.id),...(reports.data??[]).map((item)=>item.id),...(packets.data??[]).map((item)=>item.id)]);
  for(const item of attachments.data??[])if(allowedRecordIds.has(item.record_id))options.push({evidenceType:"file",evidenceId:item.id,label:item.file_name,href:`/api/files/${item.id}`,context:`File attached to ${title(item.record_type)}`});
  return options;
}

export async function listRegulatoryRequirements(identity:WorkspaceIdentity,profileId:string,projectId:string):Promise<RegulatoryRequirement[]> {
  if(identity.demo)return generateRequirements(demoInput).map((item,index)=>{const linked=demoLinked.has(item.category);const evidence:EvidenceLink[]=linked?[{id:`link_${item.category}`,requirementId:`req_${item.category}`,evidenceType:index%2?"experiment":"report",evidenceId:`evidence_${item.category}`,label:index%2?"EXP-104 · LoD characterization":"ETR-2026-041 · Analytical performance summary",href:index%2?"/app/experiments/exp_flow":"/app/reports/rpt_flow",notes:"Fictional demonstration evidence.",linkedAt:"2026-08-12T14:00:00Z",available:true}]:[];const status:RequirementStatus=linked?item.minimumEvidenceCount>1?"partial":"evidence_linked":"missing";return {...item,id:`req_${item.category}`,status,updatedAt:"2026-08-12T14:00:00Z",evidence};});
  const supabase=await createClient();const [requirements,options]=await Promise.all([supabase.from("regulatory_requirements").select("*,regulatory_evidence_links(*)").eq("organization_id",identity.organizationId).eq("profile_id",profileId).order("priority").order("title"),listRegulatoryEvidenceOptions(identity,projectId)]);if(requirements.error)throw new Error("Evidence requirements could not be loaded.");const available=new Set(options.map((item)=>`${item.evidenceType}:${item.evidenceId}`));
  return requirements.data.map((row)=>{const evidence:EvidenceLink[]=row.regulatory_evidence_links.map((link:{id:string;requirement_id:string;evidence_type:EvidenceType;evidence_id:string;evidence_label:string;evidence_href:string;notes:string;linked_at:string})=>({id:link.id,requirementId:link.requirement_id,evidenceType:link.evidence_type,evidenceId:link.evidence_id,label:link.evidence_label,href:link.evidence_href,notes:link.notes,linkedAt:link.linked_at,available:available.has(`${link.evidence_type}:${link.evidence_id}`)}));return {id:row.id,category:row.category,title:row.title,description:row.description,rationale:row.rationale,jurisdiction:row.jurisdiction,priority:row.priority,minimumEvidenceCount:row.minimum_evidence_count,status:deriveRequirementStatus(evidence,row.minimum_evidence_count),updatedAt:row.updated_at,evidence};});
}

export async function listRegulatoryReports(identity:WorkspaceIdentity,profileId:string):Promise<RegulatoryReadinessReportSummary[]>{if(identity.demo)return [{id:"reg_report_demo",reportNumber:"RRR-2026-DEMO",version:1,createdAt:"2026-08-12T15:00:00Z"}];const result=await (await createClient()).from("regulatory_readiness_reports").select("id,report_number,version,created_at").eq("organization_id",identity.organizationId).eq("profile_id",profileId).order("version",{ascending:false});if(result.error)throw new Error("Regulatory report history could not be loaded.");return result.data.map((row)=>({id:row.id,reportNumber:row.report_number,version:row.version,createdAt:row.created_at}));}

export async function getRegulatoryReport(identity:WorkspaceIdentity,id:string):Promise<RegulatoryReadinessReport|null>{if(identity.demo){if(id!=="reg_report_demo")return null;const requirements=await listRegulatoryRequirements(identity,demoProfile.id,demoProfile.projectId);const [{summarizeCoverage},{regulatoryReferences}]=await Promise.all([import("@/lib/regulatory/readiness"),import("@/lib/regulatory/references")]);return {id,reportNumber:"RRR-2026-DEMO",version:1,createdAt:"2026-08-12T15:00:00Z",snapshot:{title:"Regulatory Readiness Report",organization:identity.organizationName,generatedAt:"2026-08-12T15:00:00Z",generatedBy:identity.fullName,profile:demoProfile,assessment:demoAssessment,requirements,coverage:summarizeCoverage(requirements),nextActions:requirements.filter((item)=>item.status!=="evidence_linked").slice(0,5).map((item)=>`Link or create evidence for ${item.title}.`),references:regulatoryReferences,disclaimer:"Fictional demo; decision support only."}};}const result=await (await createClient()).from("regulatory_readiness_reports").select("id,report_number,version,created_at,snapshot").eq("organization_id",identity.organizationId).eq("id",id).maybeSingle();if(result.error)throw new Error("Regulatory report could not be loaded.");return result.data?{id:result.data.id,reportNumber:result.data.report_number,version:result.data.version,createdAt:result.data.created_at,snapshot:result.data.snapshot as RegulatoryReadinessReportSnapshot}:null;}
