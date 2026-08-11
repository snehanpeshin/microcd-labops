"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireWorkspaceIdentity } from "@/lib/auth";
import { can, type Permission } from "@/lib/security/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { canTransitionExperiment, signedInventoryDelta } from "@/lib/lab-workflows";

function textField(data: FormData, name: string) { return String(data.get(name) ?? "").trim(); }
function optionalUuid(value?: string) { return value || null; }
function optionalDate(value?: string) { return value || null; }
function tags(value: string) { return value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 20); }
function generatedCode(prefix: "EXP" | "SMP") { return `${prefix}-${new Date().getUTCFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`; }

async function context(permission: Permission) {
  const identity = await requireWorkspaceIdentity();
  if (identity.demo) throw new Error("Demo records are read-only. Configure Supabase to persist laboratory records.");
  if (!can(identity.role, permission)) throw new Error("You do not have permission to perform this action.");
  return { identity, supabase: await createClient() };
}

async function recordActivity(organizationId: string, userId: string, action: string, recordType: string, recordId: string, summary: string) {
  const { error } = await createAdminClient().from("activity_log").insert({ organization_id:organizationId, actor_id:userId, action, record_type:recordType, record_id:recordId, summary });
  if (error) throw new Error("The record was saved, but its audit entry failed. Contact support.");
}

async function verifyReference(table: "projects" | "experiments" | "samples" | "protocol_versions" | "inventory_items" | "equipment" | "lab_tasks", id: string, organizationId: string) {
  const { data, error } = await createAdminClient().from(table).select("id").eq("id", id).eq("organization_id", organizationId).maybeSingle();
  if (error || !data) throw new Error("A referenced record was not found in this workspace.");
}

const experimentSchema = z.object({
  title:z.string().min(3).max(180), projectId:z.string().uuid(), objective:z.string().min(10).max(8000), type:z.string().min(2).max(100),
  protocolVersionId:z.string().uuid().optional().or(z.literal("")), startDate:z.string().date().optional().or(z.literal("")),
  priority:z.enum(["low","medium","high","critical"]), notes:z.string().max(8000), tags:z.string().max(500),
});

export async function createExperiment(formData: FormData) {
  const { identity, supabase } = await context("lab:write");
  const input = experimentSchema.parse({ title:textField(formData,"title"), projectId:textField(formData,"projectId"), objective:textField(formData,"objective"), type:textField(formData,"type"), protocolVersionId:textField(formData,"protocolVersionId"), startDate:textField(formData,"startDate"), priority:textField(formData,"priority"), notes:textField(formData,"notes"), tags:textField(formData,"tags") });
  await verifyReference("projects", input.projectId, identity.organizationId);
  if (input.protocolVersionId) await verifyReference("protocol_versions", input.protocolVersionId, identity.organizationId);
  const code = generatedCode("EXP");
  const { data, error } = await supabase.from("experiments").insert({ organization_id:identity.organizationId, code, title:input.title, project_id:input.projectId, objective:input.objective, owner_id:identity.userId, experiment_type:input.type, protocol_version_id:optionalUuid(input.protocolVersionId), start_date:optionalDate(input.startDate), status:input.startDate ? "planned" : "draft", priority:input.priority, notes:input.notes, tags:tags(input.tags), created_by:identity.userId }).select("id").single();
  if (error) throw new Error("Experiment could not be created. Try again; generated identifiers must be unique.");
  await recordActivity(identity.organizationId, identity.userId, "experiment_created", "Experiment", data.id, `${code} created`);
  revalidatePath("/app"); revalidatePath("/app/experiments"); redirect(`/app/experiments/${data.id}`);
}

