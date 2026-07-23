import { createClient } from "@/lib/supabase/server";import { Brand } from "@/components/brand";import { ButtonLink } from "@/components/ui/button";import { AcceptInvitation } from "@/components/auth/accept-invitation";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata(
  "Organization Invitation",
  "Secure invitation acceptance for a MicroCD LabOps organization workspace.",
);

export default async function InvitationPage({params}:{params:Promise<{token:string}>}){const {token}=await params;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();const path=`/invite/${encodeURIComponent(token)}`;return <main className="mx-auto max-w-xl px-5 py-20"><Brand/><div className="mt-10 rounded-lg border border-slate-200 bg-white p-7 shadow-sm"><p className="text-xs font-bold uppercase text-teal-800">MicroCD LabOps Beta</p><h1 className="mt-3 text-3xl font-semibold text-slate-950">Organization invitation</h1><p className="mt-4 text-sm leading-6 text-slate-600">Invitation details are validated only after you sign in. Use the exact email address that received the invitation. Expired, revoked, consumed, mismatched, or duplicate invitations will be rejected.</p><div className="mt-7">{user?<AcceptInvitation token={token}/>:<div className="flex gap-3"><ButtonLink href={`/login?next=${encodeURIComponent(path)}`}>Sign in</ButtonLink><ButtonLink href={`/signup?next=${encodeURIComponent(path)}`} variant="secondary">Create account</ButtonLink></div>}</div></div></main>}
