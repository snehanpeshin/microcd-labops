import { createClient } from "@/lib/supabase/server";
import type { WorkspaceIdentity } from "@/lib/auth";
import type { EquipmentEvent, EquipmentRecord, Experiment, GlobalSearchResult, InventoryItem, InventoryTransaction, LabAttachment, LabTask, ProtocolRecord, ProtocolVersion, Sample } from "@/lib/lab-types";
import { demoEquipment, demoExperiments, demoInventory, demoInventoryTransactions, demoLabTasks, demoProtocols, demoProtocolVersions, demoSamples } from "./lab-demo";
import { listProjects } from "./workspace";

export interface RegistryFilters { q?: string; status?: string; }
type RelatedNamedRecord = { name: string; code?: string };

function requireData<T>(data: T | null, error: { message: string } | null): T {
  if (error || data === null) throw new Error("Laboratory records could not be loaded.");
  return data;
}

function relatedOne<T>(value: T | readonly T[] | null | undefined): T | undefined {
  return (Array.isArray(value) ? value[0] : value) as T | undefined;
}

async function loadProfileNames(ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (!unique.length) return new Map<string,string>();
  const supabase = await createClient();
  const result = await supabase.from("profiles").select("id,full_name").in("id", unique);
  if (result.error) throw new Error("Workspace member names could not be loaded.");
  return new Map((result.data ?? []).map((profile) => [String(profile.id), profile.full_name || "Unassigned"]));
}

function titleCase(value: string) {
  return value.split("_").map((part) => part ? part[0].toUpperCase() + part.slice(1) : part).join(" ");
}

function safeFilterTerm(value: string) {
  return value.trim().replace(/[,%().]/g, " ").slice(0, 120);
}

function filterDemo<T>(rows: T[], filters: RegistryFilters, searchable: (row: T) => string) {
  const query = filters.q?.trim().toLowerCase();
  return rows.filter((row) => (!filters.status || (row as {status?:string}).status?.toLowerCase().replaceAll(" ", "_") === filters.status) && (!query || searchable(row).toLowerCase().includes(query)));
}

export async function listExperiments(identity: WorkspaceIdentity, filters: RegistryFilters = {}): Promise<Experiment[]> {
  if (identity.demo) return filterDemo(demoExperiments, filters, (row) => `${row.code} ${row.title} ${row.owner} ${row.projectName} ${row.tags.join(" ")}`);
  const supabase = await createClient();
  let query = supabase.from("experiments").select("id,code,title,project_id,objective,owner_id,experiment_type,protocol_version_id,start_date,completion_date,status,priority,notes,results,observations,conclusions,tags,updated_at,project:projects(name),protocol_version:protocol_versions(version,protocol:protocols(code))").eq("organization_id", identity.organizationId).is("deleted_at", null).order("updated_at", { ascending: false }).limit(200);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.q) { const term=safeFilterTerm(filters.q); if(term) query = query.or(`code.ilike.%${term}%,title.ilike.%${term}%,objective.ilike.%${term}%`); }
  const result = await query;
  const rows=requireData(result.data, result.error); const names=await loadProfileNames(rows.map(row=>row.owner_id));
  return rows.map((row) => {
    const project = relatedOne(row.project as RelatedNamedRecord | RelatedNamedRecord[] | null);
    const protocolVersion = relatedOne(row.protocol_version as unknown as { version: number; protocol: { code: string } | { code: string }[] | null } | null);
    const protocol = relatedOne(protocolVersion?.protocol);
    return { id:row.id, code:row.code, title:row.title, projectId:row.project_id ?? "", projectName:project?.name ?? "Unassigned", objective:row.objective, owner:names.get(String(row.owner_id))??"Unassigned", type:row.experiment_type, protocolVersionId:row.protocol_version_id ?? undefined, protocolLabel:protocolVersion && protocol ? `${protocol.code} v${protocolVersion.version}` : undefined, startDate:row.start_date ?? undefined, completionDate:row.completion_date ?? undefined, status:titleCase(row.status) as Experiment["status"], priority:titleCase(row.priority) as Experiment["priority"], notes:row.notes, results:row.results, observations:row.observations, conclusions:row.conclusions, tags:row.tags ?? [], updatedAt:row.updated_at };
  });
}

