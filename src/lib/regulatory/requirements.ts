import type { RegulatoryProfileInput, RequirementDefinition } from "./types";

const requirement = (category: string, title: string, description: string, rationale: string, priority: RequirementDefinition["priority"] = "medium", minimumEvidenceCount = 1, jurisdiction: RequirementDefinition["jurisdiction"] = "Generic"): RequirementDefinition => ({ category, title, description, rationale, jurisdiction, priority, minimumEvidenceCount });

export function generateRequirements(profile: RegulatoryProfileInput): RequirementDefinition[] {
  const items: RequirementDefinition[] = [
    requirement("intended_use", "Intended Use", "A controlled intended-use statement and supporting use conditions.", "Classification and evidence planning depend on intended use and indications.", "critical", 1, "US"),
    requirement("design_inputs", "Design Inputs", "Approved user, performance, interface, safety, and regulatory inputs.", "Design inputs define what verification and validation must demonstrate.", "high"),
    requirement("design_outputs", "Design Outputs", "Specifications and outputs that implement the design inputs.", "Traceable outputs support implementation and verification.", "high"),
    requirement("verification", "Verification", "Objective evidence that design outputs meet design inputs.", "Verification evidence is central to demonstrating that the design was implemented as specified.", "critical", 2),
    requirement("validation", "Validation", "Evidence that the product meets user needs and intended uses under actual or simulated use conditions.", "Validation addresses intended users and use environments.", "critical", 2),
    requirement("risk_management", "Risk Management", "Risk analysis, controls, verification of controls, and residual-risk decisions.", "The profile identifies medical functions and possible patient/user harm.", "critical", 2),
    requirement("manufacturing", "Manufacturing", "Evidence for controlled build, inspection, supplier, lot, and process activities.", "Manufacturing evidence connects released design intent to physical product realization.", "high"),
    requirement("labeling", "Labeling", "Draft labeling, instructions, warnings, and claims aligned to intended use.", "Labeling affects intended use and communicates safe use.", "high", 1, "US"),
  ];

  if (profile.isDiagnostic || profile.isIVD) {
    items.push(requirement("analytical_performance", "Analytical Performance", "Evidence such as precision, accuracy, analytical sensitivity, specificity, interference, and measuring range as applicable.", "The profile identifies a diagnostic or IVD function.", "critical", 3, "US"));
    items.push(requirement("clinical_performance", "Clinical Performance", "Evidence supporting performance in the intended population and clinical context as applicable.", "The profile identifies a diagnostic function that may affect clinical decisions.", "critical", 2, "US"));
    items.push(requirement("shelf_life", "Shelf Life / Stability", "Stability evidence supporting storage, transport, and claimed shelf life as applicable.", "IVD and diagnostic materials may require stability support.", "high", 2));
  }

  if (profile.deviceType !== "hardware" || profile.isSaMD || profile.hasAI) items.push(requirement("software_verification", "Software Verification", "Versioned software requirements, architecture, testing, anomaly disposition, and release evidence.", "The profile identifies software, SaMD, or AI/ML functionality.", "critical", 2, "US"));
  if (profile.isConnected || profile.isSaMD || profile.hasAI) items.push(requirement("cybersecurity", "Cybersecurity", "Threat modeling, security requirements, testing, vulnerability handling, and update planning as applicable.", "The profile identifies connected, SaMD, or AI/ML functionality.", "high", 2, "US"));
  if (profile.isPatientFacing || profile.drivesClinicalDecisions) items.push(requirement("human_factors", "Usability / Human Factors", "Use-related risk analysis and evidence that intended users can use the product safely and effectively.", "The profile identifies patient-facing use or clinical-decision impact.", "high", 2, "US"));
  if (profile.deviceType !== "software") items.push(requirement("electrical_safety", "Electrical Safety", "Safety and electromagnetic compatibility evidence where applicable to the hardware configuration.", "The profile includes hardware; applicability and standards require confirmation.", "medium", 1));
  if (profile.isPatientFacing) items.push(requirement("biocompatibility", "Biocompatibility", "A biological evaluation and supporting evidence where patient-contacting materials are present.", "The product is patient-facing; actual nature and duration of contact require confirmation.", "high", 1));

  return items;
}
