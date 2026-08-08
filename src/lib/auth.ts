import { redirect } from "next/navigation";
import { appConfig } from "@/lib/config";
import { getFirebaseClaims } from "@/lib/firebase/server";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export interface WorkspaceIdentity {
  userId: string;
  email: string;
  fullName: string;
  organizationId: string;
  organizationName: string;
  role: Role;
  demo: boolean;
}

export async function getWorkspaceIdentity(): Promise<WorkspaceIdentity | null> {
  if (!appConfig.supabaseConfigured) {
    return appConfig.demoMode ? {
      userId: "demo_user",
      email: "demo@microcdlabs.com",
      fullName: "Demo Engineer",
      organizationId: "org_demo_microcd",
      organizationName: "Fictional Centrifugal Diagnostics Lab",
      role: "owner",
      demo: true,
    } : null;
  }

  const supabase = await createClient();
  const firebase = await getFirebaseClaims();
  if (firebase) {
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id, role, organizations(name)")
      .eq("user_id", firebase.sub)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (!membership) return null;
    const organization = Array.isArray(membership.organizations) ? membership.organizations[0] : membership.organizations;
    return {
      userId: firebase.sub,
      email: firebase.email,
      fullName: firebase.name,
      organizationId: membership.organization_id,
      organizationName: organization?.name ?? "Organization",
      role: membership.role as Role,
      demo: false,
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!membership) return null;
  const organization = Array.isArray(membership.organizations) ? membership.organizations[0] : membership.organizations;
  return {
    userId: user.id,
    email: user.email ?? "",
    fullName: String(user.user_metadata.full_name ?? user.email ?? "User"),
    organizationId: membership.organization_id,
    organizationName: organization?.name ?? "Organization",
    role: membership.role as Role,
    demo: false,
  };
}

export async function requireWorkspaceIdentity() {
  const identity = await getWorkspaceIdentity();
  if (!identity && appConfig.supabaseConfigured) {
    if (await getFirebaseClaims()) redirect("/onboarding");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/onboarding");
  }
  if (!identity) redirect("/login");
  return identity;
}
