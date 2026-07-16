"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireWorkspaceIdentity } from "@/lib/auth";
import { can, type Permission } from "@/lib/security/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { evaluateCriterion, summarize } from "@/lib/reports/calculations";

function textField(data: FormData, name: string) { return String(data.get(name) ?? "").trim(); }
async function context(permission: Permission) {
  const identity = await requireWorkspaceIdentity();
  if (identity.demo) throw new Error("Demo records are read-only. Configure Supabase to persist records.");
  if (!can(identity.role, permission)) throw new Error("You do not have permission to perform this action.");
  return { identity, supabase: await createClient() };
}
async function recordActivity(organizationId: string, userId: string, action: string, recordType: string, recordId: string, summary: string) {
  const { error } = await createAdminClient().from("activity_log").insert({ organization_id: organizationId, actor_id: userId, action, record_type: recordType, record_id: recordId, summary });
  if (error) throw new Error("The record was saved, but its audit entry failed. Contact support.");
}
async function verifyReference(table: "projects" | "suppliers" | "components" | "lots" | "inspections" | "reports", id: string, organizationId: string) {
  const { data, error } = await createAdminClient().from(table).select("id").eq("id", id).eq("organization_id", organizationId).maybeSingle();
  if (error || !data) throw new Error("A referenced record was not found in this workspace.");
}

const projectSchema = z.object({ code: z.string().min(2).max(30), name: z.string().min(3).max(160), product: z.string().min(2).max(160), description: z.string().max(4000), targetDate: z.string().date().optional().or(z.literal("")) });
export async function createProject(formData: FormData) {
  const { identity, supabase } = await context("projects:write");
  const input = projectSchema.parse({ code: textField(formData,"code"), name: textField(formData,"name"), product: textField(formData,"product"), description: textField(formData,"description"), targetDate: textField(formData,"targetDate") });
  const { data, error } = await supabase.from("projects").insert({ organization_id: identity.organizationId, code: input.code, name: input.name, product: input.product, description: input.description, target_date: input.targetDate || null, owner_id: identity.userId, created_by: identity.userId, status: "planning" }).select("id").single();
  if (error) throw new Error("Project could not be created.");
  await recordActivity(identity.organizationId, identity.userId, "project_created", "Project", data.id, `Project ${input.code} created`);
  revalidatePath("/app/projects"); redirect("/app/projects");
}

const supplierSchema = z.object({ code: z.string().min(2).max(30), name: z.string().min(2).max(180), supplierType: z.string().min(2).max(100), country: z.string().min(2).max(100), risk: z.enum(["low","medium","high"]) });
export async function createSupplier(formData: FormData) {
  const { identity, supabase } = await context("suppliers:write");
  const input = supplierSchema.parse({ code: textField(formData,"code"), name: textField(formData,"name"), supplierType: textField(formData,"supplierType"), country: textField(formData,"country"), risk: textField(formData,"risk") });
  const { data, error } = await supabase.from("suppliers").insert({ organization_id: identity.organizationId, code: input.code, name: input.name, supplier_type: input.supplierType, country: input.country, risk: input.risk, owner_id: identity.userId, created_by: identity.userId, status: "prospective" }).select("id").single();
  if (error) throw new Error("Supplier could not be created.");
  await recordActivity(identity.organizationId, identity.userId, "supplier_created", "Supplier", data.id, `Supplier ${input.code} created`);
  revalidatePath("/app/suppliers"); redirect(`/app/suppliers/${data.id}`);
}

