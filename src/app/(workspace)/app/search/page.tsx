import Link from "next/link";
import { Search } from "lucide-react";
import { requireWorkspaceIdentity } from "@/lib/auth";
import { globalSearch } from "@/lib/data/lab-operations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string}>}){const identity=await requireWorkspaceIdentity();const q=(await searchParams).q?.trim()??"";const results=await globalSearch(identity,q);return <><PageHeader eyebrow="Workspace-wide lookup" title="Global search" description="Find projects, experiments, samples, inventory, equipment, and protocols from one place."/><Card><CardContent><form className="flex flex-col gap-3 sm:flex-row"><label className="registry-search"><Search size={17}/><span className="sr-only">Search workspace</span><input autoFocus name="q" defaultValue={q} minLength={2} placeholder="Search identifiers, names, barcodes, lots, or keywords"/></label><Button>Search</Button></form></CardContent></Card>{q.length>0&&q.length<2?<p className="text-sm text-amber-800">Enter at least two characters.</p>:null}{q.length>=2?<Card><CardContent className="space-y-2">{results.map(r=><Link key={`${r.type}-${r.id}`} href={r.href} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-4 hover:border-teal-300 hover:bg-teal-50/30"><Badge tone="neutral">{r.type}</Badge><div className="min-w-0 flex-1"><strong className="block text-slate-950">{r.primary}</strong><span className="text-sm text-slate-500">{r.secondary}</span></div>{r.status?<Badge tone="info">{r.status}</Badge>:null}</Link>)}{!results.length?<EmptyState title="No matching records" description={`No records matched “${q}”. Try an identifier, owner, barcode, or broader keyword.`}/>:null}</CardContent></Card>:null}</>}
