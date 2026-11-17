import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getWorkspaceIdentity } from "@/lib/auth";
import { can } from "@/lib/security/permissions";
import { getOperationsCase,listCaseEvents,listOperationsCases } from "@/lib/data/medical-operations";
import { sources,workflowFor } from "@/lib/medical-operations/workflows";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const identity=await getWorkspaceIdentity();if(!identity)return NextResponse.json({error:"Authentication required"},{status:401});
 if(identity.demo||!can(identity.role,"workspace:export"))return NextResponse.json({error:"Export permission required"},{status:403});
 const {id}=await params,record=await getOperationsCase(identity,id);if(!record)return NextResponse.json({error:"Record not found"},{status:404});
 const workflow=workflowFor(record.workflowKey);if(!workflow)return NextResponse.json({error:"Workflow unavailable"},{status:409});
 const [events,records]=await Promise.all([listCaseEvents(identity,id),listOperationsCases(identity)]);
 const payload={format:"microcd-labops-operations-passport-v1",exportedAt:new Date().toISOString(),organization:identity.organizationName,record,workflow,sources:workflow.sourceKeys.map(k=>sources[k]),followups:records.filter(c=>c.parentId===record.id).map(c=>({id:c.id,title:c.title,state:c.state})),history:events,historyWindow:"Latest 200 event snapshots; follow-ups from up to 500 loaded records",limitations:"Evidence references capture descriptions and identifiers, not copies of mutable source records. This export is not an FDA submission, electronic signature, or certification."};
 const serialized=JSON.stringify(payload,null,2);const sha256=createHash("sha256").update(serialized,"utf8").digest("hex");
 return new NextResponse(JSON.stringify({manifest:{algorithm:"SHA-256",sha256,scope:"UTF-8 JSON.stringify(payload, null, 2); no trailing newline. Digest detects byte changes, not authorship."},payload},null,2),{headers:{"Content-Type":"application/json; charset=utf-8","Content-Disposition":`attachment; filename="labops-passport-${id}.json"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}
