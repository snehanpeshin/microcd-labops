import { NextResponse } from "next/server";
import { getWorkspaceIdentity } from "@/lib/auth";
import { can } from "@/lib/security/permissions";
import { createClient } from "@/lib/supabase/server";

const allowedOrigins = new Set(["https://www.microcdlabs.com", "https://microcdlabs.com"]);

export async function GET(request: Request) {
  const origin = request.headers.get("Origin");
  const headers = new Headers({ "Cache-Control": "private, no-store", Vary: "Origin" });
  if (!origin || !allowedOrigins.has(origin)) {
    return NextResponse.json({ error: "Dashboard origin required" }, { status: 403, headers });
  }
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");

  const identity = await getWorkspaceIdentity();
  if (!identity) return NextResponse.json({ error: "LabOps sign-in required" }, { status: 401, headers });
  if (identity.demo || !can(identity.role, "members:manage")) {
    return NextResponse.json({ error: "LabOps administrator access required" }, { status: 403, headers });
  }

  const supabase = await createClient();
  const [projects, experiments, reports] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("organization_id", identity.organizationId).is("deleted_at", null),
    supabase.from("experiments").select("id", { count: "exact", head: true }).eq("organization_id", identity.organizationId).is("deleted_at", null),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("organization_id", identity.organizationId).is("deleted_at", null),
  ]);
  if (projects.count === null || experiments.count === null || reports.count === null || projects.error || experiments.error || reports.error) {
    return NextResponse.json({ error: "Workspace totals are temporarily unavailable" }, { status: 503, headers });
  }
  return NextResponse.json({
    workspace: identity.organizationName,
    projects: projects.count,
    experiments: experiments.count,
    reports: reports.count,
  }, { headers });
}
