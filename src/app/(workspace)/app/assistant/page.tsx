import { BrainCircuit, FileCheck2, FlaskConical, ShieldCheck, Sparkles } from "lucide-react";
import { WorkspaceCopilot } from "@/components/ai/workspace-copilot";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireWorkspaceIdentity } from "@/lib/auth";
import { appConfig } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export default async function AssistantPage() {
  const identity = await requireWorkspaceIdentity();
  let enabled = false;
  if (!identity.demo) {
    const result = await createClient().then((client) => client.from("organizations").select("ai_enabled").eq("id", identity.organizationId).maybeSingle());
    enabled = Boolean(result.data?.ai_enabled);
  }
  return <>
    <PageHeader eyebrow="Human-controlled workflow assistance" title="LabOps AI Copilot" description="Ask for next steps, checklists, document structure, readiness guidance, and review questions across the workspace—without giving AI authority over records or decisions." actions={<Badge tone={appConfig.aiConfigured && enabled ? "good" : "neutral"}>{appConfig.aiConfigured && enabled ? "Available" : "Setup required"}</Badge>}/>
    <div className="grid gap-4 md:grid-cols-3">{[[FlaskConical, "Plan the work", "Turn an engineering objective into a practical sequence of experiments, resources, tasks, and evidence checks."], [FileCheck2, "Strengthen the record", "Outline reports and docket documents, identify review questions, and surface missing evidence without inventing facts."], [ShieldCheck, "Keep humans in control", "DLP screening, aggregate-only workspace context, explicit transfer consent, usage limits, and no automatic writes."]].map(([Icon, title, body]) => <Card key={String(title)}><CardContent><span className="grid size-10 place-items-center rounded-lg bg-violet-50 text-violet-700">{Icon === BrainCircuit ? <Sparkles size={20}/> : <Icon size={20}/>}</span><h2 className="mt-4 font-semibold text-slate-950">{String(title)}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{String(body)}</p></CardContent></Card>)}</div>
    <WorkspaceCopilot configured={appConfig.aiConfigured} enabled={enabled} demo={identity.demo}/>
  </>;
}
