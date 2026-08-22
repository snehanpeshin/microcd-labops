export const REGULATORY_DISCLAIMER = "Regulatory Navigator provides decision-support information based on user inputs and published regulatory frameworks. Results may be incomplete or inaccurate and do not constitute regulatory, legal, quality, or compliance advice. Users should confirm conclusions with qualified regulatory professionals and applicable authorities.";

export type Market = "US" | "EU";
export type DeviceType = "hardware" | "software" | "combination";
export type FailureImpact = "inconvenience" | "delay_diagnosis" | "incorrect_diagnosis" | "deterioration" | "serious_injury" | "death";
export type PredicateAvailability = "yes" | "no" | "unknown";
export type RequirementStatus = "not_assessed" | "missing" | "partial" | "evidence_linked" | "needs_review";
export type EvidenceType = "project" | "experiment" | "report" | "evidence_packet" | "protocol" | "file";

export interface RegulatoryProfileInput {
  productName: string;
  intendedUse: string;
  intendedUser: string;
  targetPopulation: string;
  clinicalEnvironment: string;
  markets: Market[];
  deviceType: DeviceType;
  isIVD: boolean;
  isSaMD: boolean;
  hasAI: boolean;
  isConnected: boolean;
  isPatientFacing: boolean;
  isDiagnostic: boolean;
  isTherapeutic: boolean;
  isMonitoring: boolean;
  drivesClinicalDecisions: boolean;
  failureImpact: FailureImpact;
  predicateAvailability: PredicateAvailability;
}

export interface RegulatoryAssessmentResult {
  jurisdiction: "US";
  possibleDeviceStatus: string;
  possibleClassification: string;
  possiblePathway: string;
  confidence: "preliminary" | "insufficient_information";
  ruleId: string;
  ruleVersion: string;
  evaluatedInputs: RegulatoryProfileInput;
  reasoning: string[];
  assumptions: string[];
  confirmations: string[];
}

export interface RequirementDefinition {
  category: string;
  title: string;
  description: string;
  rationale: string;
  jurisdiction: "US" | "Generic";
  priority: "critical" | "high" | "medium" | "low";
  minimumEvidenceCount: number;
}

export interface EvidenceLink {
  id: string;
  requirementId: string;
  evidenceType: EvidenceType;
  evidenceId: string;
  label: string;
  href: string;
  notes: string;
  linkedAt: string;
  available: boolean;
}

export interface RegulatoryRequirement extends RequirementDefinition {
  id: string;
  status: RequirementStatus;
  updatedAt: string;
  evidence: EvidenceLink[];
}

export interface RegulatoryReference {
  authority: string;
  title: string;
  identifier: string;
  sourceUrl: string;
  version: string;
  effectiveDate?: string;
  lastReviewedDate: string;
}
