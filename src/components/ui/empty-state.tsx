import type { ReactNode } from "react";
import { FilePlus2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({ title, description, action, icon, compact = false }: { title: string; description: string; action?: ReactNode; icon?: ReactNode; compact?: boolean }) {
  return <div className={cn("empty-state", compact && "empty-state-compact")}><div><span>{icon ?? <FilePlus2 size={21} aria-hidden="true"/>}</span><h3>{title}</h3><p>{description}</p>{action ? <div className="mt-5">{action}</div> : null}</div></div>;
}