const componentSchema = z.object({ partNumber: z.string().min(2).max(80), name: z.string().min(2).max(180), category: z.string().max(100), material: z.string().max(100), revision: z.string().min(1).max(20), risk: z.enum(["low","medium","high"]), supplierId: z.string().uuid().optional().or(z.literal("")), supplierPartNumber: z.string().max(100) });
export async function createComponent(formData: FormData) {
  const { identity, supabase } = await context("suppliers:write");
  const input = componentSchema.parse({ partNumber: textField(formData,"partNumber"), name: textField(formData,"name"), category: textField(formData,"category"), material: textField(formData,"material"), revision: textField(formData,"revision"), risk: textField(formData,"risk"), supplierId: textField(formData,"supplierId"), supplierPartNumber: textField(formData,"supplierPartNumber") });
  if (input.supplierId) await verifyReference("suppliers", input.supplierId, identity.organizationId);
  const { data, error } = await supabase.from("components").insert({ organization_id: identity.organizationId, part_number: input.partNumber, name: input.name, category: input.category, material: input.material, revision: input.revision, risk: input.risk }).select("id").single();
  if (error) throw new Error("Component could not be created.");
  if (input.supplierId) { const link = await supabase.from("supplier_components").insert({ organization_id: identity.organizationId, supplier_id: input.supplierId, component_id: data.id, supplier_part_number: input.supplierPartNumber, approved: false }); if (link.error) throw new Error("Component was created, but the supplier link failed."); }
  await recordActivity(identity.organizationId, identity.userId, "component_created", "Component", data.id, `Component ${input.partNumber} created`);
  revalidatePath("/app/components"); redirect("/app/components");
}

const lotSchema = z.object({ internalLot: z.string().min(2).max(80), supplierLot: z.string().max(100), componentId: z.string().uuid(), supplierId: z.string().uuid(), quantity: z.coerce.number().positive(), unit: z.string().min(1).max(30), receivedAt: z.string().date() });
export async function createLot(formData: FormData) {
  const { identity, supabase } = await context("suppliers:write");
  const input = lotSchema.parse({ internalLot: textField(formData,"internalLot"), supplierLot: textField(formData,"supplierLot"), componentId: textField(formData,"componentId"), supplierId: textField(formData,"supplierId"), quantity: textField(formData,"quantity"), unit: textField(formData,"unit"), receivedAt: textField(formData,"receivedAt") });
  await Promise.all([verifyReference("components",input.componentId,identity.organizationId),verifyReference("suppliers",input.supplierId,identity.organizationId)]);
  const { data, error } = await supabase.from("lots").insert({ organization_id: identity.organizationId, internal_lot: input.internalLot, supplier_lot: input.supplierLot, component_id: input.componentId, supplier_id: input.supplierId, quantity: input.quantity, unit: input.unit, received_at: input.receivedAt, inspection_status: "pending", disposition: "quarantine" }).select("id").single();
  if (error) throw new Error("Lot could not be recorded.");
  await recordActivity(identity.organizationId, identity.userId, "lot_received", "Lot", data.id, `Lot ${input.internalLot} received`);
  revalidatePath("/app/lots"); redirect(`/app/lots/${data.id}`);
}

const inspectionSchema = z.object({ number: z.string().min(2).max(80), lotId: z.string().uuid(), componentId: z.string().uuid(), date: z.string().date(), sampleSize: z.coerce.number().int().positive(), outcome: z.enum(["passed","failed","conditional"]), disposition: z.string().min(2).max(100), defects: z.string().max(4000) });
export async function createInspection(formData: FormData) {
  const { identity, supabase } = await context("suppliers:write");
  const input = inspectionSchema.parse({ number:textField(formData,"number"),lotId:textField(formData,"lotId"),componentId:textField(formData,"componentId"),date:textField(formData,"date"),sampleSize:textField(formData,"sampleSize"),outcome:textField(formData,"outcome"),disposition:textField(formData,"disposition"),defects:textField(formData,"defects") });
  await Promise.all([verifyReference("lots",input.lotId,identity.organizationId),verifyReference("components",input.componentId,identity.organizationId)]);
  const { data, error } = await supabase.from("inspections").insert({ organization_id: identity.organizationId, inspection_number: input.number, lot_id: input.lotId, component_id: input.componentId, inspector_id: identity.userId, inspected_at: input.date, sample_size: input.sampleSize, outcome: input.outcome, disposition: input.disposition, defects: input.defects }).select("id").single();
  if (error) throw new Error("Inspection could not be recorded.");
  const lotUpdate = await supabase.from("lots").update({ inspection_status: input.outcome, disposition: input.disposition }).eq("id",input.lotId).eq("organization_id",identity.organizationId);
  if (lotUpdate.error) throw new Error("Inspection was saved, but lot disposition could not be updated.");
  await recordActivity(identity.organizationId,identity.userId,"inspection_completed","Inspection",data.id,`Inspection ${input.number} completed: ${input.outcome}`);
  revalidatePath("/app/inspections"); revalidatePath("/app/lots"); redirect("/app/inspections");
}

