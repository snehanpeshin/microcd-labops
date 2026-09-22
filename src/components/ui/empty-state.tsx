import type { ReactNode } from "react";
import { FilePlus2 } from "lucide-react";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div><span><FilePlus2 size={21} aria-hidden="true"/></span><h3>{title}</h3><p>{description}</p>{action ? <div className="mt-5">{action}</div> : null}</div></div>;
}
