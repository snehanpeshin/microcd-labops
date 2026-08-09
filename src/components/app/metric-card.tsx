import type { ReactNode } from "react";

export function MetricCard({ label, value, note, icon }: { label: string; value: string | number; note: string; icon: ReactNode }) {
  return <article className="metric-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-slate-600">{label}</p><strong className="mt-2 block text-3xl font-semibold text-slate-950">{value}</strong></div><span className="metric-card-icon grid size-9 place-items-center rounded-md bg-slate-100 text-slate-600">{icon}</span></div><p className="mt-3 text-xs leading-5 text-slate-500">{note}</p></article>;
}