export interface ReportDraftInput { title: string; reportType: string; projectId: string; objective: string; measurement: string; maximum: number; values: number[]; }
const reportDraftSchema = z.object({ title:z.string().min(3).max(180),reportType:z.string().min(3).max(100),projectId:z.string().uuid(),objective:z.string().min(10).max(8000),measurement:z.string().min(1).max(100),maximum:z.number().finite(),values:z.array(z.number().finite()).min(1).max(10000) });
export async function createReportDraft(raw: ReportDraftInput) {
  const { identity, supabase } = await context("reports:write");
  const input = reportDraftSchema.parse(raw); await verifyReference("projects",input.projectId,identity.organizationId);
  const stats = summarize(input.values); const outcome = evaluateCriterion(stats.mean,{operator:"<=",maximum:input.maximum}) ? "pass" : "fail";
  const number = `ETR-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
  const { data: report, error } = await supabase.from("reports").insert({ organization_id:identity.organizationId,project_id:input.projectId,number,title:input.title,report_type:input.reportType,revision:"A",status:"draft",author_id:identity.userId,confidentiality:"Internal development record" }).select("id").single();
  if (error) throw new Error("Report draft could not be created.");
  const [sectionResult, criterionResult] = await Promise.all([
    supabase.from("report_sections").insert([{organization_id:identity.organizationId,report_id:report.id,title:"Objective",content:input.objective,sort_order:1,source:"user"},{organization_id:identity.organizationId,report_id:report.id,title:"Results",content:`${input.measurement}: n=${stats.count}, mean=${stats.mean}, median=${stats.median}, sample SD=${stats.standardDeviation}, range=${stats.minimum} to ${stats.maximum}.`,sort_order:2,source:"user"}]),
    supabase.from("acceptance_criteria").insert({organization_id:identity.organizationId,report_id:report.id,measurement:input.measurement,operator:"<=",maximum:input.maximum,unit:"",result:stats.mean,outcome})
  ]);
  if (sectionResult.error || criterionResult.error) throw new Error("Report metadata was created, but its sections or criterion failed to save.");
  await recordActivity(identity.organizationId,identity.userId,"report_created","Report",report.id,`Report ${number} created`);
  revalidatePath("/app/reports"); return { id: report.id };
}

const reportTransitionSchema = z.object({
  reportId: z.string().uuid(),
  comment: z.string().trim().max(4000).default(""),
});

async function loadMutableReport(reportId: string, organizationId: string) {
  const { data, error } = await createAdminClient()
    .from("reports")
    .select("id,organization_id,number,title,report_type,revision,status,project_id,confidentiality,author_id")
    .eq("id", reportId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) throw new Error("Report not found.");
  return data;
}

export async function submitReportForReview(formData: FormData) {
  const { identity } = await context("reports:write");
  const input = reportTransitionSchema.parse({ reportId: textField(formData, "reportId"), comment: textField(formData, "comment") });
  const report = await loadMutableReport(input.reportId, identity.organizationId);
  if (!["draft", "in_progress", "changes_requested"].includes(report.status)) throw new Error("This report cannot be submitted from its current state.");
  const admin = createAdminClient();
  const { error } = await admin.from("reports").update({ status: "ready_for_review", submitted_at: new Date().toISOString(), reviewer_id: null }).eq("id", report.id).eq("organization_id", identity.organizationId);
  if (error) throw new Error("Report could not be submitted for review.");
  await admin.from("report_reviews").insert({ organization_id: identity.organizationId, report_id: report.id, reviewer_id: identity.userId, decision: "comment", comment: input.comment || "Submitted for review", revision: report.revision });
  await recordActivity(identity.organizationId, identity.userId, "report_submitted", "Report", report.id, `Report ${report.number} revision ${report.revision} submitted for review`);
  revalidatePath(`/app/reports/${report.id}`); revalidatePath("/app/reports");
}

export async function reviewReport(formData: FormData) {
  const { identity } = await context("reports:review");
  const input = reportTransitionSchema.extend({ decision: z.enum(["approved", "changes_requested"]), comment: z.string().trim().min(10).max(4000) }).parse({ reportId: textField(formData, "reportId"), decision: textField(formData, "decision"), comment: textField(formData, "comment") });
  const report = await loadMutableReport(input.reportId, identity.organizationId);
  if (report.status !== "ready_for_review") throw new Error("Only reports ready for review can receive a decision.");
  if (report.author_id === identity.userId) throw new Error("The report author cannot approve their own report.");
  const now = new Date().toISOString();
  const admin = createAdminClient();
  const update = input.decision === "approved"
    ? { status: "approved", reviewer_id: identity.userId, approved_at: now, approved_by: identity.userId, locked_at: now }
    : { status: "changes_requested", reviewer_id: identity.userId, approved_at: null, approved_by: null, locked_at: null };
  const { error } = await admin.from("reports").update(update).eq("id", report.id).eq("organization_id", identity.organizationId).eq("status", "ready_for_review");
  if (error) throw new Error("The review decision could not be recorded.");
  const review = await admin.from("report_reviews").insert({ organization_id: identity.organizationId, report_id: report.id, reviewer_id: identity.userId, decision: input.decision, comment: input.comment, revision: report.revision });
  if (review.error) throw new Error("The report changed state, but the review record failed. Contact support.");
  await recordActivity(identity.organizationId, identity.userId, `report_${input.decision}`, "Report", report.id, `Report ${report.number} revision ${report.revision}: ${input.decision.replace("_", " ")}`);
  revalidatePath(`/app/reports/${report.id}`); revalidatePath("/app/reports");
}

function nextRevision(current: string) {
  if (!/^[A-Z]$/.test(current) || current === "Z") throw new Error("Automatic revision numbering supports A through Z.");
  return String.fromCharCode(current.charCodeAt(0) + 1);
}

export async function createReportRevision(formData: FormData) {
  const { identity } = await context("reports:write");
  const input = reportTransitionSchema.extend({ changeSummary: z.string().trim().min(10).max(4000) }).parse({ reportId: textField(formData, "reportId"), changeSummary: textField(formData, "changeSummary"), comment: "" });
  const source = await loadMutableReport(input.reportId, identity.organizationId);
  if (source.status !== "approved") throw new Error("A new revision can only be created from an approved report.");
  const admin = createAdminClient();
  const [{ data: sections, error: sectionError }, { data: criteria, error: criterionError }] = await Promise.all([
    admin.from("report_sections").select("title,content,sort_order,source,ai_metadata").eq("report_id", source.id).eq("organization_id", identity.organizationId),
    admin.from("acceptance_criteria").select("measurement,operator,minimum,maximum,target,unit,result,outcome").eq("report_id", source.id).eq("organization_id", identity.organizationId),
  ]);
  if (sectionError || criterionError) throw new Error("The approved revision could not be copied.");
  const revision = nextRevision(source.revision);
  const { data: copy, error } = await admin.from("reports").insert({ organization_id: identity.organizationId, project_id: source.project_id, number: source.number, title: source.title, report_type: source.report_type, revision, status: "draft", confidentiality: source.confidentiality, author_id: identity.userId, change_summary: input.changeSummary, parent_report_id: source.id }).select("id").single();
  if (error) throw new Error("A new revision could not be created. It may already exist.");
  const [sectionCopy, criterionCopy] = await Promise.all([
    sections?.length ? admin.from("report_sections").insert(sections.map((item) => ({ ...item, id: undefined, organization_id: identity.organizationId, report_id: copy.id }))) : Promise.resolve({ error: null }),
    criteria?.length ? admin.from("acceptance_criteria").insert(criteria.map((item) => ({ ...item, id: undefined, organization_id: identity.organizationId, report_id: copy.id }))) : Promise.resolve({ error: null }),
  ]);
  if (sectionCopy.error || criterionCopy.error) throw new Error("The revision was created, but its controlled content failed to copy. Contact support.");
  await recordActivity(identity.organizationId, identity.userId, "report_revision_created", "Report", copy.id, `Report ${source.number} revision ${revision} created from revision ${source.revision}`);
  revalidatePath("/app/reports"); redirect(`/app/reports/${copy.id}`);
}
