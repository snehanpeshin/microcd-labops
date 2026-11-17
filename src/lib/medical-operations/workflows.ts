import catalog from "./catalog.json";
import { z } from "zod";

export interface WorkflowField { key:string; label:string; required:boolean; }
export interface WorkflowDefinition { key:string; version:number; title:string; area:string; applicability:string; summary:string; sourceKeys:string[]; reviewedOn:string; fields:WorkflowField[]; }
export const workflows:WorkflowDefinition[]=catalog.workflows;
export const sources:Record<string,{title:string;url:string;kind:string}>=catalog.sources;
export const workflowFor=(key:string)=>workflows.find(w=>w.key===key);
export const states=["draft","active","in_review","changes_requested","closed"] as const;
export type CaseState=typeof states[number];
export const stateLabels:Record<CaseState,string>={draft:"Draft",active:"In progress",in_review:"Awaiting review",changes_requested:"Changes requested",closed:"Reviewed closure"};
export const evidenceKinds=["project","experiment","report","protocol","sample","equipment","lot","build","evidence_packet"] as const;
export type EvidenceKind=typeof evidenceKinds[number];
export interface CaseEvidence {kind:EvidenceKind;id:string;label:string;}
export interface OperationsCase {
 id:string; organizationId:string; workflowKey:string; title:string; state:CaseState; priority:"low"|"medium"|"high"|"critical";
 ownerLabel:string; dueDate?:string; parentId?:string; fields:Record<string,string>; evidence:CaseEvidence[];
 revision:number; createdBy:string; lastEditedBy:string; updatedAt:string; decisionNote:string;
}
export interface CaseEvent {id:string;revision:number;actorId:string;occurredAt:string;snapshot:Record<string,unknown>;}
export const caseInputSchema=z.object({
 title:z.string().trim().min(3).max(180), ownerLabel:z.string().trim().min(2).max(160),
 priority:z.enum(["low","medium","high","critical"]), dueDate:z.string().date().or(z.literal("")),
 parentId:z.string().uuid().or(z.literal("")),
});
export const evidenceSchema=z.array(z.object({kind:z.enum(evidenceKinds),id:z.string().uuid(),label:z.string().trim().min(1).max(240)})).max(40);
export function validateFields(workflow:WorkflowDefinition, input:Record<string,string>, requireComplete=false) {
 const allowed=new Set(workflow.fields.map(f=>f.key));
 for(const [key,value] of Object.entries(input)) if(!allowed.has(key)||typeof value!=="string"||value.length>8000) throw Error("Unrecognized or oversized workflow field.");
 const missing=workflow.fields.filter(f=>f.required&&(!input[f.key]?.trim()||/^(tbd|todo|n\/?a|pending|unknown|not assessed)[.!\s]*$/i.test(input[f.key].trim())));
 if(requireComplete&&missing.length)throw Error(`Complete these fields or document a justified exclusion: ${missing.map(f=>f.label).join(", ")}`);
 return {fields:Object.fromEntries(workflow.fields.map(f=>[f.key,input[f.key]?.trim()??""])),missing};
}
export function transitionAllowed(from:CaseState,to:CaseState,reviewer:boolean,authorId:string,actorId:string) {
 if(from==="closed")return false;
 if(from==="in_review")return reviewer&&authorId!==actorId&&(to==="closed"||to==="changes_requested");
 return ["draft","active","changes_requested"].includes(from)&&["draft","active","in_review"].includes(to);
}
export function evidenceHref(e:Pick<CaseEvidence,"kind"|"id">) {
 const section:Record<EvidenceKind,string>={project:"projects",experiment:"experiments",report:"reports",protocol:"protocols",sample:"samples",equipment:"equipment",lot:"lots",build:"builds",evidence_packet:"evidence"};
 return e.kind==="project"?"/app/projects":`/app/${section[e.kind]}/${encodeURIComponent(e.id)}`;
}
export function coverageByWorkflow(cases:OperationsCase[]) {
 return workflows.map(workflow=>({workflow,records:cases.filter(c=>c.workflowKey===workflow.key),open:cases.filter(c=>c.workflowKey===workflow.key&&c.state!=="closed").length}));
}