export async function transitionExperiment(formData: FormData) {
  const { identity } = await context("records:read");
  const input = z.object({ experimentId:z.string().uuid(), status:z.enum(["draft","planned","ready","running","paused","completed","failed","cancelled","under_review","approved"]), note:z.string().max(2000) }).parse({ experimentId:textField(formData,"experimentId"), status:textField(formData,"status"), note:textField(formData,"note") });
  const admin = createAdminClient();
  const { data:current, error:loadError } = await admin.from("experiments").select("id,code,status").eq("id",input.experimentId).eq("organization_id",identity.organizationId).is("deleted_at",null).maybeSingle();
  if (loadError || !current) throw new Error("Experiment not found.");
  if (!canTransitionExperiment(current.status,input.status)) throw new Error(`Experiment cannot transition from ${current.status} to ${input.status}.`);
  const permission = input.status === "approved" ? "lab:review" : "lab:write";
  if (!can(identity.role,permission)) throw new Error(input.status === "approved" ? "Only reviewers, administrators, and owners can approve experiments." : "You do not have permission to change this experiment.");
  const completionDate = ["completed","failed"].includes(input.status) ? new Date().toISOString().slice(0,10) : null;
  const { error } = await admin.from("experiments").update({ status:input.status, completion_date:completionDate, updated_at:new Date().toISOString() }).eq("id",input.experimentId).eq("organization_id",identity.organizationId);
  if (error) throw new Error("Experiment status could not be updated.");
  await recordActivity(identity.organizationId,identity.userId,"experiment_status_changed","Experiment",input.experimentId,`${current.code}: ${current.status} → ${input.status}${input.note ? ` · ${input.note}` : ""}`);
  revalidatePath("/app"); revalidatePath("/app/experiments"); revalidatePath(`/app/experiments/${input.experimentId}`);
}

const sampleSchema = z.object({
  name:z.string().min(2).max(180), type:z.string().min(2).max(100), source:z.string().max(300), projectId:z.string().uuid().optional().or(z.literal("")), experimentId:z.string().uuid().optional().or(z.literal("")), parentSampleId:z.string().uuid().optional().or(z.literal("")), preparationDate:z.string().date().optional().or(z.literal("")), quantity:z.coerce.number().nonnegative().optional(), concentration:z.coerce.number().nonnegative().optional(), unit:z.string().max(30), storageLocation:z.string().max(180), freezer:z.string().max(80), rack:z.string().max(80), box:z.string().max(80), position:z.string().max(80), expirationDate:z.string().date().optional().or(z.literal("")), barcode:z.string().max(120), notes:z.string().max(4000),
});

export async function createSample(formData: FormData) {
  const { identity, supabase } = await context("lab:write");
  const input = sampleSchema.parse({ name:textField(formData,"name"), type:textField(formData,"type"), source:textField(formData,"source"), projectId:textField(formData,"projectId"), experimentId:textField(formData,"experimentId"), parentSampleId:textField(formData,"parentSampleId"), preparationDate:textField(formData,"preparationDate"), quantity:textField(formData,"quantity") || undefined, concentration:textField(formData,"concentration") || undefined, unit:textField(formData,"unit"), storageLocation:textField(formData,"storageLocation"), freezer:textField(formData,"freezer"), rack:textField(formData,"rack"), box:textField(formData,"box"), position:textField(formData,"position"), expirationDate:textField(formData,"expirationDate"), barcode:textField(formData,"barcode"), notes:textField(formData,"notes") });
  await Promise.all([input.projectId ? verifyReference("projects",input.projectId,identity.organizationId) : null, input.experimentId ? verifyReference("experiments",input.experimentId,identity.organizationId) : null, input.parentSampleId ? verifyReference("samples",input.parentSampleId,identity.organizationId) : null]);
  const code = generatedCode("SMP");
  const { data,error } = await supabase.from("samples").insert({ organization_id:identity.organizationId, code, name:input.name, sample_type:input.type, source:input.source, project_id:optionalUuid(input.projectId), experiment_id:optionalUuid(input.experimentId), parent_sample_id:optionalUuid(input.parentSampleId), preparation_date:optionalDate(input.preparationDate), owner_id:identity.userId, quantity:input.quantity ?? null, concentration:input.concentration ?? null, unit:input.unit, storage_location:input.storageLocation, freezer:input.freezer, rack:input.rack, box:input.box, position:input.position, status:"available", expiration_date:optionalDate(input.expirationDate), barcode:input.barcode || null, notes:input.notes, created_by:identity.userId }).select("id").single();
  if (error) throw new Error("Sample could not be created. Verify its barcode is unique.");
  await recordActivity(identity.organizationId,identity.userId,"sample_created","Sample",data.id,`${code} created`);
  revalidatePath("/app/samples"); redirect(`/app/samples/${data.id}`);
}

