import { z } from "zod";

const modeler = z.object({
  schema: z.literal("microcd.modeler.project"),
  version: z.literal(2),
  id: z.string().min(1),
  name: z.string().min(1),
  updatedAt: z.iso.datetime(),
  features: z.array(z.unknown()),
  layers: z.array(z.unknown()),
});

const analyzer = z.object({
  schema: z.literal("microcd.analyzer.analysis"),
  version: z.literal(1),
  experimentId: z.string(),
  experimentName: z.string(),
  createdAt: z.iso.datetime(),
  demonstration: z.boolean(),
  results: z.record(z.string(), z.unknown()),
  rawObservations: z.array(z.unknown()).optional(),
});

const snapshot = z.discriminatedUnion("schema", [modeler, analyzer]);

export function describeEngineeringSnapshot(text: string) {
  const result = snapshot.parse(JSON.parse(text));
  if (result.schema === "microcd.modeler.project") {
    return {
      source: "Modeler",
      title: result.name,
      reference: result.id,
      capturedAt: result.updatedAt,
      contents: `${result.features.length} design features`,
      demonstration: false,
    };
  }
  return {
    source: "Analyzer",
    title: result.experimentName || "Untitled analysis",
    reference: result.experimentId,
    capturedAt: result.createdAt,
    contents: result.rawObservations
      ? `Analysis results and ${result.rawObservations.length} raw observations`
      : "Analysis results and settings",
    demonstration: result.demonstration,
  };
}