export async function getExperiment(identity: WorkspaceIdentity, id: string) {
  return (await listExperiments(identity)).find((record) => record.id === id) ?? null;
}

export async function listSamples(identity: WorkspaceIdentity, filters: RegistryFilters = {}): Promise<Sample[]> {
  if (identity.demo) return filterDemo(demoSamples, filters, (row) => `${row.code} ${row.name} ${row.type} ${row.source} ${row.storageLocation} ${row.barcode ?? ""}`);
  const supabase = await createClient();
  let query = supabase.from("samples").select("id,code,name,sample_type,source,project_id,experiment_id,parent_sample_id,preparation_date,owner_id,quantity,concentration,unit,storage_location,freezer,rack,box,position,status,notes,expiration_date,barcode,updated_at,project:projects(name),experiment:experiments(code)").eq("organization_id", identity.organizationId).is("deleted_at", null).order("updated_at", { ascending: false }).limit(250);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.q) { const term=safeFilterTerm(filters.q); if(term) query = query.or(`code.ilike.%${term}%,name.ilike.%${term}%,sample_type.ilike.%${term}%,barcode.ilike.%${term}%`); }
  const result = await query;
  const rows=requireData(result.data,result.error);const names=await loadProfileNames(rows.map(row=>row.owner_id));
  return rows.map((row) => ({ id:row.id, code:row.code, name:row.name, type:row.sample_type, source:row.source, projectId:row.project_id ?? undefined, projectName:relatedOne(row.project as RelatedNamedRecord | RelatedNamedRecord[] | null)?.name, experimentId:row.experiment_id ?? undefined, experimentCode:relatedOne(row.experiment as { code:string } | { code:string }[] | null)?.code, parentSampleId:row.parent_sample_id ?? undefined, preparationDate:row.preparation_date ?? undefined, owner:names.get(String(row.owner_id))??"Unassigned", quantity:row.quantity === null ? undefined : Number(row.quantity), concentration:row.concentration === null ? undefined : Number(row.concentration), unit:row.unit, storageLocation:row.storage_location, freezer:row.freezer, rack:row.rack, box:row.box, position:row.position, status:titleCase(row.status) as Sample["status"], expirationDate:row.expiration_date ?? undefined, barcode:row.barcode ?? undefined, notes:row.notes, updatedAt:row.updated_at }));
}

export async function getSample(identity: WorkspaceIdentity, id: string) {
  return (await listSamples(identity)).find((record) => record.id === id) ?? null;
}

export async function listLabAttachments(identity: WorkspaceIdentity, recordType:"experiment"|"sample"|"equipment"|"protocol", recordId:string): Promise<LabAttachment[]> {
  if(identity.demo) return [];
  const supabase=await createClient();
  const result=await supabase.from("attachments").select("id,file_name,mime_type,size_bytes,created_at").eq("organization_id",identity.organizationId).eq("record_type",recordType).eq("record_id",recordId).order("created_at",{ascending:false}).limit(100);
  return requireData(result.data,result.error).map(row=>({id:row.id,fileName:row.file_name,mimeType:row.mime_type,sizeBytes:Number(row.size_bytes),uploadedAt:row.created_at}));
}

