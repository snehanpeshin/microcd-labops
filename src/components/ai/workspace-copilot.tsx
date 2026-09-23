"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Send, ShieldCheck, Sparkles } from "lucide-react";
import { copilotAreaDetails, type CopilotArea } from "@/lib/ai/copilot";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type CopilotResponse = { answer?: string; error?: string; model?: string; generatedAt?: string; dlp?: { redacted: boolean } };

export function WorkspaceCopilot({ configured, enabled, demo }: { configured: boolean; enabled: boolean; demo: boolean }) {
  const [area, setArea] = useState<CopilotArea>("workspace");
  const [question, setQuestion] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<CopilotResponse | null>(null);
  const details = useMemo(() => copilotAreaDetails[area], [area]);
  const available = configured && enabled && !demo;

  async function ask() {
    if (!available || !confirmed || question.trim().length < 5) return;
    setPending(true); setResult(null);
    try {
      const response = await fetch("/api/ai/copilot", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ area, question, confirmedTransfer: true }) });
      const data = await response.json() as CopilotResponse;
      if (!response.ok) throw new Error(data.error ?? "AI Copilot is temporarily unavailable.");
      setResult(data);
    } catch (cause) {
      setResult({ error: cause instanceof Error ? cause.message : "AI Copilot is temporarily unavailable." });
    } finally {
      setPending(false);
    }
  }

  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
    <section className="ai-composer">
      <div className="ai-composer-heading"><span className="ai-composer-icon"><Sparkles size={20}/></span><div><p>Organization-scoped assistant</p><h2>Ask LabOps AI Copilot</h2><span>Get a read-only plan grounded in aggregate workspace status and known LabOps workflows.</span></div><span className="ai-private-badge"><ShieldCheck size={14}/>DLP screened</span></div>
      <div className="ai-controls"><label><span>Work area</span><select value={area} onChange={(event) => { setArea(event.target.value as CopilotArea); setResult(null); }}>{Object.entries(copilotAreaDetails).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></label></div>
      <div className="ai-prompt-starters" aria-label="Suggested questions">{details.starters.map((starter) => <button key={starter} type="button" onClick={() => setQuestion(starter)}>{starter}</button>)}</div>
      <label className="ai-prompt-box"><span>What do you need help with?</span><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Describe the decision, workflow, or document you need help planning. Do not enter credentials, patient data, or confidential IP." maxLength={3000}/><small>{question.length}/3000 · High-risk secrets are blocked; common identifiers are redacted.</small></label>
      <div className="mx-5 mt-4"><label className="flex items-start gap-3 rounded-lg border border-violet-200 bg-white/70 p-3 text-xs leading-5 text-slate-700"><input className="mt-0.5 size-4 min-h-0" type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}/><span>I reviewed this question and authorize sending its DLP-screened text plus aggregate workspace counts to the configured AI service. No record bodies, files, patient data, or confidential product evidence are included automatically.</span></label></div>
      <div className="ai-composer-footer"><p><ShieldCheck size={15}/>Read-only guidance; no records are changed.</p><Button type="button" onClick={ask} disabled={!available || !confirmed || question.trim().length < 5 || pending}><Send size={16}/>{pending ? "Thinking…" : "Ask Copilot"}</Button></div>
      {!available ? <div className="mx-5 mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>AI Copilot is not available yet.</strong><p className="mt-1 text-xs leading-5">{demo ? "AI requests are disabled in the fictional demo." : !configured ? "A server-side OpenAI credential must be configured by an administrator." : "An organization owner must enable AI assistance in Settings."}</p>{!demo ? <Link href="/app/settings" className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-amber-950 hover:underline">Open AI settings <ArrowRight size={15}/></Link> : null}</div> : null}
    </section>
    <aside className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold text-slate-950">Copilot response</h2>{result?.model ? <Badge tone="info">AI-assisted</Badge> : null}</div>{pending ? <div role="status" className="mt-5 space-y-3"><div className="h-4 w-4/5 animate-pulse rounded bg-slate-200"/><div className="h-4 w-full animate-pulse rounded bg-slate-200"/><div className="h-4 w-2/3 animate-pulse rounded bg-slate-200"/></div> : result?.error ? <p role="alert" className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800"><AlertCircle className="mt-0.5 shrink-0" size={17}/>{result.error}</p> : result?.answer ? <><div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{result.answer}</div>{result.dlp?.redacted ? <p role="status" className="mt-4 text-xs text-amber-800">Identifiers were redacted before the request was sent.</p> : null}<Link href={details.href} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-900 hover:bg-slate-50">Open {details.label}<ArrowRight size={15}/></Link></> : <div className="mt-5 text-sm leading-6 text-slate-500"><CheckCircle2 className="mb-3 text-teal-700" size={21}/><p>Choose a work area and ask a specific question. The response will separate suggested actions from items requiring human judgment.</p></div>}</div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-xs leading-6 text-slate-600"><strong className="text-slate-900">Copilot boundaries</strong><ul className="mt-2 space-y-1"><li>• Cannot approve, sign, or modify records</li><li>• Cannot determine regulatory compliance</li><li>• Cannot replace engineering or quality review</li><li>• Does not receive files or record bodies automatically</li></ul></div>
    </aside>
  </div>;
}
