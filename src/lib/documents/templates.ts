export type TemplateReference = { label: string; url: string };

export type DocumentTemplate = {
  id: string;
  title: string;
  description: string;
  domain: string;
  type: string;
  stage: string;
  tags: string[];
  status: "Starter" | "Official external form";
  minutes: number;
  sourceChecked: string;
  sections: string[];
  references: TemplateReference[];
};

const sources = {
  qmsr: { label: "FDA Quality Management System Regulation (QMSR)", url: "https://www.fda.gov/medical-devices/postmarket-requirements-devices/quality-management-system-regulation-qmsr" },
  software: { label: "FDA Content of Premarket Submissions for Device Software Functions", url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/content-premarket-submissions-device-software-functions" },
  cybersecurity: { label: "FDA Cybersecurity in Medical Devices guidance", url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/cybersecurity-medical-devices-quality-system-considerations-and-content-premarket-submissions" },
  estar: { label: "FDA eSTAR Program", url: "https://www.fda.gov/medical-devices/how-study-and-market-your-device/estar-program" },
  ide: { label: "FDA Investigational Device Exemption (IDE)", url: "https://www.fda.gov/medical-devices/premarket-submissions-selecting-and-preparing-correct-submission/investigational-device-exemption-ide" },
  pathways: { label: "FDA 510(k), De Novo, and PMA pathway overview", url: "https://www.fda.gov/medical-devices/510k-clearances/medical-device-safety-and-510k-clearance-process" },
  ichGcp: { label: "ICH E6(R3) Good Clinical Practice", url: "https://database.ich.org/sites/default/files/ICH_E6%28R3%29_Step4_FinalGuideline_2025_0106.pdf" },
  corrections: { label: "FDA Recalls, Corrections and Removals", url: "https://www.fda.gov/medical-devices/postmarket-requirements-devices/recalls-corrections-and-removals-devices" },
};

type TemplateInput = Omit<DocumentTemplate, "id" | "status" | "sourceChecked">;
const define = (input: TemplateInput, index: number): DocumentTemplate => ({
  ...input,
  id: `tpl-${index + 1}`,
  status: "Starter",
  sourceChecked: "2026-08-08",
});

const definitions: TemplateInput[] = [
  {
    title: "Standard Operating Procedure",
    description: "Controlled instructions for a repeatable laboratory or operational process.",
    domain: "Laboratory operations", type: "SOP", stage: "Operations", tags: ["quality", "training", "procedure"], minutes: 35,
    sections: ["Document control and approvals", "Purpose", "Scope", "Definitions", "Responsibilities", "Materials and equipment", "Safety and precautions", "Procedure", "Acceptance criteria", "Deviations", "Records generated", "Training requirements", "References and revision history"],
    references: [sources.qmsr],
  },
  {
    title: "Experimental Protocol",
    description: "Plan objectives, methods, controls, acceptance criteria, and data handling before execution.",
    domain: "Laboratory operations", type: "Protocol", stage: "Feasibility", tags: ["research", "study", "experiment"], minutes: 45,
    sections: ["Objective and hypothesis", "Scope", "Study design", "Materials and equipment", "Sample selection", "Controls and replicates", "Procedure", "Predefined acceptance criteria", "Data capture and analysis", "Deviations", "Results approval and records", "References"],
    references: [],
  },
  {
    title: "Sample Chain of Custody",
    description: "Trace sample identity, transfer, condition, custody, storage, and final disposition.",
    domain: "Laboratory operations", type: "Record", stage: "Testing", tags: ["samples", "traceability", "specimen"], minutes: 20,
    sections: ["Study or project", "Sample identifiers", "Source and collection", "Receipt condition", "Transfers and custodians", "Storage conditions", "Aliquots and derived samples", "Excursions", "Final disposition", "Review"],
    references: [],
  },
  {
    title: "Equipment Calibration and Maintenance Record",
    description: "Document equipment status, standards, calibration results, maintenance, and disposition.",
    domain: "Laboratory operations", type: "Record", stage: "Operations", tags: ["equipment", "calibration", "maintenance"], minutes: 25,
    sections: ["Equipment identification", "Location and owner", "Intended use", "Calibration or maintenance interval", "Reference standards and traceability", "As-found results", "Work performed", "As-left results", "Acceptance decision", "Impact assessment for out-of-tolerance condition", "Next due date", "Approval and attachments"],
    references: [sources.qmsr],
  },
  {
    title: "Design and Development Plan",
    description: "Define phases, responsibilities, interfaces, reviews, deliverables, and change control for device development.",
    domain: "Design and development", type: "Design control", stage: "Planning", tags: ["QMSR", "ISO 13485", "planning"], minutes: 60,
    sections: ["Product and intended use", "Development scope", "Applicable regulatory assumptions", "Development phases and deliverables", "Roles and technical interfaces", "Design review gates", "Verification and validation strategy", "Risk-management integration", "Software and cybersecurity activities", "Supplier and transfer activities", "Configuration and change control", "Schedule and approval"],
    references: [sources.qmsr],
  },
  {
    title: "User Needs and Intended Use",
    description: "Capture intended users, use environments, clinical or laboratory workflow, and high-level needs.",
    domain: "Design and development", type: "Design input", stage: "Concept", tags: ["user needs", "intended use", "workflow"], minutes: 45,
    sections: ["Device concept", "Intended use", "Indications or research-use assumptions", "Intended users", "Patient or specimen population", "Use environments", "Workflow and use scenarios", "User needs", "Known limitations", "Safety-related use scenarios", "Traceability and approval"],
    references: [sources.qmsr, sources.pathways],
  },
  {
    title: "Design Input Requirements",
    description: "Define verifiable user, functional, performance, safety, interface, and regulatory requirements.",
    domain: "Design and development", type: "Design input", stage: "Definition", tags: ["requirements", "QMSR", "traceability"], minutes: 65,
    sections: ["Purpose and scope", "Device and intended-use context", "Source user needs", "Functional requirements", "Performance requirements", "Safety and risk-control requirements", "Usability requirements", "Software and data requirements", "Mechanical, fluidic, electrical, and interface requirements", "Environmental, transport, and shelf-life requirements", "Labeling and packaging requirements", "Regulatory and standards requirements", "Verification method and acceptance criteria", "Traceability, review, and approval"],
    references: [sources.qmsr, sources.software],
  },
  {
    title: "Design Output and Device Specification Index",
    description: "Index specifications, drawings, software, manufacturing instructions, and acceptance procedures.",
    domain: "Design and development", type: "Design output", stage: "Development", tags: ["outputs", "drawings", "specifications"], minutes: 45,
    sections: ["Approved design inputs baseline", "System specifications", "Drawings and bills of materials", "Software configuration items", "Manufacturing and assembly instructions", "Inspection and test methods", "Packaging and labeling specifications", "Installation and servicing information", "Risk-control implementation", "Output-to-input traceability", "Release status and approvals"],
    references: [sources.qmsr, sources.software],
  },
  {
    title: "Design Review Record",
    description: "Record an independent, phase-appropriate review of design results and unresolved actions.",
    domain: "Design and development", type: "Review record", stage: "Review", tags: ["design review", "gate", "actions"], minutes: 30,
    sections: ["Review scope and phase", "Inputs reviewed", "Required participants and independence", "Review criteria", "Findings", "Risk and unresolved anomalies", "Decisions", "Actions, owners, and due dates", "Follow-up evidence", "Approval"],
    references: [sources.qmsr],
  },
  {
    title: "Design Verification Plan",
    description: "Map design inputs to test methods, samples, evidence, and objective acceptance criteria.",
    domain: "Design and development", type: "Verification plan", stage: "Verification", tags: ["verification", "requirements", "testing"], minutes: 65,
    sections: ["Purpose and scope", "Configuration under test", "Referenced design inputs", "Verification matrix", "Test methods and equipment", "Sample-size rationale", "Preconditioning and environments", "Acceptance criteria", "Protocol deviations", "Data integrity and statistical methods", "Anomaly handling", "Reports and traceability", "Review and approval"],
    references: [sources.qmsr, sources.software],
  },
  {
    title: "Design Validation Plan",
    description: "Plan validation under actual or simulated use with production-equivalent units and representative users.",
    domain: "Design and development", type: "Validation plan", stage: "Validation", tags: ["validation", "intended use", "users"], minutes: 65,
    sections: ["Intended use and validation objectives", "Production-equivalent configuration", "Representative users and environments", "Use scenarios", "Clinical, laboratory, or workflow endpoints", "Sample-size rationale", "Risk-related tasks", "Acceptance criteria", "Human factors linkage", "Data analysis", "Deviations and anomalies", "Conclusion and traceability", "Approval"],
    references: [sources.qmsr, sources.ide],
  },
  {
    title: "Risk Management Plan and FMEA",
    description: "Plan risk activities and document hazards, failure modes, controls, verification, and residual risk.",
    domain: "Design and development", type: "Risk management", stage: "Lifecycle", tags: ["risk", "FMEA", "hazards"], minutes: 75,
    sections: ["Scope and product boundaries", "Risk-management responsibilities", "Risk acceptability criteria", "Hazard analysis", "Use-related hazards", "Software and cybersecurity hazards", "Process and supplier risks", "Failure modes and effects", "Risk-control measures", "Risk-control verification", "Benefit-risk analysis where needed", "Overall residual-risk evaluation", "Production and post-production information", "Risk-management report and approval"],
    references: [sources.qmsr, sources.cybersecurity],
  },
  {
    title: "Requirements Traceability Matrix",
    description: "Connect user needs, design inputs, risk controls, outputs, verification, validation, and evidence.",
    domain: "Design and development", type: "Traceability matrix", stage: "Lifecycle", tags: ["traceability", "verification", "validation"], minutes: 50,
    sections: ["Configuration baseline", "User need identifiers", "Design input identifiers", "Risk-control identifiers", "Design output identifiers", "Verification protocol and result", "Validation evidence", "Unresolved gaps", "Change impact", "Review and approval"],
    references: [sources.qmsr, sources.software],
  },
  {
    title: "Analytical Performance Study Plan",
    description: "Plan analytical performance evidence for an IVD or diagnostic assay using predefined methods and criteria.",
    domain: "IVD and assay performance", type: "Study plan", stage: "Verification", tags: ["IVD", "analytical", "diagnostics"], minutes: 75,
    sections: ["Measurand and intended use", "Assay and instrument configuration", "Specimen types and handling", "Reference or comparator methods", "Precision and reproducibility", "Linearity and measuring interval", "Detection capability", "Analytical specificity and interference", "Carryover and cross-contamination", "Hook effect or prozone assessment", "Reagent and sample stability", "Acceptance criteria", "Statistical analysis", "Deviations and report requirements"],
    references: [sources.pathways, sources.estar],
  },
  {
    title: "Clinical Performance Study Plan",
    description: "Plan clinical performance evidence for a diagnostic test with representative specimens and endpoints.",
    domain: "IVD and assay performance", type: "Study plan", stage: "Clinical performance", tags: ["IVD", "clinical performance", "diagnostic accuracy"], minutes: 90,
    sections: ["Intended use and claims", "Study objectives", "Study design and sites", "Population and specimen selection", "Comparator and truth method", "Blinding and bias controls", "Sample-size rationale", "Endpoints and acceptance criteria", "Discordant-result handling", "Subgroup analyses", "Missing and invalid results", "Statistical analysis", "Ethics and consent determination", "Data integrity", "Reporting and limitations"],
    references: [sources.ide, sources.ichGcp, sources.estar],
  },
  {
    title: "Reagent and Shelf-Life Stability Protocol",
    description: "Plan real-time, accelerated, transport, open-vial, and in-use stability studies.",
    domain: "IVD and assay performance", type: "Protocol", stage: "Verification", tags: ["stability", "reagent", "shelf life"], minutes: 60,
    sections: ["Product and lot configurations", "Stability claims", "Storage and transport conditions", "Time points", "Lots and sample-size rationale", "Test panel and challenge levels", "Performance endpoints", "Acceptance criteria", "Statistical approach", "Excursions and deviations", "Labeling linkage", "Report and approval"],
    references: [sources.qmsr, sources.estar],
  },
  {
    title: "Software Development and Maintenance Plan",
    description: "Plan software lifecycle activities, configuration, risk, verification, release, and maintenance.",
    domain: "Software and cybersecurity", type: "Software plan", stage: "Planning", tags: ["software", "SaMD", "lifecycle"], minutes: 60,
    sections: ["Software purpose and device context", "Documentation level rationale", "Lifecycle model", "Roles and responsibilities", "Configuration management", "Requirements and architecture", "Risk management", "Verification and validation", "SOUP and off-the-shelf software", "Cybersecurity activities", "Anomaly management", "Release and maintenance", "Traceability and approvals"],
    references: [sources.software, sources.cybersecurity, sources.qmsr],
  },
  {
    title: "Software Requirements Specification",
    description: "Define testable software functional, interface, data, safety, security, and performance requirements.",
    domain: "Software and cybersecurity", type: "Software specification", stage: "Definition", tags: ["SRS", "software requirements", "interfaces"], minutes: 75,
    sections: ["Software system overview", "Operating environment", "Functional requirements", "Inputs and outputs", "User-interface requirements", "External interfaces", "Data definitions and retention", "Performance and timing", "Safety-related requirements", "Cybersecurity requirements", "Error handling and alarms", "Installation and upgrade", "Traceability and acceptance methods"],
    references: [sources.software, sources.cybersecurity],
  },
  {
    title: "Software Architecture and Design Specification",
    description: "Describe architecture, interfaces, segregation, data flow, risk controls, and detailed design decisions.",
    domain: "Software and cybersecurity", type: "Software design", stage: "Development", tags: ["architecture", "design", "data flow"], minutes: 75,
    sections: ["Architecture overview", "Software items and responsibilities", "Interface definitions", "Data and control flow", "Hazard-related segregation", "Cybersecurity boundaries", "Database and persistence design", "Error handling", "Third-party components", "Deployment architecture", "Design rationale", "Requirements and risk traceability"],
    references: [sources.software, sources.cybersecurity],
  },
  {
    title: "Software Verification Protocol",
    description: "Define unit, integration, system, regression, performance, and risk-control testing.",
    domain: "Software and cybersecurity", type: "Test protocol", stage: "Verification", tags: ["software testing", "verification", "regression"], minutes: 75,
    sections: ["Scope and software version", "Test environment", "Requirements coverage", "Unit and integration testing", "System and interface testing", "Risk-control testing", "Cybersecurity testing", "Performance and stress testing", "Regression strategy", "Objective acceptance criteria", "Anomaly handling", "Results and traceability"],
    references: [sources.software, sources.cybersecurity],
  },
  {
    title: "Cybersecurity Risk Management Plan",
    description: "Plan threat modeling, secure design, testing, SBOM, vulnerability handling, and lifecycle monitoring.",
    domain: "Software and cybersecurity", type: "Cybersecurity plan", stage: "Lifecycle", tags: ["cybersecurity", "SBOM", "threat model"], minutes: 75,
    sections: ["Device and system scope", "Cyber-device determination", "Security objectives", "Threat model and attack surfaces", "Security risk assessment", "Security controls", "Authentication and authorization", "Data protection", "Logging and resilience", "Security verification and penetration testing", "SBOM governance", "Vulnerability disclosure and remediation", "Updateability and patching", "Postmarket monitoring", "Premarket evidence index"],
    references: [sources.cybersecurity, sources.software],
  },
  {
    title: "Quality Plan and QMSR Readiness Assessment",
    description: "Plan quality-system activities and assess readiness against applicable QMSR and ISO 13485 processes.",
    domain: "Quality and manufacturing", type: "Quality plan", stage: "Lifecycle", tags: ["QMSR", "quality plan", "gap assessment"], minutes: 75,
    sections: ["Organization and product scope", "Regulatory applicability", "Quality objectives", "Process map", "Document and record controls", "Design and development controls", "Risk management", "Supplier controls", "Production and process controls", "Complaint and postmarket processes", "CAPA and nonconformity", "Training and competence", "Internal audit", "Management review", "Gap actions and owners"],
    references: [sources.qmsr],
  },
  {
    title: "CAPA Record",
    description: "Structure issue evaluation, investigation, actions, implementation, and effectiveness verification.",
    domain: "Quality and manufacturing", type: "CAPA", stage: "Lifecycle", tags: ["CAPA", "root cause", "effectiveness"], minutes: 60,
    sections: ["Problem statement and source", "Scope and affected product", "Immediate correction and containment", "Risk and reportability assessment", "Investigation plan", "Root-cause analysis", "Corrective action", "Preventive or systemic action", "Implementation evidence", "Effectiveness criteria and check", "Related changes and training", "Closure approval"],
    references: [sources.qmsr],
  },
  {
    title: "Change Control Request",
    description: "Assess and control product, process, supplier, software, and documentation changes.",
    domain: "Quality and manufacturing", type: "Change control", stage: "Lifecycle", tags: ["change", "impact", "configuration"], minutes: 50,
    sections: ["Change description and rationale", "Affected configurations and records", "Regulatory impact", "Risk-management impact", "Verification and validation impact", "Clinical and usability impact", "Supplier and manufacturing impact", "Software and cybersecurity impact", "Labeling and inventory impact", "Implementation plan", "Training and communication", "Effectiveness review", "Approvals"],
    references: [sources.qmsr, sources.software, sources.cybersecurity],
  },
  {
    title: "Supplier Qualification and Monitoring Plan",
    description: "Define risk-based supplier selection, qualification, controls, monitoring, and re-evaluation.",
    domain: "Quality and manufacturing", type: "Supplier control", stage: "Supply chain", tags: ["supplier", "purchasing", "risk"], minutes: 50,
    sections: ["Purchased product or service", "Criticality and risk classification", "Selection criteria", "Capability and quality assessment", "Audit or evidence rationale", "Quality agreement requirements", "Incoming acceptance controls", "Change-notification requirements", "Performance metrics", "Nonconformance escalation", "Re-evaluation frequency", "Approval status"],
    references: [sources.qmsr],
  },
  {
    title: "Process Validation Protocol",
    description: "Validate a production or service process where output cannot be fully verified by later inspection.",
    domain: "Quality and manufacturing", type: "Validation protocol", stage: "Transfer", tags: ["process validation", "manufacturing", "acceptance"], minutes: 75,
    sections: ["Process and product scope", "Validation rationale", "Equipment and utilities", "Personnel and training", "Materials and suppliers", "Critical process parameters", "Critical quality attributes", "Installation and operational qualification", "Performance qualification", "Sampling and statistical rationale", "Acceptance criteria", "Deviations", "Continued monitoring", "Report and approval"],
    references: [sources.qmsr],
  },
  {
    title: "Nonconformance and Material Review Record",
    description: "Control nonconforming product, assess impact, determine disposition, and preserve traceability.",
    domain: "Quality and manufacturing", type: "Nonconformance", stage: "Production", tags: ["NCR", "disposition", "material review"], minutes: 35,
    sections: ["Detection source", "Product, lot, and quantity", "Requirement not met", "Segregation and containment", "Risk and impact assessment", "Investigation", "Disposition rationale", "Rework instructions and verification", "Supplier notification", "CAPA escalation decision", "Approvals and closure"],
    references: [sources.qmsr],
  },
  {
    title: "Clinical Investigation Protocol Outline",
    description: "Structure objectives, design, endpoints, conduct, oversight, and data handling for device research.",
    domain: "Clinical and human subjects", type: "Protocol outline", stage: "Clinical", tags: ["clinical", "GCP", "IDE"], minutes: 90,
    sections: ["Protocol synopsis", "Background and rationale", "Device description and accountability", "Objectives and endpoints", "Study design", "Population", "Eligibility criteria", "Study procedures", "Risk-benefit assessment", "Safety reporting", "Sample-size and statistics", "Data handling", "Monitoring", "Ethics and informed consent", "Protocol deviations", "Records, reports, and publication"],
    references: [sources.ide, sources.ichGcp],
  },
  {
    title: "Clinical Monitoring Plan",
    description: "Define risk-proportionate oversight of sites, consent, data, device accountability, and safety reporting.",
    domain: "Clinical and human subjects", type: "Monitoring plan", stage: "Clinical", tags: ["monitoring", "GCP", "sites"], minutes: 60,
    sections: ["Study and oversight model", "Critical data and processes", "Risk assessment", "Monitoring approach", "Site initiation", "Consent review", "Source-data and endpoint review", "Device accountability", "Safety and deviation review", "Centralized monitoring", "Issue escalation", "Closeout", "Reports and follow-up"],
    references: [sources.ide, sources.ichGcp],
  },
  {
    title: "Clinical Data Management Plan",
    description: "Define collection, validation, coding, reconciliation, access, change control, and database lock.",
    domain: "Clinical and human subjects", type: "Data plan", stage: "Clinical", tags: ["clinical data", "database lock", "quality"], minutes: 60,
    sections: ["Systems and responsibilities", "Data flow", "Case-report forms", "Edit checks", "External data", "Medical coding", "Query management", "Safety reconciliation", "Access and audit trail", "Data transfers", "Deviations and missing data", "Quality control", "Database freeze and lock", "Archiving"],
    references: [sources.ichGcp],
  },
  {
    title: "Statistical Analysis Plan",
    description: "Predefine analysis populations, endpoints, methods, missing-data handling, and outputs.",
    domain: "Clinical and human subjects", type: "Statistical plan", stage: "Clinical", tags: ["statistics", "endpoints", "analysis"], minutes: 75,
    sections: ["Objectives and estimands", "Endpoints", "Analysis populations", "Sample-size assumptions", "General conventions", "Primary analysis", "Secondary analyses", "Diagnostic performance measures", "Subgroups", "Missing and censored data", "Sensitivity analyses", "Multiplicity", "Interim analyses", "Tables, figures, and listings", "Deviations from protocol"],
    references: [sources.ichGcp, sources.ide],
  },
  {
    title: "Regulatory Strategy and Classification Assessment",
    description: "Frame intended use, product classification, pathway assumptions, evidence, and agency interactions.",
    domain: "Regulatory submissions", type: "Strategy", stage: "Strategy", tags: ["FDA", "classification", "pathway"], minutes: 75,
    sections: ["Product and intended use", "Device versus non-device assessment", "IVD or accessory considerations", "Classification and product-code research", "Predicate landscape", "510(k), De Novo, or PMA rationale", "IDE and clinical-data considerations", "Standards and guidance landscape", "QMSR readiness", "Software and cybersecurity applicability", "Evidence gap assessment", "Q-Submission questions", "Submission and commercialization plan", "Assumptions requiring confirmation"],
    references: [sources.pathways, sources.estar, sources.ide, sources.qmsr],
  },
  {
    title: "Q-Submission / Pre-Submission Briefing Package",
    description: "Organize focused questions, background, proposed testing, and supporting evidence for FDA feedback.",
    domain: "Regulatory submissions", type: "Briefing package", stage: "Agency interaction", tags: ["Q-Sub", "Pre-Sub", "FDA feedback"], minutes: 75,
    sections: ["Cover and administrative information", "Purpose of interaction", "Device description", "Intended use and indications", "Regulatory history and pathway", "Development status", "Risk summary", "Proposed nonclinical testing", "Proposed software and cybersecurity evidence", "Proposed clinical or analytical studies", "Focused questions with sponsor position", "Supporting attachments", "Meeting objectives and attendees"],
    references: [sources.estar, sources.pathways],
  },
  {
    title: "510(k) eSTAR Readiness Index",
    description: "Plan evidence and attachments for a 510(k); use the current official FDA eSTAR for submission.",
    domain: "Regulatory submissions", type: "Readiness checklist", stage: "Premarket", tags: ["510(k)", "eSTAR", "predicate"], minutes: 75,
    sections: ["Current eSTAR version check", "Submission type and administrative data", "Device description", "Indications for use", "Classification and product code", "Predicate and substantial-equivalence rationale", "Standards", "Risk management", "Bench and analytical performance", "Software documentation", "Cybersecurity documentation", "Biocompatibility and sterility where applicable", "Human factors", "Clinical evidence where applicable", "Labeling", "Attachment index and gap log"],
    references: [sources.estar, sources.pathways, sources.software, sources.cybersecurity],
  },
  {
    title: "De Novo eSTAR Readiness Index",
    description: "Plan classification rationale, special controls, risks, and evidence for a De Novo request.",
    domain: "Regulatory submissions", type: "Readiness checklist", stage: "Premarket", tags: ["De Novo", "eSTAR", "special controls"], minutes: 75,
    sections: ["Current eSTAR version check", "Device description and intended use", "Classification rationale", "No-predicate rationale", "Benefit-risk profile", "Risk and mitigation table", "Proposed special controls", "Standards", "Nonclinical performance", "Software and cybersecurity", "Human factors", "Clinical evidence", "Labeling", "Attachment index and gap log"],
    references: [sources.estar, sources.pathways, sources.software, sources.cybersecurity],
  },
  {
    title: "IDE Readiness Checklist",
    description: "Assess investigational plan, risk determination, oversight, consent, labeling, monitoring, and reporting readiness.",
    domain: "Regulatory submissions", type: "Readiness checklist", stage: "Clinical", tags: ["IDE", "IRB", "investigational device"], minutes: 75,
    sections: ["Study and device summary", "Significant-risk determination", "Prior investigations", "Investigational plan", "Manufacturing information", "Investigator agreements", "IRB status", "Informed consent", "Investigational labeling", "Monitoring procedures", "Device accountability", "Records and reports", "Safety reporting", "Environmental assessment or exclusion", "Submission gap log"],
    references: [sources.ide, sources.ichGcp],
  },
  {
    title: "Complaint and Reportability Assessment",
    description: "Evaluate complaints for investigation, risk, MDR reportability, corrections, and CAPA escalation.",
    domain: "Postmarket and vigilance", type: "Assessment", stage: "Postmarket", tags: ["complaint", "MDR", "reportability"], minutes: 45,
    sections: ["Complaint intake", "Device and lot identification", "Event narrative", "Patient or user impact", "Device return and investigation", "Failure analysis", "Risk assessment", "MDR reportability decision", "Correction or removal assessment", "Trend and CAPA assessment", "Customer response", "Closure and approval"],
    references: [sources.qmsr, sources.corrections],
  },
  {
    title: "Correction and Removal Assessment",
    description: "Document health-risk evaluation, reporting determination, scope, communications, and effectiveness checks.",
    domain: "Postmarket and vigilance", type: "Field action assessment", stage: "Postmarket", tags: ["recall", "correction", "removal"], minutes: 60,
    sections: ["Issue and affected devices", "Distribution scope", "Health-risk evaluation", "Correction or removal rationale", "21 CFR 806 reporting assessment", "MDR linkage", "Regulatory notifications", "Consignee communications", "Product control and reconciliation", "Effectiveness checks", "Root cause and CAPA", "Closeout and records"],
    references: [sources.corrections],
  },
];

export const documentTemplates = definitions.map(define);
export const templateDomains = [...new Set(documentTemplates.map((template) => template.domain))];

export function searchTemplates(query: string, domain = "All") {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return documentTemplates.filter((template) =>
    (domain === "All" || template.domain === domain) &&
    terms.every((term) => [template.title, template.description, template.type, template.stage, ...template.tags, ...template.sections].join(" ").toLowerCase().includes(term)),
  );
}
