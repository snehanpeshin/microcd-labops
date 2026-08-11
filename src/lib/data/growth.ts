import type { WorkspaceIdentity } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type PilotMetric = { id:string; name:string; unit:string; baseline:number; target:number; currentValue?:number; direction:"increase"|"decrease"; notes:string; updatedAt:string };
export type NotificationPreferences = { email:string; overdueTasks:boolean; lowStock:boolean; expirations:boolean; calibration:boolean; leadDays:number; digestFrequency:"daily"|"weekly"|"off" };

export async function getNotificationPreferences(identity:WorkspaceIdentity):Promise<NotificationPreferences>{
  if(identity.demo) return {email:identity.email,overdueTasks:true,lowStock:true,expirations:true,calibration:true,leadDays:14,digestFrequency:"daily"};
  const supabase=await createClient();const result=await supabase.from("notification_preferences").select("email,overdue_tasks,low_stock,expirations,calibration,lead_days,digest_frequency").eq("organization_id",identity.organizationId).eq("user_id",identity.userId).maybeSingle();
  if(result.error) throw new Error("Alert preferences could not be loaded.");
  return result.data?{email:result.data.email,overdueTasks:result.data.overdue_tasks,lowStock:result.data.low_stock,expirations:result.data.expirations,calibration:result.data.calibration,leadDays:result.data.lead_days,digestFrequency:result.data.digest_frequency}:{email:identity.email,overdueTasks:true,lowStock:true,expirations:true,calibration:true,leadDays:14,digestFrequency:"daily"};
}

export async function listPilotMetrics(identity:WorkspaceIdentity):Promise<PilotMetric[]>{
  if(identity.demo) return [{id:"metric-demo",name:"Time to locate experiment context",unit:"minutes",baseline:18,target:5,currentValue:9,direction:"decrease",notes:"Measured during a fictional pilot workflow.",updatedAt:new Date().toISOString()}];
  const supabase=await createClient();const result=await supabase.from("pilot_metrics").select("id,name,unit,baseline,target,current_value,direction,notes,updated_at").eq("organization_id",identity.organizationId).order("updated_at",{ascending:false});
  if(result.error) throw new Error("Pilot metrics could not be loaded.");
  return (result.data??[]).map(row=>({id:row.id,name:row.name,unit:row.unit,baseline:Number(row.baseline),target:Number(row.target),currentValue:row.current_value===null?undefined:Number(row.current_value),direction:row.direction,notes:row.notes,updatedAt:row.updated_at}));
}

export async function getAdoptionSummary(identity:WorkspaceIdentity){
  if(identity.demo) return {events30d:47,activeDays30d:9,recordsCreated30d:18,imports30d:2,exports30d:4,topEvents:[["experiment_created",8],["sample_created",6],["task_status_changed",5]] as [string,number][]};
  const supabase=await createClient();const since=new Date(Date.now()-30*86400000).toISOString();const result=await supabase.from("product_events").select("event_name,occurred_at").eq("organization_id",identity.organizationId).gte("occurred_at",since).order("occurred_at",{ascending:false}).limit(5000);
  if(result.error) throw new Error("Adoption activity could not be loaded.");const events=result.data??[];const counts=new Map<string,number>();events.forEach(event=>counts.set(event.event_name,(counts.get(event.event_name)??0)+1));
  const created=[...counts.entries()].filter(([name])=>name.endsWith("_created")||name.endsWith("_registered")).reduce((sum,[,count])=>sum+count,0);
  return {events30d:events.length,activeDays30d:new Set(events.map(event=>event.occurred_at.slice(0,10))).size,recordsCreated30d:created,imports30d:[...counts.entries()].filter(([name])=>name.includes("import")).reduce((sum,[,count])=>sum+count,0),exports30d:counts.get("workspace_exported")??0,topEvents:[...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6) as [string,number][]};
}

export async function listAppliedTemplates(identity:WorkspaceIdentity){
  if(identity.demo) return ["microfluidic-development"];
  const supabase=await createClient();const result=await supabase.from("workspace_template_runs").select("template_key").eq("organization_id",identity.organizationId);if(result.error)throw new Error("Template history could not be loaded.");return (result.data??[]).map(row=>row.template_key);
}