export async function moveSample(formData: FormData) {
  const { identity, supabase } = await context("lab:write");
  const input = z.object({ sampleId:z.string().uuid(), storageLocation:z.string().min(2).max(180), freezer:z.string().max(80), rack:z.string().max(80), box:z.string().max(80), position:z.string().max(80), status:z.enum(["available","reserved","in_use","consumed","disposed","expired"]) }).parse({ sampleId:textField(formData,"sampleId"), storageLocation:textField(formData,"storageLocation"), freezer:textField(formData,"freezer"), rack:textField(formData,"rack"), box:textField(formData,"box"), position:textField(formData,"position"), status:textField(formData,"status") });
  const admin=createAdminClient(); const {data:previous,error:loadError}=await admin.from("samples").select("id,code,storage_location,freezer,rack,box,position,status").eq("id",input.sampleId).eq("organization_id",identity.organizationId).maybeSingle();
  if(loadError||!previous) throw new Error("Sample not found.");
  const {error}=await supabase.from("samples").update({storage_location:input.storageLocation,freezer:input.freezer,rack:input.rack,box:input.box,position:input.position,status:input.status,updated_at:new Date().toISOString()}).eq("id",input.sampleId).eq("organization_id",identity.organizationId);
  if(error) throw new Error("Sample location could not be updated.");
  await recordActivity(identity.organizationId,identity.userId,"sample_moved","Sample",input.sampleId,`${previous.code}: ${previous.storage_location} → ${input.storageLocation}; ${previous.status} → ${input.status}`);
  revalidatePath("/app/samples"); revalidatePath(`/app/samples/${input.sampleId}`);
}

export async function createInventoryItem(formData: FormData) {
  const { identity, supabase } = await context("lab:write");
  const input = z.object({ code:z.string().min(2).max(40), name:z.string().min(2).max(180), type:z.enum(["reagent","chemical","consumable","kit","disposable"]), manufacturer:z.string().max(160), catalogNumber:z.string().max(120), lotNumber:z.string().max(120), quantity:z.coerce.number().nonnegative(), unit:z.string().min(1).max(30), minimumStock:z.coerce.number().nonnegative(), storageLocation:z.string().max(180), receivedDate:z.string().date().optional().or(z.literal("")), expirationDate:z.string().date().optional().or(z.literal("")), notes:z.string().max(4000) }).parse({ code:textField(formData,"code"), name:textField(formData,"name"), type:textField(formData,"type"), manufacturer:textField(formData,"manufacturer"), catalogNumber:textField(formData,"catalogNumber"), lotNumber:textField(formData,"lotNumber"), quantity:textField(formData,"quantity"), unit:textField(formData,"unit"), minimumStock:textField(formData,"minimumStock"), storageLocation:textField(formData,"storageLocation"), receivedDate:textField(formData,"receivedDate"), expirationDate:textField(formData,"expirationDate"), notes:textField(formData,"notes") });
  const {data,error}=await supabase.from("inventory_items").insert({organization_id:identity.organizationId,code:input.code,name:input.name,item_type:input.type,manufacturer:input.manufacturer,catalog_number:input.catalogNumber,lot_number:input.lotNumber,quantity:0,unit:input.unit,minimum_stock:input.minimumStock,storage_location:input.storageLocation,received_date:optionalDate(input.receivedDate),expiration_date:optionalDate(input.expirationDate),owner_id:identity.userId,notes:input.notes,created_by:identity.userId}).select("id").single();
  if(error) throw new Error("Inventory item could not be created.");
  if(input.quantity>0){const receipt=await supabase.rpc("adjust_inventory",{target_item_id:data.id,amount:input.quantity,adjustment_type:"receipt",adjustment_reason:"Initial inventory balance",related_experiment_id:null});if(receipt.error){await createAdminClient().from("inventory_items").delete().eq("id",data.id).eq("organization_id",identity.organizationId);throw new Error("Initial inventory receipt could not be recorded.");}}
  await recordActivity(identity.organizationId,identity.userId,"inventory_item_created","Inventory item",data.id,`${input.code} created`);
  revalidatePath("/app"); revalidatePath("/app/inventory"); redirect("/app/inventory");
}

