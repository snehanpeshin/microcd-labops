import { EngineeringHandoffForm } from "@/components/app/engineering-handoff-form";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireWorkspaceIdentity } from "@/lib/auth";
import { listExperiments } from "@/lib/data/lab-operations";
import { listProjects } from "@/lib/data/workspace";
import { can } from "@/lib/security/permissions";

export default async function EngineeringHandoffPage() {
  const identity = await requireWorkspaceIdentity();
  const allowed = !identity.demo && can(identity.role, "lab:write");
  const [projects, experiments] = allowed
    ? await Promise.all([listProjects(identity), listExperiments(identity)])
    : [[], []];

  return (
    <>
      <PageHeader eyebrow="Projects" title="Attach engineering evidence" description="Save a Modeler design or Analyzer results with a LabOps experiment." />
      <Card>
        <CardHeader title="Review snapshot" description="Select the JSON file downloaded from Modeler or Analyzer, then confirm where it belongs." />
        <CardContent>
          {!allowed ? <p className="text-sm">Ask a workspace member with experiment editing access to attach this snapshot.</p>
            : projects.length ? <EngineeringHandoffForm
              projects={projects.map(({ id, code, name }) => ({ id, label: `${code} · ${name}` }))}
              experiments={experiments.map(({ id, code, title, projectId }) => ({ id, projectId, label: `${code} · ${title}` }))}
            /> : <ButtonLink href="/app/projects?new=1">Create project</ButtonLink>}
        </CardContent>
      </Card>
    </>
  );
}
