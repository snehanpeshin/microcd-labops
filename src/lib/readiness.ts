export type ReadinessLevel = "ready" | "at_risk" | "blocked";

export type ReadinessCheck = {
  key: "protocol" | "build" | "materials" | "equipment" | "samples" | "tasks";
  label: string;
  level: ReadinessLevel;
  summary: string;
  details: string[];
};

export type ReadinessInput = {
  protocol?: { label: string; status: string };
  builds: { code: string; status: string; materials: { label: string; inspectionStatus: string; disposition: string; expiresAt?: string }[] }[];
  equipment: { code: string; status: string; nextCalibration?: string }[];
  samples: { code: string; status: string; expirationDate?: string }[];
  tasks: { title: string; priority: string; status: string; dueDate?: string }[];
};

const day = 86_400_000;
const dateOnly = (value: Date) => value.toISOString().slice(0, 10);
const withinDays = (date: string | undefined, today: string, days: number) => Boolean(date && date >= today && new Date(`${date}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime() <= days * day);

export function evaluateReadiness(input: ReadinessInput, now = new Date()): { status: ReadinessLevel; checks: ReadinessCheck[] } {
  const today = dateOnly(now);
  const protocol: ReadinessCheck = !input.protocol
    ? { key:"protocol", label:"Approved method", level:"blocked", summary:"No protocol version is linked.", details:["Link an approved protocol version before execution."] }
    : input.protocol.status.toLowerCase() !== "approved"
      ? { key:"protocol", label:"Approved method", level:"blocked", summary:`${input.protocol.label} is ${input.protocol.status.toLowerCase()}.`, details:["Approve the linked version or select an approved version."] }
      : { key:"protocol", label:"Approved method", level:"ready", summary:`${input.protocol.label} is approved.`, details:[] };

  const blockedBuilds = input.builds.filter((build) => ["planned","quarantined","retired"].includes(build.status.toLowerCase()));
  const build: ReadinessCheck = input.builds.length === 0
    ? { key:"build", label:"Device build", level:"blocked", summary:"No device build is linked.", details:["Link the exact device or cartridge build used by this experiment."] }
    : blockedBuilds.length
      ? { key:"build", label:"Device build", level:"blocked", summary:`${blockedBuilds.length} linked build${blockedBuilds.length === 1 ? " is" : "s are"} unavailable.`, details:blockedBuilds.map((item) => `${item.code}: ${item.status}`) }
      : input.builds.some((item) => item.status.toLowerCase() === "in_build")
        ? { key:"build", label:"Device build", level:"at_risk", summary:"A linked build is still in progress.", details:input.builds.filter((item) => item.status.toLowerCase() === "in_build").map((item) => item.code) }
        : { key:"build", label:"Device build", level:"ready", summary:`${input.builds.length} available build${input.builds.length === 1 ? "" : "s"} linked.`, details:[] };

  const materials = input.builds.flatMap((item) => item.materials);
  const blockedMaterials = materials.filter((item) => item.inspectionStatus.toLowerCase() !== "passed" || !["accepted","released"].includes(item.disposition.toLowerCase()) || Boolean(item.expiresAt && item.expiresAt < today));
  const riskyMaterials = materials.filter((item) => item.inspectionStatus.toLowerCase() === "conditional" || item.disposition.toLowerCase().includes("conditional") || withinDays(item.expiresAt,today,14));
  const materialCheck: ReadinessCheck = materials.length === 0
    ? { key:"materials", label:"Material genealogy", level:"at_risk", summary:"No component lots are recorded on the linked build.", details:["Add component and supplier-lot records to complete genealogy."] }
    : blockedMaterials.length
      ? { key:"materials", label:"Material genealogy", level:"blocked", summary:`${blockedMaterials.length} material lot${blockedMaterials.length === 1 ? " blocks" : "s block"} execution.`, details:blockedMaterials.map((item) => `${item.label}: ${item.inspectionStatus}, ${item.disposition}${item.expiresAt && item.expiresAt < today ? ", expired" : ""}`) }
      : riskyMaterials.length
        ? { key:"materials", label:"Material genealogy", level:"at_risk", summary:`${riskyMaterials.length} material lot${riskyMaterials.length === 1 ? " needs" : "s need"} attention.`, details:riskyMaterials.map((item) => item.label) }
        : { key:"materials", label:"Material genealogy", level:"ready", summary:`${materials.length} inspected material lot${materials.length === 1 ? "" : "s"} traced.`, details:[] };

  const blockedEquipment = input.equipment.filter((item) => ["calibration required","maintenance","out of service","retired"].includes(item.status.toLowerCase()) || Boolean(item.nextCalibration && item.nextCalibration < today));
  const riskyEquipment = input.equipment.filter((item) => !item.nextCalibration || withinDays(item.nextCalibration,today,14));
  const equipment: ReadinessCheck = input.equipment.length === 0
    ? { key:"equipment", label:"Equipment readiness", level:"blocked", summary:"No equipment is linked.", details:["Link the instruments and fixtures required for execution."] }
    : blockedEquipment.length
      ? { key:"equipment", label:"Equipment readiness", level:"blocked", summary:`${blockedEquipment.length} equipment record${blockedEquipment.length === 1 ? " blocks" : "s block"} execution.`, details:blockedEquipment.map((item) => `${item.code}: ${item.status}${item.nextCalibration && item.nextCalibration < today ? ", calibration overdue" : ""}`) }
      : riskyEquipment.length
        ? { key:"equipment", label:"Equipment readiness", level:"at_risk", summary:`${riskyEquipment.length} equipment record${riskyEquipment.length === 1 ? " needs" : "s need"} calibration planning.`, details:riskyEquipment.map((item) => `${item.code}: ${item.nextCalibration ?? "no next calibration date"}`) }
        : { key:"equipment", label:"Equipment readiness", level:"ready", summary:`${input.equipment.length} ready equipment record${input.equipment.length === 1 ? "" : "s"} linked.`, details:[] };

  const blockedSamples = input.samples.filter((item) => ["expired","consumed","disposed"].includes(item.status.toLowerCase()) || Boolean(item.expirationDate && item.expirationDate < today));
  const riskySamples = input.samples.filter((item) => withinDays(item.expirationDate,today,7));
  const samples: ReadinessCheck = input.samples.length === 0
    ? { key:"samples", label:"Sample availability", level:"at_risk", summary:"No samples are linked.", details:["Confirm that this experiment does not require registered samples."] }
    : blockedSamples.length
      ? { key:"samples", label:"Sample availability", level:"blocked", summary:`${blockedSamples.length} sample${blockedSamples.length === 1 ? " is" : "s are"} unavailable.`, details:blockedSamples.map((item) => `${item.code}: ${item.status}`) }
      : riskySamples.length
        ? { key:"samples", label:"Sample availability", level:"at_risk", summary:`${riskySamples.length} sample${riskySamples.length === 1 ? " expires" : "s expire"} within seven days.`, details:riskySamples.map((item) => item.code) }
        : { key:"samples", label:"Sample availability", level:"ready", summary:`${input.samples.length} available sample${input.samples.length === 1 ? "" : "s"} linked.`, details:[] };

  const blockingTasks = input.tasks.filter((item) => item.status.toLowerCase() === "blocked" || (["high","critical"].includes(item.priority.toLowerCase()) && item.status.toLowerCase() !== "completed" && Boolean(item.dueDate && item.dueDate < today)));
  const riskyTasks = input.tasks.filter((item) => ["high","critical"].includes(item.priority.toLowerCase()) && item.status.toLowerCase() !== "completed");
  const tasks: ReadinessCheck = blockingTasks.length
    ? { key:"tasks", label:"Prerequisite work", level:"blocked", summary:`${blockingTasks.length} prerequisite task${blockingTasks.length === 1 ? " blocks" : "s block"} execution.`, details:blockingTasks.map((item) => item.title) }
    : riskyTasks.length
      ? { key:"tasks", label:"Prerequisite work", level:"at_risk", summary:`${riskyTasks.length} high-priority task${riskyTasks.length === 1 ? " remains" : "s remain"} open.`, details:riskyTasks.map((item) => item.title) }
      : { key:"tasks", label:"Prerequisite work", level:"ready", summary:"No blocking prerequisite tasks were found.", details:[] };

  const checks = [protocol,build,materialCheck,equipment,samples,tasks];
  return { status:checks.some((item) => item.level === "blocked") ? "blocked" : checks.some((item) => item.level === "at_risk") ? "at_risk" : "ready", checks };
}
