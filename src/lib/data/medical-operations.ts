import { cache } from "react";
import { workflows } from "@/lib/medical-operations/workflows";
import type { WorkspaceIdentity } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CaseEvidence, CaseEvent, EvidenceKind, OperationsCase } from "@/lib/medical-operations/workflows";

export const evidenceTables:Record<EvidenceKind,{table:string;select:string;identifier:string;name?:string}>={
 project:{table:"projects",select:"id,code,name",identifier:"code",name:"name"},experiment:{table:"experiments",select:"id,code,title",identifier:"code",name:"title"},report:{table:"reports",select:"id,number,title",identifier:"number",name:"title"},protocol:{table:"protocols",select:"id,code,name",identifier:"code",name:"name"},sample:{table:"samples",select:"id,code,name",identifier:"code",name:"name"},equipment:{table:"equipment",select:"id,code,name",identifier:"code",name:"name"},lot:{table:"lots",select:"id,internal_lot",identifier:"internal_lot"},build:{table:"device_builds",select:"id,code,name",identifier:"code",name:"name"},evidence_packet:{table:"evidence_packets",select:"id,packet_number",identifier:"packet_number"},
};
export const operationsReady=cache(async (identity:WorkspaceIdentity):Promise<boolean>=>{
 if(identity.demo)return true;
 const result=await (await createClient()).from("medical_operations_definitions").select("key").eq("version",1).limit(100);
 if(result.error){if(["PGRST205","42P01"].includes(result.error.code))return false;throw Error("Operations availability could not be checked.");}
 const keys=new Set(result.data.map(row=>row.key));return workflows.every(workflow=>keys.has(workflow.key));
});
function mapCase(row:Record<string,unknown>):OperationsCase {
 return {id:String(row.id),organizationId:String(row.organization_id),workflowKey:String(row.workflow_key),title:String(row.title),state:row.state as OperationsCase["state"],priority:row.priority as OperationsCase["priority"],ownerLabel:String(row.owner_label),dueDate:row.due_date?String(row.due_date):undefined,parentId:row.parent_id?String(row.parent_id):undefined,fields:(row.fields??{}) as Record<string,string>,evidence:(row.evidence_refs??[]) as CaseEvidence[],revision:Number(row.revision),createdBy:String(row.created_by),lastEditedBy:String(row.last_edited_by??row.created_by),updatedAt:String(row.updated_at),decisionNote:String(row.decision_note)};
}
export async function listOperationsCases(identity:WorkspaceIdentity):Promise<OperationsCase[]> {
 if(identity.demo)return [{id:"demo-complaint",organizationId:identity.organizationId,workflowKey:"complaint",title:"Investigate intermittent cartridge leakage",state:"active",priority:"high",ownerLabel:"Quality lead",fields:{applicability:"Fictional example of a complaint investigation."},evidence:[],revision:1,createdBy:"demo-author",lastEditedBy:"demo-author",updatedAt:"2026-11-17T12:00:00Z",decisionNote:"Fictional demo record"}];
 if(!await operationsReady(identity))return [];
 const result=await (await createClient()).from("medical_operations_cases").select("id,organization_id,workflow_key,title,state,priority,owner_label,due_date,parent_id,revision,created_by,last_edited_by,updated_at,decision_note").eq("organization_id",identity.organizationId).order("updated_at",{ascending:false}).limit(500);
 if(result.error)throw Error("Medical-device operations records could not be loaded.");
 return result.data.map(row=>mapCase(row as Record<string,unknown>));
}
export async function getOperationsCase(identity:WorkspaceIdentity,id:string):Promise<OperationsCase|null> {
 if(identity.demo)return (await listOperationsCases(identity)).find(c=>c.id===id)??null;
 if(!await operationsReady(identity))return null;
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return null;
 const result=await (await createClient()).from("medical_operations_cases").select("*").eq("organization_id",identity.organizationId).eq("id",id).maybeSingle();
 if(result.error)throw Error("Operations record could not be loaded.");
 return result.data?mapCase(result.data as Record<string,unknown>):null;
}
export async function listCaseEvents(identity:WorkspaceIdentity,id:string):Promise<CaseEvent[]> {
 if(identity.demo)return [];
 const result=await (await createClient()).from("medical_operations_events").select("id,revision,actor_id,occurred_at,snapshot").eq("organization_id",identity.organizationId).eq("case_id",id).order("revision",{ascending:false}).limit(200);
 if(result.error)throw Error("Record history could not be loaded.");
 return result.data.map(row=>({id:row.id,revision:row.revision,actorId:row.actor_id,occurredAt:row.occurred_at,snapshot:row.snapshot}));
}
export async function evidenceOptions(identity:WorkspaceIdentity,kind:EvidenceKind):Promise<CaseEvidence[]> {
 if(identity.demo)return [];
 const definition=evidenceTables[kind];
 let query=(await createClient()).from(definition.table).select(definition.select).eq("organization_id",identity.organizationId);
 if(!["lot","evidence_packet"].includes(kind))query=query.is("deleted_at",null);
 const result=await query.limit(250);
 if(result.error)throw Error("Evidence records could not be loaded.");
 return (result.data as unknown as Record<string,unknown>[]).map(row=>({kind,id:String(row.id),label:[row[definition.identifier],definition.name?row[definition.name]:null].filter(Boolean).join(" · ").slice(0,240)}));
}
export async function verifyCaseEvidence(identity:WorkspaceIdentity,evidence:CaseEvidence[]) {
 const db=await createClient();
 for(const ref of evidence){
  const definition=evidenceTables[ref.kind];
  let query=db.from(definition.table).select(definition.select).eq("organization_id",identity.organizationId).eq("id",ref.id);
  if(!["lot","evidence_packet"].includes(ref.kind))query=query.is("deleted_at",null);
  const result=await query.maybeSingle();
  if(result.error||!result.data)throw Error("An evidence record is unavailable in this organization.");
  const row=result.data as unknown as Record<string,unknown>;
  ref.label=[row[definition.identifier],definition.name?row[definition.name]:null].filter(Boolean).join(" · ").slice(0,240);
 }
 return evidence;
}

