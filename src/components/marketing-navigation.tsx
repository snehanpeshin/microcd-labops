"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const marketingLinks = [
  { href:"/product-tour", label:"Product tour" },
  { href:"/features/reports", label:"Reports + AI" },
  { href:"/features/traceability", label:"Traceability" },
  { href:"/pricing", label:"Pricing" },
  { href:"/security", label:"Security" },
];

function isCurrent(pathname:string,href:string){return pathname===href||pathname.startsWith(`${href}/`);}

export function MarketingNavigation({mobile=false}:{mobile?:boolean}){
  const pathname=usePathname();
  return <nav aria-label={mobile?"Mobile navigation":"Marketing navigation"} className={mobile?undefined:"marketing-nav"}>
    {marketingLinks.map((item)=>{const active=isCurrent(pathname,item.href);return <Link key={item.href} href={item.href} aria-current={active?"page":undefined} className={cn(active&&"marketing-nav-active")}>{item.label}</Link>;})}
    {mobile?<><Link href="/request-demo" aria-current={pathname==="/request-demo"?"page":undefined} className={cn(pathname==="/request-demo"&&"marketing-nav-active")}>Discuss a pilot</Link><Link href="/login" aria-current={pathname==="/login"?"page":undefined} className={cn(pathname==="/login"&&"marketing-nav-active")}>Log in</Link></>:null}
  </nav>;
}
