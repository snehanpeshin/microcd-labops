import { createClient } from "@/lib/supabase/server";
import type { WorkspaceIdentity } from "@/lib/auth";
import type { Activity, ComponentRecord, Inspection, Lot, Project, Report, Supplier } from "@/lib/types";
import { demoActivity, demoComponents, demoInspections, demoLots, demoProjects, demoReports, demoSuppliers } from "./demo";

function requireData<T>(data: T | null, error: { message: string } | null): T {
  if (error || data === null) throw new Error("Workspace data could not be loaded");
  return data;
}

type RelatedProfile = { full_name: string };

function relatedName(value: RelatedProfile | readonly RelatedProfile[] | null | undefined, fallback: string) {
  const profile = Array.isArray(value) ? value[0] : value as RelatedProfile | null | undefined;
  return profile?.full_name || fallback;
}

export async function listProjects(identity: WorkspaceIdentity): Promise<Project[]> {
  if (identity.demo) return demoProjects;
  const supabase = await createClient();
  const result = await supabase.from("projects").select("id,code,name,product,description,status,target_date,owner:profiles!projects_owner_profile_fkey(full_name)").eq("organization_id", identity.organizationId).is("deleted_at", null).order("updated_at", { ascending: false });
  return requireData(result.data, result.error).map((row) => ({ id: row.id, code: row.code, name: row.name, product: row.product, description: row.description, status: row.status === "on_hold" ? "On hold" : row.status === "complete" ? "Complete" : row.status === "active" ? "Active" : "Planning", owner: relatedName(row.owner, "Unassigned"), targetDate: row.target_date ?? "" }));
}

export async function listReports(identity: WorkspaceIdentity): Promise<Report[]> {
  if (identity.demo) return demoReports;
  const supabase = await createClient();
  const result = await supabase.from("reports").select("id,number,title,report_type,project_id,revision,status,confidentiality,updated_at,author:profiles!reports_author_profile_fkey(full_name),reviewer:profiles!reports_reviewer_profile_fkey(full_name),report_sections!report_sections_report_id_fkey(id,title,content,source,sort_order),acceptance_criteria!acceptance_criteria_report_id_fkey(id,measurement,operator,minimum,maximum,target,unit,result,outcome,override_reason)").eq("organization_id", identity.organizationId).is("deleted_at", null).order("updated_at", { ascending: false });
  return requireData(result.data, result.error).map((row) => ({ id: row.id, number: row.number, title: row.title, type: row.report_type, projectId: row.project_id ?? "", revision: row.revision, status: row.status === "in_progress" ? "In progress" : row.status === "ready_for_review" ? "Ready for review" : row.status === "changes_requested" ? "Changes requested" : row.status === "approved" ? "Approved" : row.status === "archived" ? "Archived" : "Draft", author: relatedName(row.author, "Unknown"), reviewer: relatedName(row.reviewer, "Unassigned"), updatedAt: row.updated_at, confidentiality: row.confidentiality, sections: row.report_sections.sort((a, b) => a.sort_order - b.sort_order).map((section) => ({ id: section.id, title: section.title, content: section.content, source: section.source === "ai_assisted" ? "ai-assisted" : "user", order: section.sort_order })), criteria: row.acceptance_criteria.map((criterion) => ({ id: criterion.id, measurement: criterion.measurement, operator: criterion.operator as "between" | ">=" | "<=" | "=", minimum: criterion.minimum ?? undefined, maximum: criterion.maximum ?? undefined, target: criterion.target ?? undefined, unit: criterion.unit, result: criterion.result ?? undefined, outcome: criterion.outcome === "pass" ? "Pass" : criterion.outcome === "fail" ? "Fail" : "Not evaluated", overrideReason: criterion.override_reason ?? undefined })) }));
}

export async function getReport(identity: WorkspaceIdentity, id: string) {
  return (await listReports(identity)).find((report) => report.id === id) ?? null;
}

