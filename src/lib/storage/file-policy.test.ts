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

  it("enforces the documented byte limit", () => {
    expect(maxUploadBytes).toBe(25 * 1024 * 1024);
  });
});
