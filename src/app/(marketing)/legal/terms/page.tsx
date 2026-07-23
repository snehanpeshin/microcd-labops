import { marketingMetadata } from "@/lib/seo";

export const metadata = marketingMetadata({
  title: "Terms of Use",
  description: "Terms governing MicroCD LabOps trials, customer responsibilities, engineering records, regulated-use boundaries, and service availability.",
  path: "/legal/terms",
});

export default function TermsPage(){return <article className="prose-legal mx-auto max-w-4xl px-5 py-16"><h1 className="text-4xl font-semibold">Terms of Use</h1><p>Last updated July 14, 2026. Draft for legal review before commercial launch.</p><h2>Service</h2><p>LabOps supports engineering documentation and supplier traceability workflows. It does not replace professional engineering, quality, legal, statistical, medical, regulatory, or cybersecurity advice.</p><h2>Customer responsibility</h2><p>Customers remain responsible for source-data accuracy, acceptance criteria, report review, supplier decisions, backups, validation, user access, and determining whether the service is suitable for their intended use.</p><h2>No regulated-system representation</h2><p>Unless a signed agreement states otherwise, the service is not represented as validated for regulated electronic records, electronic signatures, clinical decisions, or a formal quality management system.</p><h2>Availability and changes</h2><p>Trial functionality may change and is provided without a production service-level commitment. Paid terms, support, limits, and warranty language require an executed commercial agreement.</p></article>}
