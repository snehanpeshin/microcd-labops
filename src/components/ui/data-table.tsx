import type { ReactNode } from "react";

export function DataTable({ headers, children, caption }: { headers: string[]; children: ReactNode; caption: string }) {
  return <div className="data-table-wrap w-full max-w-full overflow-x-auto"><table className="w-full min-w-[720px] border-collapse text-left text-sm"><caption className="sr-only">{caption}</caption><thead><tr className="border-b border-slate-200 bg-slate-50">{headers.map((header) => <th key={header} scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{children}</tbody></table></div>;
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle text-slate-700 ${className}`}>{children}</td>;
}
