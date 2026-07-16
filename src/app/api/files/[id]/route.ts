import { NextResponse } from "next/server";
import { getWorkspaceIdentity } from "@/lib/auth";
import { can } from "@/lib/security/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await getWorkspaceIdentity();
  if (!identity) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  const admin = createAdminClient();
  const result = await admin.from("attachments").select("storage_path,file_name").eq("id", id).eq("organization_id", identity.organizationId).maybeSingle();
  if (result.error || !result.data) return NextResponse.json({ error: "File not found" }, { status: 404 });
  const signed = await admin.storage.from("labops-files").createSignedUrl(result.data.storage_path, 60, { download: result.data.file_name });
  if (signed.error) return NextResponse.json({ error: "Download could not be authorized" }, { status: 500 });
  return NextResponse.redirect(signed.data.signedUrl, { headers: { "Cache-Control": "private, no-store" } });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await getWorkspaceIdentity();
  if (!identity) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!can(identity.role, "members:manage")) return NextResponse.json({ error: "Administrator permission required" }, { status: 403 });
  const { id } = await params;
  const admin = createAdminClient();
  const result = await admin.from("attachments").select("storage_path,record_type,record_id").eq("id", id).eq("organization_id", identity.organizationId).maybeSingle();
  if (result.error || !result.data) return NextResponse.json({ error: "File not found" }, { status: 404 });
  if (result.data.record_type === "report") {
    const report = await admin.from("reports").select("status").eq("id", result.data.record_id).eq("organization_id", identity.organizationId).maybeSingle();
    if (report.data?.status === "approved") return NextResponse.json({ error: "Approved report evidence is immutable" }, { status: 409 });
  }
  const removed = await admin.storage.from("labops-files").remove([result.data.storage_path]);
  if (removed.error) return NextResponse.json({ error: "File deletion failed" }, { status: 500 });
  const deleted = await admin.from("attachments").delete().eq("id", id).eq("organization_id", identity.organizationId);
  if (deleted.error) return NextResponse.json({ error: "File metadata deletion failed" }, { status: 500 });
  await admin.from("activity_log").insert({ organization_id: identity.organizationId, actor_id: identity.userId, action: "document_deleted", record_type: "Attachment", record_id: id, summary: "Attachment deleted by administrator" });
  return new NextResponse(null, { status: 204 });
}
