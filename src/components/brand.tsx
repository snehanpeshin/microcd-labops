import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="inline-flex items-center gap-3 font-semibold text-slate-950" aria-label="MicroCD LabOps home"><span className="grid size-8 place-items-center rounded-full bg-slate-950 text-sm text-white">µ</span>{compact ? null : <span><span className="block text-sm leading-none">MicroCD</span><span className="mt-1 block text-[11px] font-medium uppercase tracking-wide text-teal-700">LabOps</span></span>}</Link>;
}
