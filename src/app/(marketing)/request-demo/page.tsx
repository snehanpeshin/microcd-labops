import { LeadForm } from "@/components/marketing/lead-form";
import { marketingMetadata } from "@/lib/seo";

export const metadata = marketingMetadata({
  title: "Request a LabOps Pilot",
  description: "Discuss a focused MicroCD LabOps pilot for an experiment, sample, protocol, resource-readiness, or engineering evidence workflow.",
  path: "/request-demo",
});
export default function RequestDemoPage() { return <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[.75fr_1.25fr]"><div><p className="text-sm font-semibold uppercase tracking-wide text-teal-800">Focused pilot</p><h1 className="mt-3 text-4xl font-semibold text-slate-950">Test LabOps against one costly laboratory bottleneck.</h1><p className="mt-5 text-base leading-7 text-slate-600">Choose one experiment, sample, protocol, inventory, equipment, or evidence workflow. Establish a baseline, use fictional or non-sensitive data, and measure whether LabOps reduces retrieval time, missed handoffs, or operational surprises.</p><ul className="mt-7 space-y-3 text-sm text-slate-700"><li>Define one customer problem and measurable outcome</li><li>Configure the minimum workflow needed to test it</li><li>Document what worked, what did not, and the decision to continue</li></ul></div><div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-semibold text-slate-950">Tell us where the workflow breaks down</h2><p className="mt-2 mb-6 text-sm text-slate-600">Do not include patient data, confidential methods, or sensitive project details.</p><LeadForm /></div></div>; }
