import type { ReactNode } from "react";

export function DataTable({ headers, children, caption }: { headers: string[]; children: ReactNode; caption: string }) {
  return <div className="data-table-wrap"><table><caption className="sr-only">{caption}</caption><thead><tr>{headers.map((header) => <th key={header} scope="col">{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={className}>{children}</td>;
}
