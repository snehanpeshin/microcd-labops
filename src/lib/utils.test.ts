import { describe, expect, it } from "vitest";
import { activityActionLabel, activitySentence } from "./utils";

describe("activity language", () => {
  it("turns database event keys into readable action labels", () => {
    expect(activityActionLabel("workspace_template_applied")).toBe("Applied");
    expect(activityActionLabel("protocol_approved")).toBe("Approved");
  });

  it("preserves the review meaning of change requests", () => {
    expect(activitySentence("quality_document_changes_requested", "Quality document")).toBe(
      "requested changes to quality document",
    );
  });

  it("falls back safely for an unfamiliar event", () => {
    expect(activityActionLabel("legacy_sync_started")).toBe("Legacy sync started");
  });
});
