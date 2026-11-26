import { beforeEach, describe, expect, it, vi } from "vitest";
import { getWorkspaceIdentity } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GET } from "./route";

vi.mock("@/lib/auth", () => ({ getWorkspaceIdentity: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const origin = "https://www.microcdlabs.com";
const request = (site = origin) => new Request("https://labops.microcdlabs.com/api/admin/workspace-stats", { headers: { Origin: site } });
const identity = {
  userId: "user-a",
  organizationId: "org-a",
  organizationName: "Workspace A",
  email: "admin@example.test",
  fullName: "Workspace admin",
  role: "admin" as const,
  demo: false,
};

describe("private workspace stats", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getWorkspaceIdentity).mockResolvedValue(identity);
  });

  it("rejects other origins without reading a LabOps session", async () => {
    const response = await GET(request("https://www.microcdlabs.com.example.test"));
    expect(response.status).toBe(403);
    expect(response.headers.has("Access-Control-Allow-Origin")).toBe(false);
    expect(getWorkspaceIdentity).not.toHaveBeenCalled();
  });

  it("requires an authenticated workspace administrator and excludes demo", async () => {
    vi.mocked(getWorkspaceIdentity)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...identity, role: "viewer" })
      .mockResolvedValueOnce({ ...identity, demo: true });
    expect((await GET(request())).status).toBe(401);
    expect((await GET(request())).status).toBe(403);
    expect((await GET(request())).status).toBe(403);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("returns uncached totals scoped to the administrator's organization", async () => {
    const is = vi.fn()
      .mockResolvedValueOnce({ count: 4, error: null })
      .mockResolvedValueOnce({ count: 12, error: null })
      .mockResolvedValueOnce({ count: 0, error: null });
    const eq = vi.fn(() => ({ is }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    vi.mocked(createClient).mockResolvedValue({ from } as unknown as Awaited<ReturnType<typeof createClient>>);
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    expect(await response.json()).toEqual({ workspace: "Workspace A", projects: 4, experiments: 12, reports: 0 });
    expect(from.mock.calls).toEqual([["projects"], ["experiments"], ["reports"]]);
    expect(eq.mock.calls).toEqual(Array(3).fill(["organization_id", "org-a"]));
    expect(is.mock.calls).toEqual(Array(3).fill(["deleted_at", null]));
  });
});
