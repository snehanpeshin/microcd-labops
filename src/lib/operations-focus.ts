import type { EquipmentRecord, Experiment, InventoryItem, LabTask, Sample } from "./lab-types";
import type { OperationsCase } from "./medical-operations/workflows";
import type { Report } from "./types";

/** Date-only laboratory deadlines use calendar days in UTC, independent of server timezone. */
export function daysUntil(value: string | undefined, now = new Date()): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const deadline = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(deadline) || new Date(deadline).toISOString().slice(0, 10) !== value) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((deadline - today) / 86_400_000);
}

const priorityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
export interface TaskFilters { task?: string; q?: string; status?: string; priority?: string; focus?: string; sort?: string; }
export function filterTasks(tasks: LabTask[], filters: TaskFilters, now = new Date()) {
  const needle = filters.q?.trim().toLowerCase();
  return tasks.filter(task => {
    if (filters.task && task.id !== filters.task) return false;
    const days = daysUntil(task.dueDate, now);
    const open = task.status !== "Completed";
    if (needle && ![task.title, task.description, task.assignee, task.projectName, task.experimentCode, task.notes].filter(Boolean).join(" ").toLowerCase().includes(needle)) return false;
    if (filters.status && task.status.toLowerCase().replaceAll(" ", "_") !== filters.status) return false;
    if (filters.priority && task.priority.toLowerCase() !== filters.priority) return false;
    if (filters.focus === "open" && !open) return false;
    if (filters.focus === "overdue" && !(open && days !== null && days < 0)) return false;
    if (filters.focus === "week" && !(open && days !== null && days >= 0 && days <= 7)) return false;
    if (filters.focus === "blocked" && task.status !== "Blocked") return false;
    if (filters.focus === "unassigned" && !(open && task.assignee === "Unassigned")) return false;
    return true;
  }).sort((a, b) => {
    if (filters.sort === "updated") return b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id);
    if (filters.sort === "priority") return priorityRank[a.priority] - priorityRank[b.priority] || (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || a.id.localeCompare(b.id);
    const completed = Number(a.status === "Completed") - Number(b.status === "Completed");
    return completed || (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || priorityRank[a.priority] - priorityRank[b.priority] || a.id.localeCompare(b.id);
  });
}

export type AttentionCategory = "tasks" | "samples" | "inventory" | "equipment" | "reviews" | "operations";
export interface AttentionItem {
  id: string; category: AttentionCategory; title: string; detail: string; owner: string;
  urgency: "urgent" | "action" | "upcoming"; href: string; dueDate?: string;
}
export interface OperationsRecords { operations?: OperationsCase[]; tasks: LabTask[]; samples: Sample[]; inventory: InventoryItem[]; equipment: EquipmentRecord[]; experiments: Experiment[]; reports: Pick<Report, "id" | "number" | "title" | "status" | "author" | "reviewer">[]; }
export function buildAttentionQueue(records: OperationsRecords, now = new Date()): AttentionItem[] {
  const result: AttentionItem[] = [];
  for (const task of records.tasks) {
    if (task.status === "Completed") continue;
    const days = daysUntil(task.dueDate, now);
    const overdue = days !== null && days < 0;
    if (!overdue && task.status !== "Blocked" && !["Critical", "High"].includes(task.priority) && !(days !== null && days <= 7)) continue;
    result.push({ id:`task:${task.id}`, category:"tasks", title:task.title, detail:overdue ? "Overdue task" : task.status === "Blocked" ? "Blocked task" : `${task.priority} priority · ${task.status}`, owner:task.assignee, urgency:overdue || task.priority === "Critical" ? "urgent" : days !== null && days > 0 && days <= 7 && task.priority !== "High" && task.status !== "Blocked" ? "upcoming" : "action", href:`/app/tasks?task=${encodeURIComponent(task.id)}#task-${encodeURIComponent(task.id)}`, dueDate:task.dueDate });
  }
  for (const sample of records.samples) {
    if (["Consumed", "Disposed"].includes(sample.status)) continue;
    const days = daysUntil(sample.expirationDate, now);
    if (sample.status !== "Expired" && !(days !== null && days <= 30)) continue;
    result.push({ id:`sample:${sample.id}`, category:"samples", title:`${sample.code} · ${sample.name}`, detail:sample.status === "Expired" || (days !== null && days < 0) ? "Expired sample" : days === 0 ? "Sample expires today" : "Sample expires within 30 days", owner:sample.owner, urgency:sample.status === "Expired" || (days !== null && days <= 0) ? "urgent" : "upcoming", href:`/app/samples/${encodeURIComponent(sample.id)}`, dueDate:sample.expirationDate });
  }
  for (const item of records.inventory) {
    const days = daysUntil(item.expirationDate, now);
    const low = item.quantity <= item.minimumStock;
    const expiring = item.quantity > 0 && days !== null && days <= 30;
    if (!low && !expiring) continue;
    const reasons = [low ? `Low stock: ${item.quantity} ${item.unit}; minimum ${item.minimumStock}` : "", expiring ? days! < 0 ? "Expired stock" : days === 0 ? "Stock expires today" : "Stock expires within 30 days" : ""].filter(Boolean);
    result.push({ id:`inventory:${item.id}`, category:"inventory", title:`${item.code} · ${item.name}`, detail:reasons.join(" · "), owner:item.owner, urgency:expiring && days! <= 0 ? "urgent" : low ? "action" : "upcoming", href:`/app/inventory?q=${encodeURIComponent(item.code)}`, dueDate:expiring ? item.expirationDate : undefined });
  }
  for (const item of records.equipment) {
    if (item.status === "Retired") continue;
    const dates = [{date:item.nextCalibration, label:"Calibration"}, {date:item.nextMaintenance, label:"Maintenance"}].flatMap(entry => {
      const days = daysUntil(entry.date, now);
      return days !== null && days <= 7 ? [{...entry, days}] : [];
    });
    const unavailable = ["Calibration required", "Out of service", "Maintenance"].includes(item.status);
    if (!unavailable && !dates.length) continue;
    dates.sort((a,b) => a.days - b.days);
    result.push({ id:`equipment:${item.id}`, category:"equipment", title:`${item.code} · ${item.name}`, detail:[unavailable ? item.status : "", ...dates.map(d => `${d.label} ${d.days < 0 ? "overdue" : d.days === 0 ? "due today" : "due within 7 days"}`)].filter(Boolean).join(" · "), owner:item.owner, urgency:item.status === "Out of service" || dates.some(d => d.days <= 0) ? "urgent" : unavailable ? "action" : "upcoming", href:`/app/equipment/${encodeURIComponent(item.id)}`, dueDate:dates[0]?.date });
  }
  for (const item of records.experiments) {
    if (!["Under review", "Paused", "Failed"].includes(item.status)) continue;
    result.push({id:`experiment:${item.id}`, category:"reviews", title:`${item.code} · ${item.title}`, detail:`Experiment ${item.status.toLowerCase()}`, owner:item.owner, urgency:item.status === "Failed" ? "urgent" : "action", href:`/app/experiments/${encodeURIComponent(item.id)}`});
  }
  for (const item of records.reports) {
    if (item.status !== "Ready for review" && item.status !== "Changes requested") continue;
    result.push({id:`report:${item.id}`, category:"reviews", title:`${item.number} · ${item.title}`, detail:`Report ${item.status.toLowerCase()}`, owner:item.status === "Ready for review" ? item.reviewer : item.author, urgency:"action", href:`/app/reports/${encodeURIComponent(item.id)}`});
  }
  for(const item of records.operations??[]){
    if(item.state==="closed")continue;
    const days=daysUntil(item.dueDate,now),overdue=days!==null&&days<0;
    if(!overdue&&item.priority!=="critical"&&item.priority!=="high"&&item.state!=="in_review")continue;
    result.push({id:`operations:${item.id}`,category:"operations",title:item.title,detail:item.state==="in_review"?"Operations record awaiting independent review":overdue?"Operations record overdue":`${item.priority} priority operations record`,owner:item.ownerLabel,urgency:overdue||item.priority==="critical"?"urgent":"action",href:`/app/operations/${encodeURIComponent(item.id)}`,dueDate:item.dueDate});
  }
  const rank = {urgent:0, action:1, upcoming:2};
  return result.sort((a,b) => rank[a.urgency] - rank[b.urgency] || (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || a.id.localeCompare(b.id));
}

export function filterInventoryAttention(items: InventoryItem[], status?: string, now = new Date()) {
  return items.filter(item => {
    const days = daysUntil(item.expirationDate, now);
    if (status === "low") return item.quantity <= item.minimumStock;
    if (status === "expired") return item.quantity > 0 && days !== null && days < 0;
    if (status === "expiring") return item.quantity > 0 && days !== null && days >= 0 && days <= 30;
    return true;
  });
}