export async function registrySignals(identity:WorkspaceIdentity,area:string):Promise<{label:string;count:number;href:string}[]> {
 const catalog:Record<string,{label:string;table:string;href:string;filter?:[string,string]}[]>={
  "quality-management":[{label:"Controlled document records",table:"quality_documents",href:"/app/dockets"},{label:"Approved quality documents",table:"quality_documents",href:"/app/dockets",filter:["status","approved"]}],
  suppliers:[{label:"Supplier records",table:"suppliers",href:"/app/suppliers"},{label:"High-risk suppliers",table:"suppliers",href:"/app/suppliers",filter:["risk","high"]},{label:"Approved suppliers",table:"suppliers",href:"/app/suppliers",filter:["status","approved"]}],
  "production-release":[{label:"Device build records",table:"device_builds",href:"/app/builds"},{label:"Available builds",table:"device_builds",href:"/app/builds",filter:["status","available"]},{label:"Inspection records",table:"inspections",href:"/app/inspections"}],
  reporting:[{label:"Engineering report records",table:"reports",href:"/app/reports"},{label:"Engineering reports awaiting review",table:"reports",href:"/app/reports",filter:["status","ready_for_review"]}],
  traceability:[{label:"Material lot records",table:"lots",href:"/app/lots"},{label:"Build material links",table:"device_build_items",href:"/app/builds"},{label:"Shipment records",table:"shipments",href:"/app/lots"}],
  training:[{label:"Protocol records",table:"protocols",href:"/app/protocols"},{label:"Approved quality documents",table:"quality_documents",href:"/app/dockets",filter:["status","approved"]}],
 };
 if(identity.demo)return [];
 const db=await createClient();
 return Promise.all((catalog[area]??[]).map(async spec=>{
  let query=db.from(spec.table).select("id",{count:"exact",head:true}).eq("organization_id",identity.organizationId);
  if(spec.filter)query=query.eq(spec.filter[0],spec.filter[1]);
  const result=await query;if(result.error)throw Error("Connected registry counts could not be loaded.");
  return {label:spec.label,count:result.count??0,href:spec.href};
 }));
}
