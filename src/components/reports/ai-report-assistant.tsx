"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { acceptAiReportDraft } from "@/app/(workspace)/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const sections = [
  ["executive_summary", "Executive summary"],
  ["methodology", "Methodology"],
  ["results", "Results interpretation"],
  ["conclusion", "Conclusion"],
] as const;
type SectionKey = (typeof sections)[number][0];
type DraftResponse = { suggestion:string; promptVersion:string; model:string; generatedAt:string; error?:string };

export function AiReportAssistant({ reportId, projectId, objective, evidence, criteriaSummary, configured }: { reportId:string; projectId:string; objective:string; evidence:string; criteriaSummary:string; configured:boolean }) {
  const router=useRouter();
  const [section,setSection]=useState<SectionKey>("executive_summary");
  const [suggestion,setSuggestion]=useState("");
  const [metadata,setMetadata]=useState<Pick<DraftResponse,"promptVersion"|"model"|"generatedAt">|null>(null);
  const [confirmed,setConfirmed]=useState(false);
  const [error,setError]=useState("");
  const [generated,setGenerated]=useState(false);
  const [pending,startTransition]=useTransition();

  async function generate(){
    setError("");setConfirmed(false);setGenerated(false);
    try{
      const response=await fetch("/api/ai/draft",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({reportId,projectId,section,objective,evidence,criteriaSummary})});
      const data=await response.json() as DraftResponse;
      if(!response.ok)throw new Error(data.error??"AI drafting is temporarily unavailable.");
      setSuggestion(data.suggestion);setMetadata(data);setGenerated(true);
    }catch(cause){setError(cause instanceof Error?cause.message:"AI drafting is temporarily unavailable.");}
  }

  function accept(){
    if(!metadata||!confirmed)return;
    setError("");
    startTransition(async()=>{try{await acceptAiReportDraft({reportId,section,content:suggestion,...metadata});setSuggestion("");setMetadata(null);setConfirmed(false);setGenerated(false);router.refresh();}catch(cause){setError(cause instanceof Error?cause.message:"The draft could not be accepted.");}});
  }

  return <div id="ai-assistant"><Card><CardHeader title="AI report assistant" description="Draft from this report’s evidence; you remain the author and decision-maker." action={<span className="grid size-9 place-items-center rounded-lg bg-violet-50 text-violet-700"><Sparkles size={18}/></span>}/><CardContent className="space-y-4">
    <div className="form-field"><label htmlFor="ai-section">Section to draft</label><select id="ai-section" value={section} onChange={(event)=>setSection(event.target.value as SectionKey)}>{sections.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
    <div className="rounded-lg border border-violet-100 bg-violet-50/60 p-3 text-xs leading-5 text-violet-950"><strong>Evidence boundary</strong><p className="mt-1">The assistant receives the objective, existing report sections, and criteria summary. It cannot change calculations, approve the report, or sign a record.</p></div>
    {!configured?<p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">An administrator must configure the AI service before drafting is available.</p>:null}
    <Button type="button" className="w-full" onClick={generate} disabled={pending||!configured}>{pending?"Working…":"Generate evidence-grounded suggestion"}</Button>
    {error?<p role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800"><AlertCircle className="mt-0.5 shrink-0" size={16}/>{error}</p>:null}
    {generated?<div className="space-y-3"><div className="form-field"><label htmlFor="ai-suggestion">AI-assisted suggestion</label><textarea id="ai-suggestion" rows={10} value={suggestion} onChange={(event)=>setSuggestion(event.target.value)} maxLength={12000}/><span className="text-xs font-normal text-slate-500">Edit freely. The saved section remains visibly labeled AI-assisted.</span></div><label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-xs leading-5"><input className="mt-0.5 size-4 min-h-0" type="checkbox" checked={confirmed} onChange={(event)=>setConfirmed(event.target.checked)}/><span>I reviewed this text against the source evidence and accept responsibility for the saved content.</span></label><Button type="button" variant="secondary" className="w-full" onClick={accept} disabled={pending||!confirmed||suggestion.trim().length<10}>{pending?"Saving…":"Accept into report"}</Button></div>:null}
    {!generated&&configured?<p className="flex gap-2 text-xs leading-5 text-slate-500"><CheckCircle2 className="mt-0.5 shrink-0 text-teal-700" size={15}/>Generation is usage-limited, logged, private, and never persisted until you explicitly accept it.</p>:null}
  </CardContent></Card></div>;
}
