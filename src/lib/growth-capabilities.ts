import { z } from "zod";

export const inventoryImportRowSchema = z.object({
  code: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(180),
  item_type: z.enum(["reagent","chemical","consumable","kit","disposable"]).default("reagent"),
  manufacturer: z.string().trim().max(160).default(""),
  catalog_number: z.string().trim().max(120).default(""),
  lot_number: z.string().trim().max(120).default(""),
  quantity: z.coerce.number().nonnegative().default(0),
  unit: z.string().trim().min(1).max(30).default("each"),
  minimum_stock: z.coerce.number().nonnegative().default(0),
  storage_location: z.string().trim().max(180).default(""),
  received_date: z.string().date().optional().or(z.literal("")),
  expiration_date: z.string().date().optional().or(z.literal("")),
  notes: z.string().trim().max(4000).default(""),
});

export const experimentImportRowSchema = z.object({
  title: z.string().trim().min(3).max(180),
  objective: z.string().trim().min(10).max(8000),
  experiment_type: z.string().trim().min(2).max(100),
  priority: z.enum(["low","medium","high","critical"]).default("medium"),
  start_date: z.string().date().optional().or(z.literal("")),
  tags: z.string().max(500).default(""),
  notes: z.string().max(4000).default(""),
});

export type WorkspaceTemplate = {
  key: "microfluidic-development" | "assay-development" | "equipment-qualification";
  name: string;
  audience: string;
  description: string;
  project: { codePrefix:string; name:string; product:string; description:string };
  protocol: { codePrefix:string; name:string; description:string; steps:string };
  tasks: string[];
};

export const workspaceTemplates: WorkspaceTemplate[] = [
  { key:"microfluidic-development", name:"Microfluidic development", audience:"Cartridges, chips, and fluidic systems", description:"Start with a characterization project, controlled flow protocol, and the first execution tasks.", project:{codePrefix:"MFD",name:"Microfluidic Prototype Characterization",product:"Microfluidic cartridge or chip",description:"Characterize fluid transfer, interfaces, materials, and prototype performance."}, protocol:{codePrefix:"PRO-FLOW",name:"Flow characterization",description:"Controlled method for documenting microfluidic transfer performance.",steps:"1. Confirm equipment readiness.\n2. Register samples and prototype identifiers.\n3. Execute the defined flow profile.\n4. Capture observations and evidence.\n5. Review results against the objective."}, tasks:["Confirm equipment calibration","Register starting samples","Define the first experiment objective"] },
  { key:"assay-development", name:"Assay development", audience:"Reagents, samples, and analytical studies", description:"Create an assay optimization project with a versioned method and resource-readiness tasks.", project:{codePrefix:"ASD",name:"Assay Optimization Study",product:"Research-use assay workflow",description:"Evaluate assay conditions, reagent stability, sample handling, and analytical response."}, protocol:{codePrefix:"PRO-ASSAY",name:"Assay optimization study",description:"Structured method for controlled assay-condition comparisons.",steps:"1. Verify reagent inventory and expiry.\n2. Register standards and samples.\n3. Prepare condition matrix.\n4. Execute measurements.\n5. Record observations and review conclusions."}, tasks:["Confirm reagent stock and expiration","Register standards and controls","Define the condition matrix"] },
  { key:"equipment-qualification", name:"Equipment qualification", audience:"Calibration and readiness workflows", description:"Create an equipment-readiness project, qualification protocol, and maintenance follow-through tasks.", project:{codePrefix:"EQT",name:"Equipment Readiness Qualification",product:"Laboratory equipment program",description:"Establish equipment readiness, calibration evidence, service history, and operating checks."}, protocol:{codePrefix:"PRO-EQ",name:"Equipment readiness check",description:"Repeatable readiness and qualification check for laboratory equipment.",steps:"1. Verify equipment identity and location.\n2. Review maintenance and calibration status.\n3. Perform readiness checks.\n4. Attach supporting evidence.\n5. Record disposition and next due date."}, tasks:["Register critical equipment","Review calibration due dates","Assign readiness owners"] },
];

export function metricProgress(metric:{baseline:number;target:number;currentValue?:number|null;direction:"increase"|"decrease"}) {
  if (metric.currentValue == null || metric.baseline === metric.target) return 0;
  const travelled = metric.direction === "decrease" ? metric.baseline - metric.currentValue : metric.currentValue - metric.baseline;
  const required = metric.direction === "decrease" ? metric.baseline - metric.target : metric.target - metric.baseline;
  return Math.max(0, Math.min(100, Math.round((travelled / required) * 100)));
}

export function csvEscape(value: unknown) {
  const text = value == null ? "" : Array.isArray(value) ? value.join(";") : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"','""')}"` : text;
}