export async function listInventory(identity: WorkspaceIdentity, filters: RegistryFilters = {}): Promise<InventoryItem[]> {
  if (identity.demo) return filterDemo(demoInventory, filters, (row) => `${row.code} ${row.name} ${row.manufacturer} ${row.catalogNumber} ${row.lotNumber}`);
  const supabase = await createClient();
  let query = supabase.from("inventory_items").select("id,code,name,item_type,manufacturer,catalog_number,lot_number,quantity,unit,minimum_stock,storage_location,received_date,opened_date,expiration_date,supplier_id,notes,updated_at,owner_id").eq("organization_id", identity.organizationId).is("deleted_at", null).order("updated_at", { ascending: false }).limit(250);
  if (filters.q) { const term=safeFilterTerm(filters.q); if(term) query = query.or(`code.ilike.%${term}%,name.ilike.%${term}%,manufacturer.ilike.%${term}%,catalog_number.ilike.%${term}%,lot_number.ilike.%${term}%`); }
  const result = await query;
  const rows = requireData(result.data, result.error);
  const names = await loadProfileNames(rows.map((row) => row.owner_id));
  const items = rows.map((row) => ({ id:row.id, code:row.code, name:row.name, type:titleCase(row.item_type) as InventoryItem["type"], manufacturer:row.manufacturer, catalogNumber:row.catalog_number, lotNumber:row.lot_number, quantity:Number(row.quantity), unit:row.unit, minimumStock:Number(row.minimum_stock), storageLocation:row.storage_location, receivedDate:row.received_date ?? undefined, openedDate:row.opened_date ?? undefined, expirationDate:row.expiration_date ?? undefined, owner:names.get(String(row.owner_id)) ?? "Unassigned", supplierId:row.supplier_id ?? undefined, notes:row.notes, updatedAt:row.updated_at }));
  return filters.status === "low" ? items.filter((item) => item.quantity <= item.minimumStock) : items;
}

export async function listInventoryTransactions(identity: WorkspaceIdentity, itemId?: string): Promise<InventoryTransaction[]> {
  if (identity.demo) return itemId ? demoInventoryTransactions.filter((row) => row.itemId === itemId) : demoInventoryTransactions;
  const supabase = await createClient();
  let query = supabase.from("inventory_transactions").select("id,inventory_item_id,transaction_type,quantity_delta,resulting_quantity,reason,created_at,created_by").eq("organization_id", identity.organizationId).order("created_at", { ascending:false }).limit(100);
  if (itemId) query = query.eq("inventory_item_id", itemId);
  const result = await query;
  const rows = requireData(result.data, result.error);
  const names = await loadProfileNames(rows.map((row) => row.created_by));
  return rows.map((row) => ({ id:row.id, itemId:row.inventory_item_id, type:titleCase(row.transaction_type) as InventoryTransaction["type"], quantityDelta:Number(row.quantity_delta), resultingQuantity:Number(row.resulting_quantity), reason:row.reason, actor:names.get(String(row.created_by)) ?? "System", createdAt:row.created_at }));
}

export async function listEquipment(identity: WorkspaceIdentity, filters: RegistryFilters = {}): Promise<EquipmentRecord[]> {
  if (identity.demo) return filterDemo(demoEquipment, filters, (row) => `${row.code} ${row.name} ${row.category} ${row.manufacturer} ${row.model} ${row.location}`);
  const supabase = await createClient();
  let query = supabase.from("equipment").select("id,code,name,category,manufacturer,model,serial_number,location,status,last_maintenance,next_maintenance,last_calibration,next_calibration,notes,updated_at,owner_id").eq("organization_id", identity.organizationId).is("deleted_at", null).order("name").limit(250);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.q) { const term=safeFilterTerm(filters.q); if(term) query = query.or(`code.ilike.%${term}%,name.ilike.%${term}%,category.ilike.%${term}%,manufacturer.ilike.%${term}%,model.ilike.%${term}%,serial_number.ilike.%${term}%`); }
  const result = await query;
  const rows = requireData(result.data, result.error);
  const names = await loadProfileNames(rows.map((row) => row.owner_id));
  return rows.map((row) => ({ id:row.id, code:row.code, name:row.name, category:row.category, manufacturer:row.manufacturer, model:row.model, serialNumber:row.serial_number, location:row.location, status:titleCase(row.status) as EquipmentRecord["status"], owner:names.get(String(row.owner_id)) ?? "Unassigned", lastMaintenance:row.last_maintenance ?? undefined, nextMaintenance:row.next_maintenance ?? undefined, lastCalibration:row.last_calibration ?? undefined, nextCalibration:row.next_calibration ?? undefined, notes:row.notes, updatedAt:row.updated_at }));
}

