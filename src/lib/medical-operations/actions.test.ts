import { beforeEach,describe,expect,it,vi } from "vitest";
import type { WorkspaceIdentity } from "@/lib/auth";
import type { OperationsCase } from "./workflows";
const mocks=vi.hoisted(()=>({identity:vi.fn(),getCase:vi.fn(),client:vi.fn(),options:vi.fn(),verify:vi.fn(),ready:vi.fn()}));
vi.mock("@/lib/auth",()=>({requireWorkspaceIdentity:mocks.identity}));
vi.mock("@/lib/supabase/server",()=>({createClient:mocks.client}));
vi.mock("@/lib/data/medical-operations",()=>({getOperationsCase:mocks.getCase,evidenceOptions:mocks.options,verifyCaseEvidence:mocks.verify,operationsReady:mocks.ready}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("next/navigation",()=>({redirect:vi.fn()}));
import { createOperationsCase,updateOperationsCase } from "@/app/(workspace)/app/operations/actions";
const identity:WorkspaceIdentity={userId:"author",email:"engineer@example.invalid",fullName:"Engineer",organizationId:"org-a",organizationName:"Test",role:"engineer",demo:false};
const record:OperationsCase={id:"00000000-0000-4000-8000-000000000001",organizationId:"org-a",workflowKey:"capa",title:"CAPA record",state:"active",priority:"medium",ownerLabel:"Lead",fields:{},evidence:[],revision:2,createdBy:"author",lastEditedBy:"author",updatedAt:"2026-11-17",decisionNote:"Work started"};
function form(values:Record<string,string>){const data=new FormData();for(const [k,v]of Object.entries(values))data.set(k,v);return data;}
beforeEach(()=>{vi.clearAllMocks();mocks.ready.mockResolvedValue(true);mocks.identity.mockResolvedValue(identity);mocks.client.mockResolvedValue({from:vi.fn(()=>{throw Error("Unexpected database mutation");})});mocks.getCase.mockResolvedValue(record);mocks.verify.mockImplementation(async x=>x);});
describe("operations server-action boundaries",()=>{
 it("fails closed while workspace activation is pending",async()=>{mocks.ready.mockResolvedValue(false);expect((await createOperationsCase({},form({workflowKey:"capa"}))).error).toContain("activation");});
 it("denies creation by viewers before any database mutation",async()=>{mocks.identity.mockResolvedValue({...identity,role:"viewer"});expect((await createOperationsCase({},form({workflowKey:"capa"}))).error).toContain("permission");});
 it("rejects stale revisions",async()=>{expect((await updateOperationsCase({},form({caseId:record.id,revision:"1",intent:"save"}))).error).toContain("changed");});
 it("rejects missing and cross-organization origin records",async()=>{mocks.getCase.mockResolvedValue(null);const r=await createOperationsCase({},form({workflowKey:"capa",title:"A new CAPA",ownerLabel:"Quality lead",priority:"high",dueDate:"",parentId:record.id}));expect(r.error).toContain("not available");});
 it("prevents the author from approving their own submission",async()=>{mocks.identity.mockResolvedValue({...identity,role:"owner"});mocks.getCase.mockResolvedValue({...record,state:"in_review"});expect((await updateOperationsCase({},form({caseId:record.id,revision:"2",intent:"approve"}))).error).toContain("independent reviewer");});
 it("also prevents a different last editor from closing their own work",async()=>{mocks.identity.mockResolvedValue({...identity,userId:"editor",role:"reviewer"});mocks.getCase.mockResolvedValue({...record,state:"in_review",lastEditedBy:"editor"});expect((await updateOperationsCase({},form({caseId:record.id,revision:"2",intent:"approve"}))).error).toContain("independent reviewer");});
 it("does not permit a reviewer to rewrite submitted evidence",async()=>{mocks.identity.mockResolvedValue({...identity,userId:"reviewer",role:"reviewer"});mocks.getCase.mockResolvedValue({...record,state:"in_review"});expect((await updateOperationsCase({},form({caseId:record.id,revision:"2",intent:"save"}))).error).toContain("role");});
 it("prevents placeholder submissions without mutating the record",async()=>{const r=await updateOperationsCase({},form({caseId:record.id,revision:"2",intent:"submit",title:record.title,ownerLabel:"Lead",priority:"high",dueDate:"",decisionNote:"Ready for review",field_applicability:"TBD"}));expect(r.error).toContain("Complete these fields");});
});
