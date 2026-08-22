import { NextResponse } from "next/server";
import { getWorkspaceIdentity } from "@/lib/auth";
import { getRegulatoryProfile,listRegulatoryRequirements } from "@/lib/data/regulatory";
import { generateDesignControlMatrix,generateTraceabilityMatrix } from "@/lib/regulatory/design-controls";
import { can } from "@/lib/security/permissions";
import { csvEscape } from "@/lib/growth-capabilities";

const row=(values:unknown[])=>values.map(csvEscape).join(",");

export async function GET(_request:Request,{params}:{params:Promise<{id:string;matrix:string}>}){
  const identity=await getWorkspaceIdentity();if(!identity)return NextResponse.json({error:"Authentication required"},{status:401});
  if(!identity.demo&&!can(identity.role,"workspace:export"))return NextResponse.json({error:"Export permission required"},{status:403});
  const {id,matrix}=await params,profile=await getRegulatoryProfile(identity,id);if(!profile)return NextResponse.json({error:"Regulatory profile not found"},{status:404});
  const requirements=await listRegulatoryRequirements(identity,profile.id,profile.projectId);let csv:string,kind:string;
  if(matrix==="design-controls"){
    const rows=generateDesignControlMatrix(profile,requirements);csv=[row(["Development Stage","Primary Quality File","Required Document Artifact","Readiness","Mapped Requirements","Linked Evidence Count","Linked Evidence"]),...rows.map((item)=>row([item.stage,item.primaryQualityFile,item.artifact,item.status,item.requirementCategories.join("; "),item.evidence.length,item.evidence.map((evidence)=>evidence.label).join("; ")]))].join("\n");kind="design-controls";
  }else if(matrix==="traceability"){
    const rows=generateTraceabilityMatrix(requirements);csv=[row(["RTM ID","Source Requirement","Trace Path","Status","Linked Evidence","Next Action"]),...rows.map((item)=>row([item.id,item.sourceRequirement,item.designControlTarget,item.status,item.evidence.map((evidence)=>evidence.label).join("; "),item.nextAction]))].join("\n");kind="requirements-traceability-matrix";
  }else return NextResponse.json({error:"Matrix not found"},{status:404});
  const product=profile.productName.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");return new Response(csv,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="${product}-${kind}.csv"`,"Cache-Control":"private, no-store"}});
}
