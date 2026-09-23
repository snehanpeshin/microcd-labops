import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Activity, AlertTriangle, CheckCircle2, ClipboardList, FileUp, FlaskConical, Plus, ScanLine, Sparkles, TestTube2, Warehouse } from "lucide-react";
import { MetricCard } from "@/components/app/metric-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireWorkspaceIdentity } from "@/lib/auth";
import { listEquipment, listExperiments, listInventory, listLabTasks, listSamples } from "@/lib/data/lab-operations";
import { listActivity, listReports } from "@/lib/data/workspace";
import { isOverdue } from "@/lib/lab-workflows";
import { activitySentence, formatDate } from "@/lib/utils";

type QuickAction = [label: string, href: string, icon: LucideIcon];

export default async function DashboardPage() {
  const identity = await requireWorkspaceIdentity();
  const [experiments, samples, inventory, equipment, tasks, reports, activity] = await Promise.all([
    listExperiments(identity), listSamples(identity), listInventory(identity), listEquipment(identity), listLabTasks(identity), listReports(identity), listActivity(identity),
  ]);
  const running = experiments.filter((experiment) => experiment.status === "Running");
  const review = experiments.filter((experiment) => experiment.status === "Under review").length + reports.filter((report) => report.status === "Ready for review").length;
  const overdue = tasks.filter((task) => isOverdue(task.dueDate, task.status));
  const sampleAttention = samples.filter((sample) => sample.status === "Expired" || (sample.expirationDate && sample.expirationDate <= new Date().toISOString().slice(0, 10)));
  const priorityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 } as const;
  const priorityTasks = tasks.filter((task) => task.status !== "Completed").sort((a, b) => {
    const overdueDifference = Number(isOverdue(b.dueDate, b.status)) - Number(isOverdue(a.dueDate, a.status));
    if (overdueDifference) return overdueDifference;
    const priorityDifference = priorityRank[a.priority] - priorityRank[b.priority];
    return priorityDifference || (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
  }).slice(0, 5);
  const activeExperiments = experiments.filter((experiment) => !["Approved", "Cancelled"].includes(experiment.status)).slice(0, 5);
  const recentActivity = activity.slice(0, 8);
  const resourceWarnings = [
    ...inventory.filter((item) => item.quantity <= item.minimumStock).map((item) => ({ id: item.id, title: `${item.code} · ${item.name}`, detail: `${item.quantity} ${item.unit} remaining; minimum ${item.minimumStock}`, href: "/app/inventory?status=low" })),
    ...equipment.filter((item) => item.status === "Calibration required" || item.status === "Out of service").map((item) => ({ id: item.id, title: `${item.code} · ${item.name}`, detail: item.status, href: "/app/equipment" })),
  ];
  const quickActions: QuickAction[] = identity.demo
    ? [["Explore experiments", "/app/experiments", FlaskConical], ["Open sample registry", "/app/samples", TestTube2], ["Review inventory", "/app/inventory", Warehouse], ["View quality tasks", "/app/tasks", ClipboardList], ["Open document dockets", "/app/dockets", FileUp], ["View pilot analytics", "/app/analytics", Sparkles]]
    : [["New experiment", "/app/experiments?new=1", FlaskConical], ["Scan sample", "/app/samples/scan", ScanLine], ["Adjust inventory", "/app/inventory", Warehouse], ["Create task", "/app/tasks?new=1", ClipboardList], ["Import CSV", "/app/imports", FileUp], ["Ask AI Copilot", "/app/assistant", Sparkles]];

  return <>
    <PageHeader eyebrow="Operational command center" title="LabOps dashboard" description="The work, scientific records, and resources that need attention now." actions={!identity.demo ? <><ButtonLink href="/app/experiments?new=1"><Plus size={16}/>New experiment</ButtonLink><ButtonLink href="/app/samples/scan" variant="secondary"><ScanLine size={16}/>Scan sample</ButtonLink></> : <ButtonLink href="/app/experiments">Explore experiments</ButtonLink>}/>
    {!identity.demo && experiments.length === 0 ? <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50 to-white p-5"><div className="flex gap-3"><Sparkles className="mt-0.5 text-teal-700"/><div><strong className="text-slate-950">Create your first coherent workflow</strong><p className="mt-1 text-sm text-slate-600">Start from a project, protocol, and task template instead of a blank workspace.</p></div></div><ButtonLink href="/app/get-started">Choose a template</ButtonLink></div> : null}
    <div className="metric-grid"><MetricCard label="Running experiments" value={running.length} note="Currently in execution" icon={<FlaskConical size={18}/>}/><MetricCard label="Review queue" value={review} note="Experiments and reports awaiting review" icon={<ClipboardList size={18}/>}/><MetricCard label="Overdue tasks" value={overdue.length} note="Open work past its due date" icon={<AlertTriangle size={18}/>}/><MetricCard label="Samples needing action" value={sampleAttention.length} note="Expired or at expiration" icon={<TestTube2 size={18}/>}/></div>
    <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <Card><CardHeader title="Priority work" description="Overdue work appears first, followed by criticality and due date." action={<ButtonLink href="/app/tasks" variant="ghost">All tasks</ButtonLink>}/><CardContent className={priorityTasks.length ? "space-y-3" : "p-0"}>{priorityTasks.map((task) => { const taskOverdue = isOverdue(task.dueDate, task.status); return <div key={task.id} className="flex items-start gap-3 rounded-md border border-slate-200 p-4"><span aria-hidden="true" className={`mt-1 size-2 rounded-full ${taskOverdue ? "bg-red-600" : "bg-teal-600"}`}/><div className="min-w-0 flex-1"><strong className="text-sm text-slate-950">{task.title}</strong><p className="mt-1 text-xs text-slate-500">{taskOverdue ? <><span className="font-semibold text-red-700">Overdue</span> · </> : null}{task.assignee} · {task.dueDate ? formatDate(task.dueDate) : "No due date"} · {task.experimentCode ?? task.projectName ?? "General"}</p></div><Badge tone={task.priority === "Critical" ? "danger" : task.priority === "High" ? "warning" : "neutral"}>{task.priority}</Badge></div>; })}{!priorityTasks.length ? <EmptyState compact title="No open priority work" description="New and overdue assignments will appear here automatically." icon={<CheckCircle2 size={20} aria-hidden="true"/>}/> : null}</CardContent></Card>
      <Card><CardHeader title="Quick actions" description={identity.demo ? "Explore this fictional workspace without changing records." : "Start common laboratory workflows."}/><CardContent className="grid grid-cols-2 gap-3">{quickActions.map(([label, href, Icon]) => <ButtonLink key={label} href={href} variant="secondary" className="min-h-20 flex-col"><Icon size={19}/>{label}</ButtonLink>)}</CardContent></Card>
    </div>
    <div className="grid gap-5 xl:grid-cols-2">
      <Card><CardHeader title="Active experiments" action={<ButtonLink href="/app/experiments" variant="ghost">Open registry</ButtonLink>}/><CardContent className={activeExperiments.length ? "space-y-3" : "p-0"}>{activeExperiments.map((experiment) => <Link key={experiment.id} href={`/app/experiments/${experiment.id}`} className="block rounded-md border border-slate-200 p-4 transition-colors hover:border-teal-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"><div className="flex items-center justify-between gap-3"><strong>{experiment.code} · {experiment.title}</strong><Badge tone={experiment.status === "Running" ? "info" : "warning"}>{experiment.status}</Badge></div><p className="mt-1 text-xs text-slate-500">{experiment.projectName} · {experiment.owner}</p></Link>)}{!activeExperiments.length ? <EmptyState compact title="No active experiments" description="Planned and running experiments will appear here for fast access." icon={<FlaskConical size={20} aria-hidden="true"/>} action={!identity.demo ? <ButtonLink href="/app/experiments?new=1" variant="secondary">Create experiment</ButtonLink> : undefined}/> : null}</CardContent></Card>
      <Card><CardHeader title="Resource warnings" action={<ButtonLink href="/app/inventory" variant="ghost">Inventory</ButtonLink>}/><CardContent className={resourceWarnings.length ? "space-y-3" : "p-0"}>{resourceWarnings.map((warning) => <Link key={warning.id} href={warning.href} className="flex gap-3 rounded-md border border-amber-200 bg-amber-50/50 p-4 transition-colors hover:border-amber-300 hover:bg-amber-50"><AlertTriangle size={18} className="mt-0.5 text-amber-700"/><div><strong className="text-sm">{warning.title}</strong><p className="mt-1 text-xs text-slate-600">{warning.detail}</p></div></Link>)}{!resourceWarnings.length ? <EmptyState compact title="Resources look ready" description="No low-stock, calibration, or service warnings need attention." icon={<CheckCircle2 size={20} aria-hidden="true"/>}/> : null}</CardContent></Card>
    </div>
    <Card><CardHeader title="Recent activity" description="An auditable stream across laboratory and quality records." action={<ButtonLink href="/app/activity" variant="ghost">View audit log</ButtonLink>}/><CardContent className={recentActivity.length ? "grid gap-0 divide-y divide-slate-100 p-0" : "p-0"}>{recentActivity.map((entry) => <div key={entry.id} className="flex gap-4 px-5 py-4"><span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-teal-600"/><div><p className="text-sm"><strong>{entry.actor}</strong> {activitySentence(entry.action, entry.recordType)}</p><p className="mt-1 text-xs text-slate-500">{entry.summary} · {formatDate(entry.timestamp)}</p></div></div>)}{!recentActivity.length ? <EmptyState compact title="No activity recorded yet" description="Controlled changes will appear here as the workspace is used." icon={<Activity size={20} aria-hidden="true"/>}/> : null}</CardContent></Card>
  </>;
}
