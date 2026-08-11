import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions, breadcrumbs }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode; breadcrumbs?: { label:string; href?:string }[] }) {
  return <header className="flex flex-wrap items-end justify-between gap-5"><div className="max-w-3xl">{breadcrumbs?.length?<nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">{breadcrumbs.map((item,index)=><span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">{index?<span aria-hidden="true">/</span>:null}{item.href?<Link href={item.href} className="hover:text-teal-700">{item.label}</Link>:<span aria-current="page">{item.label}</span>}</span>)}</nav>:null}{eyebrow ? <p className="mb-2 text-xs font-bold uppercase tracking-wide text-teal-700">{eyebrow}</p> : null}<h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">{title}</h1>{description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p> : null}</div>{actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}</header>;
}
