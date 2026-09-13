import { SearchX } from "lucide-react";
import { Brand } from "@/components/brand";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound(){
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><section className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"><div className="flex justify-center"><Brand/></div><span className="mx-auto mt-8 grid size-12 place-items-center rounded-full bg-teal-50 text-teal-800"><SearchX size={22} aria-hidden="true"/></span><p className="mt-5 text-xs font-bold uppercase tracking-wide text-teal-700">404 · Page not found</p><h1 className="mt-2 text-2xl font-semibold text-slate-950">This LabOps page is unavailable</h1><p className="mt-3 text-sm leading-6 text-slate-600">The address may have changed, or the record may no longer be available to this workspace.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><ButtonLink href="/app">Open workspace</ButtonLink><ButtonLink href="/" variant="secondary">LabOps home</ButtonLink></div></section></main>;
}
