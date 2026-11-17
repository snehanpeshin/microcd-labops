import { createHash } from "node:crypto";
import { beforeEach,describe,expect,it,vi } from "vitest";
const mocks=vi.hoisted(()=>({identity:vi.fn(),record:vi.fn(),events:vi.fn(),records:vi.fn()}));
vi.mock("@/lib/auth",()=>({getWorkspaceIdentity:mocks.identity}));
vi.mock("@/lib/data/medical-operations",()=>({getOperationsCase:mocks.record,listCaseEvents:mocks.events,listOperationsCases:mocks.records}));
import { GET } from "@/app/api/operations/[id]/passport/route";
const id="00000000-0000-4000-8000-000000000001";
const request=()=>GET(new Request(`https://example.invalid/api/operations/${id}/passport`),{params:Promise.resolve({id})});
beforeEach(()=>{vi.clearAllMocks();mocks.identity.mockResolvedValue({role:"owner",demo:false,organizationName:"Example lab"});mocks.record.mockResolvedValue({id,workflowKey:"capa",state:"active",evidence:[]});mocks.events.mockResolvedValue([]);mocks.records.mockResolvedValue([]);});
describe("evidence passport exports",()=>{
 it("denies unauthenticated and unprivileged exports",async()=>{mocks.identity.mockResolvedValueOnce(null);expect((await request()).status).toBe(401);mocks.identity.mockResolvedValueOnce({role:"engineer",demo:false});expect((await request()).status).toBe(403);});
 it("returns not-found when the scoped record is unavailable",async()=>{mocks.record.mockResolvedValue(null);expect((await request()).status).toBe(404);});
 it("hashes the exact documented payload and prevents shared caching",async()=>{const response=await request();const body=await response.json();expect(response.status).toBe(200);expect(response.headers.get("cache-control")).toBe("private, no-store");expect(body.manifest.sha256).toBe(createHash("sha256").update(JSON.stringify(body.payload,null,2),"utf8").digest("hex"));expect(body.payload.limitations).toContain("not an FDA submission");});
});
