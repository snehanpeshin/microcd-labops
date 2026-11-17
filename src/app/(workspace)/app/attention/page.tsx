import Link from "next/link";
import { listOperationsCases } from "@/lib/data/medical-operations";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { requireWorkspaceIdentity } from "@/lib/auth";
import { listEquipment, listExperiments, listInventory, listLabTasks, listSamples } from "@/lib/data/lab-operations";
import { listReportsForAttention } from "@/lib/data/workspace";
import { buildAttentionQueue } from "@/lib/operations-focus";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/ui/page-header";

const categories = [{value:"operations",label:"Medical-device operations"}, {value:"tasks",label:"Tasks"}, {value:"samples",label:"Samples"}, {value:"inventory",label:"Inventory"}, {value:"equipment",label:"Equipment"}, {value:"reviews",label:"Reviews & exceptions"}];
export default async function AttentionPage({searchParams}: {searchParams:Promise<{q?:string;category?:string;urgency?:string}>}) {
  const identity = await requireWorkspaceIdentity();
  const params = await searchParams;
  const [tasks, samples, inventory, equipment, experiments, reports, operations] = await Promise.all([
    listLabTasks(identity), listSamples(identity), listInventory(identity), listEquipment(identity), listExperiments(identity), listReportsForAttention(identity), listOperationsCases(identity),
  ]);
  const queue = buildAttentionQueue({tasks, samples, inventory, equipment, experiments, reports, operations});
  const query = params.q?.trim().toLowerCase();
  const shown = queue.filter(item => (!params.category || item.category === params.category) && (!params.urgency || item.urgency === params.urgency) && (!query || `${item.title} ${item.detail} ${item.owner}`.toLowerCase().includes(query)));
  return <>
    <PageHeader eyebrow="Plan the next action" title="Attention center" description="Triage overdue work, stock and expiry risks, service deadlines, and scientific reviews in one place." actions={<ButtonLink href="/app/tasks?focus=open" variant="secondary">Open tasks<ArrowRight size={16}/></ButtonLink>}/>
    <div className="metric-grid">
      {[{label:"Needs attention",value:queue.length,note:"Across the loaded workspace records"},{label:"Urgent",value:queue.filter(i=>i.urgency==="urgent").length,note:"Overdue, expired, or failed records"},{label:"Action needed",value:queue.filter(i=>i.urgency==="action").length,note:"Blocked work, low stock, and reviews"},{label:"Coming up",value:queue.filter(i=>i.urgency==="upcoming").length,note:"Tasks/service: 7 days · expiry: 30 days"}].map(metric=><MetricCard key={metric.label} {...metric} icon={<AlertTriangle size={18}/>}/>)}
    </div>
    <Card><CardHeader title="Work that needs attention" description="Urgent items appear first. Open a record to review it before taking action."/>
      <form method="get" className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-5">
        <label className="min-w-48 flex-1 text-sm font-medium">Search<input className="mt-1 w-full" type="search" name="q" defaultValue={params.q} placeholder="Record, owner, or issue"/></label>
        <label className="text-sm font-medium">Category<select className="mt-1 block" name="category" defaultValue={params.category??""}><option value="">All categories</option>{categories.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
        <label className="text-sm font-medium">Urgency<select className="mt-1 block" name="urgency" defaultValue={params.urgency??""}><option value="">All urgency levels</option><option value="urgent">Urgent</option><option value="action">Action needed</option><option value="upcoming">Coming up</option></select></label>
        <Button variant="secondary">Apply filters</Button>{params.q||params.category||params.urgency?<ButtonLink href="/app/attention" variant="ghost">Clear filters</ButtonLink>:null}
      </form>
      <CardContent className="space-y-3"><p className="text-sm text-slate-600" role="status">Showing {shown.length} of {queue.length} attention items</p>
        {shown.map(item=><article key={item.id} className="flex flex-wrap items-start gap-3 rounded-lg border border-slate-200 p-4">
          <AlertTriangle size={18} aria-hidden="true" className={item.urgency==="urgent"?"mt-1 text-red-700":"mt-1 text-amber-700"}/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Link className="font-semibold text-teal-800 hover:underline" href={item.href}>{item.title}</Link><Badge tone={item.urgency==="urgent"?"danger":item.urgency==="action"?"warning":"info"}>{item.urgency==="urgent"?"Urgent":item.urgency==="action"?"Action needed":"Coming up"}</Badge></div><p className="mt-1 text-sm text-slate-700">{item.detail}</p><p className="mt-2 text-xs text-slate-500">{categories.find(c=>c.value===item.category)?.label} · {item.owner}{item.dueDate?` · ${formatDate(item.dueDate)}`:""}</p></div><ButtonLink href={item.href} variant="ghost">Open record<ArrowRight size={15}/></ButtonLink>
        </article>)}
        {!shown.length?<EmptyState compact title={queue.length?"No items match these filters":"No attention items in the loaded records"} description={queue.length?"Try another category or clear the search to see more work.":"New deadlines and exceptions will appear here as records change."} icon={<CheckCircle2 size={20}/>} action={queue.length?<ButtonLink href="/app/attention" variant="secondary">Clear filters</ButtonLink>:undefined}/>:null}
      </CardContent>
    </Card>
    <p className="text-xs leading-relaxed text-slate-500">Dates use UTC calendar days. This view checks up to 200 experiments and 250 records from each task, sample, inventory, and equipment registry, plus reports requiring review or changes.</p>
  </>;
}
