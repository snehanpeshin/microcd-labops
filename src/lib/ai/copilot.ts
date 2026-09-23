export const copilotAreas = [
  "workspace",
  "experiments",
  "samples",
  "resources",
  "reports",
  "dockets",
  "regulatory",
  "data",
] as const;

export type CopilotArea = (typeof copilotAreas)[number];

export const copilotAreaDetails: Record<CopilotArea, { label: string; href: string; starters: string[] }> = {
  workspace: { label: "Workspace priorities", href: "/app", starters: ["What should the team prioritize today?", "Give me a first-week LabOps onboarding checklist."] },
  experiments: { label: "Experiments & readiness", href: "/app/experiments", starters: ["Help me plan an experiment without inventing acceptance criteria.", "What evidence should I check before starting a run?"] },
  samples: { label: "Samples & traceability", href: "/app/samples", starters: ["Give me a sample traceability review checklist.", "What should I verify before moving or consuming a sample?"] },
  resources: { label: "Inventory & equipment", href: "/app/inventory", starters: ["Help me review resource readiness for upcoming work.", "Suggest a practical low-stock and calibration review routine."] },
  reports: { label: "Engineering reports", href: "/app/reports", starters: ["Help me outline an evidence-grounded engineering report.", "What should a reviewer challenge in a verification report?"] },
  dockets: { label: "Document dockets", href: "/app/dockets", starters: ["Which engineering docket should I work on next?", "Give me a human-review checklist for an AI-assisted document draft."] },
  regulatory: { label: "Regulatory readiness", href: "/app/regulatory", starters: ["Help me identify missing readiness evidence without making a regulatory determination.", "Explain how to prepare for a regulatory evidence review."] },
  data: { label: "Imports, exports & API", href: "/app/developers", starters: ["Help me prepare a safe CSV import.", "What should I verify before exporting workspace data?"] },
};

export function buildCopilotInstructions(area: CopilotArea) {
  return `You are the MicroCD LabOps AI Copilot for ${copilotAreaDetails[area].label}. Help entry-level engineers take safe, concrete next steps in a laboratory and medical-device development workspace. Use only the user's screened question, the aggregate workspace counts, and the product navigation map supplied in the request. Never claim you inspected a record, file, result, or regulation that was not supplied. Never invent acceptance criteria, measurements, approvals, signatures, compliance conclusions, root causes, or regulatory classifications. Do not provide medical advice. Do not tell the user that an action was performed; this assistant is read-only. Clearly distinguish facts, suggestions, and items requiring qualified human review. Prefer a short answer followed by a numbered action plan and a final 'Human review' note. Use plain text only.`;
}

export function buildCopilotInput(area: CopilotArea, question: string, aggregateContext: string) {
  const navigation = Object.values(copilotAreaDetails).map((item) => `${item.label}: ${item.href}`).join("\n");
  return `SELECTED WORK AREA\n${copilotAreaDetails[area].label}\n\nAGGREGATE WORKSPACE CONTEXT\n${aggregateContext}\n\nAVAILABLE LABOPS DESTINATIONS\n${navigation}\n\nUSER QUESTION\n${question}`;
}
