import type { RegulatoryAssessmentResult, RegulatoryProfileInput } from "./types";

export const FDA_RULESET_VERSION = "2026.08.1";

const medicalFunction = (input: RegulatoryProfileInput) => input.isIVD || input.isSaMD || input.isDiagnostic || input.isTherapeutic || input.isMonitoring || input.drivesClinicalDecisions;
const highestRisk = (input: RegulatoryProfileInput) => input.failureImpact === "death" || input.failureImpact === "serious_injury";
const moderateRisk = (input: RegulatoryProfileInput) => ["delay_diagnosis", "incorrect_diagnosis", "deterioration"].includes(input.failureImpact);

function base(input: RegulatoryProfileInput): Pick<RegulatoryAssessmentResult, "jurisdiction" | "evaluatedInputs" | "ruleVersion" | "assumptions"> {
  return {
    jurisdiction: "US",
    evaluatedInputs: input,
    ruleVersion: FDA_RULESET_VERSION,
    assumptions: [
      "The questionnaire is complete and accurately reflects the current intended use and device configuration.",
      "No FDA product code, classification regulation, predicate record, exemption limitation, or formal agency determination has been verified by LabOps.",
    ],
  };
}

export function assessUSProfile(input: RegulatoryProfileInput): RegulatoryAssessmentResult {
  const common = base(input);
  if (!input.markets.includes("US")) return {
    ...common,
    possibleDeviceStatus: "Not assessed for the United States",
    possibleClassification: "Not assessed",
    possiblePathway: "US assessment not requested",
    confidence: "insufficient_information",
    ruleId: "FDA-SCOPE-001",
    reasoning: ["The selected target markets do not include the United States."],
    confirmations: ["Select the United States as a target market before using the FDA decision-support module."],
  };

  if (!input.productName || !input.intendedUse.trim()) return {
    ...common,
    possibleDeviceStatus: "Insufficient information",
    possibleClassification: "Not assessed",
    possiblePathway: "Complete the profile",
    confidence: "insufficient_information",
    ruleId: "FDA-INCOMPLETE-001",
    reasoning: ["Product name and intended use are required before preliminary pathway reasoning can be generated."],
    confirmations: ["Complete the intended-use statement and confirm the product functions."],
  };

  if (!medicalFunction(input)) return {
    ...common,
    possibleDeviceStatus: "Medical-device applicability is unclear",
    possibleClassification: "Not assessed",
    possiblePathway: "Confirm device applicability",
    confidence: "preliminary",
    ruleId: "FDA-DEVICE-001",
    reasoning: ["The supplied answers do not identify a diagnostic, therapeutic, monitoring, IVD, SaMD, or clinical-decision function."],
    confirmations: ["Confirm the intended use and whether the product meets the statutory definition of a medical device with qualified counsel or FDA, including whether a 513(g) request is appropriate."],
  };

  if (highestRisk(input)) return {
    ...common,
    possibleDeviceStatus: "Potential medical device",
    possibleClassification: "Potential Class III",
    possiblePathway: "Possible PMA pathway",
    confidence: "preliminary",
    ruleId: "FDA-PATH-003",
    reasoning: [
      "The stated function appears medical-device related.",
      "The user indicated that failure could cause serious injury or death.",
      "This high-risk signal warrants evaluating whether Class III controls and a PMA pathway may apply.",
    ],
    confirmations: ["Identify the applicable FDA product code and classification regulation.", "Confirm whether general and special controls could be sufficient.", "Confirm the pathway directly with FDA and qualified regulatory counsel."],
  };

  if (input.predicateAvailability === "yes") return {
    ...common,
    possibleDeviceStatus: "Potential medical device",
    possibleClassification: moderateRisk(input) || input.isDiagnostic || input.isIVD || input.isSaMD ? "Potential Class II" : "Potential Class I or II",
    possiblePathway: "Possible 510(k) pathway",
    confidence: "preliminary",
    ruleId: "FDA-PATH-001",
    reasoning: [
      "The stated function appears medical-device related.",
      "The user indicated that a possible legally marketed predicate may exist.",
      "The reported risk is below the highest-risk answer.",
      "This combination may be compatible with a 510(k) pathway if substantial equivalence and the applicable classification regulation are confirmed.",
    ],
    confirmations: ["Verify the candidate predicate is legally marketed and suitable.", "Confirm the product code, classification, special controls, and exemption limitations.", "Confirm that technological differences do not raise different questions of safety and effectiveness."],
  };

  if (input.predicateAvailability === "no" && (moderateRisk(input) || input.isDiagnostic || input.isIVD || input.isSaMD)) return {
    ...common,
    possibleDeviceStatus: "Potential medical device",
    possibleClassification: "Potential Class I or II",
    possiblePathway: "Possible De Novo pathway",
    confidence: "preliminary",
    ruleId: "FDA-PATH-002",
    reasoning: [
      "The stated function appears medical-device related.",
      "The user indicated that no legally marketed predicate is available.",
      "The reported risk is not the highest-risk answer.",
      "A novel low-to-moderate-risk device may warrant evaluation of the De Novo pathway.",
    ],
    confirmations: ["Perform a documented predicate and product-code search.", "Confirm that general controls or general and special controls could provide reasonable assurance of safety and effectiveness.", "Confirm the pathway directly with FDA and qualified regulatory counsel."],
  };

  return {
    ...common,
    possibleDeviceStatus: "Potential medical device",
    possibleClassification: "Potential Class I or II",
    possiblePathway: input.predicateAvailability === "unknown" ? "Predicate research required" : "Possible exempt or De Novo pathway",
    confidence: "preliminary",
    ruleId: input.predicateAvailability === "unknown" ? "FDA-PATH-004" : "FDA-PATH-005",
    reasoning: ["The stated function appears medical-device related.", "The reported failure impact is comparatively low.", "The selected answers are not sufficient to distinguish an exempt possibility, 510(k), or De Novo pathway."],
    confirmations: ["Identify the applicable product code and classification regulation.", "Check all limitations of exemption.", "Complete predicate research and confirm the conclusion with qualified regulatory professionals."],
  };
}
