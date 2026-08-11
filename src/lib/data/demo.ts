import type { Activity, ComponentRecord, Inspection, Lot, Project, Report, Supplier } from "@/lib/types";

export const demoOrganization = {
  id: "org_demo_microcd",
  name: "Fictional Centrifugal Diagnostics Lab",
  plan: "Lab",
  storageUsed: "1.4 GB",
  storageLimit: "10 GB",
  notice: "Fictional sample workspace for product evaluation. No records represent a real customer, supplier, or test result.",
};

export const demoProjects: Project[] = [
  {
    id: "proj_centrifugal",
    code: "CDX-001",
    name: "Centrifugal Cartridge Prototype Evaluation",
    product: "Research-use centrifugal assay cartridge",
    owner: "Dr. Maya Chen",
    status: "Active",
    targetDate: "2026-09-30",
    description: "Evaluate cartridge spin profiles, fluid transfer repeatability, and prototype component traceability.",
  },
  {
    id: "proj_reader",
    code: "OPT-014",
    name: "Optical Reader Fixture Review",
    product: "Prototype fluorescence reader fixture",
    owner: "Jon Bell",
    status: "Planning",
    targetDate: "2026-10-18",
    description: "Define fixture requirements and early verification evidence for a research-use reader concept.",
  },
];

export const demoReports: Report[] = [
  {
    id: "rpt_001",
    number: "ETR-CDX-001-01",
    title: "Spin Profile and Burst-Valve Evaluation",
    type: "Engineering Test Report",
    projectId: "proj_centrifugal",
    revision: "A",
    status: "Ready for review",
    author: "Dr. Maya Chen",
    reviewer: "Alex Rivera",
    updatedAt: "2026-07-12T14:32:00Z",
    confidentiality: "Confidential — development record",
    sections: [
      { id: "s1", title: "Executive summary", content: "Prototype discs were evaluated across three programmed rotational profiles. This fictional demo illustrates structured evidence capture and does not report a real test outcome.", source: "user", order: 1 },
      { id: "s2", title: "Objective", content: "Assess whether the selected rotational profile transfers the dyed aqueous sample into the collection chamber within the defined development window.", source: "user", order: 2 },
      { id: "s3", title: "Methodology", content: "Five fictional cartridges were loaded with simulated sample and operated using the documented speed profile. Transfer time was recorded from image timestamps.", source: "user", order: 3 },
      { id: "s4", title: "Conclusion", content: "Illustrative wording only: four of five fictional samples met the provisional transfer-time criterion. Engineering review is required before any conclusion is accepted.", source: "ai-assisted", order: 4 },
    ],
    criteria: [
      { id: "c1", measurement: "Transfer time", operator: "<=", maximum: 18, unit: "s", result: 16.4, outcome: "Pass" },
      { id: "c2", measurement: "Final chamber fill", operator: ">=", minimum: 90, unit: "%", result: 92, outcome: "Pass" },
      { id: "c3", measurement: "Visible leakage", operator: "=", target: 0, unit: "events", result: 1, outcome: "Fail" },
    ],
  },
  {
    id: "rpt_002",
    number: "II-CDX-004-01",
    title: "Incoming Inspection — Molded Disc Lot",
    type: "Incoming Inspection Report",
    projectId: "proj_centrifugal",
    revision: "A",
    status: "Draft",
    author: "Jon Bell",
    reviewer: "Unassigned",
    updatedAt: "2026-07-13T09:15:00Z",
    confidentiality: "Internal",
    sections: [],
    criteria: [],
  },
];

export const demoSuppliers: Supplier[] = [
  { id: "sup_northstar", code: "SUP-001", name: "Northstar Polymer Works (Fictional)", type: "Contract manufacturer", country: "United States", risk: "Medium", status: "Conditionally approved", documentCompleteness: 83, nextReview: "2026-08-15", owner: "Dr. Maya Chen" },
  { id: "sup_optiflow", code: "SUP-002", name: "OptiFlow Components (Fictional)", type: "Distributor", country: "Germany", risk: "Low", status: "Approved", documentCompleteness: 100, nextReview: "2027-01-20", owner: "Jon Bell" },
];

export const demoComponents: ComponentRecord[] = [
  { id: "cmp_disc", partNumber: "MCD-1001", supplierPartNumber: "NS-PMMA-120", name: "PMMA centrifugal disc substrate", category: "Molded component", material: "PMMA", revision: "B", supplierIds: ["sup_northstar"], risk: "Medium", status: "Active" },
  { id: "cmp_tube", partNumber: "MCD-2012", supplierPartNumber: "OF-PTFE-030", name: "PTFE transfer tubing", category: "Fluid handling", material: "PTFE", revision: "A", supplierIds: ["sup_optiflow"], risk: "Low", status: "Active" },
  { id: "cmp_filter", partNumber: "MCD-3304", supplierPartNumber: "OF-F520-10", name: "520 nm emission filter", category: "Optical component", material: "Coated glass", revision: "A", supplierIds: ["sup_optiflow"], risk: "High", status: "Active" },
];

export const demoLots: Lot[] = [
  { id: "lot_001", internalLot: "LOT-26-0711-A", supplierLot: "NS-88421", componentId: "cmp_disc", supplierId: "sup_northstar", quantity: 100, receivedAt: "2026-07-11", inspectionStatus: "Failed", disposition: "Quarantine" },
  { id: "lot_002", internalLot: "LOT-26-0702-B", supplierLot: "OF-22019", componentId: "cmp_tube", supplierId: "sup_optiflow", quantity: 250, receivedAt: "2026-07-02", expiresAt: "2029-07-02", inspectionStatus: "Passed", disposition: "Accepted" },
];

export const demoInspections: Inspection[] = [
  { id: "ins_001", number: "INSP-2026-004", lotId: "lot_001", componentId: "cmp_disc", inspector: "Jon Bell", date: "2026-07-12", sampleSize: 13, outcome: "Failed", disposition: "Quarantine", defects: "Two fictional samples exceeded the provisional channel-width tolerance." },
];

export const demoActivity: Activity[] = [
  { id: "a1", recordId: "ins_001", actor: "Jon Bell", action: "completed", recordType: "Inspection", summary: "INSP-2026-004 marked Failed; lot moved to quarantine.", timestamp: "2026-07-12T16:10:00Z" },
  { id: "a2", recordId: "rpt_001", actor: "Dr. Maya Chen", action: "submitted", recordType: "Report", summary: "ETR-CDX-001-01 Rev A submitted for review.", timestamp: "2026-07-12T14:32:00Z" },
  { id: "a3", actor: "System", action: "flagged", recordType: "Supplier document", summary: "Insurance certificate expires within 30 days.", timestamp: "2026-07-11T08:00:00Z" },
  { id: "a4", actor: "Jon Bell", action: "received", recordType: "Lot", summary: "LOT-26-0711-A received from fictional supplier Northstar Polymer Works.", timestamp: "2026-07-11T12:05:00Z" },
];
