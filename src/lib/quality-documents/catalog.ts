export type QualityPhase = 1 | 2 | 3 | 4 | 5;

export interface QualityDocumentDefinition {
  key: string;
  title: string;
  phase: QualityPhase;
  phaseName: string;
  qualityFile: "DDF / DHF" | "DMR" | "DHR" | "QMS" | "Submission";
  basis: string;
  applicability: "core" | "conditional" | "business";
  startWeek: number;
  endWeek: number | null;
  sections: string[];
}

const phaseNames: Record<QualityPhase, string> = {
  1: "Plan & frame risk",
  2: "Needs & design inputs",
  3: "Outputs, V&V & risk controls",
  4: "Transfer & launch readiness",
  5: "Postmarket & change control",
};

const d = (key:string,title:string,phase:QualityPhase,qualityFile:QualityDocumentDefinition["qualityFile"],basis:string,applicability:QualityDocumentDefinition["applicability"],startWeek:number,endWeek:number|null,sections:string[]):QualityDocumentDefinition => ({key,title,phase,phaseName:phaseNames[phase],qualityFile,basis,applicability,startWeek,endWeek,sections});

export const qualityDocumentCatalog: QualityDocumentDefinition[] = [
  d("design-development-plan","Design & Development Plan",1,"DDF / DHF","QMSR / ISO 13485:2016 §7.3.2","core",0,6,["Purpose and scope","Development stages and deliverables","Roles and responsibilities","Design reviews and gates","Traceability method","Resources and interfaces","Change control"]),
  d("risk-management-plan","Risk Management Plan",1,"DDF / DHF","QMSR / ISO 13485:2016 §7.1 and §7.3","core",0,8,["Scope","Risk acceptability policy","Responsibilities","Risk activities by phase","Review and approval","Production and post-production information"]),
  d("regulatory-strategy","Regulatory Strategy & Pathway",1,"Submission","Applicable FDA pathway and product-specific requirements","conditional",1,10,["Product and intended use","Markets","Preliminary classification","Potential pathway","Product code and predicate research","Submission evidence plan","Open questions and assumptions"]),
  d("market-requirements","Market Requirements / Voice of Customer",2,"DDF / DHF","Business input supporting user needs; not itself an FDA-mandated title","business",2,12,["Problem statement","Users and stakeholders","Use environments","Unmet needs","Workflow observations","Prioritized needs","Source interviews"]),
  d("intended-use","Intended Use & Indications for Use",2,"Submission","Product definition and applicable premarket submission content","conditional",2,12,["Intended purpose","Indications","Users","Patient population","Use environment","Contraindications and limitations","Open regulatory questions"]),
  d("human-factors-plan","Human Factors / Usability Engineering Plan",2,"DDF / DHF","QMSR design inputs and applicable FDA human-factors guidance","conditional",4,18,["Users and use environments","User interface","Known use problems","Critical tasks","Formative evaluations","Validation strategy","Risk linkage"]),
  d("system-requirements","System / Product Requirements Specification",2,"DDF / DHF","QMSR / ISO 13485:2016 §7.3.3","core",6,18,["Scope","Functional requirements","Performance requirements","Safety and usability requirements","Interfaces","Regulatory and standards inputs","Acceptance criteria","Traceability"]),
  d("software-requirements","Software Requirements Specification",2,"DDF / DHF","Applicable to software-containing devices","conditional",7,20,["Software scope","Functional requirements","Interfaces","Data and privacy","Cybersecurity requirements","Alarms and failure handling","Acceptance criteria","Traceability"]),
  d("preliminary-risk-analysis","Preliminary Hazard Analysis / FMEA",2,"DDF / DHF","QMSR integrated risk management","core",4,20,["System definition","Hazards and hazardous situations","Sequences of events","Initial risk estimates","Risk control options","Residual risk","Traceability to requirements"]),
  d("design-output-index","Design Output / DMR Index",3,"DMR","QMSR / ISO 13485:2016 §7.3.4 and applicable FDA record requirements","core",16,38,["Output identifier","Description","Input linkage","Acceptance criteria","Approval state","DMR location","Change history"]),
  d("software-architecture","Software Architecture & Cybersecurity Design",3,"DDF / DHF","Applicable software and February 2026 FDA cybersecurity guidance","conditional",14,34,["Architecture overview","Trust boundaries and data flows","Security requirements","Threat model","Security controls","SOUP and SBOM","Update and vulnerability processes","Verification linkage"]),
  d("manufacturing-instructions","Manufacturing & Assembly Instructions",3,"DMR","QMSR production and service provision controls","conditional",22,42,["Scope","Materials and equipment","Process steps","In-process controls","Acceptance criteria","Labeling and packaging","Records generated","Training"]),
  d("requirements-traceability-matrix","Requirements Traceability Matrix",3,"DDF / DHF","QMSR traceability methods and design verification/validation evidence","core",10,48,["User need","Design input","Risk control","Design output","Verification method","Verification result","Validation evidence","Status and owner"]),
  d("verification-plan-report","Design Verification Plan & Report",3,"DDF / DHF","QMSR / ISO 13485:2016 §7.3.6","core",22,44,["Scope","Inputs under verification","Methods and protocols","Acceptance criteria","Configuration","Results and deviations","Traceability","Conclusion and approvals"]),
  d("validation-plan-report","Design Validation Plan & Report",3,"DDF / DHF","QMSR / ISO 13485:2016 §7.3.7","core",30,50,["Scope and intended use","Representative product","Users and use environments","Methods","Acceptance criteria","Results and deviations","Traceability","Conclusion and approvals"]),
  d("final-risk-report","Final Risk Management Report",3,"DDF / DHF","QMSR integrated risk management","core",38,52,["Risk activities completed","Residual risk evaluation","Benefit-risk conclusions","Risk-control verification","Overall residual risk","Production and post-production plan","Approvals"]),
  d("submission-index","Premarket Submission / Technical File Index",4,"Submission","Applicable FDA pathway; content varies by device and submission type","conditional",34,58,["Administrative information","Device description","Substantial equivalence or benefit-risk rationale","Performance evidence","Labeling","Quality and manufacturing information","Cybersecurity, if applicable","Open items"]),
  d("process-validation","Process Validation IQ/OQ/PQ",4,"DMR","QMSR production process validation, as applicable","conditional",36,56,["Process and equipment","Validation rationale","Installation qualification","Operational qualification","Performance qualification","Acceptance criteria","Deviations","Release and revalidation"]),
  d("dhr-template","Device History Record Template",4,"DHR","Applicable FDA record requirements for production history","conditional",42,58,["Device and lot identification","Dates and quantities","Acceptance records","Labeling","Release authorization","Nonconformances and rework","Traceable source records"]),
  d("postmarket-plan","Postmarket Surveillance & Feedback Plan",5,"QMS","Complaint, feedback, reporting and applicable postmarket requirements","core",48,null,["Feedback sources","Complaint handling","Adverse event assessment","Trending and signals","CAPA escalation","Cybersecurity monitoring","Periodic review","Change inputs"]),
  d("design-change-record","Design & Development Change Record",5,"DDF / DHF","QMSR / ISO 13485:2016 §7.3.9","core",48,null,["Change description and rationale","Affected requirements and outputs","Risk impact","Regulatory impact","Verification or validation","Implementation plan","Approvals","Effectiveness check"]),
];

export const qualityPhases = ([1,2,3,4,5] as QualityPhase[]).map((number)=>({number,name:phaseNames[number],documents:qualityDocumentCatalog.filter((item)=>item.phase===number)}));

export function catalogItem(key:string){return qualityDocumentCatalog.find((item)=>item.key===key)??null;}

export function documentSkeleton(item:QualityDocumentDefinition, productName:string) {
  return `# ${item.title}\n\n> Working draft for ${productName}. Not approved. Confirm applicability and content with qualified quality and regulatory personnel.\n\n${item.sections.map((section)=>`## ${section}\n\n[TBD — add source-backed content and link supporting LabOps evidence.]`).join("\n\n")}\n`;
}
