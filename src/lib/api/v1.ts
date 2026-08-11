import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getWorkspaceIdentity, type WorkspaceIdentity } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/types";

export async function getApiIdentity(request:Request):Promise<WorkspaceIdentity|null>{
  const authorization=request.headers.get("authorization");
  if(!authorization?.startsWith("Bearer "))return getWorkspaceIdentity();
  const token=authorization.slice(7).trim(),url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;if(!url||!key||!token)return null;
  const client=createSupabaseClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});const userResult=await client.auth.getUser(token);const user=userResult.data.user;if(!user)return null;
  const membership=await createAdminClient().from("organization_members").select("organization_id,role,organizations(name)").eq("user_id",user.id).eq("status","active").limit(1).maybeSingle();if(membership.error||!membership.data)return null;const organization=Array.isArray(membership.data.organizations)?membership.data.organizations[0]:membership.data.organizations;
  return {userId:user.id,email:user.email??"",fullName:String(user.user_metadata.full_name??user.email??"API user"),organizationId:membership.data.organization_id,organizationName:organization?.name??"Organization",role:membership.data.role as Role,demo:false};
}

export function pageParams(request:Request){const url=new URL(request.url);const limit=Math.min(100,Math.max(1,Number(url.searchParams.get("limit")??25)||25));const offset=Math.max(0,Number(url.searchParams.get("offset")??0)||0);return {limit,offset,status:url.searchParams.get("status")?.slice(0,40),q:url.searchParams.get("q")?.trim().slice(0,120)};}

export const apiResources={
  experiments:{table:"experiments",columns:"id,code,title,project_id,objective,experiment_type,start_date,completion_date,status,priority,tags,created_at,updated_at",search:["code","title","objective"]},
  samples:{table:"samples",columns:"id,code,name,sample_type,source,project_id,experiment_id,parent_sample_id,quantity,concentration,unit,storage_location,freezer,rack,box,position,status,expiration_date,barcode,created_at,updated_at",search:["code","name","barcode"]},
  inventory:{table:"inventory_items",columns:"id,code,name,item_type,manufacturer,catalog_number,lot_number,quantity,unit,minimum_stock,storage_location,received_date,opened_date,expiration_date,created_at,updated_at",search:["code","name","catalog_number","lot_number"]},
  equipment:{table:"equipment",columns:"id,code,name,category,manufacturer,model,serial_number,location,status,last_maintenance,next_maintenance,last_calibration,next_calibration,created_at,updated_at",search:["code","name","serial_number"]},
  builds:{table:"device_builds",columns:"id,code,name,project_id,revision,serial_number,firmware_version,configuration,status,built_at,created_at,updated_at",search:["code","name","serial_number","configuration"]},
  evidence:{table:"evidence_packets",columns:"id,experiment_id,packet_number,version,readiness_status,checksum_sha256,created_at",search:["packet_number"]},
} as const;
export type ApiResource=keyof typeof apiResources;

export type UntypedRowsResult={data:Array<Record<string,unknown>>|null;error:{message:string}|null;count:number|null};
export type UntypedQuery=PromiseLike<UntypedRowsResult>&{eq:(column:string,value:unknown)=>UntypedQuery;is:(column:string,value:unknown)=>UntypedQuery;or:(filters:string)=>UntypedQuery;order:(column:string,options?:{ascending?:boolean})=>UntypedQuery;range:(from:number,to:number)=>UntypedQuery;limit:(count:number)=>UntypedQuery};
export function untypedSelect(table:string,columns:string,options?:{count?:"exact"}){const client=createAdminClient() as unknown as {from:(name:string)=>{select:(selection:string,options?:{count?:"exact"})=>UntypedQuery}};return client.from(table).select(columns,options);}