export async function listSuppliers(identity: WorkspaceIdentity): Promise<Supplier[]> {
  if (identity.demo) return demoSuppliers;
  const supabase = await createClient();
  const result = await supabase.from("suppliers").select("id,code,name,supplier_type,country,risk,status,next_review,owner:profiles!suppliers_owner_profile_fkey(full_name),supplier_documents!supplier_documents_supplier_id_fkey(id,review_status)").eq("organization_id", identity.organizationId).is("deleted_at", null).order("name");
  return requireData(result.data, result.error).map((row) => { const documents = row.supplier_documents; const accepted = documents.filter((document) => document.review_status === "accepted").length; return { id: row.id, code: row.code, name: row.name, type: row.supplier_type, country: row.country, risk: row.risk === "high" ? "High" : row.risk === "low" ? "Low" : "Medium", status: row.status.split("_").map((part: string) => part[0].toUpperCase() + part.slice(1)).join(" ") as Supplier["status"], documentCompleteness: documents.length ? Math.round((accepted / documents.length) * 100) : 0, nextReview: row.next_review ?? "", owner: relatedName(row.owner, "Unassigned") }; });
}

export async function listComponents(identity: WorkspaceIdentity): Promise<ComponentRecord[]> {
  if (identity.demo) return demoComponents;
  const supabase = await createClient();
  const result = await supabase.from("components").select("id,part_number,name,category,material,revision,risk,status,supplier_components(supplier_id,supplier_part_number)").eq("organization_id", identity.organizationId).is("deleted_at", null).order("part_number");
  return requireData(result.data, result.error).map((row) => ({ id: row.id, partNumber: row.part_number, supplierPartNumber: row.supplier_components[0]?.supplier_part_number ?? "", name: row.name, category: row.category, material: row.material, revision: row.revision, supplierIds: row.supplier_components.map((link) => link.supplier_id), risk: row.risk === "high" ? "High" : row.risk === "low" ? "Low" : "Medium", status: row.status === "obsolete" ? "Obsolete" : "Active" }));
}

export async function listLots(identity: WorkspaceIdentity): Promise<Lot[]> {
  if (identity.demo) return demoLots;
  const supabase = await createClient();
  const result = await supabase.from("lots").select("id,internal_lot,supplier_lot,component_id,supplier_id,quantity,received_at,expires_at,inspection_status,disposition").eq("organization_id", identity.organizationId).is("deleted_at", null).order("received_at", { ascending: false });
  return requireData(result.data, result.error).map((row) => ({ id: row.id, internalLot: row.internal_lot, supplierLot: row.supplier_lot, componentId: row.component_id, supplierId: row.supplier_id, quantity: Number(row.quantity), receivedAt: row.received_at, expiresAt: row.expires_at ?? undefined, inspectionStatus: row.inspection_status === "passed" ? "Passed" : row.inspection_status === "failed" ? "Failed" : row.inspection_status === "conditional" ? "Conditional" : "Pending", disposition: row.disposition }));
}

export async function listInspections(identity: WorkspaceIdentity): Promise<Inspection[]> {
  if (identity.demo) return demoInspections;
  const supabase = await createClient();
  const result = await supabase.from("inspections").select("id,inspection_number,lot_id,component_id,inspected_at,sample_size,outcome,disposition,defects,inspector:profiles!inspections_inspector_profile_fkey(full_name)").eq("organization_id", identity.organizationId).order("inspected_at", { ascending: false });
  return requireData(result.data, result.error).map((row) => ({ id: row.id, number: row.inspection_number, lotId: row.lot_id, componentId: row.component_id, inspector: relatedName(row.inspector, "Unknown"), date: row.inspected_at, sampleSize: row.sample_size, outcome: row.outcome === "passed" ? "Passed" : row.outcome === "failed" ? "Failed" : "Conditional", disposition: row.disposition, defects: row.defects }));
}

export async function listActivity(identity: WorkspaceIdentity): Promise<Activity[]> {
  if (identity.demo) return demoActivity;
  const supabase = await createClient();
  const result = await supabase.from("activity_log").select("id,record_id,action,record_type,summary,created_at,actor:profiles!activity_log_actor_profile_fkey(full_name)").eq("organization_id", identity.organizationId).order("created_at", { ascending: false }).limit(100);
  return requireData(result.data, result.error).map((row) => ({ id: String(row.id), recordId: row.record_id ?? undefined, actor: relatedName(row.actor, "System"), action: row.action, recordType: row.record_type, summary: row.summary, timestamp: row.created_at }));
}
