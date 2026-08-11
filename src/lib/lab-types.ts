export type Priority = "Low" | "Medium" | "High" | "Critical";
export type ExperimentStatus = "Draft" | "Planned" | "Ready" | "Running" | "Paused" | "Completed" | "Failed" | "Cancelled" | "Under review" | "Approved";

export interface Experiment {
  id: string; code: string; title: string; projectId: string; projectName: string; objective: string;
  owner: string; type: string; protocolVersionId?: string; protocolLabel?: string; startDate?: string;
  completionDate?: string; status: ExperimentStatus; priority: Priority; notes: string; results: string;
  observations: string; conclusions: string; tags: string[]; updatedAt: string;
}

export interface Sample {
  id: string; code: string; name: string; type: string; source: string; projectId?: string; projectName?: string;
  experimentId?: string; experimentCode?: string; parentSampleId?: string; preparationDate?: string; owner: string;
  quantity?: number; concentration?: number; unit: string; storageLocation: string; freezer: string; rack: string;
  box: string; position: string; status: "Available" | "Reserved" | "In use" | "Consumed" | "Disposed" | "Expired";
  expirationDate?: string; barcode?: string; notes: string; updatedAt: string;
}

export interface InventoryItem {
  id: string; code: string; name: string; type: "Reagent" | "Chemical" | "Consumable" | "Kit" | "Disposable";
  manufacturer: string; catalogNumber: string; lotNumber: string; quantity: number; unit: string; minimumStock: number;
  storageLocation: string; receivedDate?: string; openedDate?: string; expirationDate?: string; owner: string;
  supplierId?: string; notes: string; updatedAt: string;
}

export interface InventoryTransaction {
  id: string; itemId: string; type: "Receipt" | "Use" | "Adjustment" | "Disposal" | "Transfer";
  quantityDelta: number; resultingQuantity: number; reason: string; actor: string; createdAt: string;
}

export interface EquipmentRecord {
  id: string; code: string; name: string; category: string; manufacturer: string; model: string; serialNumber: string;
  location: string; status: "Available" | "In use" | "Maintenance" | "Calibration required" | "Out of service" | "Retired";
  owner: string; lastMaintenance?: string; nextMaintenance?: string; lastCalibration?: string; nextCalibration?: string;
  notes: string; updatedAt: string;
}
export interface EquipmentEvent { id:string; equipmentId:string; type:"Maintenance"|"Calibration"|"Status change"|"Inspection"|"Note"; performedAt:string; actor:string; previousStatus?:string; newStatus?:string; summary:string; nextDueDate?:string; }

export interface ProtocolRecord {
  id: string; code: string; name: string; description: string; owner: string; status: "Draft" | "Active" | "Retired";
  latestVersion?: number; latestVersionId?: string; latestVersionStatus?: "Draft" | "Approved" | "Superseded"; updatedAt: string;
}

export interface ProtocolVersion {
  id: string; protocolId: string; version: number; title: string; steps: string; materials: string; equipment: string;
  notes: string; status: "Draft" | "Approved" | "Superseded"; author: string; approvedAt?: string; createdAt: string;
}

export interface LabTask {
  id: string; title: string; description: string; assignee: string; experimentId?: string; experimentCode?: string;
  projectId?: string; projectName?: string; dueDate?: string; priority: Priority; status: "To do" | "In progress" | "Blocked" | "Completed";
  notes: string; updatedAt: string;
}

export interface GlobalSearchResult {
  id: string; type: "Project" | "Experiment" | "Sample" | "Inventory" | "Equipment" | "Protocol";
  primary: string; secondary: string; href: string; status?: string;
}

export interface LabAttachment { id:string; fileName:string; mimeType:string; sizeBytes:number; uploadedAt:string; }
