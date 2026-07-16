import { NextResponse } from "next/server";
import Papa from "papaparse";
import { z } from "zod";
import { getWorkspaceIdentity } from "@/lib/auth";
import { parseNumericValue, summarize } from "@/lib/reports/calculations";
import { can } from "@/lib/security/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ attachmentId: z.string().uuid(), selectedColumn: z.string().min(1).max(100) });
type CsvRow = Record<string, string>;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await getWorkspaceIdentity();
  if (!identity) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!can(identity.role, "reports:write")) return NextResponse.json({ error: "Insufficient permission" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid dataset mapping" }, { status: 400 });
  const { id: reportId } = await params;
  const admin = createAdminClient();
  const [report, attachment] = await Promise.all([
    admin.from("reports").select("id,status").eq("id", reportId).eq("organization_id", identity.organizationId).maybeSingle(),
    admin.from("attachments").select("id,file_name,storage_path").eq("id", parsed.data.attachmentId).eq("organization_id", identity.organizationId).eq("record_type", "report").eq("record_id", reportId).maybeSingle(),
  ]);
  if (report.error || !report.data || attachment.error || !attachment.data) return NextResponse.json({ error: "Report or evidence file not found" }, { status: 404 });
  if (report.data.status === "approved") return NextResponse.json({ error: "Approved report revisions are immutable" }, { status: 409 });
  const downloaded = await admin.storage.from("labops-files").download(attachment.data.storage_path);
  if (downloaded.error) return NextResponse.json({ error: "Evidence file could not be read" }, { status: 500 });
  const csv = Papa.parse<CsvRow>(await downloaded.data.text(), { header: true, skipEmptyLines: true });
  if (csv.errors.length) return NextResponse.json({ error: "CSV contains parsing errors" }, { status: 400 });
  if (csv.data.length > 100_000) return NextResponse.json({ error: "CSV exceeds the 100,000-row analysis limit" }, { status: 413 });
  if (!csv.meta.fields?.includes(parsed.data.selectedColumn)) return NextResponse.json({ error: "Selected column is not present in the uploaded CSV" }, { status: 400 });
  const values = csv.data.map((row) => parseNumericValue(row[parsed.data.selectedColumn])).filter((value): value is number => value !== null);
  if (!values.length) return NextResponse.json({ error: "Selected column contains no numeric values" }, { status: 400 });
  const statistics = summarize(values);
  const dataset = await admin.from("report_datasets").insert({ organization_id: identity.organizationId, report_id: reportId, attachment_id: attachment.data.id, original_name: attachment.data.file_name, selected_column: parsed.data.selectedColumn, row_count: csv.data.length, mapping: { measurement: parsed.data.selectedColumn }, created_by: identity.userId }).select("id").single();
  if (dataset.error?.code === "23505") return NextResponse.json({ error: "This source column has already been analyzed for the report" }, { status: 409 });
  if (dataset.error) return NextResponse.json({ error: "Dataset metadata could not be saved" }, { status: 500 });
  const rows = Object.entries(statistics).map(([name, value]) => ({ organization_id: identity.organizationId, report_id: reportId, dataset_id: dataset.data.id, measurement: parsed.data.selectedColumn, statistic_name: name, statistic_value: value, calculation_version: "summary-v1", created_by: identity.userId }));
  const stored = await admin.from("report_statistics").insert(rows);
  if (stored.error) {
    await admin.from("report_datasets").delete().eq("id", dataset.data.id).eq("organization_id", identity.organizationId);
    return NextResponse.json({ error: "Calculated statistics could not be saved" }, { status: 500 });
  }
  await admin.from("activity_log").insert({ organization_id: identity.organizationId, actor_id: identity.userId, action: "dataset_analyzed", record_type: "Report", record_id: reportId, summary: `Dataset analyzed using ${parsed.data.selectedColumn}` });
  return NextResponse.json({ datasetId: dataset.data.id, statistics }, { status: 201 });
}
