"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireWorkspaceIdentity } from "@/lib/auth";
import { can } from "@/lib/security/permissions";
import { createClient } from "@/lib/supabase/server";
import { evidenceOptions, getOperationsCase, operationsReady, verifyCaseEvidence } from "@/lib/data/medical-operations";
import { caseInputSchema, evidenceKinds, evidenceSchema, transitionAllowed, validateFields, workflowFor, type CaseState } from "@/lib/medical-operations/workflows";
import type { OperationsActionState } from "@/components/medical-operations/action-form";
const text=(form:FormData,key:string)=>String(form.get(key)??"").trim();
const failure=(error:unknown):OperationsActionState=>({error:error instanceof z.ZodError?error.issues.map(i=>`${i.path.join(" ")}: ${i.message}`).join("; "):error instanceof Error?error.message:"The record could not be saved."});
async function context(){const identity=await requireWorkspaceIdentity();if(identity.demo)throw Error("Demo records are read-only.");if(!await operationsReady(identity))throw Error("Operations records are awaiting workspace activation.");return {identity,db:await createClient()};}
function refresh(id:string){revalidatePath("/app/operations","layout");revalidatePath(`/app/operations/${id}`);revalidatePath("/app/attention");revalidatePath("/app");}
export async function createOperationsCase(_previous:OperationsActionState,form:FormData):Promise<OperationsActionState>{
 let id:string;
 try{
  const {identity,db}=await context();if(!can(identity.role,"lab:write"))throw Error("You do not have permission to create operations records.");
  const workflow=workflowFor(text(form,"workflowKey"));if(!workflow)throw Error("Select an available workflow.");
  const input=caseInputSchema.parse(Object.fromEntries(["title","ownerLabel","priority","dueDate","parentId"].map(k=>[k,text(form,k)])));
  if(input.parentId&&!await getOperationsCase(identity,input.parentId))throw Error("The origin record is not available in this workspace.");
  const {data,error}=await db.from("medical_operations_cases").insert({organization_id:identity.organizationId,workflow_key:workflow.key,workflow_version:workflow.version,title:input.title,owner_label:input.ownerLabel,priority:input.priority,due_date:input.dueDate||null,parent_id:input.parentId||null,created_by:identity.userId,last_edited_by:identity.userId,fields:{},evidence_refs:[],decision_note:"Operations record created"}).select("id").single();
  if(error||!data)throw Error("The operations record could not be created. Check access and try again.");id=data.id;
 }catch(error){return failure(error);}
 refresh(id);redirect(`/app/operations/${id}`);
}
export async function updateOperationsCase(_previous:OperationsActionState,form:FormData):Promise<OperationsActionState>{
 let id:string;
 try{
  const {identity,db}=await context();id=z.string().uuid().parse(text(form,"caseId"));const revision=z.coerce.number().int().positive().parse(text(form,"revision"));
  const current=await getOperationsCase(identity,id);if(!current)throw Error("Record not found.");if(current.revision!==revision)throw Error("This record has changed. Reload before saving your edits.");
  const workflow=workflowFor(current.workflowKey);if(!workflow)throw Error("The workflow is not available.");
  const intent=z.enum(["save","submit","approve","changes","link","unlink"]).parse(text(form,"intent"));
  const reviewing=intent==="approve"||intent==="changes";
  if(!can(identity.role,reviewing?"lab:review":"lab:write"))throw Error("Your role does not permit this action.");
  const next:CaseState=reviewing?(intent==="approve"?"closed":"changes_requested"):intent==="submit"?"in_review":"active";
  if(!transitionAllowed(current.state,next,can(identity.role,"lab:review"),current.createdBy,identity.userId)||reviewing&&current.lastEditedBy===identity.userId)throw Error("This action requires an allowed transition and an independent reviewer.");
  let metadata={title:current.title,owner_label:current.ownerLabel,priority:current.priority,due_date:current.dueDate??null};
  let fields=current.fields,evidence=[...current.evidence],note=text(form,"decisionNote");
  if(intent==="save"||intent==="submit"){
   const parsed=caseInputSchema.parse({title:text(form,"title"),ownerLabel:text(form,"ownerLabel"),priority:text(form,"priority"),dueDate:text(form,"dueDate"),parentId:current.parentId??""});
   metadata={title:parsed.title,owner_label:parsed.ownerLabel,priority:parsed.priority,due_date:parsed.dueDate||null};
   fields=validateFields(workflow,Object.fromEntries(workflow.fields.map(f=>[f.key,text(form,`field_${f.key}`)])),intent==="submit").fields;
  }
  if(intent==="link"){
   const kind=z.enum(evidenceKinds).parse(text(form,"evidenceKind"));const targetId=z.string().uuid().parse(text(form,"evidenceId"));
   const match=(await evidenceOptions(identity,kind)).find(e=>e.id===targetId);if(!match)throw Error("Select a visible evidence record.");
   if(evidence.some(e=>e.kind===kind&&e.id===targetId))throw Error("That evidence is already linked.");evidence.push(match);note=`Evidence linked: ${match.label}`;
  }
  if(intent==="unlink"){evidence=evidence.filter(e=>`${e.kind}:${e.id}`!==text(form,"evidenceKey"));note="Evidence link removed; prior link preserved in record history";}
  evidence=evidenceSchema.parse(evidence);await verifyCaseEvidence(identity,evidence);
  if((next==="in_review"||next==="closed")&&!evidence.length)throw Error("Link supporting evidence before submitting or closing the record.");
  if(next==="closed")validateFields(workflow,fields,true);
  if(next!==current.state&&note.length<10)throw Error("Enter a review or transition rationale of at least 10 characters.");
  const update=reviewing?{state:next,decision_note:note,revision}:{state:next,...metadata,fields,evidence_refs:evidence,decision_note:note||"Working record updated",revision};
  const {data,error}=await db.from("medical_operations_cases").update(update).eq("id",id).eq("organization_id",identity.organizationId).eq("revision",revision).select("id").maybeSingle();
  if(error||!data)throw Error("The record changed or could not be saved. Reload and check the review requirements.");
 }catch(error){return failure(error);}
 refresh(id);redirect(`/app/operations/${id}`);
}
