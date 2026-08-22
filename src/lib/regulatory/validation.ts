import { z } from "zod";

export const profileBasicsSchema = z.object({
  profileId: z.string().uuid().optional().or(z.literal("")),
  projectId: z.string().uuid(),
  productName: z.string().trim().min(2).max(180),
  intendedUse: z.string().trim().min(10).max(6000),
  intendedUser: z.string().trim().min(2).max(500),
  targetPopulation: z.string().trim().min(2).max(1000),
  clinicalEnvironment: z.string().trim().min(2).max(1000),
});

export const profileFunctionSchema = z.object({
  profileId: z.string().uuid(),
  markets: z.array(z.enum(["US", "EU"])).min(1),
  deviceType: z.enum(["hardware", "software", "combination"]),
  isIVD: z.boolean(),
  isSaMD: z.boolean(),
  hasAI: z.boolean(),
  isConnected: z.boolean(),
  isPatientFacing: z.boolean(),
  isDiagnostic: z.boolean(),
  isTherapeutic: z.boolean(),
  isMonitoring: z.boolean(),
  drivesClinicalDecisions: z.boolean(),
});

export const profileRiskSchema = z.object({
  profileId: z.string().uuid(),
  failureImpact: z.enum(["inconvenience", "delay_diagnosis", "incorrect_diagnosis", "deterioration", "serious_injury", "death"]),
  predicateAvailability: z.enum(["yes", "no", "unknown"]),
});

export const evidenceLinkSchema = z.object({
  requirementId: z.string().uuid(),
  evidenceKey: z.string().regex(/^(project|experiment|report|evidence_packet|protocol|file):[0-9a-f-]{36}$/),
  notes: z.string().trim().max(2000),
});
