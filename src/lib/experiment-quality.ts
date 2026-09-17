import type {Experiment} from "@/lib/lab-types";

export type SetupCheck={key:"intent"|"method"|"schedule"|"instructions"|"labels";label:string;complete:boolean;why:string;fix:string};
export type ExperimentSetupQuality={score:number;level:"prepared"|"attention"|"needs_setup";checks:SetupCheck[];nextAction:string};

export function evaluateExperimentSetup(experiment:Experiment):ExperimentSetupQuality{
  const checks:SetupCheck[]=[
    {key:"intent",label:"Clear objective",complete:experiment.objective.trim().length>=30,why:"A specific objective tells the operator what question the run must answer.",fix:"State what will be measured, changed or compared, and what decision the result supports."},
    {key:"method",label:"Approved method",complete:Boolean(experiment.protocolVersionId)&&experiment.protocolStatus==="Approved",why:"An approved protocol keeps operators on the same controlled method.",fix:experiment.protocolVersionId?"Replace the linked draft or superseded version with an approved protocol.":"Link an approved protocol version before execution."},
    {key:"schedule",label:"Planned start",complete:Boolean(experiment.startDate),why:"A date lets the team reserve equipment, material and reviewer time.",fix:"Choose the intended start date, even if it is provisional."},
    {key:"instructions",label:"Run guidance",complete:experiment.notes.trim().length>=10,why:"Short run-specific notes prevent avoidable setup assumptions.",fix:"Add replicate count, special handling, setup differences or a note that there are none."},
    {key:"labels",label:"Searchable tags",complete:experiment.tags.length>0,why:"Tags make related runs and evidence easier to retrieve later.",fix:"Add one to three terms such as verification, flow, bonding or calibration."},
  ];
  const complete=checks.filter((item)=>item.complete).length,score=Math.round(complete/checks.length*100),criticalMissing=checks.some((item)=>!item.complete&&(item.key==="intent"||item.key==="method"));
  const level=score===100?"prepared":criticalMissing?"needs_setup":"attention";
  return {score,level,checks,nextAction:checks.find((item)=>!item.complete)?.fix??"Run the full pre-run readiness gate and have another engineer review the setup."};
}

export function nextExperimentBatch(experiments:Experiment[],limit=6){
  const priority={Critical:0,High:1,Medium:2,Low:3};
  return experiments.filter((item)=>["Draft","Planned","Ready","Paused"].includes(item.status)).map((experiment)=>({experiment,quality:evaluateExperimentSetup(experiment)})).sort((a,b)=>{
    const date=(a.experiment.startDate??"9999").localeCompare(b.experiment.startDate??"9999");
    return date||priority[a.experiment.priority]-priority[b.experiment.priority]||a.experiment.code.localeCompare(b.experiment.code);
  }).slice(0,limit);
}
