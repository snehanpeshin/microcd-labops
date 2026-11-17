import { beforeEach,describe,expect,it,vi } from "vitest";
import type { WorkspaceIdentity } from "@/lib/auth";
import { workflows } from "./workflows";
const mocks=vi.hoisted(()=>({result:vi.fn(),from:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({from:mocks.from})}));
import { operationsReady,listOperationsCases } from "@/lib/data/medical-operations";
const identity:WorkspaceIdentity={userId:"test",organizationId:"org",organizationName:"Test",email:"test@example.invalid",fullName:"Test",role:"owner",demo:false};
beforeEach(()=>{vi.clearAllMocks();const query={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),limit:mocks.result};mocks.from.mockReturnValue(query);});
describe("operations activation boundary",()=>{
 it("treats only an absent schema as inactive",async()=>{mocks.result.mockResolvedValue({data:null,error:{code:"PGRST205"}});expect(await operationsReady({...identity})).toBe(false);});
 it("fails closed for an incomplete workflow catalog",async()=>{mocks.result.mockResolvedValue({data:[{key:"capa"}],error:null});expect(await operationsReady({...identity})).toBe(false);});
 it("recognizes all definitions after activation",async()=>{mocks.result.mockResolvedValue({data:workflows.map(w=>({key:w.key})),error:null});expect(await operationsReady({...identity})).toBe(true);});
 it("does not hide database failures as an empty compliant workspace",async()=>{mocks.result.mockResolvedValue({data:null,error:{code:"42501"}});await expect(operationsReady({...identity})).rejects.toThrow("could not be checked");});
 it("does not query the case table before activation",async()=>{mocks.result.mockResolvedValue({data:null,error:{code:"42P01"}});expect(await listOperationsCases({...identity})).toEqual([]);expect(mocks.from).toHaveBeenCalledTimes(1);expect(mocks.from).toHaveBeenCalledWith("medical_operations_definitions");});
});
