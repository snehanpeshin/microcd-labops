import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspaceIdentity } from "@/lib/auth";
import { appConfig } from "@/lib/config";
import { can } from "@/lib/security/permissions";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const requestSchema = z.object({ reportId: z.string().uuid(), projectId: z.string().uuid(), section: z.enum(["executive_summary", "methodology", "results", "conclusion"]), objective: z.string().min(10).max(6000), evidence: z.string().max(12000).default(""), criteriaSummary: z.string().max(6000).default("") });

export async function POST(request: Request) {
  const identity = await getWorkspaceIdentity();
  if (!identity) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (identity.demo || !can(identity.role, "reports:write")) return NextResponse.json({ error: "AI drafting is unavailable for this workspace" }, { status: 403 });
  if (!appConfig.aiConfigured) return NextResponse.json({ error: "AI drafting is disabled until it is configured" }, { status: 503 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid drafting request" }, { status: 400 });
  const admin = createAdminClient();
  const [organization, report] = await Promise.all([
    admin.from("organizations").select("ai_enabled,ai_monthly_limit").eq("id", identity.organizationId).single(),
    admin.from("reports").select("id,status").eq("id", parsed.data.reportId).eq("project_id", parsed.data.projectId).eq("organization_id", identity.organizationId).maybeSingle(),
  ]);
  if (organization.error || !organization.data?.ai_enabled) return NextResponse.json({ error: "AI drafting is not enabled by this organization" }, { status: 403 });
  if (report.error || !report.data) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  if (report.data.status === "approved") return NextResponse.json({ error: "Approved report revisions are immutable" }, { status: 409 });
  const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
  const usage = await admin.from("ai_usage").select("id", { count: "exact", head: true }).eq("organization_id", identity.organizationId).gte("created_at", monthStart.toISOString());
  if ((usage.count ?? 0) >= organization.data.ai_monthly_limit) return NextResponse.json({ error: "Monthly AI usage limit reached" }, { status: 429 });
  const rateLimit = await enforceRateLimit(`${identity.organizationId}:${identity.userId}`, "ai_draft", 20, 3600);
  if (!rateLimit.allowed) return NextResponse.json({ error: "AI request limit reached. Try again later." }, { status: 429 });
  const model = process.env.OPENAI_MODEL ?? "gpt-5.6-terra"; const promptVersion = "engineering-section-v3"; const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const response = await client.responses.create({ model, reasoning:{effort:"none"}, text:{verbosity:"low"}, max_output_tokens:1200, input: [{ role: "system", content: "Produce one concise engineering-report section using only the supplied evidence. Success means: preserve every stated measurement and criterion exactly; separate direct observation from interpretation; use 'not provided' when evidence is missing; add no standards, approvals, identities, causes, claims, or conclusions that the evidence does not support; return plain text only. This is a suggestion for explicit human review, never a scientific decision, calculation, approval, or signature." }, { role: "user", content: `Requested section: ${parsed.data.section}\n\nObjective:\n${parsed.data.objective}\n\nExisting report evidence:\n${parsed.data.evidence || "Not provided"}\n\nDeterministic criteria summary:\n${parsed.data.criteriaSummary || "Not provided"}` }] });
    const inputTokens = response.usage?.input_tokens ?? 0; const outputTokens = response.usage?.output_tokens ?? 0; const inputRate = Number(process.env.OPENAI_INPUT_COST_PER_MILLION ?? 0); const outputRate = Number(process.env.OPENAI_OUTPUT_COST_PER_MILLION ?? 0); const estimatedCost = (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000;
    await admin.from("ai_usage").insert({ organization_id: identity.organizationId, user_id: identity.userId, report_id: parsed.data.reportId, prompt_version: promptVersion, model, input_tokens: inputTokens, output_tokens: outputTokens, estimated_cost_usd: estimatedCost });
    return NextResponse.json({ suggestion: response.output_text, source: "ai-assisted", requiresHumanAcceptance: true, promptVersion, model, generatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { await admin.from("operational_events").insert({ correlation_id: crypto.randomUUID(), organization_id: identity.organizationId, category: "ai", severity: "error", code: "ai_generation_failed", safe_message: "AI drafting request failed" }); return NextResponse.json({ error: "AI drafting is temporarily unavailable" }, { status: 502 }); }
}
