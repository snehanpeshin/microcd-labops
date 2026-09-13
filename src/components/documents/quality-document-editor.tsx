"use client";

import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {AlertTriangle,CheckCircle2,ShieldCheck,Sparkles} from "lucide-react";
import {saveQualityDocumentRevision} from "@/app/(workspace)/app/documents/actions";
import {Button} from "@/components/ui/button";

type AiResponse={suggestion?:string;promptVersion?:string;model?:string;generatedAt?:string;dlp?:{blocked:boolean;redacted:boolean;findings:{category:string;severity:string;count:number}[]};error?:string};

export function QualityDocumentEditor({documentId,initialContent,locked,configured}:{documentId:string;initialContent:string;locked:boolean;configured:boolean}){
  const router=useRouter(),[content,setContent]=useState(initialContent),[source,setSource]=useState<"user"|"ai_assisted">("user"),[metadata,setMetadata]=useState<AiResponse|null>(null),[reviewed,setReviewed]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState(""),[generating,setGenerating]=useState(false),[pending,startTransition]=useTransition();
  async function generate(){setGenerating(true);setError("");setNotice("");try{const response=await fetch("/api/ai/quality-document",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({documentId,localContent:content})});const data=await response.json() as AiResponse;if(!response.ok)throw new Error(data.error??"AI template generation failed.");setContent(data.suggestion??content);setSource("ai_assisted");setMetadata(data);setReviewed(false);setNotice("Generic AI template loaded. No project or document content was transmitted.");}catch(cause){setError(cause instanceof Error?cause.message:"AI template generation failed.");}finally{setGenerating(false);}}
  function save(){setError("");setNotice("");startTransition(async()=>{try{await saveQualityDocumentRevision({documentId,content,source,model:metadata?.model,promptVersion:metadata?.promptVersion,generatedAt:metadata?.generatedAt,dlpSummary:metadata?.dlp?JSON.stringify(metadata.dlp):undefined});setSource("user");setMetadata(null);setReviewed(false);setNotice("New controlled revision saved.");router.refresh();}catch(cause){setError(cause instanceof Error?cause.message:"Revision could not be saved.");}});}
  return <div className="space-y-4">
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0" size={19}/><div><strong>Private template mode</strong><p>AI receives only public template metadata—not this draft, product name, files, evidence, or identifiers. Local DLP blocks detected credentials before generation.</p></div></div></div>
    <label className="form-field"><span>Controlled document content</span><textarea rows={24} value={content} onChange={(event)=>{setContent(event.target.value);if(source==="ai_assisted")setReviewed(false);}} disabled={locked} maxLength={100000} className="font-mono text-sm leading-6"/><small>{content.length.toLocaleString()} / 100,000 characters · Markdown supported</small></label>
    {error?<p role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertTriangle size={18}/>{error}</p>:null}{notice?<p role="status" className="flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"><CheckCircle2 size={18}/>{notice}</p>:null}
    {source==="ai_assisted"?<label className="flex items-start gap-3 rounded-lg border border-violet-200 bg-violet-50/60 p-4 text-sm leading-6"><input type="checkbox" className="mt-1 size-4 min-h-0" checked={reviewed} onChange={(event)=>setReviewed(event.target.checked)}/><span>I reviewed and edited this AI-generated rough template, verified its content against source evidence, and accept authorship responsibility. It remains unapproved until independent review.</span></label>:null}
    {!locked?<div className="flex flex-wrap gap-3"><Button type="button" variant="secondary" onClick={generate} disabled={!configured||generating||pending}><Sparkles size={17}/>{generating?"Creating private template…":"Create AI rough template"}</Button><Button type="button" onClick={save} disabled={pending||content.trim().length<10||(source==="ai_assisted"&&!reviewed)}>{pending?"Saving revision…":"Save new revision"}</Button></div>:null}
    {!configured&&!locked?<p className="text-sm text-amber-800">An administrator must configure and enable AI assistance before template generation is available. Manual editing still works.</p>:null}
  </div>;
}
