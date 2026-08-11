import Link from "next/link";
import { Plus } from "lucide-react";
import { createExperiment } from "../lab-actions";
import { requireWorkspaceIdentity } from "@/lib/auth";
import { listExperiments, listProtocolVersions } from "@/lib/data/lab-operations";
import { listProjects } from "@/lib/data/workspace";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable, Td } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { RegistryToolbar } from "@/components/ui/registry-toolbar";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDate } from "@/lib/utils";

const statuses=["draft","planned","ready","running","paused","completed","failed","cancelled","under_review","approved"].map(value=>({value,label:value.replaceAll("_"," ").replace(/^./,c=>c.toUpperCase())}));
const tone=(status:string)=>status==="Approved"||status==="Completed"?"good" as const:status==="Failed"||status==="Cancelled"?"danger" as const:status==="Running"?"info" as const:"warning" as const;

export default async function ExperimentsPage({searchParams}:{searchParams:Promise<{q?:string;status?:string;new?:string}>}){
  const identity=await requireWorkspaceIdentity(); const params=await searchParams;
  const [experiments,projects,versions]=await Promise.all([listExperiments(identity,params),listProjects(identity),listProtocolVersions(identity)]);
  return <><PageHeader eyebrow="Scientific execution" title="Experiments" description="Plan, execute, review, and approve experimental work with traceable samples and protocol versions." actions={!identity.demo?<ButtonLink href="/app/experiments?new=1"><Plus size={16}/>New experiment</ButtonLink>:undefined}/>
  {params.new==="1"&&!identity.demo?<Card><CardHeader title="Create experiment" description="Required fields are marked by the browser. The experiment starts as draft or planned."/><CardContent><form action={createExperiment} className="form-grid"><div className="form-field form-field-wide"><label htmlFor="title">Title</label><input id="title" name="title" required maxLength={180}/></div><div className="form-field"><label htmlFor="projectId">Project</label><select id="projectId" name="projectId" required><option value="">Select project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></div><div className="form-field"><label htmlFor="type">Experiment type</label><input id="type" name="type" required placeholder="Flow characterization"/></div><div className="form-field"><label htmlFor="protocolVersionId">Protocol version</label><select id="protocolVersionId" name="protocolVersionId"><option value="">No protocol linked</option>{versions.map(v=><option key={v.id} value={v.id}>{v.title} · v{v.version}</option>)}</select></div><div className="form-field"><label htmlFor="startDate">Planned start</label><input id="startDate" name="startDate" type="date"/></div><div className="form-field"><label htmlFor="priority">Priority</label><select id="priority" name="priority" defaultValue="medium"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div><div className="form-field"><label htmlFor="tags">Tags</label><input id="tags" name="tags" placeholder="flow, verification"/></div><div className="form-field form-field-wide"><label htmlFor="objective">Objective</label><textarea id="objective" name="objective" rows={4} required minLength={10}/></div><div className="form-field form-field-wide"><label htmlFor="notes">Execution notes</label><textarea id="notes" name="notes" rows={3}/></div><div className="form-field-wide flex gap-3"><SubmitButton idle="Create experiment" pending="Creating…"/><ButtonLink href="/app/experiments" variant="secondary">Cancel</ButtonLink></div></form></CardContent></Card>:null}
  <Card><RegistryToolbar q={params.q} status={params.status} statuses={statuses}/>{experiments.length?<DataTable caption="Experiments" headers={["Experiment","Project","Owner","Priority","Status","Updated"]}>{experiments.map(e=><tr key={e.id}><Td><Link className="font-semibold text-teal-800 hover:underline" href={`/app/experiments/${e.id}`}>{e.code}</Link><span className="block text-slate-600">{e.title}</span></Td><Td>{e.projectName}</Td><Td>{e.owner}</Td><Td><Badge tone={e.priority==="Critical"?"danger":e.priority==="High"?"warning":"neutral"}>{e.priority}</Badge></Td><Td><Badge tone={tone(e.status)}>{e.status}</Badge></Td><Td>{formatDate(e.updatedAt)}</Td></tr>)}</DataTable>:<EmptyState title="No experiments found" description={params.q||params.status?"Try clearing the current filters.":"Create the first experiment to begin traceable laboratory execution."}/>}</Card></>;
}
