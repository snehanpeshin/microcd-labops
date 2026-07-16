import type { ReactNode } from "react";
import { FilePlus2 } from "lucide-react";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="grid min-h-56 place-items-center p-8 text-center"><div className="max-w-sm"><span className="mx-auto grid size-11 place-items-center rounded-full bg-slate-100 text-slate-600"><FilePlus2 size={20} /></span><h3 className="mt-4 font-semibold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>{action ? <div className="mt-5">{action}</div> : null}</div></div>;
}
