import { Plus } from "lucide-react";
import { createProject } from "../actions";
import { requireWorkspaceIdentity } from "@/lib/auth";
import { listProjects, listReports } from "@/lib/data/workspace";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable, Td } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/utils";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const identity = await requireWorkspaceIdentity(); const [projects,reports] = await Promise.all([listProjects(identity),listReports(identity)]); const creating = (await searchParams).new === "1";
  return <><PageHeader eyebrow="Shared project record" title="Projects" description="Connect reports, components, suppliers, lots, documents, and activity around a development objective." actions={<ButtonLink href="/app/projects?new=1"><Plus size={16} />Create project</ButtonLink>} />{creating&&<Card><CardHeader title="Create project" description="Project codes are unique within this workspace."/><CardContent><form action={createProject} className="form-grid"><div className="form-field"><label htmlFor="code">Project code</label><input id="code" name="code" required maxLength={30}/></div><div className="form-field"><label htmlFor="targetDate">Target date</label><input id="targetDate" name="targetDate" type="date"/></div><div className="form-field form-field-wide"><label htmlFor="name">Project name</label><input id="name" name="name" required maxLength={160}/></div><div className="form-field form-field-wide"><label htmlFor="product">Product or system</label><input id="product" name="product" required maxLength={160}/></div><div className="form-field form-field-wide"><label htmlFor="description">Development objective</label><textarea id="description" name="description" rows={4} maxLength={4000}/></div><div className="form-field-wide flex gap-3"><Button>Create project</Button><ButtonLink href="/app/projects" variant="secondary">Cancel</ButtonLink></div></form></CardContent></Card>}<Card><DataTable caption="Projects" headers={["Project","Product","Owner","Status","Reports","Target"]}>{projects.map(project=><tr key={project.id}><Td><strong className="block text-slate-950">{project.code}</strong>{project.name}</Td><Td>{project.product}</Td><Td>{project.owner}</Td><Td><Badge tone={project.status==="Active"?"good":"info"}>{project.status}</Badge></Td><Td>{reports.filter(report=>report.projectId===project.id).length}</Td><Td>{project.targetDate?formatDate(project.targetDate):"—"}</Td></tr>)}</DataTable></Card></>;
}
