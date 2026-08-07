export type DocumentTemplate = { id:string; title:string; description:string; domain:string; type:string; stage:string; tags:string[]; status:"Starter"|"Reviewed"|"Official external form"; minutes:number; reviewed:string; sections:string[] };

const definitions: Array<[string,string,string,string,string[]]> = [
  ["Standard Operating Procedure","Controlled instructions for a repeatable laboratory process.","Laboratory operations","SOP",["quality","training"]],
  ["Experimental Protocol","Plan objectives, materials, procedure, controls, and acceptance criteria.","Laboratory operations","Protocol",["research","study"]],
  ["Sample Chain of Custody","Trace sample transfer, condition, custody, and receipt.","Laboratory operations","Record",["samples","traceability"]],
  ["Equipment Calibration Record","Document calibration standards, results, and disposition.","Laboratory operations","Record",["equipment","calibration"]],
  ["Deviation Report","Capture an unexpected event, impact assessment, and containment.","Laboratory operations","Investigation",["deviation","quality"]],
  ["CAPA Record","Structure root-cause analysis, actions, owners, and effectiveness checks.","Quality and manufacturing","Investigation",["CAPA","quality"]],
  ["Change Control Request","Assess a proposed change, impact, approvals, and implementation.","Quality and manufacturing","Change control",["change","risk"]],
  ["Design Input Requirements","Define user, functional, performance, and interface needs.","Research and product development","Design control",["ISO 13485","requirements"]],
  ["Design Verification Plan","Map design inputs to test methods, evidence, and acceptance criteria.","Research and product development","Plan",["verification","design controls"]],
  ["Risk Assessment / FMEA","Identify hazards, failure modes, controls, and residual risks.","Research and product development","Risk",["FMEA","ISO 14971"]],
  ["Requirements Traceability Matrix","Connect needs, requirements, verification, and evidence.","Research and product development","Matrix",["traceability","verification"]],
  ["Method Validation Protocol","Plan accuracy, precision, specificity, range, and robustness studies.","Research and product development","Protocol",["validation","analytical"]],
  ["Batch Manufacturing Record","Record materials, steps, in-process checks, and yield.","Quality and manufacturing","Batch record",["manufacturing","lot"]],
  ["Supplier Qualification Questionnaire","Collect supplier capability, quality, and risk information.","Quality and manufacturing","Questionnaire",["supplier","risk"]],
  ["Internal Audit Plan","Define scope, criteria, schedule, and audit responsibilities.","Quality and manufacturing","Audit",["audit","quality"]],
  ["Clinical Trial Protocol Outline","Starter outline for objectives, design, endpoints, and conduct.","Clinical operations","Protocol outline",["clinical","ICH E6"]],
  ["Site Initiation Checklist","Confirm essential site readiness activities and documentation.","Clinical operations","Checklist",["clinical","site"]],
  ["Data Management Plan","Define collection, validation, coding, reconciliation, and lock activities.","Clinical operations","Plan",["clinical","data"]],
  ["Regulatory Strategy","Frame intended use, classification assumptions, evidence, and interactions.","Regulatory affairs","Strategy",["FDA","EMA","MHRA"]],
  ["510(k) Content Checklist","Planning checklist for common submission content; verify current FDA requirements.","Regulatory affairs","Checklist",["FDA","510(k)"]],
  ["Submission Readiness Checklist","Review administrative, technical, and evidence completeness.","Regulatory affairs","Checklist",["submission","readiness"]],
];

export const documentTemplates: DocumentTemplate[] = definitions.map(([title,description,domain,type,tags],index)=>({id:`tpl-${index+1}`,title,description,domain,type,stage:index<6?"Development":"Lifecycle",tags,status:index===19?"Reviewed":"Starter",minutes:20+(index%4)*15,reviewed:"2026-07-15",sections:["Purpose and scope","Responsibilities","Required inputs","Procedure or approach","Records and references"]}));

export const templateDomains = [...new Set(documentTemplates.map((template)=>template.domain))];
export function searchTemplates(query:string,domain="All"){const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);return documentTemplates.filter(t=>(domain==="All"||t.domain===domain)&&terms.every(term=>[t.title,t.description,t.type,t.stage,...t.tags].join(" ").toLowerCase().includes(term)));}
