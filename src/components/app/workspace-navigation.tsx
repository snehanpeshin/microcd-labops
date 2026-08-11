"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Activity, BarChart3, BookOpenCheck, Boxes, Braces, Building2, ClipboardCheck, FileText, FileUp, FlaskConical, FolderKanban, Gauge, ListTodo, Microscope, PackageSearch, Search, Settings, Sparkles, TestTube2, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";

type NavigationItem = { href:string; label:string; shortLabel:string; icon:LucideIcon };
const navigationGroups: { label:string; items:NavigationItem[] }[] = [
  { label:"Overview", items:[{ href:"/app",label:"Dashboard",shortLabel:"Dashboard",icon:Gauge }] },
  { label:"Lab operations", items:[
    { href:"/app/projects",label:"Projects",shortLabel:"Projects",icon:FolderKanban },
    { href:"/app/experiments",label:"Experiments",shortLabel:"Experiments",icon:FlaskConical },
    { href:"/app/samples",label:"Samples",shortLabel:"Samples",icon:TestTube2 },
    { href:"/app/protocols",label:"Protocols",shortLabel:"Protocols",icon:BookOpenCheck },
  ]},
  { label:"Resources", items:[
    { href:"/app/inventory",label:"Inventory & Reagents",shortLabel:"Inventory",icon:Warehouse },
    { href:"/app/equipment",label:"Equipment",shortLabel:"Equipment",icon:Microscope },
    { href:"/app/suppliers",label:"Suppliers",shortLabel:"Suppliers",icon:Building2 },
    { href:"/app/components",label:"Components & Materials",shortLabel:"Components",icon:Boxes },
    { href:"/app/lots",label:"Lots & Shipments",shortLabel:"Lots",icon:PackageSearch },
    { href:"/app/inspections",label:"Inspections",shortLabel:"Inspections",icon:ClipboardCheck },
  ]},
  { label:"Documentation", items:[{ href:"/app/reports",label:"Engineering Reports",shortLabel:"Reports",icon:FileText }] },
  { label:"Work", items:[
    { href:"/app/tasks",label:"Tasks",shortLabel:"Tasks",icon:ListTodo },
    { href:"/app/imports",label:"CSV Imports",shortLabel:"Imports",icon:FileUp },
  ]},
  { label:"Insights", items:[{ href:"/app/analytics",label:"Pilot Analytics",shortLabel:"Analytics",icon:BarChart3 }] },
  { label:"System", items:[
    { href:"/app/get-started",label:"Workspace Templates",shortLabel:"Templates",icon:Sparkles },
    { href:"/app/developers",label:"Exports & API",shortLabel:"Data & API",icon:Braces },
    { href:"/app/search",label:"Global Search",shortLabel:"Search",icon:Search },
    { href:"/app/activity",label:"Activity Log",shortLabel:"Activity",icon:Activity },
    { href:"/app/settings",label:"Settings",shortLabel:"Settings",icon:Settings },
  ]},
];
const navigation = navigationGroups.flatMap((group)=>group.items);

function isCurrent(pathname: string, href: string) {
  return href === "/app" ? pathname === href : pathname.startsWith(href);
}

export function WorkspaceNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  if (mobile) {
    return <label className="mobile-workspace-nav">
      <span>Workspace section</span>
      <select aria-label="Workspace section" value={navigation.find((item) => isCurrent(pathname, item.href))?.href ?? "/app"} onChange={(event) => router.push(event.target.value)}>
        {navigationGroups.map((group)=><optgroup key={group.label} label={group.label}>{group.items.map((item) => <option key={item.href} value={item.href}>{item.shortLabel}</option>)}</optgroup>)}
      </select>
    </label>;
  }

  return <nav className="workspace-nav" aria-label="Workspace navigation">
    {navigationGroups.map((group)=><div key={group.label} className="workspace-nav-group"><p>{group.label}</p>{group.items.map(({ href, label, icon: Icon }) => { const active=isCurrent(pathname,href); return <Link key={href} href={href} aria-current={active?"page":undefined} className={cn("workspace-nav-link",active&&"workspace-nav-link-active")}><Icon size={17} strokeWidth={1.8} aria-hidden="true"/><span>{label}</span></Link>; })}</div>)}
  </nav>;
}
