import { NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspaceIdentity } from "@/lib/auth";
import { can, type Permission } from "@/lib/security/permissions";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { BetaFileScanner, validateUpload } from "@/lib/storage/file-policy";
import { createAdminClient } from "@/lib/supabase/admin";

const recordSchema = z.object({
  recordType: z.enum(["report", "supplier", "component", "lot", "inspection", "experiment", "sample", "equipment", "protocol"]),
  recordId: z.string().uuid(),
});
const recordTables = { report: "reports", supplier: "suppliers", component: "components", lot: "lots", inspection: "inspections", experiment:"experiments", sample:"samples", equipment:"equipment", protocol:"protocols" } as const;

export async function POST(request: Request) {
  const identity = await getWorkspaceIdentity();
  if (!identity) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (identity.demo) return NextResponse.json({ error: "Uploads are unavailable in the fictional demo" }, { status: 403 });

  const rateLimit = await enforceRateLimit(`${identity.organizationId}:${identity.userId}`, "file_upload", 20, 3600);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Upload limit reached. Try again later." }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });

  const body = await request.formData();
  const parsed = recordSchema.safeParse({ recordType: body.get("recordType"), recordId: body.get("recordId") });
  const file = body.get("file");
  if (!parsed.success || !(file instanceof File)) return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  const requiredPermission: Permission = parsed.data.recordType === "report" ? "reports:write" : ["experiment","sample","equipment","protocol"].includes(parsed.data.recordType) ? "lab:write" : "suppliers:write";
  if (!can(identity.role, requiredPermission)) return NextResponse.json({ error: "Insufficient permission for this record type" }, { status: 403 });

  const admin = createAdminClient();
  const record = await admin.from(recordTables[parsed.data.recordType]).select(parsed.data.recordType === "report" ? "id,status" : "id").eq("id", parsed.data.recordId).eq("organization_id", identity.organizationId).maybeSingle();
  if (record.error || !record.data) return NextResponse.json({ error: "Record not found" }, { status: 404 });
  if (parsed.data.recordType === "report" && "status" in record.data && record.data.status === "approved") return NextResponse.json({ error: "Approved report evidence is immutable" }, { status: 409 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  let validated: ReturnType<typeof validateUpload>;
  try { validated = validateUpload(file, bytes); }
  catch (cause) { return NextResponse.json({ error: cause instanceof Error ? cause.message : "File rejected" }, { status: 400 }); }
  const scan = await new BetaFileScanner().scan(bytes, validated.safeName);
  if (!scan.safe) return NextResponse.json({ error: "File failed security screening" }, { status: 400 });

  const storagePath = `${identity.organizationId}/${parsed.data.recordType}/${parsed.data.recordId}/${validated.storageName}`;
  const uploaded = await admin.storage.from("labops-files").upload(storagePath, bytes, { contentType: file.type, upsert: false, cacheControl: "private, max-age=0" });
  if (uploaded.error) return NextResponse.json({ error: "File storage failed" }, { status: 500 });

  const attachment = await admin.from("attachments").insert({ organization_id: identity.organizationId, record_type: parsed.data.recordType, record_id: parsed.data.recordId, file_name: validated.safeName, storage_path: storagePath, mime_type: file.type, size_bytes: file.size, checksum_sha256: validated.checksum, uploaded_by: identity.userId }).select("id").single();
  if (attachment.error) { await admin.storage.from("labops-files").remove([storagePath]); return NextResponse.json({ error: "File metadata could not be saved" }, { status: 500 }); }
  await admin.from("activity_log").insert({ organization_id: identity.organizationId, actor_id: identity.userId, action: "document_uploaded", record_type: "Attachment", record_id: attachment.data.id, summary: `File uploaded to ${parsed.data.recordType}` });
  return NextResponse.json({ id: attachment.data.id, fileName: validated.safeName, scanProvider: scan.provider }, { status: 201 });
}