export async function adjustInventory(formData: FormData) {
  const { supabase } = await context("lab:write");
  const input=z.object({itemId:z.string().uuid(),type:z.enum(["receipt","use","adjustment","disposal","transfer"]),amount:z.coerce.number().refine((value)=>value!==0),reason:z.string().min(3).max(1000),experimentId:z.string().uuid().optional().or(z.literal(""))}).parse({itemId:textField(formData,"itemId"),type:textField(formData,"type"),amount:textField(formData,"amount"),reason:textField(formData,"reason"),experimentId:textField(formData,"experimentId")});
  const signedAmount=signedInventoryDelta(input.type,input.amount);
  const {error}=await supabase.rpc("adjust_inventory",{target_item_id:input.itemId,amount:signedAmount,adjustment_type:input.type,adjustment_reason:input.reason,related_experiment_id:optionalUuid(input.experimentId)});
  if(error) throw new Error(error.message.includes("Insufficient")?"The adjustment would make inventory negative.":"Inventory adjustment could not be recorded.");
  revalidatePath("/app"); revalidatePath("/app/inventory");
}

export async function createEquipment(formData: FormData) {
  const {identity,supabase}=await context("lab:write");
  const input=z.object({code:z.string().min(2).max(40),name:z.string().min(2).max(180),category:z.string().max(100),manufacturer:z.string().max(160),model:z.string().max(120),serialNumber:z.string().max(120),location:z.string().max(160),status:z.enum(["available","in_use","maintenance","calibration_required","out_of_service","retired"]),nextMaintenance:z.string().date().optional().or(z.literal("")),nextCalibration:z.string().date().optional().or(z.literal("")),notes:z.string().max(4000)}).parse({code:textField(formData,"code"),name:textField(formData,"name"),category:textField(formData,"category"),manufacturer:textField(formData,"manufacturer"),model:textField(formData,"model"),serialNumber:textField(formData,"serialNumber"),location:textField(formData,"location"),status:textField(formData,"status"),nextMaintenance:textField(formData,"nextMaintenance"),nextCalibration:textField(formData,"nextCalibration"),notes:textField(formData,"notes")});
  const {data,error}=await supabase.from("equipment").insert({organization_id:identity.organizationId,code:input.code,name:input.name,category:input.category,manufacturer:input.manufacturer,model:input.model,serial_number:input.serialNumber,location:input.location,status:input.status,owner_id:identity.userId,next_maintenance:optionalDate(input.nextMaintenance),next_calibration:optionalDate(input.nextCalibration),notes:input.notes,created_by:identity.userId}).select("id").single();
  if(error) throw new Error("Equipment could not be created.");
  await recordActivity(identity.organizationId,identity.userId,"equipment_created","Equipment",data.id,`${input.code} created`);revalidatePath("/app/equipment");redirect("/app/equipment");
}

