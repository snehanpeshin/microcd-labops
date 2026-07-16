import { NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspaceIdentity } from "@/lib/auth";
import { invitationEmail } from "@/lib/email/templates";
import { sendTransactionalEmail } from "@/lib/email/send";
import { appConfig } from "@/lib/config";
import { can } from "@/lib/security/permissions";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const issueSchema = z.object({ email: z.string().email().max(254), role: z.enum(["admin", "engineer", "reviewer", "viewer"]) });
export async function POST(request: Request) {
  const identity = await getWorkspaceIdentity();
  if (!identity) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!can(identity.role, "members:manage")) return NextResponse.json({ error: "Administrator permission required" }, { status: 403 });
  const rateLimit = await enforceRateLimit(`${identity.organizationId}:${identity.userId}`, "invitation_send", 20, 3600);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Invitation limit reached. Try again later." }, { status: 429 });
  const parsed = issueSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and role" }, { status: 400 });
  const supabase = await createClient();
  const result = await supabase.rpc("issue_invitation", { target_email: parsed.data.email, assigned_role: parsed.data.role, ttl_hours: 72 });
  if (result.error || !result.data?.[0]) return NextResponse.json({ error: result.error?.message ?? "Invitation could not be created" }, { status: 400 });
  const invitation = result.data[0];
  const url = `${appConfig.siteUrl}/invite/${encodeURIComponent(invitation.raw_token)}`;
  try { await sendTransactionalEmail(parsed.data.email, invitationEmail({ organizationName: identity.organizationName, inviterName: identity.fullName, role: parsed.data.role, url, expiresAt: new Date(invitation.expires_at).toLocaleString("en-US", { timeZone: "UTC", timeZoneName: "short" }) })); }
  catch { await createAdminClient().from("operational_events").insert({ correlation_id: crypto.randomUUID(), organization_id: identity.organizationId, category: "email", severity: "error", code: "invitation_email_failed", safe_message: "Invitation created but email delivery failed" }); return NextResponse.json({ error: "Invitation was created, but email delivery failed. Resend after checking email configuration." }, { status: 502 }); }
  return NextResponse.json({ id: invitation.invitation_id, expiresAt: invitation.expires_at }, { status: 201 });
}

const revokeSchema = z.object({ id: z.string().uuid() });
export async function DELETE(request: Request) {
  const identity = await getWorkspaceIdentity();
  if (!identity) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!can(identity.role, "members:manage")) return NextResponse.json({ error: "Administrator permission required" }, { status: 403 });
  const parsed = revokeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid invitation" }, { status: 400 });
  const admin = createAdminClient();
  const updated = await admin.from("invitations").update({ revoked_at: new Date().toISOString(), revoked_by: identity.userId }).eq("id", parsed.data.id).eq("organization_id", identity.organizationId).is("accepted_at", null).is("revoked_at", null).select("id").maybeSingle();
  if (updated.error || !updated.data) return NextResponse.json({ error: "Invitation is unavailable or already consumed" }, { status: 404 });
  await admin.from("activity_log").insert({ organization_id: identity.organizationId, actor_id: identity.userId, action: "invitation_revoked", record_type: "Invitation", record_id: parsed.data.id, summary: "Organization invitation revoked" });
  return new NextResponse(null, { status: 204 });
}
