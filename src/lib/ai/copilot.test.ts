import { describe, expect, it } from "vitest";
import { buildCopilotInput, buildCopilotInstructions, copilotAreaDetails } from "./copilot";

describe("LabOps copilot prompt boundaries", () => {
  it("keeps the copilot read-only and evidence bounded", () => {
    const instructions = buildCopilotInstructions("experiments");
    expect(instructions).toContain("read-only");
    expect(instructions).toContain("Never invent acceptance criteria");
    expect(instructions).toContain("qualified human review");
  });

  it("includes only supplied aggregate context and known navigation", () => {
    const input = buildCopilotInput("dockets", "What is next?", "Documents: 4 drafts");
    expect(input).toContain("Documents: 4 drafts");
    expect(input).toContain(copilotAreaDetails.dockets.href);
    expect(input).toContain("What is next?");
  });
});
