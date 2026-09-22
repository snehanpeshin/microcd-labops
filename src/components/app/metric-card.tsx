import type { ReactNode } from "react";

export function MetricCard({ label, value, note, icon }: { label: string; value: string | number; note: string; icon: ReactNode }) {
  return <article className="metric-card"><div><div><p>{label}</p><strong>{value}</strong></div><span className="metric-card-icon">{icon}</span></div><p>{note}</p></article>;
}