export async function recordEquipmentEvent(formData:FormData){
 const {identity}=await context("lab:write");const input=z.object({equipmentId:z.string().uuid(),eventType:z.enum(["maintenance","calibration","status_change","inspection","note"]),newStatus:z.enum(["available","in_use","maintenance","calibration_required","out_of_service","retired"]),summary:z.string().min(3).max(2000),performedAt:z.string().datetime({local:true}).optional().or(z.literal("")),nextDueDate:z.string().date().optional().or(z.literal(""))}).parse({equipmentId:textField(formData,"equipmentId"),eventType:textField(formData,"eventType"),newStatus:textField(formData,"newStatus"),summary:textField(formData,"summary"),performedAt:textField(formData,"performedAt"),nextDueDate:textField(formData,"nextDueDate")});
 const admin=createAdminClient();const current=await admin.from("equipment").select("id,code,status").eq("id",input.equipmentId).eq("organization_id",identity.organizationId).is("deleted_at",null).maybeSingle();if(current.error||!current.data)throw new Error("Equipment not found.");
 const event=await admin.from("equipment_events").insert({organization_id:identity.organizationId,equipment_id:input.equipmentId,event_type:input.eventType,performed_at:input.performedAt||new Date().toISOString(),performed_by:identity.userId,previous_status:current.data.status,new_status:input.newStatus,summary:input.summary,next_due_date:optionalDate(input.nextDueDate)});if(event.error)throw new Error("Equipment history could not be recorded.");
 const dates=input.eventType==="maintenance"?{last_maintenance:new Date().toISOString().slice(0,10),next_maintenance:optionalDate(input.nextDueDate)}:input.eventType==="calibration"?{last_calibration:new Date().toISOString().slice(0,10),next_calibration:optionalDate(input.nextDueDate)}:{};
 const updated=await admin.from("equipment").update({status:input.newStatus,...dates,updated_at:new Date().toISOString()}).eq("id",input.equipmentId).eq("organization_id",identity.organizationId);if(updated.error)throw new Error("The history event was saved, but equipment status did not update.");
 await recordActivity(identity.organizationId,identity.userId,"equipment_status_changed","Equipment",input.equipmentId,`${current.data.code}: ${current.data.status} → ${input.newStatus}; ${input.summary}`);revalidatePath("/app");revalidatePath("/app/equipment");revalidatePath(`/app/equipment/${input.equipmentId}`);
}

export async function createProtocol(formData: FormData) {
  const {identity,supabase}=await context("lab:write");
  const input=z.object({code:z.string().min(2).max(40),name:z.string().min(3).max(180),description:z.string().max(4000),steps:z.string().min(10).max(20000),materials:z.string().max(8000),equipment:z.string().max(8000),notes:z.string().max(4000)}).parse({code:textField(formData,"code"),name:textField(formData,"name"),description:textField(formData,"description"),steps:textField(formData,"steps"),materials:textField(formData,"materials"),equipment:textField(formData,"equipment"),notes:textField(formData,"notes")});
  const {data,error}=await supabase.from("protocols").insert({organization_id:identity.organizationId,code:input.code,name:input.name,description:input.description,owner_id:identity.userId,status:"draft",created_by:identity.userId}).select("id").single();if(error)throw new Error("Protocol could not be created.");
  const version=await supabase.from("protocol_versions").insert({organization_id:identity.organizationId,protocol_id:data.id,version:1,title:input.name,steps:input.steps,materials:input.materials,equipment:input.equipment,notes:input.notes,status:"draft",authored_by:identity.userId});
  if(version.error){await createAdminClient().from("protocols").delete().eq("id",data.id).eq("organization_id",identity.organizationId);throw new Error("Protocol version could not be created.");}
  await recordActivity(identity.organizationId,identity.userId,"protocol_created","Protocol",data.id,`${input.code} version 1 created`);revalidatePath("/app/protocols");redirect("/app/protocols");
}

export async function createProtocolVersion(formData:FormData){
 const {identity,supabase}=await context("lab:write");const input=z.object({protocolId:z.string().uuid(),title:z.string().min(3).max(180),steps:z.string().min(10).max(20000),materials:z.string().max(8000),equipment:z.string().max(8000),notes:z.string().max(4000)}).parse({protocolId:textField(formData,"protocolId"),title:textField(formData,"title"),steps:textField(formData,"steps"),materials:textField(formData,"materials"),equipment:textField(formData,"equipment"),notes:textField(formData,"notes")});
 const admin=createAdminClient();const protocol=await admin.from("protocols").select("id,code").eq("id",input.protocolId).eq("organization_id",identity.organizationId).is("deleted_at",null).maybeSingle();if(protocol.error||!protocol.data)throw new Error("Protocol not found.");const latest=await admin.from("protocol_versions").select("version").eq("protocol_id",input.protocolId).eq("organization_id",identity.organizationId).order("version",{ascending:false}).limit(1).maybeSingle();if(latest.error)throw new Error("Protocol history could not be loaded.");const version=(latest.data?.version??0)+1;
 const created=await supabase.from("protocol_versions").insert({organization_id:identity.organizationId,protocol_id:input.protocolId,version,title:input.title,steps:input.steps,materials:input.materials,equipment:input.equipment,notes:input.notes,status:"draft",authored_by:identity.userId}).select("id").single();if(created.error)throw new Error("Protocol revision could not be created.");await recordActivity(identity.organizationId,identity.userId,"protocol_revised","Protocol",input.protocolId,`${protocol.data.code} version ${version} created`);revalidatePath("/app/protocols");redirect("/app/protocols");
}

