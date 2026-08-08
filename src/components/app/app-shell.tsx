import Link from "next/link";
import type { ReactNode } from "react";
import { HelpCircle, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { WorkspaceNavigation } from "@/components/app/workspace-navigation";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { WorkspaceIdentity } from "@/lib/auth";

export function AppShell({ children, identity }: { children: ReactNode; identity: WorkspaceIdentity }) {
  return <div className="app-frame"><aside className="workspace-sidebar"><div className="workspace-brand"><Brand /></div><WorkspaceNavigation /><div className="workspace-help"><div><ShieldCheck size={15} /><span>Organization-scoped workspace</span></div><Link href="/security"><HelpCircle size={15} />Security &amp; help</Link></div></aside><div className="workspace-main"><header className="workspace-header"><div className="lg:hidden"><Brand compact /></div><div className="workspace-identity"><p>{identity.organizationName}</p><span>{identity.role} workspace</span></div><div className="workspace-user">{identity.demo ? <Badge tone="warning">Demo data</Badge> : null}<span className="workspace-user-name">{identity.fullName}</span><span className="workspace-avatar" aria-hidden="true">{identity.fullName.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>{identity.demo ? null : <SignOutButton />}</div></header><div className="workspace-mobile-bar"><WorkspaceNavigation mobile /></div><main className="workspace-content">{identity.demo ? <div className="demo-notice"><strong>Demo workspace:</strong> all records are fictional and resettable. Do not enter confidential, patient, regulated, or production data.</div> : null}{children}</main></div></div>;
}
