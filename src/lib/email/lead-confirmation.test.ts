import { describe, expect, it } from "vitest";
import { buildLeadConfirmation } from "@/lib/email/lead-confirmation";

describe("buildLeadConfirmation", () => {
  it("creates customer-facing text and HTML summaries", () => {
    const result = buildLeadConfirmation({ name: "Ada", organization: "Example Labs", message: "Trace cartridge lots to inspection records." });
    expect(result.subject).toContain("LabOps pilot request");
    expect(result.text).toContain("Example Labs");
    expect(result.html).toContain("Trace cartridge lots to inspection records.");
  });

  it("escapes user-entered HTML", () => {
    const result = buildLeadConfirmation({ name: "<Ada>", organization: "R&D", message: "<script>alert('x')</script>" });
    expect(result.html).not.toContain("<script>");
    expect(result.html).toContain("&lt;script&gt;");
    expect(result.html).toContain("R&amp;D");
  });
});
