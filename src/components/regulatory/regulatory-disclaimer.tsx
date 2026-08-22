import { ShieldAlert } from "lucide-react";
import { REGULATORY_DISCLAIMER } from "@/lib/regulatory/types";

export function RegulatoryDisclaimer(){return <aside role="note" aria-label="Regulatory decision-support disclaimer" className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"><ShieldAlert className="mt-0.5 shrink-0" size={19} aria-hidden="true"/><div><strong>Decision support only.</strong> {REGULATORY_DISCLAIMER}</div></aside>;}