export async function getEquipment(identity:WorkspaceIdentity,id:string){return (await listEquipment(identity)).find(record=>record.id===id)??null;}
export async function listEquipmentEvents(identity:WorkspaceIdentity,equipmentId:string):Promise<EquipmentEvent[]>{
 if(identity.demo) return [];
 const supabase=await createClient();const result=await supabase.from("equipment_events").select("id,equipment_id,event_type,performed_at,previous_status,new_status,summary,next_due_date,performed_by").eq("organization_id",identity.organizationId).eq("equipment_id",equipmentId).order("performed_at",{ascending:false}).limit(100);
 const rows=requireData(result.data,result.error);const names=await loadProfileNames(rows.map(row=>row.performed_by));
 return rows.map(row=>({id:row.id,equipmentId:row.equipment_id,type:titleCase(row.event_type) as EquipmentEvent["type"],performedAt:row.performed_at,actor:names.get(String(row.performed_by))??"Unassigned",previousStatus:row.previous_status??undefined,newStatus:row.new_status??undefined,summary:row.summary,nextDueDate:row.next_due_date??undefined}));
}

export async function listProtocols(identity: WorkspaceIdentity, filters: RegistryFilters = {}): Promise<ProtocolRecord[]> {
  if (identity.demo) return filterDemo(demoProtocols, filters, (row) => `${row.code} ${row.name} ${row.description} ${row.owner}`);
  const supabase = await createClient();
  let query = supabase.from("protocols").select("id,code,name,description,status,updated_at,owner_id,protocol_versions(id,version,status)").eq("organization_id", identity.organizationId).is("deleted_at", null).order("updated_at", { ascending:false }).limit(200);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.q) { const term=safeFilterTerm(filters.q); if(term) query = query.or(`code.ilike.%${term}%,name.ilike.%${term}%,description.ilike.%${term}%`); }
  const result = await query;
  const rows = requireData(result.data, result.error);
  const names = await loadProfileNames(rows.map((row) => row.owner_id));
  return rows.map((row) => { const latest = [...row.protocol_versions].sort((a,b) => b.version-a.version)[0]; return { id:row.id, code:row.code, name:row.name, description:row.description, owner:names.get(String(row.owner_id)) ?? "Unassigned", status:titleCase(row.status) as ProtocolRecord["status"], latestVersion:latest?.version, latestVersionId:latest?.id, latestVersionStatus:latest ? titleCase(latest.status) as ProtocolRecord["latestVersionStatus"] : undefined, updatedAt:row.updated_at }; });
}

export async function listProtocolVersions(identity: WorkspaceIdentity, protocolId?: string): Promise<ProtocolVersion[]> {
  if (identity.demo) return protocolId ? demoProtocolVersions.filter((row) => row.protocolId === protocolId) : demoProtocolVersions;
  const supabase = await createClient();
  let query = supabase.from("protocol_versions").select("id,protocol_id,version,title,steps,materials,equipment,notes,status,approved_at,created_at,authored_by").eq("organization_id", identity.organizationId).order("version", { ascending:false }).limit(200);
  if (protocolId) query = query.eq("protocol_id", protocolId);
  const result = await query;
  const rows = requireData(result.data, result.error);
  const names = await loadProfileNames(rows.map((row) => row.authored_by));
  return rows.map((row) => ({ id:row.id, protocolId:row.protocol_id, version:row.version, title:row.title, steps:row.steps, materials:row.materials, equipment:row.equipment, notes:row.notes, status:titleCase(row.status) as ProtocolVersion["status"], author:names.get(String(row.authored_by)) ?? "Unassigned", approvedAt:row.approved_at ?? undefined, createdAt:row.created_at }));
}

