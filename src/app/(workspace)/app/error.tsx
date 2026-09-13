"use client";

import { AlertTriangle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function WorkspaceError({ error,reset }: { error:Error & { digest?:string }; reset:()=>void }) {
  return <div role="alert" className="grid min-h-80 place-items-center rounded-lg border border-red-200 bg-white p-8 text-center"><div className="max-w-md"><span className="mx-auto grid size-11 place-items-center rounded-full bg-red-50 text-red-700"><AlertTriangle size={20} aria-hidden="true"/></span><h1 className="mt-4 text-xl font-semibold text-slate-950">This workspace view could not be loaded</h1><p className="mt-2 text-sm leading-6 text-slate-600">Try the request again. Your existing records have not been changed.</p>{error.digest?<p className="mt-2 text-xs text-slate-500">Support reference: <code>{error.digest}</code></p>:null}<div className="mt-5 flex flex-wrap justify-center gap-2"><Button onClick={reset}>Try again</Button><ButtonLink href="/app" variant="secondary">Return to dashboard</ButtonLink></div></div></div>;
}
