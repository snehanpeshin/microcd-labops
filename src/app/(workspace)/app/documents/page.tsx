import Link from "next/link";
import { ArrowRight, CalendarRange, CheckCircle2, FileCheck2, FileStack, FolderOpen, Plus, ShieldCheck } from "lucide-react";
import { requireWorkspaceIdentity } from "@/lib/auth";
import { listProjects } from "@/lib/data/workspace";
import { listRegulatoryProfiles } from "@/lib/data/regulatory";
import { listQualityDocuments } from "@/lib/data/quality-documents";
import { qualityDocumentCatalog, qualityPhases } from "@/lib/quality-documents/catalog";
import { can } from "@/lib/security/permissions";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { createQualityDocumentPlan } from "./actions";

const tones = { draft: "neutral", in_review: "warning", changes_requested: "danger", approved: "good", obsolete: "neutral" } as const;
const labels = { draft: "Draft", in_review: "In review", changes_requested: "Changes requested", approved: "Approved", obsolete: "Obsolete" };

export default async function QualityDocumentsPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const identity = await requireWorkspaceIdentity();
  const params = await searchParams;
  const [projects, profiles] = await Promise.all([listProjects(identity), listRegulatoryProfiles(identity)]);
  const selected = projects.find((item) => item.id === params.project) ?? projects[0] ?? null;
  const documents = selected ? await listQualityDocuments(identity, selected.id) : [];
  const profile = profiles.find((item) => item.projectId === selected?.id);
  const mayWrite = !identity.demo && can(identity.role, "lab:write");
  const documentByKey = new Map(documents.map((item) => [item.documentKey, item]));
  const approved = documents.filter((item) => item.status === "approved").length;
  const inReview = documents.filter((item) => item.status === "in_review").length;

  return <>
    <PageHeader
      eyebrow="Phase-based design and development records"
      title="Engineering Document Dockets"
      description="Keep every engineering-document template visible by development phase, activate a controlled project set, draft with privacy-protected AI, and route revisions to independent review."
      actions={<ButtonLink href="/app/regulatory" variant="secondary">Open Regulatory Navigator</ButtonLink>}
    />

    <div className="metric-grid">
      <MetricCard label="Phase dockets" value={qualityPhases.length} note="Planning through postmarket" icon={<FolderOpen size={18}/>}/>
      <MetricCard label="Available templates" value={qualityDocumentCatalog.length} note="Core, conditional, and business artifacts" icon={<FileStack size={18}/>}/>
      <MetricCard label="Controlled records" value={documents.length} note={selected ? `Activated for ${selected.code}` : "Choose a project to activate"} icon={<FileCheck2 size={18}/>}/>
      <MetricCard label="Review progress" value={`${approved}/${documents.length || qualityDocumentCatalog.length}`} note={`${inReview} currently awaiting review`} icon={<CheckCircle2 size={18}/>}/>
    </div>

    <Card className="border-teal-200 bg-gradient-to-br from-white to-teal-50">
      <CardContent className="grid gap-5 lg:grid-cols-[1fr_auto]"><div><div className="flex items-center gap-2 text-sm font-semibold text-teal-900"><ShieldCheck size={18}/>Human-controlled AI + data-loss prevention</div><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Each docket begins with an editable template. AI can create a richer rough draft from public template metadata and a screened instruction; working documents and linked evidence remain inside LabOps. Revisions retain provenance and authors cannot approve their own work.</p></div><Badge tone="good" className="self-start">21 templates visible</Badge></CardContent>
    </Card>

    {projects.length ? <Card>
      <CardHeader title="Project docket set" description="Select the project whose controlled engineering record you want to organize."/>
      <CardContent className="flex flex-wrap items-end gap-3"><form method="get" action="/app/dockets" className="flex min-w-[280px] flex-1 items-end gap-3"><label className="form-field flex-1"><span>Project</span><select name="project" defaultValue={selected?.id}>{projects.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label><SubmitButton idle="View dockets" pending="Loading…" variant="secondary"/></form>{mayWrite && selected && !documents.length ? <form action={createQualityDocumentPlan}><input type="hidden" name="projectId" value={selected.id}/><input type="hidden" name="profileId" value={profile?.id ?? ""}/><SubmitButton idle="Activate all 21 templates" pending="Creating docket set…"/></form> : null}</CardContent>
    </Card> : <Card><EmptyState title="Create a project first" description="Each engineering docket set is anchored to a LabOps project." action={<ButtonLink href="/app/projects"><Plus size={16}/>Create project</ButtonLink>}/></Card>}

    {selected && !documents.length ? <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5"><div><strong className="text-amber-950">Templates are visible but not yet controlled records</strong><p className="mt-1 text-sm text-amber-800">Activate the set to create an editable revision-one shell for every docket template in {selected.code}.</p></div>{mayWrite ? <form action={createQualityDocumentPlan}><input type="hidden" name="projectId" value={selected.id}/><input type="hidden" name="profileId" value={profile?.id ?? ""}/><SubmitButton idle="Activate docket set" pending="Creating 21 records…"/></form> : null}</div> : null}

    <nav aria-label="Document docket phases" className="flex gap-2 overflow-x-auto pb-1">
      {qualityPhases.map((phase) => <a key={phase.number} href={`#docket-phase-${phase.number}`} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:border-teal-300 hover:text-teal-800"><span className="grid size-6 place-items-center rounded-full bg-teal-700 text-xs text-white">{phase.number}</span>{phase.name}</a>)}
    </nav>

    <div className="space-y-6">
      {qualityPhases.map((phase) => {
        const phaseRecords = phase.documents.map((definition) => documentByKey.get(definition.key)).filter(Boolean);
        const phaseApproved = phaseRecords.filter((record) => record?.status === "approved").length;
        return <Card key={phase.number} id={`docket-phase-${phase.number}`} className="scroll-mt-24">
          <CardHeader title={`Docket ${phase.number} · ${phase.name}`} description={`${phase.documents.length} engineering templates · ${phaseApproved} approved · planned ${phase.documents[0]?.startWeek ?? 0}–${phase.documents.at(-1)?.endWeek ?? "ongoing"} weeks`} action={<span className="flex items-center gap-2 text-xs text-slate-500"><CalendarRange size={16}/>{phaseRecords.length}/{phase.documents.length} activated</span>}/>
          <CardContent className="grid gap-3 lg:grid-cols-2">
            {phase.documents.map((definition) => {
              const record = documentByKey.get(definition.key);
              const body = <><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-teal-50 text-sm font-bold text-teal-800">P{phase.number}</span><span className="min-w-0 flex-1"><strong className="block text-sm text-slate-950">{definition.title}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{definition.qualityFile} · {definition.sections.length} guided sections · weeks {definition.startWeek}–{definition.endWeek ?? "ongoing"}</span><span className="mt-2 flex flex-wrap gap-2"><Badge tone={definition.applicability === "core" ? "info" : "neutral"}>{definition.applicability}</Badge>{record ? <Badge tone={tones[record.status]}>{labels[record.status]}</Badge> : <Badge>Template ready</Badge>}</span></span>{record ? <ArrowRight size={17} className="shrink-0 text-slate-400"/> : null}</>;
              return record ? <Link key={definition.key} href={`/app/documents/${record.id}`} className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-teal-300 hover:bg-teal-50/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800" aria-label={`Open ${definition.title}`}>{body}</Link> : <article key={definition.key} className="flex items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4">{body}</article>;
            })}
          </CardContent>
        </Card>;
      })}
    </div>

    <Card><CardContent className="flex gap-3 text-sm leading-6 text-slate-600"><FileCheck2 className="mt-0.5 shrink-0 text-teal-700" size={19}/><p><strong className="text-slate-900">Important boundary:</strong> dockets organize templates, records, evidence, revisions, and reviews. They do not determine applicability, certify compliance, or replace qualified quality and regulatory judgment.</p></CardContent></Card>
  </>;
}
