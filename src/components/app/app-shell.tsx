import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, Boxes, Building2, ClipboardCheck, FileText, FolderKanban, Gauge, HelpCircle, PackageSearch, Settings, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import type { WorkspaceIdentity } from "@/lib/auth";

const navigation = [
  { href: "/app", label: "Dashboard", icon: Gauge },
  { href: "/app/projects", label: "Projects", icon: FolderKanban },
  { href: "/app/reports", label: "Engineering Reports", icon: FileText },
  { href: "/app/suppliers", label: "Suppliers", icon: Building2 },
  { href: "/app/components", label: "Components & Materials", icon: Boxes },
  { href: "/app/lots", label: "Lots & Shipments", icon: PackageSearch },
  { href: "/app/inspections", label: "Inspections", icon: ClipboardCheck },
  { href: "/app/activity", label: "Activity Log", icon: Activity },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children, identity }: { children: ReactNode; identity: WorkspaceIdentity }) {
  return <div className="min-h-screen bg-slate-50"><aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col"><div className="flex min-h-16 items-center border-b border-slate-100 px-5"><Brand /></div><nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Workspace navigation">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"><Icon size={18} aria-hidden="true" />{label}</Link>)}</nav><div className="border-t border-slate-100 p-4 text-xs text-slate-500"><div className="flex items-center gap-2"><ShieldCheck size={15} /><span>Organization-scoped workspace</span></div><Link href="/security" className="mt-3 flex items-center gap-2"><HelpCircle size={15} />Security &amp; help</Link></div></aside><div className="lg:pl-64"><header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{identity.organizationName}</p><p className="text-xs text-slate-500">{identity.role} workspace</p></div><div className="flex items-center gap-3">{identity.demo ? <Badge tone="warning">Fictional demo data</Badge> : null}<span className="hidden text-sm text-slate-600 sm:inline">{identity.fullName}</span><span className="grid size-9 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">{identity.fullName.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span></div></header><div className="border-b border-slate-200 bg-white px-4 py-2 lg:hidden"><nav className="flex gap-2 overflow-x-auto" aria-label="Mobile workspace navigation">{navigation.slice(0, 7).map(({ href, label }) => <Link key={href} href={href} className="whitespace-nowrap rounded-md bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">{label}</Link>)}</nav></div><main className="mx-auto max-w-[1480px] space-y-7 p-4 sm:p-6 lg:p-8">{identity.demo ? <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"><strong>Demo workspace:</strong> all records are fictional and resettable. Do not enter confidential, patient, regulated, or production data.</div> : null}{children}</main></div></div>;
}
