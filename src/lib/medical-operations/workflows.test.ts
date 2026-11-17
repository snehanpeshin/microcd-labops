import { describe,expect,it } from "vitest";
import { caseInputSchema,evidenceHref,evidenceSchema,transitionAllowed,validateFields,workflowFor,workflows,sources,type OperationsCase } from "./workflows";
import { areaCases,caseMetrics,operationAreas } from "./dashboards";
const record:OperationsCase={id:"case-a",organizationId:"org",workflowKey:"capa",title:"Investigate leak",state:"active",priority:"critical",ownerLabel:"Quality lead",dueDate:"2026-11-16",fields:{},evidence:[],revision:1,createdBy:"author",lastEditedBy:"author",updatedAt:"2026-11-17T00:00:00Z",decisionNote:"Investigation started"};
describe("FDA-grounded operations workflows",()=>{
 it("covers all 26 workflows across nine dashboards without duplicate fields",()=>{
  expect(workflows).toHaveLength(26);expect(operationAreas).toHaveLength(9);
  expect(new Set(workflows.map(w=>w.key)).size).toBe(workflows.length);
  for(const w of workflows){expect(new Set(w.fields.map(f=>f.key)).size).toBe(w.fields.length);expect(operationAreas.some(a=>(a.keys as readonly string[]).includes(w.key))).toBe(true);expect(w.fields.some(f=>f.key==="applicability")).toBe(true);for(const key of w.sourceKeys)expect(new URL(sources[key].url).hostname).toBe("www.fda.gov");}
 });
 it("allows incomplete drafts but blocks blank and placeholder submissions",()=>{
  const workflow=workflowFor("capa")!;
  expect(validateFields(workflow,{}).missing.length).toBe(workflow.fields.length);
  expect(()=>validateFields(workflow,{applicability:"N/A"},true)).toThrow("Complete these fields");
  const full=Object.fromEntries(workflow.fields.map(f=>[f.key,"Documented assessment with objective evidence and a justified conclusion."]));
  expect(validateFields(workflow,full,true).missing).toEqual([]);
 });
 it("rejects unexpected fields, oversized content, invalid dates, and arbitrary evidence targets",()=>{
  expect(()=>validateFields(workflowFor("capa")!,{injected:"data"})).toThrow();
  expect(()=>validateFields(workflowFor("capa")!,{problem:"x".repeat(8001)})).toThrow();
  expect(caseInputSchema.safeParse({title:"Record",ownerLabel:"Lead",priority:"high",dueDate:"2026-02-30",parentId:""}).success).toBe(false);
  expect(evidenceSchema.safeParse([{kind:"untrusted_table",id:"not-a-uuid",label:"Unsafe"}]).success).toBe(false);
  expect(evidenceHref({kind:"report",id:"abc/def"})).toBe("/app/reports/abc%2Fdef");
 });
 it("requires independent review and leaves closed records immutable",()=>{
  expect(transitionAllowed("active","in_review",false,"author","author")).toBe(true);
  expect(transitionAllowed("in_review","closed",true,"author","author")).toBe(false);
  expect(transitionAllowed("in_review","closed",false,"author","reviewer")).toBe(false);
  expect(transitionAllowed("in_review","closed",true,"author","reviewer")).toBe(true);
  expect(transitionAllowed("in_review","active",true,"author","reviewer")).toBe(false);
  expect(transitionAllowed("closed","active",true,"author","reviewer")).toBe(false);
 });
 it("derives dashboard counts from records and excludes closed work from overdue/critical queues",()=>{
  const rows=[record,{...record,id:"closed",state:"closed" as const},{...record,id:"review",state:"in_review" as const,priority:"medium" as const,dueDate:"2026-11-20"}];
  expect(caseMetrics(rows,"2026-11-17")).toEqual({total:3,open:2,review:1,overdue:1,critical:1,closed:1});
  expect(areaCases(rows,operationAreas.find(a=>a.key==="suppliers")!)).toEqual([]);
  expect(areaCases(rows,operationAreas.find(a=>a.key==="capa")!)).toHaveLength(3);
 });
});
