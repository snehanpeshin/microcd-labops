import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app/app-shell";
import { requireWorkspaceIdentity } from "@/lib/auth";
import { privatePageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = privatePageMetadata(
  "Private Engineering Workspace",
  "Authenticated MicroCD LabOps workspace for organization-scoped engineering records.",
);

export default async function Layout({ children }: { children: ReactNode }) {
  const identity = await requireWorkspaceIdentity();
  return <AppShell identity={identity}>{children}</AppShell>;
}
