import Link from "next/link";
import {AlertTriangle,ArrowRight,CheckCircle2,ClipboardCheck,Plus} from "lucide-react";
import {requireWorkspaceIdentity} from "@/lib/auth";
import {listExperiments,listProtocolVersions} from "@/lib/data/lab-operations";
import {listProjects} from "@/lib/data/workspace";
import {evaluateExperimentSetup,nextExperimentBatch} from "@/lib/experiment-quality";
import {ExperimentSetupForm} from "@/components/experiments/experiment-setup-form";
import {Badge} from "@/components/ui/badge";
import {ButtonLink} from "@/components/ui/button";
import {Card,CardContent,CardHeader} from "@/components/ui/card";
import {DataTable,Td} from "@/components/ui/data-table";
import {EmptyState} from "@/components/ui/empty-state";
import {PageHeader} from "@/components/ui/page-header";
import {RegistryToolbar} from "@/components/ui/registry-toolbar";
import {formatDate} from "@/lib/utils";

const statuses=["draft","planned","ready","running","paused","completed","failed","cancelled","under_review","approved"].map(value=>({value,label:value.replaceAll("_"," ").replace(/^./,c=>c.toUpperCase())}));
const tone=(status:string)=>status==="Approved"||status==="Completed"?"good" as const:status==="Failed"||status==="Cancelled"?"danger" as const:status==="Running"?"info" as const:"warning" as const;
const qualityTone=(level:"prepared"|"attention"|"needs_setup")=>level==="prepared"?"good" as const:level==="needs_setup"?"danger" as const:"warning" as const;

export default async function ExperimentsPage({searchParams}:{searchParams:Promise<{q?:string;status?:string;new?:string}>}){
  const identity=await requireWorkspaceIdentity();const params=await searchParams;
  const filteredExperiments=listExperiments(identity,params),allExperiments=params.q||params.status?listExperiments(identity):filteredExperiments;
  const [experiments,projects,versions,batchSource]=await Promise.all([filteredExperiments,listProjects(identity),listProtocolVersions(identity),allExperiments]),batch=nextExperimentBatch(batchSource);
  return <><PageHeader eyebrow="Scientific execution" title="Experiments" description="Plan, execute, review, and approve experimental work with traceable samples and protocol versions." actions={!identity.demo?<ButtonLink href="/app/experiments?new=1"><Plus size={16}/>New experiment</ButtonLink>:undefined}/>
  {params.new==="1"&&!identity.demo?<Card><CardHeader title="Create a clear, runnable experiment" description="Follow the three short steps. You can save incomplete work, and LabOps will show exactly what must be fixed before execution."/><CardContent><ExperimentSetupForm projects={projects} versions={versions}/></CardContent></Card>:null}
  <Card><CardHeader title="Next experiment batch" description="A quick quality check of upcoming experiment setup. Open a record to run the full readiness gate for builds, material lots, equipment, samples, and tasks." action={<Badge tone="info">{batch.length} queued</Badge>}/><CardContent>
    {batch.length?<div className="space-y-3">{batch.map(({experiment,quality},index)=>{const missing=quality.checks.filter(item=>!item.complete);const Icon=quality.level==="prepared"?CheckCircle2:AlertTriangle;return <article key={experiment.id} className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-[auto_1fr_auto] md:items-center"><span className="grid size-9 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-700" aria-label={`Queue position ${index+1}`}>{index+1}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Link className="font-semibold text-slate-950 hover:text-teal-800 hover:underline" href={`/app/experiments/${experiment.id}`}>{experiment.code} · {experiment.title}</Link><Badge tone={qualityTone(quality.level)}><Icon size={13}/>{quality.score}% setup</Badge></div><p className="mt-1 text-sm text-slate-600">{missing.length?`Needs: ${missing.map(item=>item.label.toLowerCase()).join(", ")}.`:`Setup essentials complete. Run the full pre-run gate next.`}</p><p className="mt-1 text-xs text-slate-500">{experiment.startDate?`Planned ${formatDate(experiment.startDate)}`:"No start date"} · {experiment.priority} priority</p></div><ButtonLink href={`/app/experiments/${experiment.id}#setup-quality`} variant="secondary" className="w-full md:w-auto">Quality check<ArrowRight size={15}/></ButtonLink></article>})}</div>:<div className="flex items-start gap-3 rounded-lg bg-emerald-50 p-4 text-emerald-950"><ClipboardCheck className="mt-0.5 shrink-0" size={20}/><div><strong>No upcoming experiments need review.</strong><p className="mt-1 text-sm">Create a new experiment when the next study is ready to plan.</p></div></div>}
  </CardContent></Card>
  <Card><RegistryToolbar q={params.q} status={params.status} statuses={statuses}/>{experiments.length?<DataTable caption="Experiments" headers={["Experiment","Project","Setup","Owner","Priority","Status","Updated"]}>{experiments.map(e=>{const quality=evaluateExperimentSetup(e);return <tr key={e.id}><Td><Link className="font-semibold text-teal-800 hover:underline" href={`/app/experiments/${e.id}`}>{e.code}</Link><span className="block text-slate-600">{e.title}</span></Td><Td>{e.projectName}</Td><Td><Badge tone={qualityTone(quality.level)}>{quality.score}%</Badge></Td><Td>{e.owner}</Td><Td><Badge tone={e.priority==="Critical"?"danger":e.priority==="High"?"warning":"neutral"}>{e.priority}</Badge></Td><Td><Badge tone={tone(e.status)}>{e.status}</Badge></Td><Td>{formatDate(e.updatedAt)}</Td></tr>})}</DataTable>:<EmptyState title="No experiments found" description={params.q||params.status?"Try clearing the current filters.":"Create the first experiment to begin traceable laboratory execution."}/>}</Card></>;
}
