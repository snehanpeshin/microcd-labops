"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Activity, Building2, ClipboardCheck, FileText, FolderKanban, Gauge, Library, PackageSearch, Settings, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation: { href: string; label: string; shortLabel: string; icon: LucideIcon }[] = [
  { href: "/app", label: "Dashboard", shortLabel: "Dashboard", icon: Gauge },
  { href: "/app/documents", label: "Documentation Hub", shortLabel: "Documents", icon: Library },
  { href: "/app/projects", label: "Projects", shortLabel: "Projects", icon: FolderKanban },
  { href: "/app/reports", label: "Engineering Reports", shortLabel: "Reports", icon: FileText },
  { href: "/app/suppliers", label: "Suppliers", shortLabel: "Suppliers", icon: Building2 },
  { href: "/app/components", label: "Components & Materials", shortLabel: "Components", icon: Boxes },
  { href: "/app/lots", label: "Lots & Shipments", shortLabel: "Lots", icon: PackageSearch },
  { href: "/app/inspections", label: "Inspections", shortLabel: "Inspections", icon: ClipboardCheck },
  { href: "/app/activity", label: "Activity Log", shortLabel: "Activity", icon: Activity },
  { href: "/app/settings", label: "Settings", shortLabel: "Settings", icon: Settings },
];

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
        {navigation.map((item) => <option key={item.href} value={item.href}>{item.shortLabel}</option>)}
      </select>
    </label>;
  }

  return <nav className="workspace-nav" aria-label="Workspace navigation">
    {navigation.map(({ href, label, icon: Icon }) => {
      const active = isCurrent(pathname, href);
      return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("workspace-nav-link", active && "workspace-nav-link-active")}>
        <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
        <span>{label}</span>
      </Link>;
    })}
  </nav>;
}