export async function approveProtocolVersion(formData:FormData){
 const {identity}=await context("lab:review");const input=z.object({protocolId:z.string().uuid(),versionId:z.string().uuid()}).parse({protocolId:textField(formData,"protocolId"),versionId:textField(formData,"versionId")});const admin=createAdminClient();const current=await admin.from("protocol_versions").select("id,version,status,protocol_id").eq("id",input.versionId).eq("protocol_id",input.protocolId).eq("organization_id",identity.organizationId).maybeSingle();if(current.error||!current.data)throw new Error("Protocol version not found.");if(current.data.status!=="draft")throw new Error("Only a draft protocol version can be approved.");
 const superseded=await admin.from("protocol_versions").update({status:"superseded"}).eq("protocol_id",input.protocolId).eq("organization_id",identity.organizationId).eq("status","approved");if(superseded.error)throw new Error("Prior protocol version could not be superseded.");const approved=await admin.from("protocol_versions").update({status:"approved",approved_by:identity.userId,approved_at:new Date().toISOString()}).eq("id",input.versionId).eq("organization_id",identity.organizationId);if(approved.error)throw new Error("Protocol version could not be approved.");await admin.from("protocols").update({status:"active",updated_at:new Date().toISOString()}).eq("id",input.protocolId).eq("organization_id",identity.organizationId);await recordActivity(identity.organizationId,identity.userId,"protocol_approved","Protocol",input.protocolId,`Protocol version ${current.data.version} approved`);revalidatePath("/app/protocols");
}

export async function createLabTask(formData: FormData) {
  const {identity,supabase}=await context("lab:write");
  const input=z.object({title:z.string().min(3).max(180),description:z.string().max(4000),projectId:z.string().uuid().optional().or(z.literal("")),experimentId:z.string().uuid().optional().or(z.literal("")),dueDate:z.string().date().optional().or(z.literal("")),priority:z.enum(["low","medium","high","critical"]),notes:z.string().max(4000)}).parse({title:textField(formData,"title"),description:textField(formData,"description"),projectId:textField(formData,"projectId"),experimentId:textField(formData,"experimentId"),dueDate:textField(formData,"dueDate"),priority:textField(formData,"priority"),notes:textField(formData,"notes")});
  await Promise.all([input.projectId?verifyReference("projects",input.projectId,identity.organizationId):null,input.experimentId?verifyReference("experiments",input.experimentId,identity.organizationId):null]);
  const {data,error}=await supabase.from("lab_tasks").insert({organization_id:identity.organizationId,title:input.title,description:input.description,assigned_to:identity.userId,project_id:optionalUuid(input.projectId),experiment_id:optionalUuid(input.experimentId),due_date:optionalDate(input.dueDate),priority:input.priority,status:"to_do",notes:input.notes,created_by:identity.userId}).select("id").single();if(error)throw new Error("Task could not be created.");
  await recordActivity(identity.organizationId,identity.userId,"task_created","Task",data.id,input.title);revalidatePath("/app");revalidatePath("/app/tasks");redirect("/app/tasks");
}

export async function updateLabTaskStatus(formData: FormData) {
  const {identity,supabase}=await context("lab:write");const input=z.object({taskId:z.string().uuid(),status:z.enum(["to_do","in_progress","blocked","completed"])}).parse({taskId:textField(formData,"taskId"),status:textField(formData,"status")});
  const {error}=await supabase.from("lab_tasks").update({status:input.status,completed_at:input.status==="completed"?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq("id",input.taskId).eq("organization_id",identity.organizationId);if(error)throw new Error("Task status could not be updated.");
  await recordActivity(identity.organizationId,identity.userId,"task_status_changed","Task",input.taskId,`Task status changed to ${input.status}`);revalidatePath("/app");revalidatePath("/app/tasks");
}
