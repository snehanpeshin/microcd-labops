import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions, breadcrumbs }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode; breadcrumbs?: { label:string; href?:string }[] }) {
  return <header className="page-header"><div className="page-header-copy">{breadcrumbs?.length?<nav aria-label="Breadcrumb" className="page-breadcrumbs">{breadcrumbs.map((item,index)=><span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">{index?<span aria-hidden="true">/</span>:null}{item.href?<Link href={item.href}>{item.label}</Link>:<span aria-current="page">{item.label}</span>}</span>)}</nav>:null}{eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}<h1>{title}</h1>{description ? <p className="page-description">{description}</p> : null}</div>{actions ? <div className="page-actions">{actions}</div> : null}</header>;
}
