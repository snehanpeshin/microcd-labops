import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspaceIdentity } from "@/lib/auth";
import { buildCopilotInput, buildCopilotInstructions, copilotAreas } from "@/lib/ai/copilot";
import { appConfig } from "@/lib/config";
import { dlpSummary, scanAndSanitize } from "@/lib/security/dlp";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const requestSchema = z.object({ area: z.enum(copilotAreas), question: z.string().trim().min(5).max(3000), confirmedTransfer: z.literal(true) });

const countBy = (rows: Array<Record<string, unknown>>, key: string) => rows.reduce<Record<string, number>>((counts, row) => {
  const value = String(row[key] ?? "unknown").replaceAll("_", " ");
  counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}, {});

export async function POST(request: Request) {
  const identity = await getWorkspaceIdentity();
  if (!identity) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (identity.demo) return NextResponse.json({ error: "AI Copilot is disabled in the fictional demo" }, { status: 403 });
  if (!appConfig.aiConfigured) return NextResponse.json({ error: "AI service is not configured by the administrator" }, { status: 503 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a question and confirm the screened transfer" }, { status: 400 });

  const promptScan = scanAndSanitize(parsed.data.question);
  if (promptScan.blocked) return NextResponse.json({ error: "A secret or credential was detected and was not sent. Remove or rotate it, then try again.", dlp: dlpSummary(promptScan) }, { status: 422 });

  const admin = createAdminClient();
  const organization = await admin.from("organizations").select("ai_enabled,ai_monthly_limit").eq("id", identity.organizationId).single();
  if (organization.error || !organization.data?.ai_enabled) return NextResponse.json({ error: "AI assistance is not enabled for this workspace" }, { status: 403 });

  const monthStart = new Date();
  monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
  const usage = await admin.from("ai_usage").select("id", { count: "exact", head: true }).eq("organization_id", identity.organizationId).gte("created_at", monthStart.toISOString());
  if ((usage.count ?? 0) >= organization.data.ai_monthly_limit) return NextResponse.json({ error: "Monthly AI usage limit reached" }, { status: 429 });
  const rateLimit = await enforceRateLimit(`${identity.organizationId}:${identity.userId}`, "ai_copilot", 30, 3600);
  if (!rateLimit.allowed) return NextResponse.json({ error: "AI request limit reached. Try again later." }, { status: 429 });

  const [projects, experiments, tasks, samples, inventory, equipment, reports, documents] = await Promise.all([
    admin.from("projects").select("id").eq("organization_id", identity.organizationId).is("deleted_at", null),
    admin.from("experiments").select("status").eq("organization_id", identity.organizationId).is("deleted_at", null),
    admin.from("lab_tasks").select("status,priority,due_date").eq("organization_id", identity.organizationId),
    admin.from("samples").select("status").eq("organization_id", identity.organizationId).is("deleted_at", null),
    admin.from("inventory_items").select("quantity,minimum_stock").eq("organization_id", identity.organizationId),
    admin.from("equipment").select("status").eq("organization_id", identity.organizationId).is("deleted_at", null),
    admin.from("reports").select("status").eq("organization_id", identity.organizationId).is("deleted_at", null),
    admin.from("quality_documents").select("status,lifecycle_phase").eq("organization_id", identity.organizationId),
  ]);
  if ([projects, experiments, tasks, samples, inventory, equipment, reports, documents].some((result) => result.error)) return NextResponse.json({ error: "Workspace summary is temporarily unavailable" }, { status: 503 });

  const today = new Date().toISOString().slice(0, 10);
  const taskRows = (tasks.data ?? []) as Array<Record<string, unknown>>;
  const inventoryRows = (inventory.data ?? []) as Array<{ quantity: number; minimum_stock: number }>;
  const context = [
    `Projects: ${projects.data?.length ?? 0}`,
    `Experiments by status: ${JSON.stringify(countBy((experiments.data ?? []) as Array<Record<string, unknown>>, "status"))}`,
    `Open tasks: ${taskRows.filter((row) => row.status !== "completed").length}; overdue tasks: ${taskRows.filter((row) => row.status !== "completed" && row.due_date && String(row.due_date) < today).length}; critical tasks: ${taskRows.filter((row) => row.status !== "completed" && row.priority === "critical").length}`,
    `Samples by status: ${JSON.stringify(countBy((samples.data ?? []) as Array<Record<string, unknown>>, "status"))}`,
    `Low-stock inventory items: ${inventoryRows.filter((row) => Number(row.quantity) <= Number(row.minimum_stock)).length}`,
    `Equipment by status: ${JSON.stringify(countBy((equipment.data ?? []) as Array<Record<string, unknown>>, "status"))}`,
    `Reports by status: ${JSON.stringify(countBy((reports.data ?? []) as Array<Record<string, unknown>>, "status"))}`,
    `Engineering documents by status: ${JSON.stringify(countBy((documents.data ?? []) as Array<Record<string, unknown>>, "status"))}`,
  ].join("\n");

  const model = process.env.OPENAI_MODEL ?? "gpt-5.6-terra";
  const promptVersion = "workspace-copilot-v1";
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model,
      store: false,
      reasoning: { effort: "low" },
      text: { verbosity: "medium" },
      max_output_tokens: 1800,
      instructions: buildCopilotInstructions(parsed.data.area),
      input: buildCopilotInput(parsed.data.area, promptScan.safeText, context),
    });
    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;
    const inputRate = Number(process.env.OPENAI_INPUT_COST_PER_MILLION ?? 0);
    const outputRate = Number(process.env.OPENAI_OUTPUT_COST_PER_MILLION ?? 0);
    await admin.from("ai_usage").insert({ organization_id: identity.organizationId, user_id: identity.userId, prompt_version: promptVersion, model, input_tokens: inputTokens, output_tokens: outputTokens, estimated_cost_usd: (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000 });
    return NextResponse.json({ answer: response.output_text, model, promptVersion, generatedAt: new Date().toISOString(), dlp: dlpSummary(promptScan) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    await admin.from("operational_events").insert({ correlation_id: crypto.randomUUID(), organization_id: identity.organizationId, category: "ai", severity: "error", code: "ai_copilot_failed", safe_message: "AI Copilot request failed" });
    return NextResponse.json({ error: "AI Copilot is temporarily unavailable" }, { status: 502 });
  }
}
