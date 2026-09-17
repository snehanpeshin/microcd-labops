import {describe,expect,it} from "vitest";
import type {Experiment} from "./lab-types";
import {evaluateExperimentSetup,nextExperimentBatch} from "./experiment-quality";

const base:Experiment={id:"1",code:"EXP-1",title:"Flow study",projectId:"p1",projectName:"Cartridge",objective:"Measure transfer time across three spin profiles to select the most repeatable condition.",owner:"Engineer",type:"Characterization",protocolVersionId:"pv1",protocolLabel:"PRO-1 v1",protocolStatus:"Approved",startDate:"2026-09-20",status:"Planned",priority:"High",notes:"Run five replicates per profile.",results:"",observations:"",conclusions:"",tags:["flow"],updatedAt:"2026-09-17T00:00:00Z"};

describe("experiment setup quality",()=>{
  it("marks a complete setup as prepared",()=>expect(evaluateExperimentSetup(base)).toMatchObject({score:100,level:"prepared"}));
  it("treats a missing approved method as a critical setup gap",()=>expect(evaluateExperimentSetup({...base,protocolVersionId:undefined,protocolStatus:undefined})).toMatchObject({score:80,level:"needs_setup"}));
  it("orders the next batch by planned start before priority",()=>{const later={...base,id:"2",code:"EXP-2",startDate:"2026-09-21",priority:"Critical" as const};expect(nextExperimentBatch([later,base]).map((item)=>item.experiment.id)).toEqual(["1","2"]);});
});
