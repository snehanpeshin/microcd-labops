import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <header className="flex flex-wrap items-end justify-between gap-5"><div className="max-w-3xl">{eyebrow ? <p className="mb-2 text-xs font-bold uppercase tracking-wide text-teal-700">{eyebrow}</p> : null}<h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">{title}</h1>{description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p> : null}</div>{actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}</header>;
}
