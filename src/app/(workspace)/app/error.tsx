"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkspaceError({ reset }: { error:Error & { digest?:string }; reset:()=>void }) {
  return <div className="grid min-h-80 place-items-center rounded-lg border border-red-200 bg-white p-8 text-center"><div className="max-w-md"><span className="mx-auto grid size-11 place-items-center rounded-full bg-red-50 text-red-700"><AlertTriangle size={20}/></span><h1 className="mt-4 text-xl font-semibold text-slate-950">This workspace view could not be loaded</h1><p className="mt-2 text-sm leading-6 text-slate-600">Try again. If the problem continues, contact support with the time and page you were viewing.</p><Button className="mt-5" onClick={reset}>Try again</Button></div></div>;
}
