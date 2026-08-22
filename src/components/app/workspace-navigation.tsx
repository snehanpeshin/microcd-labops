"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Activity, BarChart3, BookOpenCheck, Boxes, Braces, Building2, ChevronDown, ClipboardCheck, Compass, FileText, FileUp, FlaskConical, FolderKanban, Gauge, GitBranch, ListTodo, Microscope, PackageSearch, Search, Settings, Sparkles, TestTube2, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";

type NavigationItem = { href:string; label:string; shortLabel:string; icon:LucideIcon };
const navigationGroups: { label:string; primary?:boolean; items:NavigationItem[] }[] = [
  { label:"Run", primary:true, items:[
    { href:"/app",label:"Dashboard",shortLabel:"Dashboard",icon:Gauge },
    { href:"/app/projects",label:"Projects",shortLabel:"Projects",icon:FolderKanban },
    { href:"/app/experiments",label:"Experiments",shortLabel:"Experiments",icon:FlaskConical },
    { href:"/app/builds",label:"Device Builds",shortLabel:"Builds",icon:GitBranch },
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
  { label:"Evidence", items:[
    { href:"/app/reports",label:"Engineering Reports",shortLabel:"Reports",icon:FileText },
    { href:"/app/regulatory",label:"Regulatory Navigator",shortLabel:"Regulatory",icon:Compass },
    { href:"/app/tasks",label:"Tasks",shortLabel:"Tasks",icon:ListTodo },
    { href:"/app/imports",label:"CSV Imports",shortLabel:"Imports",icon:FileUp },
    { href:"/app/analytics",label:"Pilot Analytics",shortLabel:"Analytics",icon:BarChart3 },
  ]},
  { label:"Workspace", items:[
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
    {navigationGroups.map((group)=>{ const containsCurrent=group.items.some((item)=>isCurrent(pathname,item.href)); const links=group.items.map(({ href, label, icon: Icon }) => { const active=isCurrent(pathname,href); return <Link key={href} href={href} aria-current={active?"page":undefined} className={cn("workspace-nav-link",active&&"workspace-nav-link-active")}><Icon size={17} strokeWidth={1.8} aria-hidden="true"/><span>{label}</span></Link>; }); return group.primary ? <div key={group.label} className="workspace-nav-group"><p>{group.label}</p>{links}</div> : <details key={group.label} className="workspace-nav-group workspace-nav-collapsible" open={containsCurrent}><summary><span>{group.label}</span><ChevronDown size={14} aria-hidden="true"/></summary><div>{links}</div></details>; })}
  </nav>;
}
