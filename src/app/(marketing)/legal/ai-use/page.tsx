import { marketingMetadata } from "@/lib/seo";

export const metadata = marketingMetadata({
  title: "AI Use Disclosure",
  description: "How optional AI-assisted drafting works in MicroCD LabOps, including evidence boundaries, labeling, and required human review.",
  path: "/legal/ai-use",
});

export default function AiUsePage(){return <article className="prose-legal mx-auto max-w-4xl px-5 py-16"><h1 className="text-4xl font-semibold">AI Use Disclosure</h1><p>AI assistance is optional and disabled without administrator configuration. Drafts are generated from user-provided context, labeled as AI-assisted, and may contain errors or omissions. AI does not determine acceptance criteria, approve reports, sign records, or replace technical review. Users must verify every generated statement against source evidence before use.</p></article>}
