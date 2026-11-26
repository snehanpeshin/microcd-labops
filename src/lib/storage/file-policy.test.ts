import { describe, expect, it } from "vitest";
import { maxUploadBytes, sanitizeFilename, validateUpload } from "./file-policy";

describe("file upload policy", () => {
  it("sanitizes paths and control characters", () => {
    expect(sanitizeFilename("../../patient data\n.csv")).toBe("patient-data-.csv");
  });

  it("accepts a textual CSV and returns a unique storage name", () => {
    const bytes = new TextEncoder().encode("time,value\n0,1\n");
    const file = new File([bytes], "results.csv", { type: "text/csv" });
    const result = validateUpload(file, bytes);
    expect(result.safeName).toBe("results.csv");
    expect(result.storageName).toMatch(/^[0-9a-f-]+-results\.csv$/);
    expect(result.checksum).toHaveLength(64);
  });

  it("rejects mismatched signatures and executable extensions", () => {
    const fakePdf = new TextEncoder().encode("not a pdf");
    expect(() => validateUpload(new File([fakePdf], "evidence.pdf", { type: "application/pdf" }), fakePdf)).toThrow("content");
    const script = new TextEncoder().encode("alert(1)");
    expect(() => validateUpload(new File([script], "payload.js", { type: "text/javascript" }), script)).toThrow("not allowed");
  });

  it("accepts supported engineering snapshots and rejects arbitrary JSON", () => {
    const encoder = new TextEncoder();
    const date = "2026-11-26T12:00:00.000Z";
    const snapshots = [
      { schema: "microcd.modeler.project", version: 2, id: "design-1", name: "Design", updatedAt: date, features: [], layers: [] },
      { schema: "microcd.analyzer.analysis", version: 1, experimentId: "run-1", experimentName: "Run", createdAt: date, demonstration: true, results: { endpoint: 1 } },
    ];
    for (const snapshot of snapshots) {
      const bytes = encoder.encode(JSON.stringify(snapshot));
      expect(validateUpload(new File([bytes], "snapshot.json"), bytes).contentType).toBe("application/json");
    }
    const unknown = encoder.encode('{"schema":"unknown","version":1}');
    expect(() => validateUpload(new File([unknown], "snapshot.json", { type: "application/json" }), unknown)).toThrow("supported Modeler or Analyzer");
  });

  it("enforces the documented byte limit", () => {
    expect(maxUploadBytes).toBe(25 * 1024 * 1024);
  });
});
