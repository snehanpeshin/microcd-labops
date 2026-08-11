import { describe, expect, it } from "vitest";
import { assertOrganizationScope, can } from "./permissions";
describe("authorization", () => {
  it("keeps billing owner-only", () => { expect(can("owner", "billing:manage")).toBe(true); expect(can("admin", "billing:manage")).toBe(false); });
  it("prevents viewers from mutating records", () => { expect(can("viewer", "reports:write")).toBe(false); expect(can("viewer", "records:read")).toBe(true); });
  it("separates laboratory authorship from approval", () => { expect(can("engineer", "lab:write")).toBe(true); expect(can("engineer", "lab:review")).toBe(false); expect(can("reviewer", "lab:review")).toBe(true); });
  it("returns an indistinguishable not-found error across organizations", () => { expect(() => assertOrganizationScope("org-a", "org-b")).toThrow("Resource not found"); expect(() => assertOrganizationScope("org-a", "org-a")).not.toThrow(); });
});
