import type { ReactNode } from "react";
import { AppShell } from "@/components/app/app-shell";
import { requireWorkspaceIdentity } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: ReactNode }) {
  const identity = await requireWorkspaceIdentity();
  return <AppShell identity={identity}>{children}</AppShell>;
}
