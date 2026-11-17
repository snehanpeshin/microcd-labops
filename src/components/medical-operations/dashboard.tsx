import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, Clock3, Layers, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { caseMetrics, type OperationArea } from "@/lib/medical-operations/dashboards";
import { stateLabels, states, type OperationsCase } from "@/lib/medical-operations/workflows";

export function OperationsMetrics({cases}:{cases:OperationsCase[]}){
 const m=caseMetrics(cases);
 return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
  {label:"Open work",value:m.open,detail:"Active records in this view",Icon:Layers,color:"text-teal-700 bg-teal-50"},
  {label:"Awaiting review",value:m.review,detail:"Ready for an independent reviewer",Icon:ClipboardCheck,color:"text-blue-700 bg-blue-50"},
  {label:"Past due",value:m.overdue,detail:"Open records past their due date",Icon:Clock3,color:"text-amber-700 bg-amber-50"},
  {label:"Reviewed closures",value:m.closed,detail:"Closed through the review workflow",Icon:CheckCircle2,color:"text-emerald-700 bg-emerald-50"},
 ].map(({label,value,detail,Icon,color})=><article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-600">{label}</p><span className={`rounded-xl p-2 ${color}`}><Icon size={19} aria-hidden="true"/></span></div><strong className="mt-3 block text-4xl tracking-tight text-slate-950">{value}</strong><p className="mt-2 text-xs text-slate-500">{detail}</p></article>)}</div>;
}
export function WorkflowChart({cases}:{cases:OperationsCase[]}){
 const colors=["bg-slate-400","bg-teal-600","bg-blue-500","bg-amber-500","bg-emerald-500"];
 return <Card><CardHeader title="Work in motion" description="Record counts by workflow stage. Closure is a review decision, not a compliance score."/><CardContent className="space-y-4"><div aria-hidden="true" className="flex h-4 overflow-hidden rounded-full bg-slate-100">{states.map((state,index)=><span key={state} className={colors[index]} style={{width:`${cases.length?cases.filter(c=>c.state===state).length/cases.length*100:0}%`}}/>)}</div>{states.map((state,index)=>{const count=cases.filter(c=>c.state===state).length;return <div key={state} className="flex items-center gap-3 text-sm"><span aria-hidden="true" className={`size-2.5 rounded-full ${colors[index]}`}/><span className="flex-1 text-slate-600">{stateLabels[state]}</span><strong className="tabular-nums text-slate-950">{count}</strong></div>})}{!cases.length?<p className="text-xs text-slate-500">Create the first record to see this workflow take shape.</p>:null}</CardContent></Card>;
}
export function OperationsQueue({cases}:{cases:OperationsCase[]}){
 const queue=cases.filter(c=>c.state!=="closed").sort((a,b)=>Number(b.priority==="critical")-Number(a.priority==="critical")||(a.dueDate??"9999").localeCompare(b.dueDate??"9999")).slice(0,6);
 return <Card><CardHeader title="Next decisions" description="Critical work first, then upcoming deadlines. Showing up to six open records."/><CardContent className="space-y-3">{queue.map(c=><Link href={`/app/operations/${c.id}`} key={c.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-teal-300 hover:bg-teal-50/40"><span className={`mt-1.5 size-2 shrink-0 rounded-full ${c.priority==="critical"?"bg-red-600":"bg-teal-600"}`}/><div className="min-w-0 flex-1"><strong className="block text-sm text-slate-950">{c.title}</strong><p className="mt-1 text-xs text-slate-500">{c.ownerLabel} · {c.dueDate?formatDate(c.dueDate):"Due date not set"}</p><div className="mt-2"><Badge tone={c.state==="in_review"?"info":"neutral"}>{stateLabels[c.state]}</Badge></div></div><ArrowRight size={17} className="mt-1 text-slate-400" aria-hidden="true"/></Link>)}{!queue.length?<EmptyState compact title="No open decisions here" description="Start a workflow below or review the connected source registries." icon={<ShieldCheck size={22}/>}/>:null}</CardContent></Card>;
}
export function AreaHero({area}:{area:OperationArea}){
 const gradient=area.accent==="blue"?"from-slate-950 via-blue-950 to-blue-800":area.accent==="amber"?"from-slate-950 via-amber-950 to-amber-800":area.accent==="rose"?"from-slate-950 via-rose-950 to-rose-800":"from-slate-950 via-teal-950 to-teal-800";
 return <section className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br ${gradient} px-6 py-7 text-white sm:px-8`}><div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 size-72 rounded-full border-[35px] border-white/5"/><p className="relative text-xs font-semibold uppercase tracking-[.16em] text-teal-200">{area.eyebrow}</p><h1 className="relative mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{area.title}</h1><p className="relative mt-3 max-w-2xl text-sm leading-6 text-teal-50/85">{area.description}</p><div className="relative mt-5 flex flex-wrap gap-2">{area.links.map(link=><ButtonLink key={link.href} href={link.href} variant="secondary" className="min-h-10 border-white/20 bg-white/10 text-white hover:bg-white/20">{link.label}<ArrowRight size={14}/></ButtonLink>)}</div></section>;
}