export async function listLabTasks(identity: WorkspaceIdentity, filters: RegistryFilters = {}): Promise<LabTask[]> {
  if (identity.demo) return filterDemo(demoLabTasks, filters, (row) => `${row.title} ${row.description} ${row.assignee} ${row.experimentCode ?? ""} ${row.projectName ?? ""}`);
  const supabase = await createClient();
  let query = supabase.from("lab_tasks").select("id,title,description,experiment_id,project_id,due_date,priority,status,notes,updated_at,assigned_to,experiment:experiments(code),project:projects(name)").eq("organization_id", identity.organizationId).is("deleted_at", null).order("due_date", { ascending:true, nullsFirst:false }).limit(250);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.q) { const term=safeFilterTerm(filters.q); if(term) query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%,notes.ilike.%${term}%`); }
  const result = await query;
  const rows = requireData(result.data, result.error);
  const names = await loadProfileNames(rows.map((row) => row.assigned_to));
  return rows.map((row) => ({ id:row.id, title:row.title, description:row.description, assignee:names.get(String(row.assigned_to)) ?? "Unassigned", experimentId:row.experiment_id ?? undefined, experimentCode:relatedOne(row.experiment as {code:string}|{code:string}[]|null)?.code, projectId:row.project_id ?? undefined, projectName:relatedOne(row.project as RelatedNamedRecord|RelatedNamedRecord[]|null)?.name, dueDate:row.due_date ?? undefined, priority:titleCase(row.priority) as LabTask["priority"], status:titleCase(row.status) as LabTask["status"], notes:row.notes, updatedAt:row.updated_at }));
}

export async function globalSearch(identity: WorkspaceIdentity, rawQuery: string): Promise<GlobalSearchResult[]> {
  const q = rawQuery.trim();
  if (q.length < 2) return [];
  const [projects, experiments, samples, inventory, equipment, protocols] = await Promise.all([
    listProjects(identity), listExperiments(identity,{q}), listSamples(identity,{q}), listInventory(identity,{q}), listEquipment(identity,{q}), listProtocols(identity,{q}),
  ]);
  const needle = q.toLowerCase();
  return [
    ...projects.filter((row) => `${row.code} ${row.name} ${row.product}`.toLowerCase().includes(needle)).map((row) => ({ id:row.id, type:"Project" as const, primary:`${row.code} · ${row.name}`, secondary:row.product, href:"/app/projects", status:row.status })),
    ...experiments.map((row) => ({ id:row.id, type:"Experiment" as const, primary:`${row.code} · ${row.title}`, secondary:row.projectName, href:`/app/experiments/${row.id}`, status:row.status })),
    ...samples.map((row) => ({ id:row.id, type:"Sample" as const, primary:`${row.code} · ${row.name}`, secondary:row.storageLocation || row.type, href:`/app/samples/${row.id}`, status:row.status })),
    ...inventory.map((row) => ({ id:row.id, type:"Inventory" as const, primary:`${row.code} · ${row.name}`, secondary:`${row.quantity} ${row.unit} · ${row.storageLocation}`, href:"/app/inventory", status:row.quantity <= row.minimumStock ? "Low stock" : "In stock" })),
    ...equipment.map((row) => ({ id:row.id, type:"Equipment" as const, primary:`${row.code} · ${row.name}`, secondary:`${row.manufacturer} ${row.model}`, href:"/app/equipment", status:row.status })),
    ...protocols.map((row) => ({ id:row.id, type:"Protocol" as const, primary:`${row.code} · ${row.name}`, secondary:row.description, href:"/app/protocols", status:row.status })),
  ].slice(0, 50);
}
