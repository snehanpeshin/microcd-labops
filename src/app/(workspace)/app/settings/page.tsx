import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { InviteMemberForm } from "@/components/settings/invite-member-form";
import { requireWorkspaceIdentity } from "@/lib/auth";
import { appConfig } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

function profileName(profile: { full_name: string } | { full_name: string }[] | null) {
  return (Array.isArray(profile) ? profile[0]?.full_name : profile?.full_name) || "Member";
}

export default async function SettingsPage() {
  const identity = await requireWorkspaceIdentity();
  let members = [{ id: identity.userId, name: identity.fullName, email: identity.email, role: identity.role }];
  let plan = identity.demo ? "Lab (fictional demo)" : "Trial";
  if (!identity.demo) {
    const supabase = await createClient();
    const [memberResult, subscriptionResult] = await Promise.all([
      supabase.from("organization_members").select("user_id,role,profile:profiles!organization_members_user_profile_fkey(full_name)").eq("organization_id", identity.organizationId).eq("status", "active"),
      supabase.from("subscriptions").select("plan,status").eq("organization_id", identity.organizationId).maybeSingle(),
    ]);
    if (memberResult.data) members = memberResult.data.map((member) => ({ id: member.user_id, name: profileName(member.profile), email: "Email hidden", role: member.role }));
    if (subscriptionResult.data) plan = `${subscriptionResult.data.plan} · ${subscriptionResult.data.status}`;
  }
  return <><PageHeader eyebrow="Workspace administration" title="Settings" description="Organization, members, integrations, retention, and billing controls." /><div className="grid gap-5 xl:grid-cols-2"><Card><CardHeader title="Organization" /><CardContent><p className="text-sm text-slate-500">Organization name</p><strong className="mt-1 block text-slate-950">{identity.organizationName}</strong><p className="mt-5 text-xs leading-5 text-slate-500">Retention changes require an owner-reviewed data lifecycle policy and are not self-service in the beta.</p></CardContent></Card><Card><CardHeader title="Service configuration" description="Secrets are server-only and are never displayed." /><CardContent className="space-y-3">{[["Supabase authentication and storage", appConfig.supabaseConfigured], ["Stripe subscriptions", appConfig.stripeConfigured], ["AI-assisted drafting", appConfig.aiConfigured], ["Email notifications", Boolean(process.env.RESEND_API_KEY)]].map(([name, configured]) => <div key={String(name)} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 text-sm"><span>{String(name)}</span><Badge tone={configured ? "good" : "neutral"}>{configured ? "Configured" : "Disabled"}</Badge></div>)}</CardContent></Card><Card><CardHeader title="Members and roles" description="Invite people with the least privilege required." /><CardContent className="space-y-4">{members.map((member) => <div key={member.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3"><div><strong className="text-sm">{member.name}</strong><p className="text-xs text-slate-500">{member.email}</p></div><Badge>{member.role}</Badge></div>)}{identity.demo ? <p className="text-sm text-slate-500">Invitations are disabled in the fictional demo.</p> : <InviteMemberForm />}</CardContent></Card><Card><CardHeader title="Billing" description="Subscription state is updated only from verified Stripe webhooks." /><CardContent><p className="text-sm text-slate-600">{plan}</p><Button className="mt-5" variant="secondary" disabled={!appConfig.stripeConfigured || identity.demo}>Manage subscription</Button></CardContent></Card></div></>;
}
