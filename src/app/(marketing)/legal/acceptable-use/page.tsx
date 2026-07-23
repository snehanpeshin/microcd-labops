import { marketingMetadata } from "@/lib/seo";

export const metadata = marketingMetadata({
  title: "Acceptable Use Policy",
  description: "Acceptable-use requirements for MicroCD LabOps accounts, engineering records, security controls, and AI-assisted drafting.",
  path: "/legal/acceptable-use",
});

export default function AcceptableUsePage(){return <article className="prose-legal mx-auto max-w-4xl px-5 py-16"><h1 className="text-4xl font-semibold">Acceptable Use</h1><p>Do not use LabOps to violate law, infringe rights, distribute malware, probe other tenants, bypass access controls, overload the service, or store prohibited data. Do not use AI drafts as unreviewed evidence, approvals, clinical decisions, or regulatory advice. Access may be restricted to protect users and the service.</p></article>}
