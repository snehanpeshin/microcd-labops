import { describe, expect, it } from "vitest";
import { buildAttentionQueue, daysUntil, filterInventoryAttention, filterTasks, type OperationsRecords } from "./operations-focus";
import { demoEquipment, demoExperiments, demoInventory, demoLabTasks, demoSamples } from "./data/lab-demo";
import { labLabel } from "./lab-labels";
import { formatDate } from "./utils";

const now = new Date("2026-08-10T23:59:59Z");
const empty = (): OperationsRecords => ({tasks:[],samples:[],inventory:[],equipment:[],experiments:[],reports:[]});
describe("operations attention", () => {
  it("uses actual UTC calendar dates across leap days and offset timestamps", () => {
    expect(daysUntil("2026-08-10",now)).toBe(0);
    expect(daysUntil("2026-08-11",now)).toBe(1);
    expect(daysUntil("2028-03-01",new Date("2028-02-28T10:00:00Z"))).toBe(2);
    expect(daysUntil("2026-02-30",now)).toBeNull();
    expect(daysUntil(undefined,now)).toBeNull();
    expect(daysUntil("2026-08-10",new Date("2026-08-10T23:00:00-04:00"))).toBe(-1);
  });
  it("keeps persisted multiword statuses consistent with demo and workflow types", () => {
    expect(["in_progress","under_review","calibration_required","out_of_service","in_use","status_change"].map(labLabel)).toEqual(["In progress","Under review","Calibration required","Out of service","In use","Status change"]);
  });
  it("preserves date-only labels in western timezones", () => {
    const previous = process.env.TZ;
    try { process.env.TZ = "America/Los_Angeles"; expect(formatDate("2026-08-10")).toBe("Aug 10, 2026"); }
    finally { if(previous===undefined) delete process.env.TZ; else process.env.TZ=previous; }
  });
  it("catches service deadlines even when equipment is marked available", () => {
    const records = empty();
    records.equipment = [{...demoEquipment[2],nextCalibration:"2026-08-09",nextMaintenance:"2026-08-15"}];
    const queue = buildAttentionQueue(records,now);
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({urgency:"urgent",dueDate:"2026-08-09",href:`/app/equipment/${demoEquipment[2].id}`});
    expect(queue[0].detail).toContain("Calibration overdue");
    expect(queue[0].detail).toContain("Maintenance due within 7 days");
  });
  it("excludes consumed/disposed samples, empty stock expiry, retired equipment, and completed work", () => {
    const records = empty();
    records.samples = ["Consumed","Disposed"].map(status=>({...demoSamples[0],status:status as "Consumed"|"Disposed",expirationDate:"2026-01-01"}));
    records.inventory = [{...demoInventory[0],quantity:0,minimumStock:-1,expirationDate:"2026-01-01"}];
    records.equipment = [{...demoEquipment[0],status:"Retired",nextCalibration:"2026-01-01"}];
    records.tasks = [{...demoLabTasks[0],status:"Completed"}];
    expect(buildAttentionQueue(records,now)).toEqual([]);
  });
  it("combines inventory risks once and orders urgent items before upcoming items", () => {
    const records = empty();
    records.inventory=[{...demoInventory[0],expirationDate:"2026-08-09"}];
    records.samples=[{...demoSamples[0],expirationDate:"2026-08-30"}];
    const queue=buildAttentionQueue(records,now);
    expect(queue).toHaveLength(2);
    expect(queue[0].category).toBe("inventory");
    expect(queue[0].detail).toContain("Low stock");
    expect(queue[0].detail).toContain("Expired stock");
    expect(queue[1].urgency).toBe("upcoming");
  });
  it("includes failed/paused/review experiments and reports requiring follow-through", () => {
    const records=empty();
    records.reports=[{id:"report",number:"R-001",title:"Review",status:"Ready for review",author:"Author",reviewer:"Reviewer"}];
    records.experiments=[{...demoExperiments[0],status:"Failed"},demoExperiments[1]];
    expect(buildAttentionQueue(records,now).map(item=>item.urgency)).toEqual(["urgent","action","action"]);
  });
});
describe("task focus", () => {
  it("combines filters and searches assignees and linked experiment codes", () => {
    expect(filterTasks(demoLabTasks,{task:"task_cal"},now).map(t=>t.id)).toEqual(["task_cal"]);
    expect(filterTasks(demoLabTasks,{q:"maya",focus:"overdue",priority:"critical"},now).map(t=>t.id)).toEqual(["task_review"]);
    expect(filterTasks(demoLabTasks,{q:"EXP-2026-00118",status:"to_do"},now).map(t=>t.id)).toEqual(["task_cal"]);
    expect(filterTasks(demoLabTasks,{focus:"week"},now).every(t=>daysUntil(t.dueDate,now)!>=0)).toBe(true);
  });
  it("never includes completed tasks in open, overdue, or unassigned focus", () => {
    const tasks=[{...demoLabTasks[0],status:"Completed" as const,assignee:"Unassigned"}];
    for(const focus of ["open","overdue","week","unassigned"]) expect(filterTasks(tasks,{focus},now)).toEqual([]);
  });
  it("sorts without mutating source records and puts undated work after dated open work", () => {
    const tasks=[{...demoLabTasks[0],id:"undated",dueDate:undefined}, {...demoLabTasks[1],id:"dated"}];
    expect(filterTasks(tasks,{},now).map(t=>t.id)).toEqual(["dated","undated"]);
    expect(tasks[0].id).toBe("undated");
    expect(filterTasks(tasks,{sort:"priority"},now)[0].id).toBe("undated");
  });
});

describe("inventory attention filters", () => {
  it("distinguishes low stock, already expired, and upcoming expiry", () => {
    const items=[{...demoInventory[0],id:"expired",expirationDate:"2026-08-09"}, {...demoInventory[1],id:"upcoming",expirationDate:"2026-08-10"}, {...demoInventory[2],id:"empty",quantity:0,expirationDate:"2026-08-09"}];
    expect(filterInventoryAttention(items,"expired",now).map(i=>i.id)).toEqual(["expired"]);
    expect(filterInventoryAttention(items,"expiring",now).map(i=>i.id)).toEqual(["upcoming"]);
    expect(filterInventoryAttention(items,"low",now).map(i=>i.id)).toEqual(["expired","empty"]);
  });
});
