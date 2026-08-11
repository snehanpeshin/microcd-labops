export type Role = "owner" | "admin" | "engineer" | "reviewer" | "viewer";
export type ReportStatus = "Draft" | "In progress" | "Ready for review" | "Changes requested" | "Approved" | "Archived";
export type SupplierStatus = "Prospective" | "Under evaluation" | "Conditionally approved" | "Approved" | "On hold" | "Disqualified" | "Inactive";

export interface Project {
  id: string;
  code: string;
  name: string;
  product: string;
  owner: string;
  status: "Planning" | "Active" | "On hold" | "Complete";
  targetDate: string;
  description: string;
}

export interface Report {
  id: string;
  number: string;
  title: string;
  type: string;
  projectId: string;
  revision: string;
  status: ReportStatus;
  author: string;
  reviewer: string;
  updatedAt: string;
  confidentiality: string;
  sections: ReportSection[];
  criteria: AcceptanceCriterion[];
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  source: "user" | "ai-assisted";
  order: number;
}

export interface AcceptanceCriterion {
  id: string;
  measurement: string;
  operator: "between" | ">=" | "<=" | "=";
  minimum?: number;
  maximum?: number;
  target?: number;
  unit: string;
  result?: number;
  outcome: "Pass" | "Fail" | "Not evaluated";
  overrideReason?: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  type: string;
  country: string;
  risk: "Low" | "Medium" | "High";
  status: SupplierStatus;
  documentCompleteness: number;
  nextReview: string;
  owner: string;
}

export interface ComponentRecord {
  id: string;
  partNumber: string;
  supplierPartNumber: string;
  name: string;
  category: string;
  material: string;
  revision: string;
  supplierIds: string[];
  risk: "Low" | "Medium" | "High";
  status: "Active" | "Obsolete";
}

export interface Lot {
  id: string;
  internalLot: string;
  supplierLot: string;
  componentId: string;
  supplierId: string;
  quantity: number;
  receivedAt: string;
  expiresAt?: string;
  inspectionStatus: "Pending" | "Passed" | "Failed" | "Conditional";
  disposition: string;
}

export interface Inspection {
  id: string;
  number: string;
  lotId: string;
  componentId: string;
  inspector: string;
  date: string;
  sampleSize: number;
  outcome: "Passed" | "Failed" | "Conditional";
  disposition: string;
  defects: string;
}

export interface Activity {
  id: string;
  recordId?: string;
  actor: string;
  action: string;
  recordType: string;
  summary: string;
  timestamp: string;
}
