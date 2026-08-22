import type { EvidenceLink, RequirementStatus } from "./types";

export function deriveRequirementStatus(links: Pick<EvidenceLink, "available">[], minimumEvidenceCount: number): RequirementStatus {
  if (!links.length) return "missing";
  const available = links.filter((item) => item.available).length;
  if (!available) return "needs_review";
  if (available < minimumEvidenceCount || available < links.length) return "partial";
  return "evidence_linked";
}

export function summarizeCoverage(requirements: { status: RequirementStatus }[]) {
  const supported = requirements.filter((item) => item.status === "evidence_linked").length;
  const partial = requirements.filter((item) => item.status === "partial" || item.status === "needs_review").length;
  const missing = requirements.filter((item) => item.status === "missing").length;
  const assessed = requirements.filter((item) => item.status !== "not_assessed").length;
  const score = supported + partial * 0.5;
  return { total: requirements.length, supported, partial, missing, notAssessed: requirements.length - assessed, percentage: requirements.length ? Math.round((score / requirements.length) * 100) : 0 };
}

export function uniqueEvidenceLinks<T extends { evidenceType: string; evidenceId: string }>(links: T[]): T[] {
  const seen = new Set<string>();
  return links.filter((item) => { const key = `${item.evidenceType}:${item.evidenceId}`; if (seen.has(key)) return false; seen.add(key); return true; });
}
