import { Brand } from "@/components/brand";
import { WorkspaceSetup } from "@/components/auth/workspace-setup";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata(
  "Workspace Setup",
  "Create the organization workspace used to isolate MicroCD LabOps engineering records.",
  "/onboarding",
);

export default function OnboardingPage() { return <div><Brand /><h1 className="mt-8 text-2xl font-semibold text-slate-950">Set up your workspace</h1><p className="mt-2 text-sm leading-6 text-slate-600">Create the private workspace that will contain your projects, reports, suppliers, files, and team membership.</p><div className="mt-6"><WorkspaceSetup /></div></div>; }
